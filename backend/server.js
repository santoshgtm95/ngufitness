const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const archiver = require('archiver');
require('dotenv').config();

const customersRouter = require('./routes/customers');
const membershipsRouter = require('./routes/memberships');
const reportsRouter = require('./routes/reports');
const servicesRouter = require('./routes/services');
const errorHandler = require('./middleware/errorHandler');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'images/customers'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files (jpeg, jpg, png, gif) are allowed'));
        }
    }
});

const app = express();
const PORT = process.env.PORT || 3000;

// Export upload middleware for use in routes
module.exports.upload = upload;


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

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve uploaded images
app.use('/images', express.static(path.join(__dirname, 'images')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Gym Membership API is running',
        timestamp: new Date().toISOString()
    });
});

// Backup endpoint - Export as ZIP file with images
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
                c.image,
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
                    image: row.image,
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
            textContent += `Image: ${customer.image || 'None'}\n`;
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

        // Set headers for ZIP download
        const filename = `ngu_fitness_backup_${new Date().toISOString().split('T')[0]}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Create zip archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        // Listen for all archive data to be written
        // 'close' event is fired only when a file descriptor is involved
        res.on('close', function () {
            console.log(archive.pointer() + ' total bytes');
            console.log('archiver has been finalized and the output file descriptor has closed.');
        });

        // This event is fired when the data source is drained no matter what was the data source.
        // It is not part of this library but rather from the NodeJS Stream API.
        // @see: https://nodejs.org/api/stream.html#stream_event_end
        res.on('end', function () {
            console.log('Data has been drained');
        });

        // good practice to catch warnings (ie stat failures and other non-blocking errors)
        archive.on('warning', function (err) {
            if (err.code === 'ENOENT') {
                // log warning
                console.warn('Archiver warning:', err);
            } else {
                // throw error
                throw err;
            }
        });

        // good practice to catch this error explicitly
        archive.on('error', function (err) {
            throw err;
        });

        // pipe archive data to the response
        archive.pipe(res);

        // append the text backup file
        archive.append(textContent, { name: `gym_data_backup_${new Date().toISOString().split('T')[0]}.txt` });

        // append images directory
        const imagesDir = path.join(__dirname, 'images/customers');
        archive.directory(imagesDir, 'images');

        // finalize the archive (ie we are done appending files but streams have to finish yet)
        // 'close', 'end' or 'finish' may be fired right after this depending on how you added the instance
        archive.finalize();

    } catch (error) {
        console.error('Error creating backup:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
});

// API Routes
app.use('/api/customers', customersRouter);
app.use('/api/memberships', membershipsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/settings', require('./routes/settings'));

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
