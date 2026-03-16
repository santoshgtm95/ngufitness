const SYNC_API_URL = '/api';

class SyncManager {
    constructor() {
        this.injectModal();
        this.init();
    }

    injectModal() {
        const modalHTML = `
            <!-- Sync Settings Modal -->
            <div id="syncSettingsModal" class="modal">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2>Database Synchronization</h2>
                        <button class="modal-close" onclick="syncApp.closeSyncSettingsModal()">✕</button>
                    </div>
                    <form id="syncSettingsForm" onsubmit="event.preventDefault(); syncApp.saveSyncSettings();">
                        <div class="form-group">
                            <label for="peerIp">Peer Computer IP Address</label>
                            <input type="text" id="peerIp" name="peerIp" placeholder="e.g., 192.168.1.5" required>
                            <small class="form-text text-muted">Enter the IP address of the other computer you want to sync with.</small>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="syncApp.closeSyncSettingsModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Settings</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    init() {
        // Any other initialization if needed
    }

    showSyncSettingsModal() {
        const modal = document.getElementById('syncSettingsModal');
        if (modal) {
            modal.style.display = 'block';
            this.loadSyncSettings();
        }
    }

    closeSyncSettingsModal() {
        const modal = document.getElementById('syncSettingsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async loadSyncSettings() {
        try {
            const response = await fetch(`${SYNC_API_URL}/settings`);
            const result = await response.json();
            if (result.success && result.data) {
                const peerIpInput = document.getElementById('peerIp');
                if (peerIpInput && result.data.peer_ip) {
                    peerIpInput.value = result.data.peer_ip;
                }
            }
        } catch (error) {
            console.error('Error loading sync settings:', error);
        }
    }

    async saveSyncSettings() {
        const peerIpInput = document.getElementById('peerIp');
        if (!peerIpInput) return;

        const peerIp = peerIpInput.value.trim();

        try {
            const response = await fetch(`${SYNC_API_URL}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    key: 'peer_ip',
                    value: peerIp
                })
            });

            const result = await response.json();
            if (result.success) {
                alert('Sync settings saved successfully!');
                this.closeSyncSettingsModal();
            } else {
                alert('Failed to save settings: ' + result.error);
            }
        } catch (error) {
            console.error('Error saving sync settings:', error);
            alert('Failed to save settings. Please try again.');
        }
    }
}

const syncApp = new SyncManager();
