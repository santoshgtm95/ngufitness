# 🏋️ Gym Membership System - Windows 10 Setup Guide

## 📋 Prerequisites

Before you begin, make sure you have:

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/
   - Choose the LTS version
   - Verify installation: Open Command Prompt and run `node --version`

2. **Git** (optional, for cloning the project)
   - Download from: https://git-scm.com/download/win

3. **A text editor** (VS Code recommended)
   - Download from: https://code.visualstudio.com/

## 📦 Installation Steps

### Step 1: Copy the Project Files

Copy the entire `NGU` folder to your Windows machine. For example:
```
C:\Users\YourUsername\Documents\NGU
```

### Step 2: Install Backend Dependencies

1. Open **Command Prompt** (press `Win + R`, type `cmd`, press Enter)

2. Navigate to the backend folder:
```cmd
cd C:\Users\YourUsername\Documents\NGU\backend
```

3. Install dependencies:
```cmd
npm install
```

This will install all required packages including SQLite.

### Step 3: Configure Environment (Already Done!)

The `.env` file is already configured. No changes needed!

Location: `C:\Users\YourUsername\Documents\NGU\backend\.env`

## 🚀 Running the Application

### Method 1: Using Two Command Prompts (Recommended)

#### Command Prompt 1 - Backend Server

1. Open Command Prompt
2. Navigate to backend folder:
```cmd
cd C:\Users\YourUsername\Documents\NGU\backend
```

3. Start the backend:
```cmd
npm start
```

You should see:
```
✅ Successfully connected to SQLite database
📁 Database location: C:\Users\YourUsername\Documents\NGU\backend\gym_membership.db
🚀 Server running on port 3000
```

**Keep this window open!**

#### Command Prompt 2 - Frontend Server

1. Open a **new** Command Prompt window
2. Navigate to the project root:
```cmd
cd C:\Users\YourUsername\Documents\NGU
```

3. Start the frontend server using one of these options:

**Option A: Using Python** (if installed)
```cmd
python -m http.server 8080
```

**Option B: Using Node.js http-server**
```cmd
npx http-server -p 8080
```

**Option C: Using VS Code Live Server**
- Open the `NGU` folder in VS Code
- Install "Live Server" extension
- Right-click on `index.html`
- Select "Open with Live Server"

**Keep this window open!**

### Method 2: Using PowerShell

You can also use PowerShell instead of Command Prompt:

1. Open **PowerShell** (press `Win + X`, select "Windows PowerShell")
2. Follow the same commands as above

### Method 3: Using a Batch File (Easiest!)

Create a file called `start-app.bat` in the `NGU` folder with this content:

```batch
@echo off
echo Starting Gym Membership Application...
echo.

REM Start backend
start "Backend Server" cmd /k "cd backend && npm start"

REM Wait 3 seconds for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend
start "Frontend Server" cmd /k "python -m http.server 8080 || npx http-server -p 8080"

echo.
echo ========================================
echo Application is starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:8080
echo ========================================
echo.
echo Press any key to open the application in your browser...
pause > nul

REM Open browser
start http://localhost:8080

exit
```

**To use:**
1. Double-click `start-app.bat`
2. Two command windows will open (backend and frontend)
3. Browser will open automatically to http://localhost:8080

## 🌐 Accessing the Application

Once both servers are running, open your web browser and go to:
```
http://localhost:8080
```

## 🎯 How to Use the Application

### Adding a Customer

1. Click the **"Add Customer"** button
2. Fill in the form:
   - **Name**: Customer's full name
   - **Phone**: Phone number
   - **Address**: Full address
3. Click **"Save Customer"**
4. The membership registration modal will open automatically!

### Registering a Membership

1. After saving a customer, the membership modal opens
2. Select the customer (pre-selected if you just added them)
3. Choose **Start Date** (defaults to today)
4. Select **Package Type**:
   - 1 Day
   - 15 Days
   - 1 Month
   - 6 Months
   - 1 Year
5. Expiration date is calculated automatically
6. Click **"Save Membership"**

### Managing Customers

- **Edit**: Click the ✏️ icon to edit customer details
- **Manage Membership**: Click the 🎫 icon to update membership
- **Delete**: Click the 🗑️ icon to delete customer and membership
- **Search**: Use the search box to filter by name, phone, or address

### Expiration Alerts

The left sidebar shows customers whose memberships expire within 5 days:
- Displays customer name, phone, and days remaining
- Updates automatically when memberships are added/updated
- Shows "No memberships expiring" when all are safe

## 🛑 Stopping the Application

To stop the servers:

1. Go to each Command Prompt window
2. Press `Ctrl + C`
3. Type `Y` and press Enter to confirm

Or simply close the Command Prompt windows.

## 💾 Database Location

Your data is stored in a SQLite database file:
```
C:\Users\YourUsername\Documents\NGU\backend\gym_membership.db
```

**To backup your data:**
- Simply copy this file to a safe location
- To restore: Copy the backup file back to this location

## 🔄 Restarting the Application

If you closed the servers, restart by:

1. Open Command Prompt
2. Start backend:
```cmd
cd C:\Users\YourUsername\Documents\NGU\backend
npm start
```

3. Open another Command Prompt
4. Start frontend:
```cmd
cd C:\Users\YourUsername\Documents\NGU
python -m http.server 8080
```

Or just double-click `start-app.bat` if you created it!

## 🐛 Troubleshooting

### "node is not recognized"
- Node.js is not installed or not in PATH
- Download and install from https://nodejs.org/
- Restart Command Prompt after installation

### "Port 3000 is already in use"
- Another application is using port 3000
- Find and close the application, or change the port in `backend\.env`:
  ```
  PORT=3001
  ```

### "Port 8080 is already in use"
- Another application is using port 8080
- Use a different port:
  ```cmd
  python -m http.server 8081
  ```
- Then access: http://localhost:8081

### "python is not recognized"
- Python is not installed
- Use Node.js http-server instead:
  ```cmd
  npx http-server -p 8080
  ```

### Backend starts but frontend can't connect
- Make sure backend is running on port 3000
- Check `backend\.env` has `PORT=3000`
- Open browser console (F12) to see error messages

### Database errors
- SQLite database is created automatically
- If issues persist, delete `gym_membership.db` and restart backend
- The database will be recreated with empty tables

## 📁 Project Structure

```
NGU/
├── index.html              # Frontend HTML
├── styles.css              # Frontend styles
├── app.js                  # Frontend JavaScript
├── start-app.bat          # Windows startup script (create this)
├── HOW_TO_USE.md          # This guide
└── backend/
    ├── server.js          # Express server
    ├── package.json       # Dependencies
    ├── .env               # Configuration
    ├── gym_membership.db  # SQLite database (created automatically)
    ├── config/
    │   └── database.js    # Database connection
    ├── routes/
    │   ├── customers.js   # Customer API
    │   └── memberships.js # Membership API
    └── middleware/
        └── errorHandler.js # Error handling
```

## 🎨 Features

✅ **Customer Management**
- Add, edit, delete customers
- Store name, phone, and address

✅ **Membership Tracking**
- Multiple package types
- Auto-calculated expiration dates
- Easy updates

✅ **Expiration Alerts**
- 5-day advance warning
- Sidebar notifications
- Real-time updates

✅ **Search & Filter**
- Search by name, phone, or address
- Instant results

✅ **Modern UI**
- Dark theme with glassmorphism
- Smooth animations
- Responsive design

✅ **Data Persistence**
- SQLite database
- No setup required
- Easy backups

## 🔐 Security Notes

- This is designed for local use on Windows
- No authentication required (single-user system)
- Database file is stored locally
- For production use, consider adding user authentication

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify Node.js is installed: `node --version`
3. Make sure both servers are running
4. Check browser console (F12) for errors
5. Ensure ports 3000 and 8080 are available

## 🎉 You're All Set!

Your gym membership management system is ready to use on Windows 10!

**Quick Start:**
1. Open two Command Prompts
2. Start backend: `cd backend && npm start`
3. Start frontend: `python -m http.server 8080`
4. Open browser: http://localhost:8080

Enjoy managing your gym memberships! 💪
