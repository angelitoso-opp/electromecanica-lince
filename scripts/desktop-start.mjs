import { spawn, execSync } from 'child_process';
import { createRequire } from 'module';
import http from 'http';

const require = createRequire(import.meta.url);
const electronBinary = require('electron');

process.env.ELECTRON_DEV = '1';

function killProcessTree(pid) {
  if (!pid) return;
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } catch {
      // Proceso ya terminado o no encontrado
    }
  } else {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {}
    }
  }
}

function checkDevServer() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:3000', (res) => {
      resolve(res.statusCode !== undefined);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function start() {
  const isServerRunning = await checkDevServer();
  let devProcess = null;

  const cleanup = () => {
    if (devProcess && devProcess.pid) {
      console.log('🛑 Cerrando subprocesos del servidor de desarrollo...');
      killProcessTree(devProcess.pid);
      devProcess = null;
    }
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });
  process.on('exit', () => {
    cleanup();
  });

  if (!isServerRunning) {
    console.log('⚡ Servidor de desarrollo Next.js no detectado en el puerto 3000. Iniciando "next dev"...');
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    devProcess = spawn(npmCmd, ['run', 'dev'], {
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, PORT: '3000' },
    });

    devProcess.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('Ready') || msg.includes('compiled') || msg.includes('3000')) {
        // server progress
      }
    });

    // Esperar hasta que el servidor responda (máximo 25 segundos)
    let ready = false;
    for (let i = 0; i < 50; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (await checkDevServer()) {
        ready = true;
        break;
      }
    }

    if (!ready) {
      console.warn('⚠️ No se pudo confirmar el servidor en 127.0.0.1:3000 a tiempo. Continuando inicio de Electron...');
    } else {
      console.log('✅ Servidor Next.js listo en http://127.0.0.1:3000');
    }
  } else {
    console.log('✅ Servidor de desarrollo activo detectado en http://127.0.0.1:3000');
  }

  console.log('🖥️ Iniciando ventana de Electron...');
  const child = spawn(electronBinary, ['.'], {
    stdio: 'inherit',
    env: { ...process.env, ELECTRON_DEV: '1' },
  });

  child.on('exit', (code) => {
    cleanup();
    process.exit(code || 0);
  });
}

start();
