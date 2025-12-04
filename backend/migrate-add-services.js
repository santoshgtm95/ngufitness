const Database = require('better-sqlite3');
const path = require('path');

console.log('🔄 Starting services table migration...');

// Open database
const dbPath = path.join(__dirname, 'gym_membership.db');
const db = new Database(dbPath);

try {
    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Create services table
    db.exec(`
        CREATE TABLE IF NOT EXISTS services (
            id TEXT PRIMARY KEY,
            service_name TEXT NOT NULL,
            price REAL NOT NULL,
            service_date DATE NOT NULL,
            customer_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_service_customer_id ON services(customer_id);
        CREATE INDEX IF NOT EXISTS idx_service_date ON services(service_date);
    `);

    console.log('✅ Services table created successfully!');
    console.log('📊 Table schema:');
    console.log('   - id: TEXT PRIMARY KEY');
    console.log('   - service_name: TEXT NOT NULL');
    console.log('   - price: REAL NOT NULL');
    console.log('   - service_date: DATE NOT NULL');
    console.log('   - customer_id: TEXT (optional)');
    console.log('   - created_at: DATETIME');
    console.log('   - updated_at: DATETIME');
    console.log('');
    console.log('🎉 Migration complete!');

} catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
} finally {
    db.close();
}
