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
                <div class="nav-item ${page === 'reports.html' ? 'active' : ''}" onclick="window.location.href='reports.html'">
                    <span class="nav-item-icon">📈</span>
                    <span class="nav-item-text">Reports</span>
                </div>
                <div class="nav-item" onclick="app.downloadBackup()">
                    <span class="nav-item-icon">⚙️</span>
                    <span class="nav-item-text">BackUp Database</span>
                </div>
            </nav>
            <div class="nav-footer">
                <p>v1.0.0</p>
                <p>© 2025 NGU Fitness</p>
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
