import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Listar órdenes de trabajo con filtros (estado, placa, cliente)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const query = searchParams.get('q')?.trim() || '';

    const whereClause: any = {};

    if (status && status !== 'TODOS') {
      whereClause.status = status;
    }

    if (query) {
      whereClause.OR = [
        { orderNumber: { contains: query.toUpperCase() } },
        { vehicle: { plate: { contains: query.toUpperCase() } } },
        { client: { name: { contains: query } } },
        { technicianName: { contains: query } },
      ];
    }

    const orders = await prisma.workOrder.findMany({
      where: whereClause,
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching work orders:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener órdenes de trabajo' },
      { status: 500 }
    );
  }
}

// Crear nueva orden de trabajo
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      clientId,
      vehicleId,
      issueDescription,
      diagnostic,
      mileageAtService,
      technicianName,
      status,
      services = [], // [{ description, cost }]
      items = [],    // [{ inventoryItemId, description, quantity, unitPrice, isCustomPart }]
      discount = 0,
      initialVoiceNote,
    } = body;

    if (!clientId || !vehicleId || !issueDescription) {
      return NextResponse.json(
        { success: false, error: 'Cliente, vehículo y motivo de ingreso son obligatorios' },
        { status: 400 }
      );
    }

    // Generar código correlativo de orden de forma segura superando 9,999 (Hallazgo #11)
    const allOrders = await prisma.workOrder.findMany({
      select: { orderNumber: true },
    });
    let maxNum = 0;
    for (const ord of allOrders) {
      const match = ord.orderNumber.match(/\d+$/);
      if (match) {
        const n = parseInt(match[0], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    const nextNum = maxNum + 1;
    const orderNumber = `OT-${String(nextNum).padStart(4, '0')}`;

    // Calcular subtotales
    const laborTotal = services.reduce(
      (sum: number, s: any) => sum + (parseFloat(s.cost) || 0),
      0
    );

    const partsTotal = items.reduce(
      (sum: number, i: any) =>
        sum + (parseInt(i.quantity) || 1) * (parseFloat(i.unitPrice) || 0),
      0
    );

    const totalAmount = Math.max(0, laborTotal + partsTotal - (parseFloat(discount) || 0));

    // Crear la orden en una transacción y descontar stock si corresponde
    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Crear Orden
      const order = await tx.workOrder.create({
        data: {
          orderNumber,
          status: status || 'PENDIENTE',
          issueDescription,
          diagnostic: diagnostic || null,
          mileageAtService: mileageAtService ? parseInt(mileageAtService) : null,
          technicianName: technicianName || null,
          laborTotal,
          partsTotal,
          discount: parseFloat(discount) || 0,
          totalAmount,
          clientId,
          vehicleId,
          services: {
            create: services.map((s: any) => ({
              description: s.description,
              cost: parseFloat(s.cost) || 0,
            })),
          },
          items: {
            create: items.map((i: any) => {
              const qty = parseInt(i.quantity) || 1;
              const price = parseFloat(i.unitPrice) || 0;
              return {
                inventoryItemId: i.inventoryItemId || null,
                description: i.description,
                quantity: qty,
                unitPrice: price,
                subtotal: qty * price,
                isCustomPart: !!i.isCustomPart,
              };
            }),
          },
          progressNotes: initialVoiceNote
            ? {
                create: [
                  {
                    note: initialVoiceNote,
                    source: 'VOZ',
                    author: technicianName || 'Mecánico',
                  },
                ],
              }
            : undefined,
        },
        include: {
          client: true,
          vehicle: true,
          services: true,
          items: true,
        },
      });

      // 2. Descontar del inventario protegiendo contra stock negativo (Hallazgo #5)
      for (const item of items) {
        if (item.inventoryItemId) {
          const qty = parseInt(item.quantity) || 1;
          const invItem = await tx.inventoryItem.findUnique({
            where: { id: item.inventoryItemId },
            select: { stock: true },
          });
          if (invItem) {
            await tx.inventoryItem.update({
              where: { id: item.inventoryItemId },
              data: {
                stock: Math.max(0, invItem.stock - qty),
              },
            });
          }
        }
      }

      // 3. Actualizar kilometraje del vehículo si se ingresó uno mayor
      if (mileageAtService) {
        await tx.vehicle.update({
          where: { id: vehicleId },
          data: { mileage: parseInt(mileageAtService) },
        });
      }

      return order;
    });

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error) {
    console.error('Error creating work order:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear orden de trabajo' },
      { status: 500 }
    );
  }
}
