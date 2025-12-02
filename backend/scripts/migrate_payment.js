const db = require('../config/database');

console.log('🔄 Starting migration: Convert payment column to INTEGER...');

const migrate = () => {
    try {
        // Begin transaction
        db.prepare('BEGIN TRANSACTION').run();

        // 1. Create new table with correct schema
        console.log('Creating new memberships table...');
        db.prepare(`
            CREATE TABLE memberships_new (
                id TEXT PRIMARY KEY,
                customer_id TEXT NOT NULL,
                start_date DATE NOT NULL,
                expire_date DATE NOT NULL,
                package_type TEXT NOT NULL,
                payment INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
        `).run();

        // 2. Copy data from old table to new table
        console.log('Copying data...');
        db.prepare(`
            INSERT INTO memberships_new (id, customer_id, start_date, expire_date, package_type, payment, created_at, updated_at)
            SELECT id, customer_id, start_date, expire_date, package_type, CAST(payment AS INTEGER), created_at, updated_at
            FROM memberships
        `).run();

        // 3. Drop old table
        console.log('Dropping old table...');
        db.prepare('DROP TABLE memberships').run();

        // 4. Rename new table
        console.log('Renaming new table...');
        db.prepare('ALTER TABLE memberships_new RENAME TO memberships').run();

        // 5. Recreate indexes
        console.log('Recreating indexes...');
        db.prepare('CREATE INDEX idx_customer_id ON memberships(customer_id)').run();
        db.prepare('CREATE INDEX idx_expire_date ON memberships(expire_date)').run();

        // Commit transaction
        db.prepare('COMMIT').run();
        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        // Rollback transaction on error
        try {
            db.prepare('ROLLBACK').run();
            console.log('🔄 Transaction rolled back.');
        } catch (rollbackError) {
            console.error('❌ Error during rollback:', rollbackError);
        }
        process.exit(1);
    }
};

migrate();
