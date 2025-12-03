const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'gym_membership.db');
const db = new Database(dbPath);

console.log('🔄 Adding image column to customers table...');

try {
    // Check if column already exists
    const tableInfo = db.prepare("PRAGMA table_info(customers)").all();
    const hasImageColumn = tableInfo.some(col => col.name === 'image');

    if (hasImageColumn) {
        console.log('✅ Image column already exists');
    } else {
        // Add image column
        db.prepare('ALTER TABLE customers ADD COLUMN image TEXT').run();
        console.log('✅ Successfully added image column to customers table');
    }

    db.close();
    console.log('✅ Migration completed successfully');
} catch (error) {
    console.error('❌ Migration failed:', error);
    db.close();
    process.exit(1);
}
