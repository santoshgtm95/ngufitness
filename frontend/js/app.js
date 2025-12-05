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

    // Handle window resize for responsive table/card view
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.renderCustomerTable();
      }, 250);
    });
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
    // Hamburger menu toggle
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const navSidebar = document.querySelector('.nav-sidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');

    if (hamburgerMenu && navSidebar && mobileOverlay) {
      const toggleMenu = () => {
        hamburgerMenu.classList.toggle('active');
        navSidebar.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
        document.body.style.overflow = navSidebar.classList.contains('active') ? 'hidden' : '';
      };

      hamburgerMenu.addEventListener('click', toggleMenu);
      mobileOverlay.addEventListener('click', toggleMenu);
    }

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

    // Auto-calculate expiration date and payment amount
    const membershipPackage = document.getElementById('membershipPackage');
    if (membershipPackage) {
      membershipPackage.addEventListener('change', () => {
        this.calculateExpirationDate();
        this.updatePaymentAmount();
      });
    }

    const membershipStartDate = document.getElementById('membershipStartDate');
    if (membershipStartDate) {
      membershipStartDate.addEventListener('change', () => {
        this.calculateExpirationDate();
      });
    }

    // Image preview
    const customerImageInput = document.getElementById('customerImageInput');
    if (customerImageInput) {
      customerImageInput.addEventListener('change', (e) => {
        this.previewImage(e.target.files[0]);
      });
    }
  }

  previewImage(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const avatarImage = document.getElementById('customerAvatarImage');
      const avatarPlaceholder = document.querySelector('.avatar-placeholder');

      if (avatarImage && avatarPlaceholder) {
        avatarImage.src = e.target.result;
        avatarImage.style.display = 'block';
        avatarPlaceholder.style.display = 'none';
      }
    };
    reader.readAsDataURL(file);
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

    // Display existing image if available
    const avatarImage = document.getElementById('customerAvatarImage');
    const avatarPlaceholder = document.querySelector('.avatar-placeholder');

    if (customer.image) {
      avatarImage.src = `http://localhost:3000/images/customers/${customer.image}`;
      avatarImage.style.display = 'block';
      avatarPlaceholder.style.display = 'none';
    } else {
      avatarImage.style.display = 'none';
      avatarPlaceholder.style.display = 'block';
    }

    document.getElementById('customerModal').classList.add('active');
  }

  closeCustomerModal() {
    document.getElementById('customerModal').classList.remove('active');
    document.getElementById('customerForm').reset();

    // Reset avatar preview
    const avatarImage = document.getElementById('customerAvatarImage');
    const avatarPlaceholder = document.querySelector('.avatar-placeholder');
    if (avatarImage && avatarPlaceholder) {
      avatarImage.style.display = 'none';
      avatarPlaceholder.style.display = 'block';
    }
  }

  async saveCustomer() {
    const id = document.getElementById('customerId').value;
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();
    const imageInput = document.getElementById('customerImageInput');

    if (!name || !phone || !address) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Use FormData for file upload
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('address', address);

      // Add image if selected
      if (imageInput.files && imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
      }

      let response;
      if (id) {
        response = await fetch(`${API_BASE_URL}/customers/${id}`, {
          method: 'PUT',
          body: formData
        });
      } else {
        response = await fetch(`${API_BASE_URL}/customers`, {
          method: 'POST',
          body: formData
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
    document.getElementById('membershipModalTitle').textContent = customerId ? 'Renew Membership' : 'Register Membership';
    document.getElementById('membershipForm').reset();
    document.getElementById('membershipId').value = ''; // Clear membership ID for new membership
    this.setDefaultDate();

    this.populateCustomerDropdown();

    if (customerId) {
      document.getElementById('membershipCustomerId').value = customerId;
      document.getElementById('membershipCustomerSelect').value = customerId;
      document.getElementById('membershipCustomerSelect').disabled = true;

      const customer = this.customers.find(c => c.id === customerId);
      // For renewal, we default to today's date, but maybe keep the package type as a suggestion
      if (customer && customer.membership) {
        document.getElementById('membershipPackage').value = customer.membership.packageType;
        document.getElementById('membershipPayment').value = customer.membership.payment || 0; // Show previous payment as reference
      }
      this.setDefaultDate(); // Always set start date to today for new/renew
      this.calculateExpirationDate();
    } else {
      document.getElementById('membershipCustomerId').value = '';
      document.getElementById('membershipCustomerSelect').disabled = false;
    }

    document.getElementById('membershipModal').classList.add('active');
  }

  showEditMembershipModal(customerId) {
    const customer = this.customers.find(c => c.id === customerId);
    if (!customer || !customer.membership) {
      alert('No membership found to edit');
      return;
    }

    document.getElementById('membershipModalTitle').textContent = 'Edit Membership';
    document.getElementById('membershipForm').reset();

    this.populateCustomerDropdown();

    // Set membership ID for update operation
    document.getElementById('membershipId').value = customer.membership.id;
    document.getElementById('membershipCustomerId').value = customerId;
    document.getElementById('membershipCustomerSelect').value = customerId;
    document.getElementById('membershipCustomerSelect').disabled = true;

    // Populate with existing membership data
    document.getElementById('membershipStartDate').value = customer.membership.startDate;
    document.getElementById('membershipPackage').value = customer.membership.packageType;
    document.getElementById('membershipExpireDate').value = customer.membership.expireDate;
    document.getElementById('membershipPayment').value = customer.membership.payment || 0;
    document.getElementById('membershipPaymentStatus').value = customer.membership.payment_status || 'paid';
    document.getElementById('membershipDescription').value = customer.membership.description || '';

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
      case '2weeks': expireDate.setDate(expireDate.getDate() + 14); break;
      case '1month': expireDate.setMonth(expireDate.getMonth() + 1); break;
      case '3months': expireDate.setMonth(expireDate.getMonth() + 3); break;
      case '6months': expireDate.setMonth(expireDate.getMonth() + 6); break;
      case '12months':
      case '12months_couple':
        expireDate.setFullYear(expireDate.getFullYear() + 1); break;
    }

    document.getElementById('membershipExpireDate').value = expireDate.toISOString().split('T')[0];
  }

  updatePaymentAmount() {
    const packageType = document.getElementById('membershipPackage').value;
    const paymentInput = document.getElementById('membershipPayment');

    if (!paymentInput) return;

    const prices = {
      '1day': 200,
      '2weeks': 1000,
      '1month': 2500,
      '3months': 6000,
      '6months': 8500,
      '12months': 15000,
      '12months_couple': 25000
    };

    if (prices[packageType]) {
      paymentInput.value = prices[packageType];
    }
  }

  async saveMembership() {
    const membershipId = document.getElementById('membershipId').value;
    const customerId = document.getElementById('membershipCustomerSelect').value;
    const startDate = document.getElementById('membershipStartDate').value;
    const packageType = document.getElementById('membershipPackage').value;
    const expireDate = document.getElementById('membershipExpireDate').value;
    const payment = document.getElementById('membershipPayment').value;
    const paymentStatus = document.getElementById('membershipPaymentStatus').value;
    const description = document.getElementById('membershipDescription').value.trim();

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
      let response;

      if (membershipId) {
        // Update existing membership
        response = await fetch(`${API_BASE_URL}/memberships/${membershipId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDate,
            expireDate,
            packageType,
            payment: paymentAmount,
            payment_status: paymentStatus,
            description
          })
        });
      } else {
        // Create new membership
        response = await fetch(`${API_BASE_URL}/memberships`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId,
            startDate,
            expireDate,
            packageType,
            payment: paymentAmount,
            payment_status: paymentStatus,
            description
          })
        });
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      await this.fetchCustomers(); // Refresh customer list
      await this.renderExpirationAlerts(); // Refresh alerts
      this.closeMembershipModal();
      alert(membershipId ? 'Membership updated successfully!' : 'Membership saved successfully!');
    } catch (error) {
      console.error('Error saving membership:', error);
      alert('Failed to save membership: ' + error.message);
    }
  }

  // Customer Details & History
  showCustomerDetails(customerId) {
    const customer = this.customers.find(c => c.id === customerId);
    if (!customer) return;

    document.getElementById('detailsCustomerName').textContent = customer.name;
    document.getElementById('detailsCustomerPhone').textContent = customer.phone;
    document.getElementById('detailsCustomerAddress').textContent = customer.address;

    // Show avatar
    const avatarImage = document.getElementById('detailsCustomerImage');
    const avatarPlaceholder = document.getElementById('detailsCustomerAvatarPlaceholder');

    if (customer.image) {
      avatarImage.src = `http://localhost:3000/images/customers/${customer.image}`;
      avatarImage.style.display = 'block';
      avatarPlaceholder.style.display = 'none';
    } else {
      avatarImage.style.display = 'none';
      avatarPlaceholder.style.display = 'flex';
      avatarPlaceholder.textContent = customer.name.charAt(0).toUpperCase();
    }



    this.renderMembershipHistory(customer.memberships || []);
    document.getElementById('customerDetailsModal').classList.add('active');
  }

  closeCustomerDetailsModal() {
    document.getElementById('customerDetailsModal').classList.remove('active');
  }

  renderMembershipHistory(memberships) {
    const tbody = document.getElementById('membershipHistoryBody');
    if (!tbody) return;

    if (memberships.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No membership history found</td></tr>`;
      return;
    }

    tbody.innerHTML = memberships.map(m => {
      const status = this.getMembershipStatus(m);
      return `
                <tr>
                    <td>${this.getPackageLabel(m.packageType)}</td>
                    <td>${this.formatDate(m.startDate)}</td>
                    <td>${this.formatDate(m.expireDate)}</td>
                    <td><span class="status-badge status-${status.class}">${status.text}</span></td>
                    <td>${m.payment}฿</td>
                </tr>
            `;
    }).join('');
  }

  // Rendering
  renderCustomerTable(customersToRender = null) {
    const tbody = document.getElementById('customerTableBody');
    if (!tbody) return;

    const customers = customersToRender || this.customers;

    if (customers.length === 0) {
      // Check if we're in mobile view
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        tbody.innerHTML = `
          <div class="customer-card" style="text-align: center; padding: 3rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">📋</div>
            <div>No customers found. Add your first customer to get started!</div>
          </div>
        `;
      } else {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-muted" style="padding: 3rem;">
              <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">📋</div>
              <div>No customers found. Add your first customer to get started!</div>
            </td>
          </tr>
        `;
      }
      return;
    }

    // Check if we're in mobile view
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // Render as cards for mobile
      tbody.innerHTML = customers.map(customer => {
        const membership = customer.membership;
        const status = this.getMembershipStatus(membership);

        return `
          <div class="customer-card" onclick="app.showCustomerDetails('${customer.id}')">
            <div class="customer-card-header">
              <div class="customer-card-info">
                <h3>${this.escapeHtml(customer.name)}</h3>
                <p>${this.escapeHtml(customer.phone)}</p>
              </div>
              <span class="status-badge status-${status.class}">${status.text}</span>
            </div>
            <div class="customer-card-body">
              <div class="customer-card-row">
                <span class="customer-card-label">Package</span>
                <span class="customer-card-value">${membership ? this.getPackageLabel(membership.packageType) : '-'}</span>
              </div>
              <div class="customer-card-row">
                <span class="customer-card-label">Expires On</span>
                <span class="customer-card-value">${membership ? this.formatDate(membership.expireDate) : '-'}</span>
              </div>
            </div>
            <div class="customer-card-actions" onclick="event.stopPropagation()">
              <button class="btn-icon" onclick="app.showEditCustomerModal('${customer.id}')" title="Edit Customer">
                ✏️ Edit
              </button>
              <button class="btn-icon" onclick="app.showAddMembershipModal('${customer.id}')" title="Renew">
                🎫 Renew
              </button>
              <button class="btn-icon" onclick="app.deleteCustomer('${customer.id}')" title="Delete">
                🗑️ Delete
              </button>
            </div>
          </div>
        `;
      }).join('');
    } else {
      // Render as table for desktop
      tbody.innerHTML = customers.map(customer => {
        // Use the latest membership for the main table status
        const membership = customer.membership;
        const status = this.getMembershipStatus(membership);

        // Row click opens details
        return `
          <tr onclick="app.showCustomerDetails('${customer.id}')" style="cursor: pointer;">
            <td>
              <div style="display: flex; align-items: center; gap: 12px;">
                <strong>${this.escapeHtml(customer.name)}</strong>
              </div>
            </td>
            <td>${this.escapeHtml(customer.phone)}</td>
            <!-- <td>${this.escapeHtml(customer.address)}</td> -->
            <td>
              <span class="status-badge status-${status.class}">${status.text}</span>
            </td>
            <td>${membership ? this.getPackageLabel(membership.packageType) : '-'}</td>
            <td>${membership ? this.formatDate(membership.expireDate) : '-'}</td>
            <td onclick="event.stopPropagation()">
              <div class="table-actions">
                <button class="btn-icon" onclick="app.showEditCustomerModal('${customer.id}')" title="Edit Customer Info">✏️</button>
                <button class="btn-icon" onclick="app.showEditMembershipModal('${customer.id}')" title="Edit Membership">📝</button>
                <button class="btn-icon" onclick="app.showAddMembershipModal('${customer.id}')" title="Renew Membership">🎫</button>
                <button class="btn-icon" onclick="app.deleteCustomer('${customer.id}')" title="Delete Customer">🗑️</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
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
      '2weeks': '2 Weeks',
      '1month': '1 Month',
      '3months': '3 Months',
      '6months': '6 Months',
      '12months': '12 Months',
      '12months_couple': '12 Months Couple'
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
