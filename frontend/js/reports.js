// Reports Page JavaScript
const API_URL = '/api';

// Global state
let currentPeriod = 'monthly';
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1; // 1-12
let currentDay = ''; // Empty means all days
let charts = {
    membership: null,
    customer: null,
    revenue: null
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    populateYearOptions();
    populateMonthOptions();
    populateDayOptions();
    initializePeriodSelector();
    initializeFilterControls();
    
    // Set initial values
    document.getElementById('monthSelect').value = currentMonth;
    
    loadReports(currentPeriod);
});

// Populate year dropdown
function populateYearOptions() {
    const yearSelect = document.getElementById('yearSelect');
    if (!yearSelect) return;
    
    const thisYear = new Date().getFullYear();
    const startYear = 2024;
    
    yearSelect.innerHTML = '';
    for (let year = thisYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
    yearSelect.value = currentYear;
}

// Populate month dropdown (ensure all months are there)
function populateMonthOptions() {
    const monthSelect = document.getElementById('monthSelect');
    if (!monthSelect) return;
    
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    monthSelect.innerHTML = '<option value="">All Months</option>';
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = month;
        monthSelect.appendChild(option);
    });
}

// Populate day dropdown based on year and month
function populateDayOptions() {
    const daySelect = document.getElementById('daySelect');
    if (!daySelect) return;

    const year = currentYear;
    const month = currentMonth;
    
    daySelect.innerHTML = '<option value="">All Days</option>';
    
    if (month) {
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            daySelect.appendChild(option);
        }
    }
    
    daySelect.value = currentDay;
}

// Period selector initialization
function initializePeriodSelector() {
    const periodButtons = document.querySelectorAll('.period-btn');

    periodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            periodButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show/hide filter groups based on period
            const period = btn.dataset.period;
            currentPeriod = period;
            
            updateSelectorVisibility();
            loadReports(currentPeriod);
        });
    });
}

// Update visibility of filter selectors
function updateSelectorVisibility() {
    const filterControls = document.getElementById('filterControls');
    const monthFilterGroup = document.getElementById('monthFilterGroup');
    const dayFilterGroup = document.getElementById('dayFilterGroup');

    if (currentPeriod === 'yearly') {
        // Yearly view: only Year selector (for specific year details) or hide all
        // User said "for yearly report able to select year", but usually yearly report shows everything.
        // Let's keep Year selector visible.
        monthFilterGroup.style.display = 'none';
        dayFilterGroup.style.display = 'none';
        filterControls.classList.remove('hidden-selector');
    } else if (currentPeriod === 'monthly') {
        // Monthly view: Year and Month
        monthFilterGroup.style.display = 'flex';
        dayFilterGroup.style.display = 'none';
        filterControls.classList.remove('hidden-selector');
    } else if (currentPeriod === 'daily') {
        // Daily view: Year, Month, and Day
        monthFilterGroup.style.display = 'flex';
        dayFilterGroup.style.display = 'flex';
        filterControls.classList.remove('hidden-selector');
    }
}

// Filter controls initialization
function initializeFilterControls() {
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    const daySelect = document.getElementById('daySelect');

    yearSelect.addEventListener('change', () => {
        currentYear = parseInt(yearSelect.value);
        populateDayOptions();
        loadReports(currentPeriod);
    });

    monthSelect.addEventListener('change', () => {
        currentMonth = monthSelect.value ? parseInt(monthSelect.value) : '';
        populateDayOptions();
        loadReports(currentPeriod);
    });

    daySelect.addEventListener('change', () => {
        currentDay = daySelect.value;
        loadReports(currentPeriod);
    });

    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', downloadPDF);
    }
}

// Load reports data
async function loadReports(period) {
    showLoading();

    try {
        let url = `${API_URL}/reports/${period}?year=${currentYear}`;
        
        // Pass month param for daily and monthly endpoints
        if (currentMonth) {
            url += `&month=${currentMonth}`;
        }
        
        // Pass day param for daily endpoint
        if (period === 'daily' && currentDay) {
            url += `&day=${currentDay}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            // Calculate total revenue from filtered details array
            const filteredTotalRevenue = (data.data.details || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
            updateStatistics(data.data.totals, filteredTotalRevenue);
            updateCharts(data, period);
            updateDetailsTable(data.data.details || []);
        } else {
            showError('Failed to load reports');
        }
    } catch (error) {
        console.error('Error loading reports:', error);
        showError('Error loading reports. Please try again.');
    } finally {
        hideLoading();
    }
}

// Update detailed report table
function updateDetailsTable(details) {
    const detailsBody = document.getElementById('detailsBody');
    const detailsFoot = document.getElementById('detailsFoot');
    if (!detailsBody) return;

    detailsBody.innerHTML = '';
    if (detailsFoot) detailsFoot.innerHTML = '';

    if (details.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">No transactions found for this period.</td>';
        detailsBody.appendChild(emptyRow);
        return;
    }

    let totalAmount = 0;

    details.forEach(item => {
        totalAmount += (parseFloat(item.amount) || 0);

        const row = document.createElement('tr');
        
        // Format date
        const date = new Date(item.created_at);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Determine status tag style
        const statusClass = `status-tag status-${(item.status || 'paid').toLowerCase().replace(' ', '-')}`;

        const customerNameDisplay = (item.customer_name && item.customer_name !== 'null') ? item.customer_name : '';

        row.innerHTML = `
            <td>${formattedDate}</td>
            <td><strong>${customerNameDisplay}</strong></td>
            <td><span class="type-tag ${item.type.toLowerCase()}">${item.type}</span></td>
            <td>${item.item}</td>
            <td class="amount-cell">${formatCurrency(item.amount)}</td>
            <td><span class="${statusClass}">${item.status || 'Paid'}</span></td>
        `;
        detailsBody.appendChild(row);
    });

    if (detailsFoot) {
        const footRow = document.createElement('tr');
        footRow.innerHTML = `
            <th colspan="4" style="text-align: right; padding-right: 1.5rem; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.8rem; color: var(--text-secondary);">Total Revenue:</th>
            <th class="amount-cell" style="font-size: 1.05rem; color: var(--text-primary);">${formatCurrency(totalAmount)}</th>
            <th></th>
        `;
        detailsFoot.appendChild(footRow);
    }
}

// Update statistics cards
function updateStatistics(totals, filteredRevenue) {
    if (!totals) return;
    const totalRevenue = document.getElementById('totalRevenue');
    if (totalRevenue) {
        const revenueToShow = filteredRevenue !== undefined ? filteredRevenue : (totals.total_revenue || 0);
        totalRevenue.textContent = formatCurrency(revenueToShow);
    }
}

// Update all charts
function updateCharts(data, period) {
    const labels = generateLabels(data, period);
    const membershipCounts = generateDataPoints(data.data.memberships, labels, period, 'count');
    const customerCounts = generateDataPoints(data.data.customers, labels, period, 'count');
    const membershipRevenue = generateDataPoints(data.data.memberships, labels, period, 'total_payment');
    const serviceRevenue = generateDataPoints(data.data.services || [], labels, period, 'total_payment');

    // Update revenue chart with two lines
    updateChart('revenueChart', 'revenue', {
        labels: labels,
        datasets: [
            {
                label: 'Membership Revenue',
                data: membershipRevenue,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.8)',
                borderWidth: 2,
                borderRadius: 4
            },
            {
                label: 'Service Revenue',
                data: serviceRevenue,
                borderColor: '#7c3aed',
                backgroundColor: 'rgba(124, 58, 237, 0.8)',
                borderWidth: 2,
                borderRadius: 4
            }
        ]
    }, 'bar');
}

// Generate labels based on period
function generateLabels(data, period) {
    if (period === 'daily') {
        // Generate all days in the month
        const year = data.year;
        const month = data.month;
        const daysInMonth = new Date(year, month, 0).getDate();
        const labels = [];

        for (let day = 1; day <= daysInMonth; day++) {
            labels.push(`${month}/${day}`);
        }
        return labels;
    } else if (period === 'monthly') {
        // All 12 months or specific month
        const allMonthsLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (currentMonth) {
            return [allMonthsLabels[currentMonth - 1]];
        }
        return allMonthsLabels;
    } else {
        // Yearly - extract unique years from data
        const years = new Set();
        data.data.memberships.forEach(item => years.add(item.year));
        data.data.customers.forEach(item => years.add(item.year));
        return Array.from(years).sort();
    }
}

// Generate data points for charts
function generateDataPoints(dataArray, labels, period, field) {
    const dataMap = new Map();

    // Map data to labels
    dataArray.forEach(item => {
        let key;
        if (period === 'daily') {
            // Extract day from date (YYYY-MM-DD)
            const dateParts = item.date.split('-');
            key = `${parseInt(dateParts[1])}/${parseInt(dateParts[2])}`;
        } else if (period === 'monthly') {
            // Convert month number to month name
            const monthIndex = parseInt(item.month) - 1;
            key = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthIndex];
        } else {
            // Yearly
            key = item.year;
        }
        dataMap.set(key, parseFloat(item[field]) || 0);
    });

    // Fill in missing data with 0
    return labels.map(label => dataMap.get(label) || 0);
}

// Update or create chart
function updateChart(canvasId, chartKey, data, type = 'line') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return; // Canvas may be commented out in HTML; skip gracefully
    const ctx = canvas.getContext('2d');

    // Destroy existing chart
    if (charts[chartKey]) {
        charts[chartKey].destroy();
    }

    // Create new chart
    const config = {
        type: type,
        data: data,
        options: {
            indexAxis: 'x', // All charts horizontal for consistency or switch to traditional x
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true, // Always show legend for revenue chart
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 10,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    borderRadius: 8,
                    titleFont: {
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (chartKey === 'revenue') {
                                label += formatCurrency(context.parsed.y);
                            } else {
                                label += context.parsed.y;
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            if (chartKey === 'revenue') {
                                return formatCurrency(value);
                            }
                            return value;
                        },
                        font: {
                            size: 11
                        },
                        color: '#6b7280'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 11
                        },
                        color: '#6b7280',
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                }
            }
        }
    };

    // Add gradients for revenue chart
    if (chartKey === 'revenue' && data.datasets) {
        data.datasets.forEach((dataset, index) => {
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            if (index === 0) { // Membership
                gradient.addColorStop(0, 'rgba(79, 70, 229, 0.8)');
                gradient.addColorStop(1, 'rgba(79, 70, 229, 0.4)');
            } else { // Service
                gradient.addColorStop(0, 'rgba(124, 58, 237, 0.8)');
                gradient.addColorStop(1, 'rgba(124, 58, 237, 0.4)');
            }
            dataset.backgroundColor = gradient;
        });
    }

    charts[chartKey] = new Chart(ctx, config);
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showError(message) {
    alert(message);
}

// Download Detailed Report as PDF
function downloadPDF() {
    if (typeof window.jspdf === 'undefined') {
        alert('PDF functionality is still loading. Please try again in a moment.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(31, 41, 55);
    doc.text('Detailed Report - NGU Fitness', 14, 20);
    
    // Subheader
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128);
    const periodText = currentPeriod.charAt(0).toUpperCase() + currentPeriod.slice(1);
    
    let subheaderText = `Period: ${periodText} | Year: ${currentYear}`;
    if (currentMonth) subheaderText += ` | Month: ${currentMonth}`;
    if (currentPeriod === 'daily' && currentDay) subheaderText += ` | Day: ${currentDay}`;
    
    doc.text(subheaderText, 14, 28);
    
    // Generate Table
    doc.autoTable({
        html: '#detailsTable',
        startY: 35,
        theme: 'striped',
        headStyles: { 
            fillColor: [79, 70, 229],
            textColor: 255 
        },
        styles: { 
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 4
        },
        alternateRowStyles: {
            fillColor: [249, 250, 251]
        }
    });
    
    // Save PDF
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`NGU_Fitness_${periodText}_Report_${timestamp}.pdf`);
}
