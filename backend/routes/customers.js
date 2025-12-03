const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer');
const path = require('path');

// Configure multer for this route
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../images/customers'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

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
                    image: row.image,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    membership: null
                });
            }

            if (row.membership_id) {
                if (!customersMap.get(row.id).memberships) {
                    customersMap.get(row.id).memberships = [];
                }
                customersMap.get(row.id).memberships.push({
                    id: row.membership_id,
                    startDate: row.start_date,
                    expireDate: row.expire_date,
                    packageType: row.package_type,
                    payment: row.payment,
                    createdAt: row.membership_created_at
                });
            }
        });

        // Convert map to array and sort memberships by date desc
        const customerList = Array.from(customersMap.values()).map(customer => {
            if (customer.memberships) {
                customer.memberships.sort((a, b) => new Date(b.expireDate) - new Date(a.expireDate));
                customer.membership = customer.memberships[0]; // Keep latest as 'membership' for backward compatibility
            }
            return customer;
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

        // Get memberships if exists
        const memberships = db.prepare('SELECT * FROM memberships WHERE customer_id = ? ORDER BY expire_date DESC').all(req.params.id);

        res.json({
            success: true,
            data: {
                ...customer,
                memberships: memberships || [],
                membership: memberships[0] || null // Backward compatibility
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/customers - Create new customer
router.post('/', upload.single('image'), async (req, res, next) => {
    try {
        const { name, phone, address } = req.body;
        const image = req.file ? req.file.filename : null;

        // Validation
        if (!name || !phone || !address) {
            return res.status(400).json({
                success: false,
                error: 'Name, phone, and address are required'
            });
        }

        const id = generateId();

        db.prepare('INSERT INTO customers (id, name, phone, address, image) VALUES (?, ?, ?, ?, ?)').run(id, name, phone, address, image);

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
router.put('/:id', upload.single('image'), async (req, res, next) => {
    try {
        const { name, phone, address } = req.body;
        const image = req.file ? req.file.filename : undefined;

        // Validation
        if (!name || !phone || !address) {
            return res.status(400).json({
                success: false,
                error: 'Name, phone, and address are required'
            });
        }

        let result;
        if (image) {
            // Update with new image
            result = db.prepare(
                'UPDATE customers SET name = ?, phone = ?, address = ?, image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
            ).run(name, phone, address, image, req.params.id);
        } else {
            // Update without changing image
            result = db.prepare(
                'UPDATE customers SET name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
            ).run(name, phone, address, req.params.id);
        }

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
