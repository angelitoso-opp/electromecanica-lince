import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const SESSION_COOKIE = 'elince_session';
const SESSION_VALUE = 'authenticated_operator_lince_v1';
const MASTER_PIN = process.env.WORKSHOP_PIN || '1234';
const MASTER_PASSWORD = process.env.WORKSHOP_PASSWORD || 'lince2026';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);
    const body = await request.json().catch(() => ({}));

    const isAuthenticated = session?.value === SESSION_VALUE;
    const isPinValid = body.pin === MASTER_PIN || body.pin === MASTER_PASSWORD || body.password === MASTER_PASSWORD;

    if (!isAuthenticated && !isPinValid) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado. Se requiere sesión activa de operador o PIN de seguridad.' },
        { status: 401 }
      );
    }

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
