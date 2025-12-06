const db = require('./config/database');

console.log('🔄 Running migration: Create settings table...');

try {
    // Create settings table
    db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Insert default peer_ip setting if it doesn't exist
    const check = db.prepare("SELECT * FROM settings WHERE key = 'peer_ip'").get();
    if (!check) {
        db.prepare("INSERT INTO settings (key, value) VALUES ('peer_ip', '')").run();
        console.log('✅ Created default peer_ip setting');
    }

    console.log('✅ Migration completed successfully!');
    console.log('- Created settings table');

} catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
}
