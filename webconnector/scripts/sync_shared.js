#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// -----------------------------------------------------------------------------
// sync_shared.js
// - Copies shared protocol/auth files from the webclient source into the
//   webconnector's local src/shared directory so the standalone npm package
//   remains self-contained.
// - Rewrites the js_andruavMessages import in andruav_auth_shared.js to point
//   at the local copy (webclient uses a different relative path).
// - Runs automatically before build/pack (see package.json scripts).
// - Silently skips if the webclient source is not present (e.g. installed pkg).
// -----------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WEBCONNECTOR_ROOT = path.resolve(__dirname, '..');
const WEBCLIENT_ROOT = path.resolve(WEBCONNECTOR_ROOT, '..');
const SHARED_DIR = path.join(WEBCONNECTOR_ROOT, 'src', 'shared');

const FILES = [
    {
        src: path.join(WEBCLIENT_ROOT, 'src', 'js', 'protocol', 'messages', 'js_andruavMessages.js'),
        dest: path.join(SHARED_DIR, 'js_andruavMessages.js'),
        rewrite: null,
    },
    {
        src: path.join(WEBCLIENT_ROOT, 'src', 'js', 'shared', 'andruav_auth_shared.js'),
        dest: path.join(SHARED_DIR, 'andruav_auth_shared.js'),
        rewrite: (content) => content.replace(
            "import * as js_andruavMessages from '../protocol/messages/js_andruavMessages.js';",
            "import * as js_andruavMessages from './js_andruavMessages.js';"
        ),
    },
];

const fn_sync = () => {
    const sourcesMissing = FILES.some((f) => !fs.existsSync(f.src));
    if (sourcesMissing) {
        console.info('[webconnector] sync_shared: webclient source not found - skipping (using bundled shared files).');
        return;
    }

    if (!fs.existsSync(SHARED_DIR)) {
        fs.mkdirSync(SHARED_DIR, { recursive: true });
    }

    for (let i = 0; i < FILES.length; ++i) {
        const f = FILES[i];
        let content = fs.readFileSync(f.src, 'utf8');
        if (f.rewrite) {
            content = f.rewrite(content);
        }
        fs.writeFileSync(f.dest, content);
        console.info(`[webconnector] sync_shared: ${path.basename(f.dest)} <- ${path.relative(WEBCONNECTOR_ROOT, f.src)}`);
    }

    console.info('[webconnector] sync_shared: shared files synchronized.');
};

fn_sync();
