import { spawn } from 'child_process';

process.env.ELECTRON_DEV = '1';
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(cmd, ['electron', '.'], { stdio: 'inherit', env: process.env });
child.on('exit', (code) => process.exit(code || 0));
