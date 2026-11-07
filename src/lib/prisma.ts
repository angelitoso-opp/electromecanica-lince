import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: process.env.DATABASE_URL
      ? { db: { url: process.env.DATABASE_URL } }
      : undefined,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Habilitar modo WAL y migrar comprobantes históricos a desglose IGV 18%
if (typeof window === 'undefined') {
  prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;')
    .then(() => prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;'))
    .then(() =>
      prisma.$executeRawUnsafe(`
        UPDATE Invoice
        SET subtotal = ROUND(total / 1.18, 2),
            igv = ROUND(total - ROUND(total / 1.18, 2), 2)
        WHERE (igv = 0 OR igv IS NULL) AND total > 0;
      `)
    )
    .catch(() => {
      // Ignorar durante compilación estática o generación de build
    });
}
