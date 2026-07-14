#!/usr/bin/env node
/**
 * Cross-platform Caddy installation script
 * Supports Windows, macOS, and Linux (Ubuntu/Debian)
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLATFORM = os.platform();
const ARCH = os.arch();

console.log(`[Caddy Installer] Platform: ${PLATFORM}`);
console.log(`[Caddy Installer] Architecture: ${ARCH}`);

// Caddy download URLs
const CADDY_VERSION = 'v2.8.4';
const CADDY_BASE_URL = 'https://github.com/caddyserver/caddy/releases/download';

function getDownloadUrl() {
    let platform, arch;
    
    // Map Node.js platform/arch to Caddy naming
    switch (PLATFORM) {
        case 'win32':
            platform = 'windows';
            break;
        case 'darwin':
            platform = 'mac';
            break;
        case 'linux':
            platform = 'linux';
            break;
        default:
            throw new Error(`Unsupported platform: ${PLATFORM}`);
    }
    
    switch (ARCH) {
        case 'x64':
            arch = 'amd64';
            break;
        case 'arm64':
            arch = 'arm64';
            break;
        case 'arm':
            arch = 'armv7';
            break;
        default:
            throw new Error(`Unsupported architecture: ${ARCH}`);
    }
    
    const filename = PLATFORM === 'win32' 
        ? `caddy_${CADDY_VERSION}_${platform}_${arch}.zip`
        : `caddy_${CADDY_VERSION}_${platform}_${arch}.tar.gz`;
    
    return `${CADDY_BASE_URL}/${CADDY_VERSION}/${filename}`;
}

function getInstallDir() {
    if (PLATFORM === 'win32') {
        return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Caddy');
    }
    // Unix-like systems
    return '/usr/local/bin';
}

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        console.log(`[Caddy Installer] Downloading from: ${url}`);
        
        const file = fs.createWriteStream(destPath);
        
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Follow redirect
                downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
                return;
            }
            
            if (response.statusCode !== 200) {
                reject(new Error(`Download failed with status: ${response.statusCode}`));
                return;
            }
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                console.log(`[Caddy Installer] Downloaded to: ${destPath}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => {});
            reject(err);
        });
    });
}

function extractArchive(archivePath, destDir) {
    return new Promise((resolve, reject) => {
        console.log(`[Caddy Installer] Extracting: ${archivePath}`);
        
        let command, args;
        
        if (PLATFORM === 'win32') {
            command = 'powershell';
            args = [
                '-NoProfile',
                '-Command',
                `Expand-Archive -Path "${archivePath}" -DestinationPath "${destDir}" -Force`
            ];
        } else {
            // Unix-like systems use tar
            command = 'tar';
            args = ['-xzf', archivePath, '-C', destDir];
        }
        
        const proc = spawn(command, args, { stdio: 'inherit' });
        
        proc.on('close', (code) => {
            if (code === 0) {
                console.log(`[Caddy Installer] Extraction complete`);
                resolve();
            } else {
                reject(new Error(`Extraction failed with code: ${code}`));
            }
        });
    });
}

function installCaddyBinary() {
    return new Promise(async (resolve, reject) => {
        try {
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'caddy-install-'));
            const downloadUrl = getDownloadUrl();
            const archivePath = path.join(tempDir, path.basename(downloadUrl));
            
            // Download
            await downloadFile(downloadUrl, archivePath);
            
            // Extract
            await extractArchive(archivePath, tempDir);
            
            // Find extracted caddy binary
            const caddyBinary = PLATFORM === 'win32' 
                ? path.join(tempDir, 'caddy.exe')
                : path.join(tempDir, 'caddy');
            
            if (!fs.existsSync(caddyBinary)) {
                throw new Error('Caddy binary not found after extraction');
            }
            
            // Install to target directory
            const installDir = getInstallDir();
            const targetPath = PLATFORM === 'win32'
                ? path.join(installDir, 'caddy.exe')
                : path.join(installDir, 'caddy');
            
            console.log(`[Caddy Installer] Installing to: ${targetPath}`);
            
            if (!fs.existsSync(installDir)) {
                fs.mkdirSync(installDir, { recursive: true });
            }
            
            fs.copyFileSync(caddyBinary, targetPath);
            
            // Make executable on Unix
            if (PLATFORM !== 'win32') {
                fs.chmodSync(targetPath, '755');
            }
            
            // Add to PATH on Windows
            if (PLATFORM === 'win32') {
                console.log(`[Caddy Installer] Adding to PATH...`);
                try {
                    exec(`setx PATH "%PATH%;${installDir}"`, (err) => {
                        if (err) {
                            console.warn(`[Caddy Installer] Could not add to PATH automatically: ${err.message}`);
                            console.log(`[Caddy Installer] Please add ${installDir} to your PATH manually`);
                        } else {
                            console.log(`[Caddy Installer] Added to PATH (restart terminal required)`);
                        }
                        resolve();
                    });
                } catch (e) {
                    console.warn(`[Caddy Installer] Could not add to PATH automatically`);
                    resolve();
                }
            } else {
                resolve();
            }
            
            // Cleanup
            fs.rmSync(tempDir, { recursive: true, force: true });
            
        } catch (error) {
            reject(error);
        }
    });
}

function checkCaddyInstalled() {
    return new Promise((resolve) => {
        const command = PLATFORM === 'win32' ? 'where' : 'which';
        exec(`${command} caddy`, (error) => {
            resolve(!error);
        });
    });
}

async function main() {
    try {
        // Check if already installed
        const isInstalled = await checkCaddyInstalled();
        
        if (isInstalled) {
            console.log('[Caddy Installer] Caddy is already installed');
            const versionCheck = spawn('caddy', ['version'], { stdio: 'pipe' });
            versionCheck.stdout.on('data', (data) => {
                console.log(`[Caddy Installer] ${data.toString().trim()}`);
            });
            return;
        }
        
        console.log('[Caddy Installer] Caddy not found, installing...');
        
        if (PLATFORM === 'win32') {
            console.log('[Caddy Installer] Windows detected - will install to LOCALAPPDATA');
        } else if (PLATFORM === 'darwin') {
            console.log('[Caddy Installer] macOS detected - will install to /usr/local/bin (requires sudo)');
        } else {
            console.log('[Caddy Installer] Linux detected - will install to /usr/local/bin (requires sudo)');
        }
        
        // Check for sudo on Unix
        if (PLATFORM !== 'win32') {
            const installDir = getInstallDir();
            if (fs.existsSync(installDir) && !fs.accessSync(installDir, fs.constants.W_OK)) {
                console.log('[Caddy Installer] This script requires sudo privileges');
                console.log('[Caddy Installer] Please run: sudo node scripts/install_caddy.js');
                process.exit(1);
            }
        }
        
        await installCaddyBinary();
        
        console.log('[Caddy Installer] Installation complete!');
        console.log('[Caddy Installer] Run: caddy version to verify');
        
        if (PLATFORM === 'win32') {
            console.log('[Caddy Installer] Restart your terminal for PATH changes to take effect');
        }
        
    } catch (error) {
        console.error('[Caddy Installer] Installation failed:', error.message);
        process.exit(1);
    }
}

main();
