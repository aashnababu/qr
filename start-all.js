const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting MediFlow Core (Backend + Frontend)...\n');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

// Start backend
const backend = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
});

// Start frontend
const frontend = spawn(npmCmd, ['--prefix', 'frontend', 'run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
});

function handleExit(code) {
  try {
    backend.kill();
  } catch {}
  try {
    frontend.kill();
  } catch {}
  process.exit(code);
}

process.on('SIGINT', () => handleExit(0));
process.on('SIGTERM', () => handleExit(0));

backend.on('error', (err) => console.error('Backend error:', err));
frontend.on('error', (err) => console.error('Frontend error:', err));

