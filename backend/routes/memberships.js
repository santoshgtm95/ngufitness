const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Generate unique ID
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// GET /api/memberships/expiring - Get memberships expiring within 5 days
router.get('/expiring', async (req, res, next) => {
    try {
        const memberships = db.prepare(`
      SELECT 
        m.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.address as customer_address,
        CAST((julianday(m.expire_date) - julianday('now')) AS INTEGER) as days_left
      FROM memberships m
      INNER JOIN customers c ON m.customer_id = c.id
      WHERE julianday(m.expire_date) >= julianday('now')
        AND julianday(m.expire_date) <= julianday('now', '+3 days')
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
        const { customerId, startDate, expireDate, packageType, payment } = req.body;

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

        // Verify customer exists
        const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(customerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        // Check if membership already exists for this customer
        const existingMembership = db.prepare('SELECT id FROM memberships WHERE customer_id = ?').get(customerId);

        if (existingMembership) {
            // Update existing membership
            db.prepare(
                'UPDATE memberships SET start_date = ?, expire_date = ?, package_type = ?, payment = ?, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ?'
            ).run(startDate, expireDate, packageType, paymentAmount, customerId);

            const updatedMembership = db.prepare('SELECT * FROM memberships WHERE customer_id = ?').get(customerId);

            res.json({
                success: true,
                data: updatedMembership,
                message: 'Membership updated successfully'
            });
        } else {
            // Create new membership
            const id = generateId();

            db.prepare(
                'INSERT INTO memberships (id, customer_id, start_date, expire_date, package_type, payment) VALUES (?, ?, ?, ?, ?, ?)'
            ).run(id, customerId, startDate, expireDate, packageType, paymentAmount);

            const newMembership = db.prepare('SELECT * FROM memberships WHERE id = ?').get(id);

            res.status(201).json({
                success: true,
                data: newMembership,
                message: 'Membership created successfully'
            });
        }
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

        res.json({
            success: true,
            message: 'Membership deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
