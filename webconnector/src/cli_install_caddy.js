#!/usr/bin/env node
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const srcDir = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(srcDir, '..');
const scriptPath = path.join(pkgRoot, 'scripts', 'install_caddy.sh');

const p = spawn('bash', [scriptPath, ...process.argv.slice(2)], {
    stdio: 'inherit',
});

p.on('exit', (code) => {
    process.exit(code ?? 0);
});
