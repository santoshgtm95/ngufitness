const axios = require('axios');
const db = require('../config/database');

class SyncService {
    constructor() {
        this.peerIp = '';
        this.loadPeerIp();
    }

    loadPeerIp() {
        try {
            const setting = db.prepare("SELECT value FROM settings WHERE key = 'peer_ip'").get();
            this.peerIp = setting ? setting.value : '';
            console.log('🔄 Sync Service: Loaded Peer IP:', this.peerIp);
        } catch (error) {
            console.error('❌ Sync Service: Failed to load Peer IP', error);
        }
    }

    async broadcastChange(method, path, body) {
        // Reload peer IP in case it changed
        this.loadPeerIp();

        if (!this.peerIp) {
            console.log('⚠️ Sync Service: No Peer IP configured. Skipping broadcast.');
            return;
        }

        const peerUrl = `http://${this.peerIp}:3000${path}`;
        console.log(`🔄 Sync Service: Broadcasting ${method} to ${peerUrl}`);

        try {
            await axios({
                method: method,
                url: peerUrl,
                data: body,
                headers: {
                    'X-Sync-Source': 'true', // Prevent loop
                    'Content-Type': 'application/json'
                },
                timeout: 5000 // 5 second timeout
            });
            console.log('✅ Sync Service: Broadcast successful');
        } catch (error) {
            console.error(`❌ Sync Service: Broadcast failed to ${peerUrl}`);
            if (error.response) {
                console.error('   Status:', error.response.status);
                console.error('   Data:', error.response.data);
            } else {
                console.error('   Error:', error.message);
            }
        }
    }
}

module.exports = new SyncService();
