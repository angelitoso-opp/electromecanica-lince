import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        vehicles: {
          include: {
            workOrders: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            vehicle: true,
            items: true,
            services: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, client });
  } catch (error) {
    console.error('Error fetching client details:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener detalle del cliente' },
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
    const { name, phone, document, email, address, notes } = body;

    const updated = await prisma.client.update({
      where: { id },
      data: {
        name,
        phone,
        document,
        email,
        address,
        notes,
      },
    });

    return NextResponse.json({ success: true, client: updated });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar cliente' },
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
      // 1. Encontrar órdenes asociadas a este cliente
      const clientOrders = await tx.workOrder.findMany({
        where: { clientId: id },
        select: { id: true },
      });
      const orderIds = clientOrders.map((o) => o.id);

      if (orderIds.length > 0) {
        // Desvincular comprobantes de estas órdenes
        await tx.invoice.updateMany({
          where: { workOrderId: { in: orderIds } },
          data: { workOrderId: null },
        });
        // Eliminar órdenes (WorkOrder cascada: items, services, progressNotes)
        await tx.workOrder.deleteMany({
          where: { id: { in: orderIds } },
        });
      }

      // 2. Eliminar vehículos del cliente
      await tx.vehicle.deleteMany({
        where: { clientId: id },
      });

      // 3. Eliminar el cliente
      await tx.client.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar cliente' },
      { status: 500 }
    );
  }
}
