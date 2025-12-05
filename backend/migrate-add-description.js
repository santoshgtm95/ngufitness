const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'gym_membership.db');
const db = new Database(dbPath);

console.log('Starting migration: Adding description column to memberships...');

try {
    // Start transaction
    db.prepare('BEGIN').run();

    // Add description column to memberships table
    console.log('Adding description column to memberships table...');
    db.prepare(`
        ALTER TABLE memberships 
        ADD COLUMN description TEXT
    `).run();

    console.log('Setting default empty description for existing records...');
    db.prepare(`
        UPDATE memberships 
        SET description = '' 
        WHERE description IS NULL
    `).run();

    // Commit transaction
    db.prepare('COMMIT').run();

    console.log('✅ Migration completed successfully!');
    console.log('- Added description column to memberships table');
    console.log('- Set all existing records to empty description');

} catch (error) {
    // Rollback on error
    db.prepare('ROLLBACK').run();
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
} finally {
    db.close();
}
