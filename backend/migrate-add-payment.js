const Database = require('better-sqlite3');
const path = require('path');

// Open the existing database
const dbPath = path.join(__dirname, 'gym_membership.db');
const db = new Database(dbPath);

console.log('🔄 Starting database migration...');
console.log(`📁 Database: ${dbPath}`);

try {
    // Check if payment column already exists
    const tableInfo = db.prepare("PRAGMA table_info(memberships)").all();
    const paymentColumnExists = tableInfo.some(col => col.name === 'payment');

    if (paymentColumnExists) {
        console.log('✅ Payment column already exists. No migration needed.');
    } else {
        // Add payment column with default value 0
        db.prepare('ALTER TABLE memberships ADD COLUMN payment REAL NOT NULL DEFAULT 0').run();
        console.log('✅ Successfully added payment column to memberships table');

        // Verify the column was added
        const updatedTableInfo = db.prepare("PRAGMA table_info(memberships)").all();
        const verified = updatedTableInfo.some(col => col.name === 'payment');

        if (verified) {
            console.log('✅ Migration verified successfully');
        } else {
            console.error('❌ Migration verification failed');
        }
    }
} catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
} finally {
    db.close();
}

console.log('🎉 Migration complete!');
