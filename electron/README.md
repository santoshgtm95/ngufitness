# FITLB Fitness – Desktop App Build Guide

This folder contains the Electron wrapper that packages the entire FITLAB Fitness
application (backend + frontend) into a standalone Windows `.exe` installer.

## Requirements (build machine only — NOT the end-user's PC)

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18 or 20 LTS | https://nodejs.org |
| npm | included with Node | — |

> The **end-user's PC needs nothing installed** — they just run the `.exe`.

---

## How to Build the Windows Installer

### Step 1 — Install Electron dependencies
Open a terminal in this `electron/` folder and run:
```
npm install
```

### Step 2 — Install backend dependencies
```
cd ..\backend
npm install --omit=dev
cd ..\electron
```

### Step 3 — Build the installer
```
npm run build
```

This creates:
```
electron/
  dist/
    FITLAB Fitness Setup 1.0.0.exe   ← share this with anyone!
```

### Step 4 — Share the installer
Copy `dist/FITLAB Fitness Setup 1.0.0.exe` to any Windows PC.
Double-click → Install → Done. No Node.js, no npm, nothing else needed.

---

## Running in Development (without building)

If you have Node.js installed and just want to run the Electron window locally:

```bash
# 1. Install Electron deps (first time only)
cd electron
npm install

# 2. Install backend deps (first time only)
cd ../backend
npm install

# 3. Launch
cd ../electron
npm start
```

---

## Where is the Database?

When running as a packaged app the database is stored in:
- **Windows**: `C:\Users\<you>\AppData\Roaming\fitlab-fitness\gym_membership.db`
- **macOS**: `~/Library/Application Support/fitlab-fitness/gym_membership.db`

This means your data is **safe** across app updates and uninstalls.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| App window never opens after splash | Check that port 3000 is not in use by another app |
| "Could not start the application server" | Make sure you ran `npm install` in `backend/` |
| Build fails on Windows | Run `npm install` again — native modules need rebuilding |
