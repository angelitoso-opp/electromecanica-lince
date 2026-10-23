import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    let whereClause = {};
    if (query) {
      whereClause = {
        OR: [
          { plate: { contains: query.toUpperCase() } },
          { brand: { contains: query } },
          { model: { contains: query } },
          { client: { name: { contains: query } } },
        ],
      };
    }

    const vehicles = await prisma.vehicle.findMany({
      where: whereClause,
      include: {
        client: true,
        workOrders: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, vehicles });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { success: false, error: 'Error al listar vehículos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plate, brand, model, year, color, vin, mileage, clientId } = body;

    if (!plate || !clientId) {
      return NextResponse.json(
        { success: false, error: 'La placa y el cliente son obligatorios' },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        plate: plate.toUpperCase().trim(),
        brand: brand || '',
        model: model || '',
        year: year ? parseInt(year) : null,
        color: color || null,
        vin: vin || null,
        mileage: mileage ? parseInt(mileage) : null,
        clientId,
      },
      include: {
        client: true,
      },
    });

    return NextResponse.json({ success: true, vehicle }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Ya existe un vehículo registrado con esta placa' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Error al registrar vehículo' },
      { status: 500 }
    );
  }
}
