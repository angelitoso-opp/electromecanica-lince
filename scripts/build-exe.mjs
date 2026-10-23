import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const electronDistDir = path.join(rootDir, 'node_modules', 'electron', 'dist');
const electronInstallScript = path.join(rootDir, 'node_modules', 'electron', 'install.js');
const standaloneDir = path.join(rootDir, '.next', 'standalone');
const outBaseDir = path.join(rootDir, 'dist-exe');
const appOutDir = path.join(outBaseDir, 'ElectromecanicaLince-win32-x64');

if (!fs.existsSync(electronDistDir) && fs.existsSync(electronInstallScript)) {
  console.log('⬇️ Descargando binario nativo de Electron para Windows x64...');
  execSync(`node "${electronInstallScript}"`, { cwd: rootDir, stdio: 'inherit' });
}

if (!fs.existsSync(electronDistDir)) {
  console.error('❌ No se encontró node_modules/electron/dist. Ejecuta "npm install" primero.');
  process.exit(1);
}

if (!fs.existsSync(standaloneDir)) {
  console.error('❌ No se encontró .next/standalone. Ejecuta "npm run build" primero.');
  process.exit(1);
}

console.log('📦 Generando ejecutable de escritorio Windows (.exe) para Electromecánica Lince...');

// 1. Limpiar carpeta de salida previa
if (fs.existsSync(appOutDir)) {
  fs.rmSync(appOutDir, { recursive: true, force: true });
}
fs.mkdirSync(appOutDir, { recursive: true });

// 2. Copiar runtime nativo de Electron para Windows x64
fs.cpSync(electronDistDir, appOutDir, { recursive: true, force: true });

// 3. Eliminar default_app.asar para activar modo empaquetado (app.isPackaged = true)
const defaultAppAsar = path.join(appOutDir, 'resources', 'default_app.asar');
if (fs.existsSync(defaultAppAsar)) {
  fs.rmSync(defaultAppAsar, { force: true });
}

// 4. Crear resources/app con el punto de entrada de Electron
const resourcesAppDir = path.join(appOutDir, 'resources', 'app');
fs.mkdirSync(path.join(resourcesAppDir, 'electron'), { recursive: true });

fs.copyFileSync(
  path.join(rootDir, 'electron', 'main.js'),
  path.join(resourcesAppDir, 'electron', 'main.js')
);

const appPkg = {
  name: 'electromecanica-lince',
  productName: 'Electromecánica Lince',
  version: '1.0.0',
  description: 'Sistema de Gestión Automotriz - Electromecánica Lince',
  main: 'electron/main.js',
  author: 'Electromecánica Lince (Jr. Soledad 330, Lince)',
};

fs.writeFileSync(
  path.join(resourcesAppDir, 'package.json'),
  JSON.stringify(appPkg, null, 2),
  'utf-8'
);

// 5. Copiar el servidor Next.js Standalone + SQLite limpio + Prisma a resources/standalone
const resourcesStandaloneDir = path.join(appOutDir, 'resources', 'standalone');
fs.cpSync(standaloneDir, resourcesStandaloneDir, { recursive: true, force: true });

// 6. Renombrar electron.exe -> ElectromecanicaLince.exe
const srcExe = path.join(appOutDir, 'electron.exe');
const destExe = path.join(appOutDir, 'ElectromecanicaLince.exe');
if (fs.existsSync(srcExe)) {
  fs.renameSync(srcExe, destExe);
}

// 7. Crear lanzador directo en la raíz de dist-exe para comodidad al copiar a otra PC
const launcherBat = `@echo off
start "" "%~dp0ElectromecanicaLince-win32-x64\\ElectromecanicaLince.exe"
`;
fs.writeFileSync(
  path.join(outBaseDir, 'Abrir Electromecanica Lince.bat'),
  launcherBat,
  'utf-8'
);

console.log('✅ ¡Ejecutable generado con éxito!');
console.log(`👉 Ruta del ejecutable: ${destExe}`);
