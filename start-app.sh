#!/bin/bash

# ========================================
#  FITLAB Fitness - Mac Startup Script
# ========================================

echo "========================================"
echo " FITLAB Fitness Membership Management"
echo "========================================"
echo ""
echo "Starting application..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo ""
    echo "Please install Node.js from: https://nodejs.org/"
    echo ""
    exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/backend" || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "First time setup detected..."
    echo "Installing dependencies..."
    echo ""
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "ERROR: Failed to install dependencies!"
        echo ""
        exit 1
    fi
    echo ""
    echo "Dependencies installed successfully!"
    echo ""
fi

# Open the application in default browser after a short delay in background
(sleep 3 && open "http://localhost:3000") &

echo "========================================"
echo " Application Starting!"
echo "========================================"
echo ""
echo "Application URL: http://localhost:3000"
echo "Press Ctrl+C to stop the application."
echo ""

# Start the backend server
npm start
