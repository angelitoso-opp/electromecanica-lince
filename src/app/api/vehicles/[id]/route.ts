import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        client: true,
        workOrders: {
          orderBy: { createdAt: 'desc' },
          include: {
            services: true,
            items: true,
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehículo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, vehicle });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener datos del vehículo' },
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
    const { plate, brand, model, year, color, vin, mileage, clientId } = body;

    const dataToUpdate: any = {};
    if (plate) dataToUpdate.plate = plate.toUpperCase().trim();
    if (brand !== undefined) dataToUpdate.brand = brand;
    if (model !== undefined) dataToUpdate.model = model;
    if (year !== undefined) dataToUpdate.year = year ? parseInt(year) : null;
    if (color !== undefined) dataToUpdate.color = color || null;
    if (vin !== undefined) dataToUpdate.vin = vin || null;
    if (mileage !== undefined) dataToUpdate.mileage = mileage ? parseInt(mileage) : null;
    if (clientId) dataToUpdate.clientId = clientId;

    const updated = await prisma.vehicle.update({
      where: { id },
      data: dataToUpdate,
      include: { client: true },
    });

    return NextResponse.json({ success: true, vehicle: updated });
  } catch (error: any) {
    console.error('Error updating vehicle:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Ya existe otro vehículo registrado con esta placa.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Error al actualizar vehículo' },
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

    // Verificar si el vehículo tiene órdenes de trabajo asociadas
    const ordersCount = await prisma.workOrder.count({
      where: { vehicleId: id },
    });

    if (ordersCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No se puede eliminar el vehículo porque tiene ${ordersCount} orden(es) de trabajo registradas en su historial.`,
        },
        { status: 400 }
      );
    }

    await prisma.vehicle.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Vehículo eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar vehículo' },
      { status: 500 }
    );
  }
}
