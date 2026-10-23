import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const keepInventory = body.keepInventory !== false;

    await prisma.$transaction(async (tx) => {
      // 1. Eliminar ítems de comprobantes y comprobantes
      await tx.invoiceItem.deleteMany({});
      await tx.invoice.deleteMany({});

      // 2. Eliminar notas, servicios e ítems de órdenes
      await tx.workOrderProgressNote.deleteMany({});
      await tx.workOrderService.deleteMany({});
      await tx.workOrderItem.deleteMany({});
      await tx.workOrder.deleteMany({});

      // 3. Eliminar vehículos y clientes
      await tx.vehicle.deleteMany({});
      await tx.client.deleteMany({});

      // 4. Si se solicita, limpiar también inventario
      if (!keepInventory) {
        await tx.inventoryItem.deleteMany({});
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Se han eliminado los datos de prueba exitosamente.',
    });
  } catch (error) {
    console.error('Error clearing sample data:', error);
    return NextResponse.json(
      { success: false, error: 'Error al limpiar datos de prueba' },
      { status: 500 }
    );
  }
}
