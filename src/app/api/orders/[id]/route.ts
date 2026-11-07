import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateOrderTotal, validateStockAvailability } from '@/lib/calculations';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        client: true,
        vehicle: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
        services: true,
        progressNotes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener orden' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      status,
      diagnostic,
      issueDescription,
      technicianName,
      mileageAtService,
      isPaid,
      paymentMethod,
      discount,
      services,
      items,
    } = body;

    // Si se envían nuevos services o items, recalculamos y actualizamos
    const currentOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: { items: true, services: true },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { success: false, error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      let laborTotal = currentOrder.laborTotal;
      let partsTotal = currentOrder.partsTotal;

      if (services && Array.isArray(services)) {
        await tx.workOrderService.deleteMany({ where: { workOrderId: id } });
        await tx.workOrderService.createMany({
          data: services.map((s: any) => ({
            workOrderId: id,
            description: s.description,
            cost: parseFloat(s.cost) || 0,
          })),
        });
        laborTotal = services.reduce(
          (sum: number, s: any) => sum + (parseFloat(s.cost) || 0),
          0
        );
      }

      if (items && Array.isArray(items)) {
        // Validar disponibilidad de repuestos antes de modificar la orden (Punto 3 de auditoría)
        for (const newItem of items) {
          if (newItem.inventoryItemId) {
            const newQty = parseInt(newItem.quantity) || 1;
            const oldItem = currentOrder.items.find(
              (oi: any) => oi.inventoryItemId === newItem.inventoryItemId
            );
            const oldQty = oldItem ? oldItem.quantity : 0;
            const inv = await tx.inventoryItem.findUnique({
              where: { id: newItem.inventoryItemId },
              select: { name: true, stock: true },
            });
            if (inv) {
              const effectiveAvailable = inv.stock + oldQty;
              const stockCheck = validateStockAvailability(newQty, effectiveAvailable);
              if (!stockCheck.valid) {
                throw new Error(
                  `Stock insuficiente para "${inv.name}". Disponible: ${stockCheck.available}, Solicitado: ${stockCheck.requested} (Faltan ${stockCheck.missing} unidades).`
                );
              }
            }
          }
        }

        // 1. Revertir el stock de los repuestos previamente asignados a esta orden
        for (const oldItem of currentOrder.items) {
          if (oldItem.inventoryItemId) {
            try {
              await tx.inventoryItem.update({
                where: { id: oldItem.inventoryItemId },
                data: { stock: { increment: oldItem.quantity } },
              });
            } catch {
              // El repuesto pudo ser eliminado del catálogo, continuar
            }
          }
        }

        // 2. Reemplazar los items de la orden
        await tx.workOrderItem.deleteMany({ where: { workOrderId: id } });
        await tx.workOrderItem.createMany({
          data: items.map((i: any) => {
            const qty = parseInt(i.quantity) || 1;
            const price = parseFloat(i.unitPrice) || 0;
            return {
              workOrderId: id,
              inventoryItemId: i.inventoryItemId || null,
              description: i.description,
              quantity: qty,
              unitPrice: price,
              subtotal: qty * price,
              isCustomPart: !!i.isCustomPart,
            };
          }),
        });

        // 3. Descontar el nuevo stock de los repuestos asignados
        for (const newItem of items) {
          if (newItem.inventoryItemId) {
            const qty = parseInt(newItem.quantity) || 1;
            try {
              await tx.inventoryItem.update({
                where: { id: newItem.inventoryItemId },
                data: { stock: { decrement: qty } },
              });
            } catch {
              // El repuesto no existe en inventario
            }
          }
        }

        partsTotal = items.reduce(
          (sum: number, i: any) =>
            sum + (parseInt(i.quantity) || 1) * (parseFloat(i.unitPrice) || 0),
          0
        );
      }

      const disc = discount !== undefined ? parseFloat(discount) || 0 : currentOrder.discount;
      const totalAmount = calculateOrderTotal(laborTotal, partsTotal, disc);

      const parsedMileage =
        mileageAtService !== undefined
          ? parseInt(mileageAtService) || null
          : currentOrder.mileageAtService;

      if (parsedMileage && parsedMileage > 0) {
        try {
          await tx.vehicle.update({
            where: { id: currentOrder.vehicleId },
            data: { mileage: parsedMileage },
          });
        } catch {
          // Si no se puede actualizar el kilometraje del vehículo, continuar
        }
      }

      return tx.workOrder.update({
        where: { id },
        data: {
          status: status || currentOrder.status,
          diagnostic: diagnostic !== undefined ? diagnostic : currentOrder.diagnostic,
          issueDescription: issueDescription || currentOrder.issueDescription,
          technicianName: technicianName !== undefined ? technicianName : currentOrder.technicianName,
          mileageAtService: parsedMileage,
          isPaid: isPaid !== undefined ? isPaid : currentOrder.isPaid,
          paymentMethod: paymentMethod !== undefined ? paymentMethod : currentOrder.paymentMethod,
          discount: disc,
          laborTotal,
          partsTotal,
          totalAmount,
        },
        include: {
          client: true,
          vehicle: true,
          services: true,
          items: true,
          progressNotes: true,
        },
      });
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Error updating work order:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar orden' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      // 1. Obtener repuestos asignados a la orden para devolverlos al inventario
      const order = await tx.workOrder.findUnique({
        where: { id },
        include: { items: true },
      });

      if (order?.items) {
        for (const item of order.items) {
          if (item.inventoryItemId) {
            try {
              await tx.inventoryItem.update({
                where: { id: item.inventoryItemId },
                data: { stock: { increment: item.quantity } },
              });
            } catch {
              // Si el repuesto ya no existe en el catálogo, continuar
            }
          }
        }
      }

      // 2. Desvincular comprobantes asociados
      await tx.invoice.updateMany({
        where: { workOrderId: id },
        data: { workOrderId: null },
      });

      // 3. Eliminar orden de trabajo (cascada en items, services, progressNotes)
      await tx.workOrder.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: 'Orden eliminada y repuestos restaurados al almacén' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar orden' },
      { status: 500 }
    );
  }
}
