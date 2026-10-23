import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const standaloneDir = path.join(rootDir, '.next', 'standalone');

if (!fs.existsSync(standaloneDir)) {
  console.error('❌ No se encontró .next/standalone. Ejecuta "npm run build" primero.');
  process.exit(1);
}

// 1. Copy public -> .next/standalone/public
const publicSrc = path.join(rootDir, 'public');
const publicDest = path.join(standaloneDir, 'public');
if (fs.existsSync(publicSrc)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true, force: true });
  console.log('✅ Copiado public -> .next/standalone/public');
}

// 2. Copy .next/static -> .next/standalone/.next/static
const staticSrc = path.join(rootDir, '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');
if (fs.existsSync(staticSrc)) {
  fs.cpSync(staticSrc, staticDest, { recursive: true, force: true });
  console.log('✅ Copiado .next/static -> .next/standalone/.next/static');
}

// 3. Copy prisma/clean.db & schema.prisma -> .next/standalone/prisma/
const prismaDest = path.join(standaloneDir, 'prisma');
fs.mkdirSync(prismaDest, { recursive: true });

for (const file of ['clean.db', 'dev.db', 'schema.prisma']) {
  const srcFile = path.join(rootDir, 'prisma', file);
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, path.join(prismaDest, file));
  }
}
console.log('✅ Copiada plantilla de base de datos limpia -> .next/standalone/prisma/');

// 4. Ensure Prisma Client & query engine binary are in .next/standalone/node_modules/.prisma
const prismaClientSrc = path.join(rootDir, 'node_modules', '.prisma');
const prismaClientDest = path.join(standaloneDir, 'node_modules', '.prisma');
if (fs.existsSync(prismaClientSrc)) {
  fs.cpSync(prismaClientSrc, prismaClientDest, { recursive: true, force: true });
  console.log('✅ Motor Prisma SQLite copiado a .next/standalone/node_modules/.prisma');
}

console.log('🚀 Paquete Standalone listo para empaquetado de escritorio (.exe).');
