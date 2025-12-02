# MySQL Password Setup Guide

## The Issue
MySQL root user requires a password, but we don't know what it is.

## Solution Options

### Option 1: Reset MySQL Root Password (Recommended)

```bash
# 1. Stop MySQL
brew services stop mysql

# 2. Start MySQL in safe mode (skip grant tables)
sudo /usr/local/Cellar/mysql/9.5.0_2/bin/mysqld_safe --skip-grant-tables &

# 3. In a new terminal, connect without password
/usr/local/Cellar/mysql/9.5.0_2/bin/mysql -u root

# 4. Reset the password (run these SQL commands)
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
FLUSH PRIVILEGES;
EXIT;

# 5. Kill the safe mode MySQL process
sudo killall mysqld

# 6. Restart MySQL normally
brew services start mysql

# 7. Test connection (should work without password now)
/usr/local/Cellar/mysql/9.5.0_2/bin/mysql -u root
```

### Option 2: Set a Password and Update .env

If you know your MySQL root password or want to set one:

```bash
# Connect to MySQL (you'll be prompted for password)
/usr/local/Cellar/mysql/9.5.0_2/bin/mysql -u root -p

# Set a new password if needed
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_new_password';
EXIT;
```

Then update `/Users/applipplimyanmar/Development/mine/NGU/backend/.env`:
```
DB_PASSWORD=your_new_password
```

### Option 3: Use Simplified Setup (Easiest)

I can create a simpler version that doesn't use MySQL authentication. Let me know if you want this option.

## After Password is Set

Once MySQL is accessible, run:

```bash
cd /Users/applipplimyanmar/Development/mine/NGU/backend
node init-db.js
```

This will create the database and tables automatically!

## Need Help?

Let me know which option you'd like to try, or if you'd prefer I create a simplified setup.
