import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // 1. Forzar volcado y truncado atómico del archivo WAL al archivo principal de SQLite
    await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE);');

    // 2. Obtener la ruta real del archivo SQLite activo
    const dbList = (await prisma.$queryRawUnsafe('PRAGMA database_list;')) as Array<{
      seq: number | bigint;
      name: string;
      file: string;
    }>;

    const mainDb = dbList.find((d) => d.name === 'main');
    const dbPath = mainDb?.file;

    if (!dbPath || !fs.existsSync(dbPath)) {
      return NextResponse.json(
        { success: false, error: 'No se pudo localizar el archivo de base de datos en disco.' },
        { status: 500 }
      );
    }

    const stat = fs.statSync(dbPath);

    // Conteo estadístico de registros protegidos
    const [clientsCount, ordersCount, invoicesCount, itemsCount] = await Promise.all([
      prisma.client.count(),
      prisma.workOrder.count(),
      prisma.invoice.count(),
      prisma.inventoryItem.count(),
    ]);

    // Si solo se solicitan estadísticas o metadatos
    if (action === 'status') {
      return NextResponse.json({
        success: true,
        path: dbPath,
        sizeBytes: stat.size,
        sizeFormatted: `${(stat.size / 1024).toFixed(1)} KB`,
        lastModified: stat.mtime.toISOString(),
        counts: {
          clients: clientsCount,
          orders: ordersCount,
          invoices: invoicesCount,
          inventoryItems: itemsCount,
        },
      });
    }

    // 3. Generar respaldo íntegro e inmutable mediante SQLite VACUUM INTO
    let fileBuffer: Buffer;
    const tempBackupPath = `${dbPath}.vacuum-${Date.now()}.db`;
    try {
      await prisma.$queryRawUnsafe(`VACUUM INTO '${tempBackupPath.replace(/'/g, "''")}';`);
      fileBuffer = fs.readFileSync(tempBackupPath);
      try { fs.unlinkSync(tempBackupPath); } catch {}
    } catch (vacuumErr) {
      console.warn('Fallo VACUUM INTO, recurriendo a lectura directa tras checkpoint:', vacuumErr);
      fileBuffer = fs.readFileSync(dbPath);
    }

    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    const filename = `electromecanica-lince-backup-${dateStr}.db`;

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/x-sqlite3',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(fileBuffer.length),
      },
    });
  } catch (error) {
    console.error('Error generating backup:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar la copia de seguridad.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('backupFile') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó ningún archivo de respaldo.' },
        { status: 400 }
      );
    }

    // Verificar que sea un archivo SQLite válido (los primeros 16 bytes deben ser "SQLite format 3\0")
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const header = buffer.subarray(0, 15).toString('ascii');

    if (!header.startsWith('SQLite format 3')) {
      return NextResponse.json(
        { success: false, error: 'El archivo seleccionado no es una base de datos SQLite válida.' },
        { status: 400 }
      );
    }

    // Obtener ruta de la base de datos actual
    await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(FULL);');
    const dbList = (await prisma.$queryRawUnsafe('PRAGMA database_list;')) as Array<{
      seq: number | bigint;
      name: string;
      file: string;
    }>;
    const mainDb = dbList.find((d) => d.name === 'main');
    const dbPath = mainDb?.file;

    if (!dbPath) {
      return NextResponse.json(
        { success: false, error: 'No se pudo ubicar el destino de restauración.' },
        { status: 500 }
      );
    }

    // Crear un respaldo de seguridad del estado actual antes de sobrescribir
    const backupBeforeRestore = `${dbPath}.pre-restore-${Date.now()}`;
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupBeforeRestore);
    }

    // Desconectar Prisma para liberar bloqueos de archivo SQLite en Windows
    await prisma.$disconnect();

    try {
      // Escribir el nuevo archivo
      fs.writeFileSync(dbPath, buffer);

      // Eliminar archivos WAL, SHM y JOURNAL antiguos para que coincidan con la nueva base restaurada
      const walFile = `${dbPath}-wal`;
      const shmFile = `${dbPath}-shm`;
      const journalFile = `${dbPath}-journal`;
      if (fs.existsSync(walFile)) fs.rmSync(walFile, { force: true });
      if (fs.existsSync(shmFile)) fs.rmSync(shmFile, { force: true });
      if (fs.existsSync(journalFile)) fs.rmSync(journalFile, { force: true });
    } finally {
      // Reconectar Prisma a la base restaurada
      await prisma.$connect();
    }

    return NextResponse.json({
      success: true,
      message: 'Base de datos restaurada correctamente. Los cambios ya están activos.',
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json(
      { success: false, error: 'Error al restaurar la copia de seguridad.' },
      { status: 500 }
    );
  }
}
