# 🚀 Quick Start - Gym Membership System

## Prerequisites
- MySQL installed and running
- Node.js installed

## Setup in 3 Steps

### 1️⃣ Set Up Database

```bash
cd backend
./setup-database.sh
```

The script will:
- Create the `gym_membership` database
- Create the `gym_admin` user
- Set up all tables
- Generate your `.env` file

### 2️⃣ Start Backend Server

```bash
cd backend
npm start
```

Expected output:
```
✅ Successfully connected to MySQL database
🚀 Server running on port 3000
```

### 3️⃣ Start Frontend

In a new terminal:

```bash
# Option 1: Python
python3 -m http.server 8080

# Option 2: npx
npx http-server -p 8080
```

## Access Application

Open browser: **http://localhost:8080**

---

## Manual Database Setup (Alternative)

If the automated script doesn't work:

```bash
# 1. Login to MySQL
mysql -u root -p

# 2. Run these commands:
CREATE DATABASE gym_membership;
CREATE USER 'gym_admin'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON gym_membership.* TO 'gym_admin'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 3. Import schema
cd backend
mysql -u gym_admin -p gym_membership < database/schema.sql

# 4. Create .env file
cp .env.example .env
# Edit .env and set DB_PASSWORD=your_password
```

---

## Troubleshooting

**MySQL not running?**
```bash
brew services start mysql
```

**Port 3000 already in use?**
```bash
# Change PORT in backend/.env
PORT=3001
```

**Can't connect to database?**
- Check credentials in `backend/.env`
- Verify MySQL is running: `brew services list`

---

## What's Next?

1. Add your first customer
2. Register a membership
3. See expiration alerts in action!

For detailed documentation, see [README.md](file:///Users/applipplimyanmar/Development/mine/NGU/README.md)
