class Sidebar {
    constructor() {
        this.render();
    }

    render() {
        const currentPath = window.location.pathname;
        const page = currentPath.split('/').pop() || 'index.html';

        const sidebarHTML = `
            <div class="nav-logo">
                <span class="nav-logo-icon">🏋️</span>
                <span class="nav-logo-text">Membership Management</span>
            </div>
            <nav class="nav-menu">
                <div class="nav-item ${page === 'index.html' || page === '' ? 'active' : ''}" onclick="window.location.href='index.html'">
                    <span class="nav-item-icon">📊</span>
                    <span class="nav-item-text">Dashboard</span>
                </div>
                <div class="nav-item ${page === 'services.html' ? 'active' : ''}" onclick="window.location.href='services.html'">
                    <span class="nav-item-icon">🛠️</span>
                    <span class="nav-item-text">Services</span>
                </div>
                <div class="nav-item ${page === 'reports.html' ? 'active' : ''}" onclick="window.location.href='reports.html'">
                    <span class="nav-item-icon">📈</span>
                    <span class="nav-item-text">Reports</span>
                </div>
                <div class="nav-item" onclick="syncApp.showSyncSettingsModal()">
                    <span class="nav-item-icon">🔄</span>
                    <span class="nav-item-text">Sync Settings</span>
                </div>
                <div class="nav-item" onclick="window.BackupManager.downloadBackup()">
                    <span class="nav-item-icon">⚙️</span>
                    <span class="nav-item-text">Export BackUp</span>
                </div>
                <div class="nav-item" onclick="window.BackupManager.triggerBackupImport()">
                    <span class="nav-item-icon">📥</span>
                    <span class="nav-item-text">Import BackUp</span>
                </div>
                <div class="nav-item text-danger" onclick="localStorage.removeItem('isAuthenticated'); window.location.href='login.html'" style="margin-top: auto; color: #dc3545;">
                    <span class="nav-item-icon">🚪</span>
                    <span class="nav-item-text">Logout</span>
                </div>
            </nav>
            <div class="nav-footer">
                <p>v1.0.0</p>
                <p>© 2026 FITLAB Fitness</p>
            </div>
        `;

        const sidebarElement = document.querySelector('.nav-sidebar');
        if (sidebarElement) {
            sidebarElement.innerHTML = sidebarHTML;
        }
    }
}

// Initialize sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Sidebar();
});

window.BackupManager = {
    downloadBackup: async function() {
        try {
            const API_BASE_URL = '/api';
            const response = await fetch(`${API_BASE_URL}/backup`);
            if (!response.ok) throw new Error('Backup failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `fitlab_fitness_backup_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading backup:', error);
            alert('Failed to download backup properly. Please try again.');
        }
    },
    triggerBackupImport: function() {
        let fileInput = document.getElementById('backupFileInput');
        if (!fileInput) {
            fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'backupFileInput';
            fileInput.accept = '.zip';
            fileInput.style.display = 'none';
            fileInput.onchange = this.importBackup.bind(this);
            document.body.appendChild(fileInput);
        }
        fileInput.click();
    },
    importBackup: async function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!confirm('WARNING: Importing a backup will REPLACE all current data. Are you sure you want to continue?')) {
            event.target.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('backupZip', file);

        try {
            const loadingMsg = document.createElement('div');
            loadingMsg.id = 'backupLoadingMsg';
            loadingMsg.style.position = 'fixed';
            loadingMsg.style.top = '20px';
            loadingMsg.style.right = '20px';
            loadingMsg.style.background = '#3273f6';
            loadingMsg.style.color = 'white';
            loadingMsg.style.padding = '10px 20px';
            loadingMsg.style.borderRadius = '5px';
            loadingMsg.style.zIndex = '9999';
            loadingMsg.innerHTML = '📥 <b>Importing backup...</b> Please wait.';
            document.body.appendChild(loadingMsg);

            const response = await fetch('/api/backup/import', { method: 'POST', body: formData });
            document.body.removeChild(loadingMsg);

            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Import failed');

            alert('Backup imported successfully! The page will now reload.');
            window.location.reload();
        } catch (error) {
            console.error('Error importing backup:', error);
            const loadingMsg = document.getElementById('backupLoadingMsg');
            if (loadingMsg) document.body.removeChild(loadingMsg);
            alert('Failed to import backup: ' + error.message);
        } finally {
            event.target.value = '';
        }
    }
};
