#!/bin/bash

# Exit on any error
set -e

echo "========================================"
echo "Starting Paranaque Build Script"
echo "========================================"

echo ""
echo "Step 1: Install root dependencies"
npm install --legacy-peer-deps

echo ""
echo "Step 2: Build React app"
npm run build

echo ""
echo "Step 3: Verify build output"
if [ -f build/index.html ]; then
  echo "✅ SUCCESS: build/index.html exists"
  echo "Build folder size: $(du -sh build | cut -f1)"
  echo "Files in build folder:"
  ls -la build/ | head -20
else
  echo "❌ ERROR: build/index.html NOT FOUND"
  echo "Contents of build folder:"
  ls -la build/ 2>/dev/null || echo "Build folder does not exist!"
  exit 1
fi

echo ""
echo "Step 4: Install backend dependencies"
cd backend
npm install --legacy-peer-deps
cd ..

echo ""
echo "========================================"
echo "✅ Build completed successfully!"
echo "========================================"
