const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'gym_membership.db');
const db = new Database(dbPath);

console.log('Starting migration: Adding extra_days column to memberships table...');

try {
    // Check if column already exists
    const tableInfo = db.prepare("PRAGMA table_info(memberships)").all();
    const columnExists = tableInfo.some(col => col.name === 'extra_days');

    if (columnExists) {
        console.log('✓ Column extra_days already exists. Skipping migration.');
    } else {
        // Add extra_days column with default value of 0
        db.prepare('ALTER TABLE memberships ADD COLUMN extra_days INTEGER DEFAULT 0').run();
        console.log('✓ Successfully added extra_days column to memberships table');

        // Verify the column was added
        const updatedTableInfo = db.prepare("PRAGMA table_info(memberships)").all();
        const newColumnExists = updatedTableInfo.some(col => col.name === 'extra_days');

        if (newColumnExists) {
            console.log('✓ Verified: extra_days column exists in memberships table');
        } else {
            throw new Error('Failed to verify extra_days column');
        }
    }

    console.log('\nMigration completed successfully!');
} catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
} finally {
    db.close();
}
