const Database = require('better-sqlite3');
const path = require('path');

// When running inside Electron the DB_PATH env variable points to a writable
// user-data directory (e.g. AppData\Roaming\FITLABFitness). Fall back to the
// local file for normal development use.
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'gym_membership.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS memberships (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    start_date DATE NOT NULL,
    expire_date DATE NOT NULL,
    package_type TEXT NOT NULL,
    payment INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_customer_id ON memberships(customer_id);
  CREATE INDEX IF NOT EXISTS idx_expire_date ON memberships(expire_date);
`);

console.log('✅ Successfully connected to SQLite database');
console.log(`📁 Database location: ${dbPath}`);

module.exports = db;
