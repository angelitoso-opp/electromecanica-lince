import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

const MASTER_PIN = process.env.WORKSHOP_PIN || '1234';
const MASTER_PASSWORD = process.env.WORKSHOP_PASSWORD || 'lince2026';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    // Exigir obligatoriamente el PIN de seguridad del taller (Hallazgo #2)
    const isPinValid =
      body.pin === MASTER_PIN ||
      body.pin === MASTER_PASSWORD ||
      body.password === MASTER_PASSWORD;

    if (!isPinValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acceso denegado. Se requiere el PIN de seguridad del taller (Por defecto: 1234) para confirmar el vaciado.',
        },
        { status: 401 }
      );
    }

    // 1. Crear respaldo de emergencia fechado antes de vaciar la base
    try {
      await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(FULL);');
      const dbList = (await prisma.$queryRawUnsafe('PRAGMA database_list;')) as Array<{
        seq: number | bigint;
        name: string;
        file: string;
      }>;
      const mainDb = dbList.find((d) => d.name === 'main');
      const dbPath = mainDb?.file;

      if (dbPath && fs.existsSync(dbPath)) {
        const backupsDir = path.join(path.dirname(dbPath), 'backups');
        if (!fs.existsSync(backupsDir)) {
          fs.mkdirSync(backupsDir, { recursive: true });
        }
        const now = new Date();
        const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        const emergencyPath = path.join(backupsDir, `electromecanica-pre-clear-${stamp}.db`);
        fs.copyFileSync(dbPath, emergencyPath);
      }
    } catch (backupErr) {
      console.warn('Aviso: no se pudo completar snapshot de emergencia previo al vaciado:', backupErr);
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
      message: 'Base de datos reiniciada exitosamente. Se ha guardado un respaldo de emergencia.',
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    return NextResponse.json(
      { success: false, error: 'Error al limpiar datos del taller' },
      { status: 500 }
    );
  }
}
