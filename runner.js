const { spawn } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

function runCommand(cmd, args, options = {}) {
  const proc = spawn(cmd, args, { stdio: 'inherit', shell: true, ...options });
  proc.on('close', code => {
    if (code !== 0) {
      console.error(`Process ${cmd} exited with code ${code}`);
    }
  });
  return proc;
}

function installBackendDeps() {
  const reqPath = path.join(__dirname, 'backend', 'requirements.txt');
  if (existsSync(reqPath)) {
    console.log('Installing backend dependencies...');
    return runCommand('pip', ['install', '-r', reqPath], { cwd: path.join(__dirname, 'backend') });
  }
}

function installFrontendDeps() {
  const pkgPath = path.join(__dirname, 'frontend', 'package.json');
  if (existsSync(pkgPath)) {
    console.log('Installing frontend dependencies...');
    return runCommand('pnpm', ['install'], { cwd: path.join(__dirname, 'frontend') });
  }
}

function startBackend() {
  console.log('Starting backend (Flask)...');
  return runCommand('python', ['src/main.py'], { cwd: path.join(__dirname, 'backend') });
}

function startFrontend() {
  console.log('Starting frontend (Vite)...');
  return runCommand('pnpm', ['run', 'dev'], { cwd: path.join(__dirname, 'frontend') });
}

async function main() {
  installBackendDeps();
  installFrontendDeps();

  // Start both servers in parallel
  startBackend();
  startFrontend();
}

main(); 