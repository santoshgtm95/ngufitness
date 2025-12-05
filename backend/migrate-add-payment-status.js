const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'gym_membership.db');
const db = new Database(dbPath);

console.log('Starting migration: Adding payment_status column...');

try {
    // Start transaction
    db.prepare('BEGIN').run();

    // Add payment_status column to memberships table
    console.log('Adding payment_status column to memberships table...');
    db.prepare(`
        ALTER TABLE memberships 
        ADD COLUMN payment_status TEXT DEFAULT 'paid' CHECK(payment_status IN ('paid', 'unpaid', 'partially_paid'))
    `).run();

    // Update existing records to 'paid' (since they already have payment amounts)
    console.log('Updating existing memberships to paid status...');
    db.prepare(`
        UPDATE memberships 
        SET payment_status = 'paid' 
        WHERE payment_status IS NULL
    `).run();

    // Add payment_status column to services table
    console.log('Adding payment_status column to services table...');
    db.prepare(`
        ALTER TABLE services 
        ADD COLUMN payment_status TEXT DEFAULT 'paid' CHECK(payment_status IN ('paid', 'unpaid', 'partially_paid'))
    `).run();

    // Update existing records to 'paid' (since they already have prices)
    console.log('Updating existing services to paid status...');
    db.prepare(`
        UPDATE services 
        SET payment_status = 'paid' 
        WHERE payment_status IS NULL
    `).run();

    // Commit transaction
    db.prepare('COMMIT').run();

    console.log('✅ Migration completed successfully!');
    console.log('- Added payment_status column to memberships table');
    console.log('- Added payment_status column to services table');
    console.log('- Set all existing records to "paid" status');

} catch (error) {
    // Rollback on error
    db.prepare('ROLLBACK').run();
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
} finally {
    db.close();
}
