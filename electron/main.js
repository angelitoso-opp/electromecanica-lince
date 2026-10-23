const { app, BrowserWindow, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');
const { spawn } = require('child_process');

let mainWindow = null;
let serverProcess = null;

// Single instance lock so the user doesn't accidentally open multiple copies
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function getFreePort(startPort = 3456) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => {
      resolve(getFreePort(startPort + 1));
    });
    server.listen(startPort, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get(url, (res) => {
          resolve();
        })
        .on('error', () => {
          if (Date.now() - start > timeoutMs) {
            reject(new Error('Tiempo de espera agotado iniciando el servidor local.'));
          } else {
            setTimeout(check, 150);
          }
        });
    };
    check();
  });
}

function ensureUserDatabase(standaloneDir) {
  const userDataDir = app.getPath('userData');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const targetDbPath = path.join(userDataDir, 'electromecanica.db');
  if (!fs.existsSync(targetDbPath)) {
    const templateCandidates = [
      path.join(standaloneDir, 'prisma', 'clean.db'),
      path.join(standaloneDir, 'prisma', 'dev.db'),
      path.join(__dirname, '..', 'prisma', 'clean.db'),
      path.join(__dirname, '..', 'prisma', 'dev.db'),
    ];
    for (const candidate of templateCandidates) {
      if (fs.existsSync(candidate)) {
        fs.copyFileSync(candidate, targetDbPath);
        break;
      }
    }
  }
  return targetDbPath;
}

async function startEmbeddedServer() {
  const isDev = !app.isPackaged && process.env.ELECTRON_DEV === '1';
  if (isDev) {
    return 'http://127.0.0.1:3000';
  }

  // Locate standalone folder (either packaged in resources/standalone or local .next/standalone)
  const packagedStandalone = path.join(process.resourcesPath, 'standalone');
  const localStandalone = path.join(__dirname, '..', '.next', 'standalone');
  const standaloneDir = fs.existsSync(packagedStandalone)
    ? packagedStandalone
    : localStandalone;

  const serverScript = path.join(standaloneDir, 'server.js');
  if (!fs.existsSync(serverScript)) {
    throw new Error(`No se encontró el servidor embebido en: ${serverScript}`);
  }

  const dbPath = ensureUserDatabase(standaloneDir);
  const normalizedDbUrl = `file:${dbPath.replace(/\\/g, '/')}`;
  const port = await getFreePort(3456);

  serverProcess = spawn(process.execPath, [serverScript], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      PORT: String(port),
      HOSTNAME: '127.0.0.1',
      DATABASE_URL: normalizedDbUrl,
    },
    stdio: 'pipe',
    windowsHide: true,
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error]: ${data}`);
  });

  const serverUrl = `http://127.0.0.1:${port}`;
  await waitForServer(serverUrl);
  return serverUrl;
}

function createSplashHtml() {
  return `data:text/html;charset=utf-8,${encodeURIComponent(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Electromecánica Lince</title>
  <style>
    body {
      margin: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f4f6f8;
      color: #131416;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      user-select: none;
    }
    .card {
      background: #ffffff;
      border: 1px solid #dde2e8;
      border-radius: 10px;
      padding: 28px 36px;
      text-align: center;
      max-width: 360px;
    }
    .logo {
      width: 40px;
      height: 40px;
      background: #131416;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      margin-bottom: 14px;
    }
    h1 {
      font-size: 16px;
      margin: 0 0 6px 0;
      font-weight: 600;
    }
    p {
      font-size: 13px;
      color: #5b6470;
      margin: 0 0 16px 0;
    }
    .code {
      font-family: monospace;
      font-size: 11px;
      color: #1b6c80;
      background: #eef6f8;
      padding: 4px 10px;
      border-radius: 4px;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">EL</div>
    <h1>Electromecánica Lince</h1>
    <p>Iniciando motor local y base de datos SQLite...</p>
    <span class="code">Jr. Soledad 330, Lince · Estación Local</span>
  </div>
</body>
</html>`)}`;
}

async function createWindow() {
  // Permitir uso de micrófono para el módulo de Dictado por Voz
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media' || permission === 'audioCapture') {
      callback(true);
    } else {
      callback(true);
    }
  });

  mainWindow = new BrowserWindow({
    width: 1380,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    title: 'Electromecánica Lince · Sistema de Gestión Automotriz',
    backgroundColor: '#f4f6f8',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  // Abrir enlaces externos (ej. WhatsApp wa.me) en el navegador predeterminado de la PC
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://wa.me') || url.startsWith('https://api.whatsapp.com') || url.startsWith('http')) {
      if (!url.includes('127.0.0.1') && !url.includes('localhost')) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    }
    return { action: 'allow' };
  });

  mainWindow.loadURL(createSplashHtml());

  try {
    const serverUrl = await startEmbeddedServer();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(serverUrl);
    }
  } catch (err) {
    console.error('Failed to start server:', err);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(
          `<body style="font-family:sans-serif;padding:40px;background:#f4f6f8;"><h2>Error al iniciar el servidor local</h2><pre>${err.message}</pre></body>`
        )}`
      );
    }
  }
}

app.whenReady().then(createWindow);


function performAutoBackup(userDataDir) {
  try {
    const dbPath = path.join(userDataDir, 'electromecanica.db');
    if (!fs.existsSync(dbPath)) return;
    const stats = fs.statSync(dbPath);
    if (stats.size < 4096) return;

    const backupsDir = path.join(userDataDir, 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const today = new Date().toISOString().slice(0, 10);
    const destName = `electromecanica-auto-${today}.db`;
    const destPath = path.join(backupsDir, destName);

    fs.copyFileSync(dbPath, destPath);

    // Rotación: conservar los últimos 7 respaldos diarios
    const existing = fs
      .readdirSync(backupsDir)
      .filter((f) => f.startsWith('electromecanica-auto-') && f.endsWith('.db'))
      .sort();

    if (existing.length > 7) {
      const toRemove = existing.slice(0, existing.length - 7);
      toRemove.forEach((f) => {
        try {
          fs.unlinkSync(path.join(backupsDir, f));
        } catch {
          // ignore
        }
      });
    }
  } catch (err) {
    console.error('Error al generar respaldo automático:', err);
  }
}

app.on('window-all-closed', () => {
  try { performAutoBackup(app.getPath('userData')); } catch {}
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {
      // ignore
    }
    serverProcess = null;
  }
  app.quit();
});

app.on('will-quit', () => {
  try { performAutoBackup(app.getPath('userData')); } catch {}
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {
      // ignore
    }
    serverProcess = null;
  }
});
