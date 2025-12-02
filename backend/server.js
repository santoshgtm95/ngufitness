const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const customersRouter = require('./routes/customers');
const membershipsRouter = require('./routes/memberships');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Gym Membership API is running',
        timestamp: new Date().toISOString()
    });
});

// Backup endpoint - Export as text file
app.get('/api/backup', (req, res) => {
    const db = require('./config/database');

    try {
        // Get all customers with their memberships
        const customers = db.prepare(`
            SELECT 
                c.id as customer_id,
                c.name,
                c.phone,
                c.address,
                c.created_at as customer_created,
                m.id as membership_id,
                m.start_date,
                m.expire_date,
                m.package_type,
                m.payment,
                m.created_at as membership_created
            FROM customers c
            LEFT JOIN memberships m ON c.id = m.customer_id
            ORDER BY c.name
        `).all();

        // Format data as text
        let textContent = '='.repeat(80) + '\n';
        textContent += 'NGU FITNESS - DATABASE BACKUP\n';
        textContent += 'Generated: ' + new Date().toISOString() + '\n';
        textContent += '='.repeat(80) + '\n\n';

        textContent += 'TOTAL CUSTOMERS: ' + new Set(customers.map(c => c.customer_id)).size + '\n';
        textContent += 'TOTAL MEMBERSHIPS: ' + customers.filter(c => c.membership_id).length + '\n\n';
        textContent += '='.repeat(80) + '\n\n';

        // Group by customer
        const customerMap = new Map();
        customers.forEach(row => {
            if (!customerMap.has(row.customer_id)) {
                customerMap.set(row.customer_id, {
                    id: row.customer_id,
                    name: row.name,
                    phone: row.phone,
                    address: row.address,
                    created: row.customer_created,
                    memberships: []
                });
            }
            if (row.membership_id) {
                customerMap.get(row.customer_id).memberships.push({
                    id: row.membership_id,
                    startDate: row.start_date,
                    expireDate: row.expire_date,
                    packageType: row.package_type,
                    payment: row.payment,
                    created: row.membership_created
                });
            }
        });

        // Format each customer
        let customerNum = 1;
        customerMap.forEach(customer => {
            textContent += `CUSTOMER #${customerNum}\n`;
            textContent += '-'.repeat(80) + '\n';
            textContent += `ID: ${customer.id}\n`;
            textContent += `Name: ${customer.name}\n`;
            textContent += `Phone: ${customer.phone}\n`;
            textContent += `Address: ${customer.address}\n`;
            textContent += `Registered: ${customer.created}\n`;

            if (customer.memberships.length > 0) {
                textContent += '\nMEMBERSHIP DETAILS:\n';
                customer.memberships.forEach((membership, idx) => {
                    textContent += `  ${idx + 1}. Package: ${membership.packageType}\n`;
                    textContent += `     Start Date: ${membership.startDate}\n`;
                    textContent += `     Expire Date: ${membership.expireDate}\n`;
                    textContent += `     Payment: ${membership.payment || 0}\n`;
                    textContent += `     Registered: ${membership.created}\n`;
                });
            } else {
                textContent += '\nMEMBERSHIP: None\n';
            }

            textContent += '\n' + '='.repeat(80) + '\n\n';
            customerNum++;
        });

        textContent += '\nEND OF BACKUP\n';
        textContent += '='.repeat(80) + '\n';

        // Send as downloadable text file
        const filename = `gym_backup_${new Date().toISOString().split('T')[0]}.txt`;
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(textContent);

    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API Routes
app.use('/api/customers', customersRouter);
app.use('/api/memberships', membershipsRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log('=================================');
    console.log('🏋️  Gym Membership API Server');
    console.log('=================================');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('=================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
