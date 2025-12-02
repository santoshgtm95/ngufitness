const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Generate unique ID
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// GET /api/customers - Get all customers with their memberships
router.get('/', async (req, res, next) => {
    try {
        const customers = db.prepare(`
      SELECT 
        c.*,
        m.id as membership_id,
        m.start_date,
        m.expire_date,
        m.package_type,
        m.payment,
        m.created_at as membership_created_at
      FROM customers c
      LEFT JOIN memberships m ON c.id = m.customer_id
      ORDER BY c.created_at DESC
    `).all();

        // Group memberships with customers
        const customersMap = new Map();
        customers.forEach(row => {
            if (!customersMap.has(row.id)) {
                customersMap.set(row.id, {
                    id: row.id,
                    name: row.name,
                    phone: row.phone,
                    address: row.address,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    membership: null
                });
            }

            if (row.membership_id) {
                customersMap.get(row.id).membership = {
                    id: row.membership_id,
                    startDate: row.start_date,
                    expireDate: row.expire_date,
                    packageType: row.package_type,
                    payment: row.payment,
                    createdAt: row.membership_created_at
                };
            }
        });

        res.json({
            success: true,
            data: Array.from(customersMap.values())
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/customers/:id - Get single customer
router.get('/:id', async (req, res, next) => {
    try {
        const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        // Get membership if exists
        const membership = db.prepare('SELECT * FROM memberships WHERE customer_id = ?').get(req.params.id);

        res.json({
            success: true,
            data: {
                ...customer,
                membership: membership || null
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/customers - Create new customer
router.post('/', async (req, res, next) => {
    try {
        const { name, phone, address } = req.body;

        // Validation
        if (!name || !phone || !address) {
            return res.status(400).json({
                success: false,
                error: 'Name, phone, and address are required'
            });
        }

        const id = generateId();

        db.prepare('INSERT INTO customers (id, name, phone, address) VALUES (?, ?, ?, ?)').run(id, name, phone, address);

        const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);

        res.status(201).json({
            success: true,
            data: customer
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', async (req, res, next) => {
    try {
        const { name, phone, address } = req.body;

        // Validation
        if (!name || !phone || !address) {
            return res.status(400).json({
                success: false,
                error: 'Name, phone, and address are required'
            });
        }

        const result = db.prepare(
            'UPDATE customers SET name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(name, phone, address, req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);

        res.json({
            success: true,
            data: customer
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/customers/:id - Delete customer (cascade deletes membership)
router.delete('/:id', async (req, res, next) => {
    try {
        const result = db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        res.json({
            success: true,
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
