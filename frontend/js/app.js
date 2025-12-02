const API_BASE_URL = 'http://localhost:3000/api';

class GymMembershipApp {
  constructor() {
    this.customers = [];
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.setDefaultDate();
  }

  async loadData() {
    try {
      await this.fetchCustomers();
      await this.renderExpirationAlerts();
    } catch (error) {
      console.error('Error loading data:', error);
      // alert('Failed to load data. Please make sure the backend server is running.');
    }
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchCustomers(e.target.value);
      });
    }

    // Phone number validation
    const customerPhone = document.getElementById('customerPhone');
    if (customerPhone) {
      customerPhone.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9+]/g, '');
      });
    }

    // Customer form submission
    const customerForm = document.getElementById('customerForm');
    if (customerForm) {
      customerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveCustomer();
      });
    }

    // Membership form submission
    const membershipForm = document.getElementById('membershipForm');
    if (membershipForm) {
      membershipForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveMembership();
      });
    }

    // Auto-calculate expiration date
    const membershipPackage = document.getElementById('membershipPackage');
    if (membershipPackage) {
      membershipPackage.addEventListener('change', () => {
        this.calculateExpirationDate();
      });
    }

    const membershipStartDate = document.getElementById('membershipStartDate');
    if (membershipStartDate) {
      membershipStartDate.addEventListener('change', () => {
        this.calculateExpirationDate();
      });
    }
  }

  setDefaultDate() {
    const startDateInput = document.getElementById('membershipStartDate');
    if (startDateInput) {
      const today = new Date().toISOString().split('T')[0];
      startDateInput.value = today;
    }
  }

  // API Methods
  async fetchCustomers() {
    try {
      const response = await fetch(`${API_BASE_URL}/customers`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      this.customers = result.data;
      this.renderCustomerTable();
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  async fetchExpiringMemberships() {
    try {
      const response = await fetch(`${API_BASE_URL}/memberships/expiring`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching expiring memberships:', error);
      return [];
    }
  }

  // Customer Management
  showAddCustomerModal() {
    document.getElementById('customerModalTitle').textContent = 'Add Customer';
    document.getElementById('customerForm').reset();
    document.getElementById('customerId').value = '';
    document.getElementById('customerModal').classList.add('active');
  }

  showEditCustomerModal(customerId) {
    const customer = this.customers.find(c => c.id === customerId);
    if (!customer) return;

    document.getElementById('customerModalTitle').textContent = 'Edit Customer';
    document.getElementById('customerId').value = customer.id;
    document.getElementById('customerName').value = customer.name;
    document.getElementById('customerPhone').value = customer.phone;
    document.getElementById('customerAddress').value = customer.address;
    document.getElementById('customerModal').classList.add('active');
  }

  closeCustomerModal() {
    document.getElementById('customerModal').classList.remove('active');
    document.getElementById('customerForm').reset();
  }

  async saveCustomer() {
    const id = document.getElementById('customerId').value;
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();

    if (!name || !phone || !address) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      let response;
      if (id) {
        response = await fetch(`${API_BASE_URL}/customers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, address })
        });
      } else {
        response = await fetch(`${API_BASE_URL}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, address })
        });
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      await this.fetchCustomers();
      this.closeCustomerModal();

      // If it was a new customer (not an edit), open membership modal
      if (!id && result.data && result.data.id) {
        this.showAddMembershipModal(result.data.id);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to save customer: ' + error.message);
    }
  }

  async deleteCustomer(customerId) {
    if (!confirm('Are you sure you want to delete this customer? This will also delete their membership.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      await this.fetchCustomers();
      await this.renderExpirationAlerts(); // Refresh alerts as well
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer: ' + error.message);
    }
  }

  // Membership Management
  showAddMembershipModal(customerId = null) {
    document.getElementById('membershipModalTitle').textContent = customerId ? 'Update Membership' : 'Register Membership';
    document.getElementById('membershipForm').reset();
    this.setDefaultDate();

    this.populateCustomerDropdown();

    if (customerId) {
      document.getElementById('membershipCustomerId').value = customerId;
      document.getElementById('membershipCustomerSelect').value = customerId;
      document.getElementById('membershipCustomerSelect').disabled = true;

      const customer = this.customers.find(c => c.id === customerId);
      if (customer && customer.membership) {
        document.getElementById('membershipStartDate').value = customer.membership.startDate;
        document.getElementById('membershipPackage').value = customer.membership.packageType;
        document.getElementById('membershipPayment').value = customer.membership.payment || 0;
        this.calculateExpirationDate();
      }
    } else {
      document.getElementById('membershipCustomerId').value = '';
      document.getElementById('membershipCustomerSelect').disabled = false;
    }

    document.getElementById('membershipModal').classList.add('active');
  }

  closeMembershipModal() {
    document.getElementById('membershipModal').classList.remove('active');
    document.getElementById('membershipForm').reset();
  }

  populateCustomerDropdown() {
    const select = document.getElementById('membershipCustomerSelect');
    if (!select) return;

    select.innerHTML = '<option value="">-- Select a customer --</option>';

    this.customers.forEach(customer => {
      const option = document.createElement('option');
      option.value = customer.id;
      option.textContent = `${customer.name} - ${customer.phone}`;
      select.appendChild(option);
    });
  }

  calculateExpirationDate() {
    const startDate = document.getElementById('membershipStartDate').value;
    const packageType = document.getElementById('membershipPackage').value;

    if (!startDate || !packageType) {
      const expireDateInput = document.getElementById('membershipExpireDate');
      if (expireDateInput) expireDateInput.value = '';
      return;
    }

    const start = new Date(startDate);
    let expireDate = new Date(start);

    switch (packageType) {
      case '1day': expireDate.setDate(expireDate.getDate() + 1); break;
      case '15days': expireDate.setDate(expireDate.getDate() + 15); break;
      case '1month': expireDate.setMonth(expireDate.getMonth() + 1); break;
      case '6months': expireDate.setMonth(expireDate.getMonth() + 6); break;
      case '1year': expireDate.setFullYear(expireDate.getFullYear() + 1); break;
    }

    document.getElementById('membershipExpireDate').value = expireDate.toISOString().split('T')[0];
  }

  async saveMembership() {
    const customerId = document.getElementById('membershipCustomerSelect').value;
    const startDate = document.getElementById('membershipStartDate').value;
    const packageType = document.getElementById('membershipPackage').value;
    const expireDate = document.getElementById('membershipExpireDate').value;
    const payment = document.getElementById('membershipPayment').value;

    if (!customerId || !startDate || !packageType || !payment) {
      alert('Please fill in all required fields');
      return;
    }

    const paymentAmount = parseInt(payment);
    if (isNaN(paymentAmount) || paymentAmount < 0) {
      alert('Payment must be a valid number greater than or equal to 0');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/memberships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          startDate,
          expireDate,
          packageType,
          payment: paymentAmount
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      await this.fetchCustomers(); // Refresh customer list
      await this.renderExpirationAlerts(); // Refresh alerts
      this.closeMembershipModal();
      alert('Membership saved successfully!');
    } catch (error) {
      console.error('Error saving membership:', error);
      alert('Failed to save membership: ' + error.message);
    }
  }

  // Rendering
  renderCustomerTable(customersToRender = null) {
    const tbody = document.getElementById('customerTableBody');
    if (!tbody) return;

    const customers = customersToRender || this.customers;

    if (customers.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted" style="padding: 3rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">📋</div>
                        <div>No customers found. Add your first customer to get started!</div>
                    </td>
                </tr>
            `;
      return;
    }

    tbody.innerHTML = customers.map(customer => {
      const membership = customer.membership;
      const status = this.getMembershipStatus(membership);

      return `
                <tr>
                    <td><strong>${this.escapeHtml(customer.name)}</strong></td>
                    <td>${this.escapeHtml(customer.phone)}</td>
                  <!-- <td>${this.escapeHtml(customer.address)}</td> -->
                    <td>
                        <span class="status-badge status-${status.class}">${status.text}</span>
                    </td>
                    <td>${membership ? this.getPackageLabel(membership.packageType) : '-'}</td>
                    <td>${membership ? this.formatDate(membership.expireDate) : '-'}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-icon" onclick="app.showEditCustomerModal('${customer.id}')" title="Edit Customer">✏️</button>
                            <button class="btn-icon" onclick="app.showAddMembershipModal('${customer.id}')" title="Manage Membership">🎫</button>
                            <button class="btn-icon" onclick="app.deleteCustomer('${customer.id}')" title="Delete Customer">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
    }).join('');
  }

  async renderExpirationAlerts() {
    const alertList = document.getElementById('alertList');
    if (!alertList) return;

    const expiringMembers = await this.fetchExpiringMemberships();

    if (expiringMembers.length === 0) {
      alertList.innerHTML = `
                <div class="alert-empty">
                    <div class="alert-empty-icon">✅</div>
                    <p>No memberships expiring in the next 5 days</p>
                </div>
            `;
      return;
    }
    alertList.innerHTML = expiringMembers.map(({ customer, membership, daysLeft }) => {
      const daysClass = daysLeft <= 3 ? 'danger' : 'warning';
      const daysText = daysLeft === 0 ? 'Today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;

      return `
                <div class="alert-item">
                    <div class="alert-header">
                        <div class="alert-info">
                            <div class="alert-name">${this.escapeHtml(customer.name)}</div>
                            <div class="alert-phone">📞 ${this.escapeHtml(customer.phone)}</div>
                        </div>
                    </div>
                    <div class="alert-footer">
                        <div class="alert-date">📅 ${this.formatDate(membership.expireDate)}</div>
                        <div class="alert-badge badge-${daysClass}">${daysText}</div>
                    </div>
                </div>
            `;
    }).join('');
  }

  searchCustomers(query) {
    if (!query.trim()) {
      this.renderCustomerTable();
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = this.customers.filter(customer => {
      return customer.name.toLowerCase().includes(lowerQuery) ||
        customer.phone.toLowerCase().includes(lowerQuery) ||
        customer.address.toLowerCase().includes(lowerQuery);
    });

    this.renderCustomerTable(filtered);
  }

  // Helpers
  getMembershipStatus(membership) {
    if (!membership) return { class: 'none', text: 'No Membership' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expireDate = new Date(membership.expireDate);
    expireDate.setHours(0, 0, 0, 0);
    const fiveDaysFromNow = new Date(today);
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

    if (expireDate < today) return { class: 'expired', text: 'Expired' };
    else if (expireDate <= fiveDaysFromNow) return { class: 'expiring', text: 'Expiring Soon' };
    else return { class: 'active', text: 'Active' };
  }

  getPackageLabel(packageType) {
    const labels = {
      '1day': '1 Day',
      '15days': '15 Days',
      '1month': '1 Month',
      '6months': '6 Months',
      '1year': '1 Year'
    };
    return labels[packageType] || packageType;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  downloadBackup() {
    window.location.href = `${API_BASE_URL}/backup`;
  }
}

const app = new GymMembershipApp();
