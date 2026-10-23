import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category') || '';
    const lowStock = searchParams.get('lowStock') === 'true';

    let whereClause: any = {};

    if (query) {
      whereClause.OR = [
        { name: { contains: query } },
        { code: { contains: query.toUpperCase() } },
        { brand: { contains: query } },
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    const items = await prisma.inventoryItem.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    const filteredItems = lowStock
      ? items.filter((item) => item.stock <= item.minStock)
      : items;

    // Obtener categorías únicas
    const categories = await prisma.inventoryItem.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    return NextResponse.json({
      success: true,
      items: filteredItems,
      categories: categories.map((c) => c.category),
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener inventario' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      code,
      name,
      category,
      brand,
      stock,
      minStock,
      unit,
      unitCost,
      unitPrice,
      location,
      notes,
    } = body;

    if (!name || !category) {
      return NextResponse.json(
        { success: false, error: 'El nombre y la categoría son obligatorios' },
        { status: 400 }
      );
    }

    const itemCode =
      code?.trim().toUpperCase() ||
      `REP-${Date.now().toString().slice(-6)}`;

    const newItem = await prisma.inventoryItem.create({
      data: {
        code: itemCode,
        name,
        category,
        brand: brand || null,
        stock: parseInt(stock) || 0,
        minStock: parseInt(minStock) || 3,
        unit: unit || 'UNIDAD',
        unitCost: parseFloat(unitCost) || 0.0,
        unitPrice: parseFloat(unitPrice) || 0.0,
        location: location || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating inventory item:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Ya existe un repuesto con ese código SKU' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Error al agregar repuesto' },
      { status: 500 }
    );
  }
}
