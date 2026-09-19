import { spawn } from 'child_process';

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const dotnetCmd = isWindows ? 'dotnet.exe' : 'dotnet';

console.log('\x1b[36m%s\x1b[0m', '=====================================================');
console.log('\x1b[36m%s\x1b[0m', '  NASA Earth System Trend Detective - Dev Runner     ');
console.log('\x1b[36m%s\x1b[0m', '  Ejecutando Backend (.NET 10) + Frontend (React 19) ');
console.log('\x1b[36m%s\x1b[0m', '=====================================================');

// 1. Iniciar API .NET 10
const backend = spawn(dotnetCmd, ['run', '--project', 'backend/src/NasaTrendDetective.Api'], {
  stdio: 'pipe',
  shell: true,
  env: { ...process.env, ASPNETCORE_ENVIRONMENT: 'Development', ASPNETCORE_URLS: 'http://localhost:5000' },
});

backend.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[35m[API]\x1b[0m ${data}`);
});

backend.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[31m[API ERR]\x1b[0m ${data}`);
});

// 2. Iniciar Frontend Vite
const frontend = spawn(npmCmd, ['run', 'dev', '--workspace=frontend'], {
  stdio: 'pipe',
  shell: true,
  env: { ...process.env, VITE_API_URL: 'http://localhost:5000' },
});

frontend.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[32m[WEB]\x1b[0m ${data}`);
});

frontend.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[33m[WEB ERR]\x1b[0m ${data}`);
});

const cleanup = () => {
  console.log('\n\x1b[33m%s\x1b[0m', 'Deteniendo servicios locales...');
  backend.kill();
  frontend.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
