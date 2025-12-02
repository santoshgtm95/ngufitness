# 📚 Documentation Guide

This project includes several documentation files for different purposes:

## 📖 Setup & Installation Guides

### For Windows Users
- **[WINDOWS_SETUP.md](WINDOWS_SETUP.md)** - Complete guide for Windows 10
  - Installation steps
  - Multiple ways to run the application
  - Includes `start-app.bat` for one-click startup
  - Windows-specific troubleshooting

### For macOS/Linux Users
- **[README.md](README.md)** - Original setup guide for macOS/Linux
  - MySQL setup instructions (historical)
  - Now using SQLite instead
- **[QUICKSTART.md](QUICKSTART.md)** - Quick setup guide
- **[HOW_TO_USE.md](HOW_TO_USE.md)** - macOS-specific usage guide

## 🚀 Quick Start

### Windows 10
1. Copy the `NGU` folder to your Windows machine
2. Open the folder and double-click **`start-app.bat`**
3. Browser opens automatically to http://localhost:8080

### macOS/Linux
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
python3 -m http.server 8080
```

## 📝 Other Documentation

- **[MYSQL_SETUP.md](MYSQL_SETUP.md)** - Old MySQL setup (not needed anymore)
- **[walkthrough.md](.gemini/antigravity/brain/.../walkthrough.md)** - Development walkthrough

## 💡 Which File Should I Read?

**I'm using Windows 10:**
→ Read [WINDOWS_SETUP.md](WINDOWS_SETUP.md)

**I'm using macOS:**
→ Read [HOW_TO_USE.md](HOW_TO_USE.md)

**I'm using Linux:**
→ Read [README.md](README.md) or [HOW_TO_USE.md](HOW_TO_USE.md)

**I just want to start the app quickly:**
→ Windows: Double-click `start-app.bat`
→ macOS/Linux: See [QUICKSTART.md](QUICKSTART.md)

## 🎯 Features

- Customer management (add, edit, delete)
- Membership tracking with auto-expiration
- 5-day expiration alerts
- Search functionality
- Modern dark theme UI
- SQLite database (no setup required!)

## 🔧 Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: SQLite (better-sqlite3)
- **No authentication required** (single-user local system)

## 📦 What's Included

```
NGU/
├── start-app.bat          # Windows startup script
├── WINDOWS_SETUP.md       # Windows guide
├── HOW_TO_USE.md          # macOS/Linux guide
├── README.md              # Original documentation
├── QUICKSTART.md          # Quick start guide
├── index.html             # Frontend
├── styles.css             # Styles
├── app.js                 # Frontend logic
└── backend/
    ├── server.js          # API server
    ├── package.json       # Dependencies
    ├── gym_membership.db  # Database (auto-created)
    └── ...
```

## 🎉 Enjoy!

Your gym membership management system is ready to use!
