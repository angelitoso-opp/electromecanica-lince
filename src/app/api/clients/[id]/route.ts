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
      include: {
        vehicles: true,
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

    // Verificar si el cliente tiene órdenes de trabajo históricas o activas (Hallazgo #4)
    const ordersCount = await prisma.workOrder.count({
      where: { clientId: id },
    });

    if (ordersCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No se puede eliminar el cliente porque tiene ${ordersCount} orden(es) de trabajo registradas en su historial. Elimine o reasigne las órdenes primero para proteger los registros del taller.`,
        },
        { status: 400 }
      );
    }
    
    await prisma.$transaction(async (tx) => {
      // 1. Eliminar vehículos del cliente (que ya sabemos no tienen órdenes)
      await tx.vehicle.deleteMany({
        where: { clientId: id },
      });

      // 2. Eliminar el cliente
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
