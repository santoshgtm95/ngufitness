const express = require('express');
const router = express.Router();
const db = require('../config/database');
const syncService = require('../services/syncService');

// Generate unique ID
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// GET /api/memberships/expiring - Get memberships expiring within 5 days (including today)
router.get('/expiring', async (req, res, next) => {
    try {
        const memberships = db.prepare(`
      SELECT 
        m.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.address as customer_address,
        CAST((julianday(m.expire_date) - julianday(date('now'))) AS INTEGER) as days_left
      FROM memberships m
      INNER JOIN customers c ON m.customer_id = c.id
      WHERE date(m.expire_date) >= date('now')
        AND date(m.expire_date) <= date('now', '+5 days')
      ORDER BY m.expire_date ASC
    `).all();

        const formattedMemberships = memberships.map(m => ({
            customer: {
                id: m.customer_id,
                name: m.customer_name,
                phone: m.customer_phone,
                address: m.customer_address
            },
            membership: {
                id: m.id,
                startDate: m.start_date,
                expireDate: m.expire_date,
                packageType: m.package_type
            },
            daysLeft: m.days_left
        }));

        res.json({
            success: true,
            data: formattedMemberships
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/memberships - Get all memberships
router.get('/', async (req, res, next) => {
    try {
        const memberships = db.prepare(`
      SELECT 
        m.*,
        c.name as customer_name,
        c.phone as customer_phone
      FROM memberships m
      INNER JOIN customers c ON m.customer_id = c.id
      ORDER BY m.created_at DESC
    `).all();

        res.json({
            success: true,
            data: memberships
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/memberships - Create or update membership for a customer
router.post('/', async (req, res, next) => {
    try {
        const { customerId, startDate, expireDate, packageType, payment, payment_status, description } = req.body;

        // Validation
        if (!customerId || !startDate || !expireDate || !packageType) {
            return res.status(400).json({
                success: false,
                error: 'Customer ID, start date, expire date, and package type are required'
            });
        }

        // Debug: Log payment value
        console.log('Received payment value:', payment, 'Type:', typeof payment);

        // Validate payment (required, must be a number >= 0)
        if (payment === undefined || payment === null || payment === '') {
            return res.status(400).json({
                success: false,
                error: 'Payment amount is required'
            });
        }

        const paymentAmount = parseFloat(payment);
        if (isNaN(paymentAmount) || paymentAmount < 0) {
            return res.status(400).json({
                success: false,
                error: 'Payment must be a valid number greater than or equal to 0'
            });
        }

        // Validate payment_status
        const validStatuses = ['paid', 'unpaid', 'partially_paid'];
        const paymentStatus = payment_status || 'paid';
        if (!validStatuses.includes(paymentStatus)) {
            return res.status(400).json({
                success: false,
                error: 'Payment status must be one of: paid, unpaid, partially_paid'
            });
        }

        // Verify customer exists
        const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(customerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        // Create new membership
        const id = generateId();

        db.prepare(
            'INSERT INTO memberships (id, customer_id, start_date, expire_date, package_type, payment, payment_status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(id, customerId, startDate, expireDate, packageType, paymentAmount, paymentStatus, description || '');

        const newMembership = db.prepare('SELECT * FROM memberships WHERE id = ?').get(id);

        // Broadcast change
        if (!req.headers['x-sync-source']) {
            syncService.broadcastChange('POST', req.originalUrl, req.body);
        }

        res.status(201).json({
            success: true,
            data: newMembership,
            message: 'Membership created successfully'
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/memberships/:id - Update existing membership
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { startDate, expireDate, packageType, payment, payment_status, description } = req.body;

        // Validation
        if (!startDate || !expireDate || !packageType) {
            return res.status(400).json({
                success: false,
                error: 'Start date, expire date, and package type are required'
            });
        }

        // Validate payment (required, must be a number >= 0)
        if (payment === undefined || payment === null || payment === '') {
            return res.status(400).json({
                success: false,
                error: 'Payment amount is required'
            });
        }

        const paymentAmount = parseFloat(payment);
        if (isNaN(paymentAmount) || paymentAmount < 0) {
            return res.status(400).json({
                success: false,
                error: 'Payment must be a valid number greater than or equal to 0'
            });
        }

        // Validate payment_status
        const validStatuses = ['paid', 'unpaid', 'partially_paid'];
        const paymentStatus = payment_status || 'paid';
        if (!validStatuses.includes(paymentStatus)) {
            return res.status(400).json({
                success: false,
                error: 'Payment status must be one of: paid, unpaid, partially_paid'
            });
        }

        // Verify membership exists
        const existingMembership = db.prepare('SELECT * FROM memberships WHERE id = ?').get(id);

        if (!existingMembership) {
            return res.status(404).json({
                success: false,
                error: 'Membership not found'
            });
        }

        // Update membership
        db.prepare(
            'UPDATE memberships SET start_date = ?, expire_date = ?, package_type = ?, payment = ?, payment_status = ?, description = ? WHERE id = ?'
        ).run(startDate, expireDate, packageType, paymentAmount, paymentStatus, description || '', id);

        const updatedMembership = db.prepare('SELECT * FROM memberships WHERE id = ?').get(id);

        // Broadcast change
        if (!req.headers['x-sync-source']) {
            syncService.broadcastChange('PUT', req.originalUrl, req.body);
        }

        res.json({
            success: true,
            data: updatedMembership,
            message: 'Membership updated successfully'
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/memberships/:id - Delete membership
router.delete('/:id', async (req, res, next) => {
    try {
        const result = db.prepare('DELETE FROM memberships WHERE id = ?').run(req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Membership not found'
            });
        }

        // Broadcast change
        if (!req.headers['x-sync-source']) {
            syncService.broadcastChange('DELETE', req.originalUrl, {});
        }

        res.json({
            success: true,
            message: 'Membership deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
