#!/bin/bash

# Gym Membership Database Setup Script
# This script sets up the MySQL database for the gym membership system

echo "=================================="
echo "Gym Membership Database Setup"
echo "=================================="
echo ""

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL first:"
    echo "   brew install mysql"
    exit 1
fi

echo "✅ MySQL is installed"
echo ""

# Prompt for MySQL root password
echo "Please enter your MySQL root password:"
read -s MYSQL_ROOT_PASSWORD
echo ""

# Test MySQL connection
if ! mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1;" &> /dev/null; then
    echo "❌ Failed to connect to MySQL. Please check your password."
    exit 1
fi

echo "✅ Connected to MySQL successfully"
echo ""

# Create database
echo "Creating database 'gym_membership'..."
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS gym_membership;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database created successfully"
else
    echo "❌ Failed to create database"
    exit 1
fi

# Prompt for new database user password
echo ""
echo "Enter a password for the 'gym_admin' database user:"
read -s DB_USER_PASSWORD
echo ""

# Create database user
echo "Creating database user 'gym_admin'..."
mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF 2>/dev/null
CREATE USER IF NOT EXISTS 'gym_admin'@'localhost' IDENTIFIED BY '$DB_USER_PASSWORD';
GRANT ALL PRIVILEGES ON gym_membership.* TO 'gym_admin'@'localhost';
FLUSH PRIVILEGES;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database user created successfully"
else
    echo "❌ Failed to create database user"
    exit 1
fi

# Run schema file
echo ""
echo "Creating database tables..."
mysql -u gym_admin -p"$DB_USER_PASSWORD" gym_membership < database/schema.sql 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database tables created successfully"
else
    echo "❌ Failed to create database tables"
    exit 1
fi

# Create .env file if it doesn't exist
echo ""
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    
    # Update .env with the database password
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_USER_PASSWORD/" .env
    else
        # Linux
        sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_USER_PASSWORD/" .env
    fi
    
    echo "✅ .env file created"
    echo ""
    echo "⚠️  Please review and update the .env file if needed"
else
    echo "⚠️  .env file already exists. Please update DB_PASSWORD manually:"
    echo "   DB_PASSWORD=$DB_USER_PASSWORD"
fi

echo ""
echo "=================================="
echo "✅ Database setup complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Review the .env file in the backend directory"
echo "2. Install dependencies: npm install"
echo "3. Start the server: npm start"
echo ""
