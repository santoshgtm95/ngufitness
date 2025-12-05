const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Generate unique ID
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// GET /api/services - Get all services with customer information
router.get('/', async (req, res, next) => {
    try {
        const services = db.prepare(`
            SELECT 
                s.*,
                c.name as customer_name,
                c.phone as customer_phone
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            ORDER BY s.service_date DESC, s.created_at DESC
        `).all();

        res.json({
            success: true,
            data: services
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/services/:id - Get single service
router.get('/:id', async (req, res, next) => {
    try {
        const service = db.prepare(`
            SELECT 
                s.*,
                c.name as customer_name,
                c.phone as customer_phone
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.id = ?
        `).get(req.params.id);

        if (!service) {
            return res.status(404).json({
                success: false,
                error: 'Service not found'
            });
        }

        res.json({
            success: true,
            data: service
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/services - Create new service
router.post('/', async (req, res, next) => {
    try {
        const { service_name, price, service_date, customer_id, payment_status } = req.body;

        // Validation
        if (!service_name || !price || !service_date) {
            return res.status(400).json({
                success: false,
                error: 'Service name, price, and service date are required'
            });
        }

        // Validate price is a number
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum < 0) {
            return res.status(400).json({
                success: false,
                error: 'Price must be a valid positive number'
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

        // Validate customer exists if customer_id is provided
        if (customer_id) {
            const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(customer_id);
            if (!customer) {
                return res.status(400).json({
                    success: false,
                    error: 'Customer not found'
                });
            }
        }

        const id = generateId();

        db.prepare(
            'INSERT INTO services (id, service_name, price, service_date, customer_id, payment_status) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(id, service_name, priceNum, service_date, customer_id || null, paymentStatus);

        const service = db.prepare(`
            SELECT 
                s.*,
                c.name as customer_name,
                c.phone as customer_phone
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.id = ?
        `).get(id);

        res.status(201).json({
            success: true,
            data: service
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/services/:id - Update service
router.put('/:id', async (req, res, next) => {
    try {
        const { service_name, price, service_date, customer_id, payment_status } = req.body;

        // Validation
        if (!service_name || !price || !service_date) {
            return res.status(400).json({
                success: false,
                error: 'Service name, price, and service date are required'
            });
        }

        // Validate price is a number
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum < 0) {
            return res.status(400).json({
                success: false,
                error: 'Price must be a valid positive number'
            });
        }

        // Validate customer exists if customer_id is provided
        if (customer_id) {
            const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(customer_id);
            if (!customer) {
                return res.status(400).json({
                    success: false,
                    error: 'Customer not found'
                });
            }
        }

        const result = db.prepare(
            'UPDATE services SET service_name = ?, price = ?, service_date = ?, customer_id = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(service_name, priceNum, service_date, customer_id || null, paymentStatus, req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Service not found'
            });
        }

        const service = db.prepare(`
            SELECT 
                s.*,
                c.name as customer_name,
                c.phone as customer_phone
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.id = ?
        `).get(req.params.id);

        res.json({
            success: true,
            data: service
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/services/:id - Delete service
router.delete('/:id', async (req, res, next) => {
    try {
        const result = db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Service not found'
            });
        }

        res.json({
            success: true,
            message: 'Service deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
