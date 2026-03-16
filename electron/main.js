/**
 * FITLAB Fitness – Electron Main Process
 *
 * Flow:
 *  1. Show a loading splash window immediately
 *  2. Spawn the Express backend as a child process
 *  3. Poll http://localhost:3000/health until the server is ready
 *  4. Load the frontend URL in the main window, hide the splash
 */

const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

// ─── Paths ─────────────────────────────────────────────────────────────────
// In production (packaged), resources land in process.resourcesPath.
// In development (electron .), __dirname is the electron/ folder itself.
const isPacked = app.isPackaged;

const backendDir = isPacked
    ? path.join(process.resourcesPath, 'backend')
    : path.join(__dirname, '..', 'backend');

// User-writable data directory (AppData\Roaming\FITLABFitness on Windows)
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'gym_membership.db');

// ─── State ─────────────────────────────────────────────────────────────────
let mainWindow = null;
let loadingWindow = null;
let backendProcess = null;
let PORT = 3000;
const MAX_WAIT_MS = 30_000;   // 30 s timeout waiting for server

// ─── Free Port Finder ───────────────────────────────────────────────────────
function getFreePort(defaultPort = 3000) {
    return new Promise((resolve, reject) => {
        const server = http.createServer();
        server.on('error', err => {
            if (err.code === 'EADDRINUSE') {
                // Try port 0 for an automatic free port
                const fallbackServer = http.createServer();
                fallbackServer.listen(0, () => {
                    const port = fallbackServer.address().port;
                    fallbackServer.close(() => resolve(port));
                });
            } else {
                reject(err);
            }
        });
        server.listen(defaultPort, () => {
            server.close(() => resolve(defaultPort));
        });
    });
}

// ─── Migrate existing DB from old install location ──────────────────────────
function migrateOldDb() {
    const oldDb = path.join(backendDir, 'gym_membership.db');
    if (fs.existsSync(oldDb) && !fs.existsSync(dbPath)) {
        try {
            fs.mkdirSync(userDataPath, { recursive: true });
            fs.copyFileSync(oldDb, dbPath);
            console.log('Migrated DB from', oldDb, 'to', dbPath);
        } catch (e) {
            console.warn('Could not migrate old DB:', e.message);
        }
    }
}

// ─── Splash window ──────────────────────────────────────────────────────────
function createLoadingWindow() {
    loadingWindow = new BrowserWindow({
        width: 420,
        height: 340,
        frame: false,
        transparent: false,
        resizable: false,
        center: true,
        show: false,
        webPreferences: { nodeIntegration: false, contextIsolation: true }
    });

    loadingWindow.loadFile(path.join(__dirname, 'loading.html'));
    loadingWindow.once('ready-to-show', () => loadingWindow.show());
}

// ─── Main window ────────────────────────────────────────────────────────────
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        show: false,
        title: 'FITLAB Fitness',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadURL(`http://localhost:${PORT}`);

    // Open external links in OS browser, not Electron
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (!url.startsWith(`http://localhost:${PORT}`)) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    mainWindow.once('ready-to-show', () => {
        if (loadingWindow && !loadingWindow.isDestroyed()) {
            loadingWindow.close();
        }
        mainWindow.show();
        mainWindow.focus();
    });

    mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── Start Express backend ───────────────────────────────────────────────────
function startBackend() {
    // Ensure user data dir exists
    fs.mkdirSync(userDataPath, { recursive: true });

    // Find node executable
    const nodeExe = process.platform === 'win32' ? 'node.exe' : 'node';

    const env = {
        ...process.env,
        PORT: String(PORT),
        DB_PATH: dbPath,
        NODE_ENV: 'production'
    };

    backendProcess = spawn(nodeExe, ['server.js'], {
        cwd: backendDir,
        env,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    backendProcess.stdout.on('data', d => process.stdout.write('[backend] ' + d));
    backendProcess.stderr.on('data', d => process.stderr.write('[backend-err] ' + d));

    backendProcess.on('error', err => {
        console.error('Failed to start backend:', err.message);
        dialog.showErrorBox(
            'FITLAB Fitness – Startup Error',
            `Could not start the application server.\n\nDetails: ${err.message}`
        );
        app.quit();
    });

    backendProcess.on('exit', (code, signal) => {
        if (code !== 0 && code !== null) {
            console.error(`Backend exited with code ${code} signal ${signal}`);
        }
    });
}

// ─── Poll until server is ready ──────────────────────────────────────────────
function waitForServer(timeoutMs = MAX_WAIT_MS) {
    return new Promise((resolve, reject) => {
        const start = Date.now();

        function check() {
            http.get(`http://localhost:${PORT}/health`, res => {
                let body = '';
                res.on('data', c => body += c);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(body);
                        if (json.success) return resolve();
                    } catch (_) { }
                    retry();
                });
            }).on('error', retry);
        }

        function retry() {
            if (Date.now() - start > timeoutMs) {
                return reject(new Error('Server did not start within 30 seconds.'));
            }
            setTimeout(check, 400);
        }

        check();
    });
}

// ─── App lifecycle ───────────────────────────────────────────────────────────
app.whenReady().then(async () => {
    try {
        // Automatically find a free port so we never clash with dev servers
        PORT = await getFreePort(3000);
        console.log(`Using dynamically assigned port: ${PORT}`);

        migrateOldDb();
        createLoadingWindow();
        startBackend();

        await waitForServer();
        createMainWindow();
    } catch (err) {
        dialog.showErrorBox('FITLAB Fitness – Startup Error', err.message);
        app.quit();
    }
});

app.on('window-all-closed', () => {
    // On macOS it's common to keep the app active while its dock icon is clicked
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

app.on('before-quit', () => {
    if (backendProcess && !backendProcess.killed) {
        backendProcess.kill();
    }
});

// Safety net: kill backend if Electron crashes
process.on('exit', () => {
    if (backendProcess && !backendProcess.killed) {
        backendProcess.kill();
    }
});
