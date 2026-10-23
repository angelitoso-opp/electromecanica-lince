import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
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

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name,
        category,
        brand,
        stock: typeof stock === 'number' ? stock : parseInt(stock),
        minStock: typeof minStock === 'number' ? minStock : parseInt(minStock),
        unit,
        unitCost: typeof unitCost === 'number' ? unitCost : parseFloat(unitCost),
        unitPrice: typeof unitPrice === 'number' ? unitPrice : parseFloat(unitPrice),
        location,
        notes,
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar repuesto' },
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
      // Desvincular de órdenes de trabajo para evitar errores de clave foránea
      await tx.workOrderItem.updateMany({
        where: { inventoryItemId: id },
        data: { inventoryItemId: null },
      });

      await tx.inventoryItem.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: 'Repuesto eliminado' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar repuesto' },
      { status: 500 }
    );
  }
}
