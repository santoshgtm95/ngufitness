# 🏋️ FITLAB Fitness - Quick Start Guide for Windows

## 🚀 One-Click Startup (Easiest Method)

### First Time Setup:

1. **Run the shortcut creator** (only needed once):
   - Double-click `Create_Desktop_Shortcut.bat`
   - A shortcut will appear on your Desktop

2. **Start the application**:
   - Double-click the **"FITLAB Fitness"** shortcut on your Desktop
   - The application will automatically:
     - Install dependencies (first time only)
     - Start the server
     - Open in your browser

### Daily Use:

Just double-click the **"NGU Fitness"** shortcut on your Desktop!

---

## 📋 Alternative Methods

### Method 1: Using the Startup Script

Double-click `START_NGU_FITNESS.bat` in the project folder

### Method 2: Manual Start

1. Open Command Prompt
2. Navigate to the project folder:
   ```cmd
   cd "C:\path\to\NGU 2"
   ```
3. Run the startup script:
   ```cmd
   START_NGU_FITNESS.bat
   ```

---

## 🛑 Stopping the Application

**Option 1:** Close the "NGU Fitness Server" window

**Option 2:** In the server window, press `Ctrl + C`

---

## ⚙️ Requirements

- **Windows 7 or higher**
- **Node.js** (Download from: https://nodejs.org/)
  - The startup script will check if Node.js is installed
  - If not installed, it will show you where to download it

---

## 🔧 Troubleshooting

### "Node.js is not installed" error
- Download and install Node.js from: https://nodejs.org/
- Restart your computer after installation
- Try running the shortcut again

### Port 3000 already in use
- Another application is using port 3000
- Close any other servers running on your computer
- Or close the previous NGU Fitness server window

### Application doesn't open in browser
- Manually open your browser
- Go to: http://localhost:3000

### Dependencies installation failed
- Make sure you have internet connection
- Try running as Administrator:
  - Right-click the shortcut
  - Select "Run as administrator"

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Make sure Node.js is installed
3. Try restarting your computer

---

## 🎯 Quick Reference

| Action | Method |
|--------|--------|
| Start Application | Double-click Desktop shortcut |
| Stop Application | Close the server window |
| Access Application | http://localhost:3000 |
| Create Shortcut | Run `Create_Desktop_Shortcut.bat` |

---

**Enjoy using NGU Fitness! 🏋️‍♂️**
