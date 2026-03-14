// Reports Page JavaScript
const API_URL = 'http://localhost:3000/api';

// Global state
let currentPeriod = 'monthly';
let charts = {
    membership: null,
    customer: null,
    revenue: null
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializePeriodSelector();
    loadReports(currentPeriod);
});

// Period selector initialization
function initializePeriodSelector() {
    const periodButtons = document.querySelectorAll('.period-btn');

    periodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            periodButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Load new period data
            currentPeriod = btn.dataset.period;
            loadReports(currentPeriod);
        });
    });
}

// Load reports data
async function loadReports(period) {
    showLoading();

    try {
        const response = await fetch(`${API_URL}/reports/${period}`);
        const data = await response.json();

        if (data.success) {
            updateStatistics(data.data.totals);
            updateCharts(data, period);
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

// Update statistics cards
function updateStatistics(totals) {
    document.getElementById('totalMemberships').textContent = totals.total_memberships || 0;
    document.getElementById('totalCustomers').textContent = totals.total_customers || 0;
    document.getElementById('totalRevenue').textContent = formatCurrency(totals.total_revenue || 0);
}

// Update all charts
function updateCharts(data, period) {
    const labels = generateLabels(data, period);
    const membershipCounts = generateDataPoints(data.data.memberships, labels, period, 'count');
    const customerCounts = generateDataPoints(data.data.customers, labels, period, 'count');
    const membershipRevenue = generateDataPoints(data.data.memberships, labels, period, 'total_payment');
    const serviceRevenue = generateDataPoints(data.data.services || [], labels, period, 'total_payment');

    // Update membership chart
    updateChart('membershipChart', 'membership', {
        labels: labels,
        datasets: [{
            label: 'New Memberships',
            data: membershipCounts,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#667eea',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
        }]
    });

    // Update customer chart
    updateChart('customerChart', 'customer', {
        labels: labels,
        datasets: [{
            label: 'New Customers',
            data: customerCounts,
            borderColor: '#f5576c',
            backgroundColor: 'rgba(245, 87, 108, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#f5576c',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
        }]
    });

    // Update revenue chart with stacked bars
    updateChart('revenueChart', 'revenue', {
        labels: labels,
        datasets: [
            {
                label: 'Membership Revenue',
                data: membershipRevenue,
                backgroundColor: 'rgba(79, 172, 254, 0.8)',
                borderColor: '#4facfe',
                borderWidth: 2,
                borderRadius: 8,
                hoverBackgroundColor: 'rgba(79, 172, 254, 1)'
            },
            {
                label: 'Service Revenue',
                data: serviceRevenue,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: '#667eea',
                borderWidth: 2,
                borderRadius: 8,
                hoverBackgroundColor: 'rgba(102, 126, 234, 1)'
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
        // All 12 months
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Destroy existing chart
    if (charts[chartKey]) {
        charts[chartKey].destroy();
    }

    // Create new chart
    charts[chartKey] = new Chart(ctx, {
        type: type,
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: chartKey === 'revenue', // Show legend only for revenue chart
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
                    stacked: chartKey === 'revenue', // Enable stacking for revenue chart
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
                    stacked: chartKey === 'revenue', // Enable stacking for revenue chart
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
    });
}

// Utility functions
function formatCurrency(amount) {
    return 'Nu ' + new Intl.NumberFormat('en-US', {
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
