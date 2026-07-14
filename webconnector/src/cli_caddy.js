#!/usr/bin/env node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

function fn_mkdirp(p) {
    fs.mkdirSync(p, { recursive: true });
}

function fn_copyIfMissing(src, dst) {
    if (fs.existsSync(dst)) return;
    fs.copyFileSync(src, dst);
}

function fn_parseArgs(argv) {
    const args = { passthrough: [] };

    for (let i = 0; i < argv.length; ++i) {
        const a = argv[i];
        if (a === '--home') {
            args.home = argv[i + 1];
            i++;
            continue;
        }

        if (a === '--caddyfile') {
            args.caddyfile = argv[i + 1];
            i++;
            continue;
        }

        args.passthrough.push(a);
    }

    return args;
}

const argv = process.argv.slice(2);
const parsed = fn_parseArgs(argv);

const srcDir = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(srcDir, '..');

const defaultHome = path.join(os.homedir(), '.droneengage', 'webconnector');
const homeDir = process.env.DE_WEBCONNECTOR_HOME || parsed.home || defaultHome;

const caddyfilePath = process.env.DE_WEBCONNECTOR_CADDYFILE || parsed.caddyfile || path.join(homeDir, 'Caddyfile.localplugin');

fn_mkdirp(homeDir);
fn_copyIfMissing(path.join(pkgRoot, 'Caddyfile.localplugin'), caddyfilePath);

console.log('[caddy] home:', homeDir);
console.log('[caddy] caddyfile:', caddyfilePath);

const p = spawn('caddy', ['run', '--config', caddyfilePath, '--adapter', 'caddyfile', ...parsed.passthrough], {
    stdio: 'inherit',
});

p.on('exit', (code) => {
    process.exit(code ?? 0);
});
