// Preload script — runs in a sandboxed context before the renderer page loads.
// Keep this minimal; expose only what the renderer truly needs.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform
});
