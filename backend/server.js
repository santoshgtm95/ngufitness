const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const archiver = require('archiver');
const fs = require('fs');
const AdmZip = require('adm-zip');
const crypto = require('crypto');
require('dotenv').config();

const customersRouter = require('./routes/customers');
const membershipsRouter = require('./routes/memberships');
const reportsRouter = require('./routes/reports');
const servicesRouter = require('./routes/services');
const errorHandler = require('./middleware/errorHandler');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'images/customers');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
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
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl) or null origin (file://)
        if (!origin || origin === 'null' || origin === 'http://localhost:8080' || origin.startsWith('http://localhost:')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
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

        // Get all services
        const services = db.prepare(`
            SELECT 
                s.*,
                c.name as customer_name
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            ORDER BY s.service_date DESC
        `).all();

        // Format data as text
        let textContent = '='.repeat(80) + '\n';
        textContent += 'NGU FITNESS - DATABASE BACKUP\n';
        textContent += 'Generated: ' + new Date().toISOString() + '\n';
        textContent += '='.repeat(80) + '\n\n';

        textContent += 'TOTAL CUSTOMERS: ' + new Set(customers.map(c => c.customer_id)).size + '\n';
        textContent += 'TOTAL MEMBERSHIPS: ' + customers.filter(c => c.membership_id).length + '\n';
        textContent += 'TOTAL SERVICES: ' + services.length + '\n\n';
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

        textContent += '\nSERVICES HISTORY:\n';
        textContent += '='.repeat(80) + '\n\n';

        if (services.length > 0) {
            services.forEach((service, idx) => {
                textContent += `SERVICE #${idx + 1}\n`;
                textContent += `-`.repeat(80) + '\n';
                textContent += `ID: ${service.id}\n`;
                textContent += `Service Name: ${service.service_name || 'N/A'}\n`;
                textContent += `Customer ID: ${service.customer_id || 'None'}\n`;
                textContent += `Customer Name: ${service.customer_name || 'None'}\n`;
                textContent += `Price: ${service.price || 0}\n`;
                textContent += `Service Date: ${service.service_date}\n`;
                textContent += `Payment Status: ${service.payment_status || 'paid'}\n`;
                textContent += `Updated At: ${service.updated_at}\n`;
                textContent += `\n` + '='.repeat(80) + '\n\n';
            });
        } else {
            textContent += 'NO SERVICES RECORDS FOUND\n\n';
            textContent += '='.repeat(80) + '\n\n';
        }

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

// Zip upload configuration
const zipStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure directory exists right before saving
        const targetDir = path.resolve(__dirname, 'images', 'customers');
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        cb(null, targetDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'backup_import_' + Date.now() + '.zip');
    }
});

const uploadZip = multer({
    storage: zipStorage,
    fileFilter: function (req, file, cb) {
        const extname = path.extname(file.originalname).toLowerCase();
        if (extname === '.zip' || file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || file.mimetype === 'application/octet-stream') {
            return cb(null, true);
        } else {
            cb(new Error('Only ZIP files are allowed'));
        }
    }
});

// Import backup endpoint
app.post('/api/backup/import', uploadZip.single('backupZip'), (req, res) => {
    const db = require('./config/database');
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No backup file uploaded' });
        }

        const zip = new AdmZip(req.file.path);
        const zipEntries = zip.getEntries();

        // Find text file
        const txtEntry = zipEntries.find(entry => entry.entryName.startsWith('gym_data_backup_') && entry.entryName.endsWith('.txt'));
        if (!txtEntry) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, error: 'Invalid backup format: Text file not found' });
        }

        const txtContent = txtEntry.getData().toString('utf8');
        const lines = txtContent.split('\n');

        let customers = [];
        let memberships = [];
        let servicesData = [];
        let currentCustomer = null;
        let currentService = null;
        let mode = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Section triggers
            if (line === 'SERVICES HISTORY:') {
                mode = 'service_section';
                continue;
            }

            if (line.startsWith('CUSTOMER #')) {
                currentCustomer = {};
                mode = 'customer';
                customers.push(currentCustomer);
            } else if (line.startsWith('SERVICE #') && mode === 'service_section') {
                currentService = {};
                servicesData.push(currentService);
                mode = 'service_item';
            } else if (currentCustomer && mode === 'customer') {
                if (line.startsWith('ID: ')) currentCustomer.id = line.substring(4).trim();
                else if (line.startsWith('Name: ')) currentCustomer.name = line.substring(6).trim();
                else if (line.startsWith('Phone: ')) currentCustomer.phone = line.substring(7).trim();
                else if (line.startsWith('Address: ')) currentCustomer.address = line.substring(9).trim();
                else if (line.startsWith('Image: ')) {
                    const img = line.substring(7).trim();
                    currentCustomer.image = img === 'None' ? null : img;
                }
                else if (line.startsWith('Registered: ')) currentCustomer.created = line.substring(12).trim();
                else if (line === 'MEMBERSHIP DETAILS:') mode = 'membership';
                else if (line === 'MEMBERSHIP: None') mode = 'customer';
            } else if (currentCustomer && mode === 'membership') {
                if (line.match(/^\d+\.\s+Package:\s+(.*)/)) {
                    const pkg = line.match(/^\d+\.\s+Package:\s+(.*)/)[1];
                    currentCustomer.currentMembership = {
                        customer_id: currentCustomer.id,
                        packageType: pkg
                    };
                    memberships.push(currentCustomer.currentMembership);
                } else if (currentCustomer.currentMembership) {
                    if (line.startsWith('Start Date: ')) currentCustomer.currentMembership.start_date = line.substring(12).trim();
                    else if (line.startsWith('Expire Date: ')) currentCustomer.currentMembership.expire_date = line.substring(13).trim();
                    else if (line.startsWith('Payment: ')) currentCustomer.currentMembership.payment = parseInt(line.substring(9).trim()) || 0;
                    else if (line.startsWith('Registered: ')) {
                        currentCustomer.currentMembership.created = line.substring(12).trim();
                    }
                }
                if (line.startsWith('=')) {
                    mode = 'customer';
                    currentCustomer = null;
                }
            } else if (currentService && mode === 'service_item') {
                if (line.startsWith('ID: ')) currentService.id = line.substring(4).trim();
                else if (line.startsWith('Service Name: ')) currentService.service_name = line.substring(14).trim();
                else if (line.startsWith('Customer ID: ')) currentService.customer_id = line.substring(13).trim();
                else if (line.startsWith('Price: ')) currentService.price = parseFloat(line.substring(7).trim()) || 0;
                else if (line.startsWith('Service Date: ')) currentService.service_date = line.substring(14).trim();
                else if (line.startsWith('Payment Status: ')) currentService.payment_status = line.substring(16).trim();
                else if (line.startsWith('Updated At: ')) currentService.updated_at = line.substring(12).trim();

                if (line.startsWith('=')) {
                    currentService = null;
                }
            }
        }

        // Extract images
        zipEntries.forEach(entry => {
            if (entry.entryName.startsWith('images/') && !entry.isDirectory) {
                const imgPath = path.join(__dirname, 'images/customers', entry.name);
                fs.writeFileSync(imgPath, entry.getData());
            }
        });

        // Generate IDs for memberships (if missing)
        memberships.forEach(m => { if (!m.id) m.id = crypto.randomUUID(); });

        // Perform DB replacement
        const migrateDB = db.transaction((custs, mems, servs) => {
            db.prepare('DELETE FROM services').run();
            db.prepare('DELETE FROM memberships').run();
            db.prepare('DELETE FROM customers').run();

            const insertC = db.prepare('INSERT INTO customers (id, name, phone, address, image, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
            const insertM = db.prepare('INSERT INTO memberships (id, customer_id, start_date, expire_date, package_type, payment, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            const insertS = db.prepare('INSERT INTO services (id, service_name, price, service_date, customer_id, payment_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

            for (const c of custs) {
                insertC.run(c.id, c.name, c.phone, c.address, c.image, c.created || new Date().toISOString(), c.created || new Date().toISOString());
            }
            for (const m of mems) {
                insertM.run(m.id, m.customer_id, m.start_date, m.expire_date, m.packageType, m.payment, m.created || new Date().toISOString(), m.created || new Date().toISOString());
            }
            for (const s of servs) {
                const customerId = s.customer_id === 'None' ? null : s.customer_id;
                insertS.run(s.id, s.service_name, s.price, s.service_date, customerId, s.payment_status, s.updated_at || new Date().toISOString(), s.updated_at || new Date().toISOString());
            }
        });

        migrateDB(customers, memberships, servicesData);

        // Delete uploaded file
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json({ success: true, message: 'Backup imported successfully with services' });
    } catch (err) {
        console.error('Import error:', err);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, error: err.message });
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
