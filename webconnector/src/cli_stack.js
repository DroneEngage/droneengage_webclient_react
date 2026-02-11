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

        if (a === '--config') {
            args.config = argv[i + 1];
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

const configPath = process.env.DE_WEBCONNECTOR_CONFIG || parsed.config || path.join(homeDir, 'config.json');
const caddyfilePath = process.env.DE_WEBCONNECTOR_CADDYFILE || parsed.caddyfile || path.join(homeDir, 'Caddyfile.localplugin');

fn_mkdirp(homeDir);
fn_copyIfMissing(path.join(pkgRoot, 'config.json'), configPath);
fn_copyIfMissing(path.join(pkgRoot, 'Caddyfile.localplugin'), caddyfilePath);

const webconnectorEntry = path.join(pkgRoot, 'src', 'index.js');

let webconnectorProc = null;
let caddyProc = null;

function fn_shutdown() {
    try {
        if (caddyProc && caddyProc.exitCode === null) caddyProc.kill('SIGTERM');
    } catch {
    }

    try {
        if (webconnectorProc && webconnectorProc.exitCode === null) webconnectorProc.kill('SIGTERM');
    } catch {
    }
}

process.on('SIGINT', () => {
    fn_shutdown();
});
process.on('SIGTERM', () => {
    fn_shutdown();
});
process.on('exit', () => {
    fn_shutdown();
});

console.log('[stack] home:', homeDir);
console.log('[stack] config:', configPath);
console.log('[stack] caddyfile:', caddyfilePath);

console.log('[stack] starting WebConnector...');
webconnectorProc = spawn(process.execPath, [webconnectorEntry, '--config', configPath, ...parsed.passthrough], {
    stdio: 'inherit',
});

console.log('[stack] starting Caddy...');
caddyProc = spawn('caddy', ['run', '--config', caddyfilePath, '--adapter', 'caddyfile'], {
    stdio: 'inherit',
});

webconnectorProc.on('exit', (code) => {
    console.log('[stack] WebConnector exited with code', code);
    fn_shutdown();
});

caddyProc.on('exit', (code) => {
    console.log('[stack] Caddy exited with code', code);
    fn_shutdown();
});
