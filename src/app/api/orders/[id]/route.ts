import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
        // Revertir inventario previo si era necesario o simplemente actualizar
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
        partsTotal = items.reduce(
          (sum: number, i: any) =>
            sum + (parseInt(i.quantity) || 1) * (parseFloat(i.unitPrice) || 0),
          0
        );
      }

      const disc = discount !== undefined ? parseFloat(discount) || 0 : currentOrder.discount;
      const totalAmount = Math.max(0, laborTotal + partsTotal - disc);

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
    await prisma.workOrder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Orden eliminada' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar orden' },
      { status: 500 }
    );
  }
}
