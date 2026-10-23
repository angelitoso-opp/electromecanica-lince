import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Listar clientes (con búsqueda por nombre, teléfono o placa de vehículo)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    let whereClause = {};
    if (query) {
      whereClause = {
        OR: [
          { name: { contains: query } },
          { phone: { contains: query } },
          { document: { contains: query } },
          {
            vehicles: {
              some: {
                plate: { contains: query.toUpperCase() },
              },
            },
          },
        ],
      };
    }

    const clients = await prisma.client.findMany({
      where: whereClause,
      include: {
        vehicles: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { success: false, error: 'Error al listar clientes' },
      { status: 500 }
    );
  }
}

// Crear nuevo cliente (opcionalmente con vehículo en el mismo paso)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, document, email, address, notes, vehicle } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'El nombre y teléfono son obligatorios' },
        { status: 400 }
      );
    }

    const newClient = await prisma.client.create({
      data: {
        name,
        phone,
        document,
        email,
        address,
        notes,
        vehicles: vehicle?.plate
          ? {
              create: [
                {
                  plate: vehicle.plate.toUpperCase().trim(),
                  brand: vehicle.brand || '',
                  model: vehicle.model || '',
                  year: vehicle.year ? parseInt(vehicle.year) : null,
                  color: vehicle.color || null,
                  mileage: vehicle.mileage ? parseInt(vehicle.mileage) : null,
                },
              ],
            }
          : undefined,
      },
      include: {
        vehicles: true,
      },
    });

    return NextResponse.json({ success: true, client: newClient }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating client:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Ya existe un vehículo con esa placa registrada' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Error al crear cliente' },
      { status: 500 }
    );
  }
}
