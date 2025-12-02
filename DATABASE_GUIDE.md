# 💾 Database Guide - Viewing and Managing Your Data

## 📍 Database Location

Your SQLite database is located at:

**macOS/Linux:**
```
/Users/applipplimyanmar/Development/mine/NGU/backend/gym_membership.db
```

**Windows:**
```
C:\Users\YourUsername\Documents\NGU\backend\gym_membership.db
```

Current database size: **28 KB**

---

## 🔍 Method 1: Using Command Line (macOS/Linux)

### View All Customers

```bash
cd /Users/applipplimyanmar/Development/mine/NGU
sqlite3 backend/gym_membership.db "SELECT * FROM customers;"
```

**Current data:**
```
ID: min0m39lflacmp8ogfd
Name: John Doe
Phone: 555-1234
Address: 123 Main St
Created: 2025-12-01 10:37:24
```

### View All Memberships

```bash
sqlite3 backend/gym_membership.db "SELECT * FROM memberships;"
```

**Current data:**
```
ID: min0mnssj0o1e0exxvn
Customer ID: min0m39lflacmp8ogfd
Start Date: 2025-12-01
Expire Date: 2026-01-01
Package: 1month
Created: 2025-12-01 10:37:51
```

### View Customers with Memberships (Joined)

```bash
sqlite3 backend/gym_membership.db "
SELECT 
  c.name,
  c.phone,
  m.package_type,
  m.start_date,
  m.expire_date
FROM customers c
LEFT JOIN memberships m ON c.id = m.customer_id;
"
```

### Interactive SQLite Shell

```bash
sqlite3 backend/gym_membership.db
```

Once inside, you can run commands:
```sql
-- List all tables
.tables

-- Show table structure
.schema customers
.schema memberships

-- Query data
SELECT * FROM customers;
SELECT * FROM memberships;

-- Exit
.quit
```

---

## 🔍 Method 2: Using Command Line (Windows)

### Install SQLite for Windows

1. Download SQLite tools from: https://www.sqlite.org/download.html
2. Look for "sqlite-tools-win32-x86-*.zip"
3. Extract to a folder (e.g., `C:\sqlite`)
4. Add to PATH or use full path

### View Data

```cmd
cd C:\Users\YourUsername\Documents\NGU
C:\sqlite\sqlite3.exe backend\gym_membership.db "SELECT * FROM customers;"
```

Or open interactive shell:
```cmd
C:\sqlite\sqlite3.exe backend\gym_membership.db
```

---

## 🖥️ Method 3: Using GUI Tools (Recommended for Beginners)

### Option A: DB Browser for SQLite (Free, Cross-Platform)

**Download:** https://sqlitebrowser.org/

**Steps:**
1. Download and install DB Browser for SQLite
2. Open the application
3. Click "Open Database"
4. Navigate to: `backend/gym_membership.db`
5. Click the "Browse Data" tab
6. Select table: `customers` or `memberships`
7. View, edit, or export your data!

**Features:**
- ✅ Visual table browser
- ✅ Edit data directly
- ✅ Run SQL queries
- ✅ Export to CSV/JSON
- ✅ No coding required

### Option B: VS Code Extension

**Extension:** SQLite Viewer

**Steps:**
1. Open VS Code
2. Install "SQLite Viewer" extension
3. Open the `NGU` folder in VS Code
4. Right-click on `backend/gym_membership.db`
5. Select "Open Database"
6. Browse tables and data

### Option C: Online SQLite Viewer

**Website:** https://sqliteviewer.app/

**Steps:**
1. Go to the website
2. Click "Choose File"
3. Select `gym_membership.db`
4. View your data in the browser

⚠️ **Note:** Your data stays in your browser, not uploaded to a server

---

## 📊 Useful SQL Queries

### Count Total Customers
```sql
SELECT COUNT(*) as total_customers FROM customers;
```

### Count Active Memberships
```sql
SELECT COUNT(*) as active_memberships 
FROM memberships 
WHERE expire_date >= date('now');
```

### Find Expiring Memberships (Next 5 Days)
```sql
SELECT 
  c.name,
  c.phone,
  m.expire_date,
  CAST((julianday(m.expire_date) - julianday('now')) AS INTEGER) as days_left
FROM memberships m
JOIN customers c ON m.customer_id = c.id
WHERE m.expire_date >= date('now')
  AND m.expire_date <= date('now', '+5 days')
ORDER BY m.expire_date;
```

### List All Customers with Membership Status
```sql
SELECT 
  c.name,
  c.phone,
  CASE 
    WHEN m.expire_date IS NULL THEN 'No Membership'
    WHEN m.expire_date < date('now') THEN 'Expired'
    WHEN m.expire_date <= date('now', '+5 days') THEN 'Expiring Soon'
    ELSE 'Active'
  END as status,
  m.expire_date
FROM customers c
LEFT JOIN memberships m ON c.id = m.customer_id
ORDER BY c.name;
```

### Export All Data
```sql
-- In sqlite3 shell
.mode csv
.headers on
.output customers_export.csv
SELECT * FROM customers;
.output memberships_export.csv
SELECT * FROM memberships;
.output stdout
```

---

## 💾 Backup Your Database

### Manual Backup (Copy File)

**macOS/Linux:**
```bash
cp backend/gym_membership.db backend/gym_membership_backup_$(date +%Y%m%d).db
```

**Windows:**
```cmd
copy backend\gym_membership.db backend\gym_membership_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.db
```

### Using SQLite Command

```bash
sqlite3 backend/gym_membership.db ".backup backup/gym_membership_backup.db"
```

### Restore from Backup

Simply copy the backup file back:
```bash
cp backend/gym_membership_backup.db backend/gym_membership.db
```

---

## 📈 Database Schema

### Customers Table
```sql
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Memberships Table
```sql
CREATE TABLE memberships (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  start_date DATE NOT NULL,
  expire_date DATE NOT NULL,
  package_type TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
```

---

## 🔧 Advanced: Create Database Views

You can create views for common queries:

```sql
-- Create a view for customer summary
CREATE VIEW customer_summary AS
SELECT 
  c.id,
  c.name,
  c.phone,
  c.address,
  m.package_type,
  m.start_date,
  m.expire_date,
  CASE 
    WHEN m.expire_date IS NULL THEN 'No Membership'
    WHEN m.expire_date < date('now') THEN 'Expired'
    WHEN m.expire_date <= date('now', '+5 days') THEN 'Expiring Soon'
    ELSE 'Active'
  END as status
FROM customers c
LEFT JOIN memberships m ON c.id = m.customer_id;

-- Use the view
SELECT * FROM customer_summary;
```

---

## 📊 Current Database Statistics

**Customers:** 1
- John Doe (555-1234)

**Memberships:** 1
- Package: 1 month
- Expires: 2026-01-01
- Status: Active

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| View all customers | `sqlite3 backend/gym_membership.db "SELECT * FROM customers;"` |
| View all memberships | `sqlite3 backend/gym_membership.db "SELECT * FROM memberships;"` |
| Count customers | `sqlite3 backend/gym_membership.db "SELECT COUNT(*) FROM customers;"` |
| Backup database | `cp backend/gym_membership.db backend/backup.db` |
| Open GUI tool | Use DB Browser for SQLite |

---

## 💡 Tips

1. **Regular Backups**: Backup your database regularly, especially before making bulk changes
2. **Use GUI Tools**: DB Browser for SQLite is the easiest way to view and manage data
3. **Export Data**: You can export to CSV for use in Excel or Google Sheets
4. **Test Queries**: Always test SQL queries on a backup first
5. **Check Integrity**: Run `.schema` in sqlite3 to verify table structure

---

## 🔒 Security Note

- The database file is stored locally on your computer
- No password protection by default
- For sensitive data, consider encrypting the database file
- Keep regular backups in a secure location

---

## 🎉 You're All Set!

You now know how to:
- ✅ Find your database file
- ✅ View data using command line
- ✅ Use GUI tools for easier management
- ✅ Run SQL queries
- ✅ Backup and restore your database

**Recommended:** Download **DB Browser for SQLite** for the easiest experience!
