#!/bin/bash

# Build script for Vercel deployment
echo "Building frontend..."
cd frontend
npm install
npm run build
echo "Frontend build completed!"

# Copy built files to root level for easier access
cp -r dist/* ../public/ 2>/dev/null || true

echo "Build process completed!"
