// Services Management Application
const API_URL = 'http://localhost:3000/api';

class ServicesApp {
    constructor() {
        this.services = [];
        this.customers = [];
        this.editingServiceId = null;
        this.init();
    }

    async init() {
        await this.loadCustomers();
        await this.loadServices();
        this.setupEventListeners();
        this.setupMobileMenu();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Service form submission
        const serviceForm = document.getElementById('serviceForm');
        if (serviceForm) {
            serviceForm.addEventListener('submit', (e) => this.handleServiceSubmit(e));
        }

        // Set today's date as default
        const serviceDateInput = document.getElementById('serviceDate');
        if (serviceDateInput) {
            serviceDateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    setupMobileMenu() {
        const hamburger = document.getElementById('hamburgerMenu');
        const sidebar = document.querySelector('.nav-sidebar');
        const overlay = document.getElementById('mobileOverlay');

        if (hamburger && sidebar && overlay) {
            hamburger.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            });

            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
        }
    }

    async loadCustomers() {
        try {
            const response = await fetch(`${API_URL}/customers`);
            const result = await response.json();

            if (result.success) {
                this.customers = result.data;
                this.populateCustomerDropdown();
            }
        } catch (error) {
            console.error('Error loading customers:', error);
            this.showNotification('Failed to load customers', 'error');
        }
    }

    populateCustomerDropdown() {
        const select = document.getElementById('serviceCustomer');
        if (!select) return;

        // Clear existing options except the first one
        select.innerHTML = '<option value="">-- No customer --</option>';

        // Add customer options
        this.customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = `${customer.name} (${customer.phone})`;
            select.appendChild(option);
        });
    }

    async loadServices() {
        try {
            const response = await fetch(`${API_URL}/services`);
            const result = await response.json();

            if (result.success) {
                this.services = result.data;
                this.renderServices(this.services);
            }
        } catch (error) {
            console.error('Error loading services:', error);
            this.showNotification('Failed to load services', 'error');
        }
    }

    renderServices(services) {
        const tbody = document.getElementById('servicesTableBody');
        if (!tbody) return;

        if (services.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        No services found. Click "Add Service" to create one.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = services.map(service => `
            <tr>
                <td><strong>${this.escapeHtml(service.service_name)}</strong></td>
                <td>${service.customer_name ? this.escapeHtml(service.customer_name) : '<em style="color: var(--text-secondary);">No customer</em>'}</td>
                <td><strong style="color: var(--primary);">${parseInt(service.price)}Nu</strong></td>
                <td>${this.formatDate(service.service_date)}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-icon" onclick="servicesApp.editService('${service.id}')" title="Edit">
                            ✏️
                        </button>
                        <button class="btn-icon" onclick="servicesApp.deleteService('${service.id}')" title="Delete">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    handleSearch(query) {
        const filtered = this.services.filter(service => {
            const searchStr = query.toLowerCase();
            return (
                service.service_name.toLowerCase().includes(searchStr) ||
                (service.customer_name && service.customer_name.toLowerCase().includes(searchStr))
            );
        });
        this.renderServices(filtered);
    }

    showAddServiceModal() {
        this.editingServiceId = null;
        document.getElementById('serviceModalTitle').textContent = 'Add Service';
        document.getElementById('serviceForm').reset();
        document.getElementById('serviceId').value = '';
        document.getElementById('serviceDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('serviceModal').classList.add('active');
    }

    async editService(id) {
        const service = this.services.find(s => s.id === id);
        if (!service) return;

        this.editingServiceId = id;
        document.getElementById('serviceModalTitle').textContent = 'Edit Service';
        document.getElementById('serviceId').value = service.id;
        document.getElementById('serviceName').value = service.service_name;
        document.getElementById('servicePrice').value = service.price;
        document.getElementById('serviceDate').value = service.service_date;
        document.getElementById('serviceCustomer').value = service.customer_id || '';
        document.getElementById('servicePaymentStatus').value = service.payment_status || 'paid';
        document.getElementById('serviceModal').classList.add('active');
    }

    closeServiceModal() {
        document.getElementById('serviceModal').classList.remove('active');
        document.getElementById('serviceForm').reset();
        this.editingServiceId = null;
    }

    async handleServiceSubmit(e) {
        e.preventDefault();

        const formData = {
            service_name: document.getElementById('serviceName').value.trim(),
            price: parseFloat(document.getElementById('servicePrice').value),
            service_date: document.getElementById('serviceDate').value,
            customer_id: document.getElementById('serviceCustomer').value || null,
            payment_status: document.getElementById('servicePaymentStatus').value
        };

        // Validation
        if (!formData.service_name || !formData.price || !formData.service_date) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        if (formData.price < 0) {
            this.showNotification('Price must be a positive number', 'error');
            return;
        }

        try {
            let response;
            if (this.editingServiceId) {
                // Update existing service
                response = await fetch(`${API_URL}/services/${this.editingServiceId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                // Create new service
                response = await fetch(`${API_URL}/services`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }

            const result = await response.json();

            if (result.success) {
                this.showNotification(
                    this.editingServiceId ? 'Service updated successfully' : 'Service created successfully',
                    'success'
                );
                this.closeServiceModal();
                await this.loadServices();
            } else {
                this.showNotification(result.error || 'Failed to save service', 'error');
            }
        } catch (error) {
            console.error('Error saving service:', error);
            this.showNotification('Failed to save service', 'error');
        }
    }

    async deleteService(id) {
        const service = this.services.find(s => s.id === id);
        if (!service) return;

        if (!confirm(`Are you sure you want to delete "${service.service_name}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/services/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Service deleted successfully', 'success');
                await this.loadServices();
            } else {
                this.showNotification(result.error || 'Failed to delete service', 'error');
            }
        } catch (error) {
            console.error('Error deleting service:', error);
            this.showNotification('Failed to delete service', 'error');
        }
    }

    formatDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Simple notification using alert for now
        // You can enhance this with a custom notification component
        if (type === 'error') {
            alert('Error: ' + message);
        } else {
            alert(message);
        }
    }

    downloadBackup() {
        window.location.href = `${API_URL.replace('/api', '')}/api/backup`;
    }
}

// Initialize the app when DOM is loaded
let servicesApp;
document.addEventListener('DOMContentLoaded', () => {
    servicesApp = new ServicesApp();
});
