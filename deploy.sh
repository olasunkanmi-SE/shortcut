#!/bin/bash

# Simple deployment script
echo "🚀 Deploying Fullstack Application"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Build both applications
echo "📦 Building applications..."

# Build backend
echo "Building backend..."
cd packages/backend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed"
    exit 1
fi
cd ../..

# Build frontend
echo "Building frontend..."
cd packages/frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi
cd ../..

echo "✅ Build completed successfully!"

# Deployment options
echo ""
echo "Choose deployment method:"
echo "1) Docker (docker-compose up)"
echo "2) Manual deployment guide"
echo "3) Exit"

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "🐳 Starting Docker deployment..."
        docker-compose up --build -d
        echo "✅ Docker deployment started!"
        echo "Frontend: http://localhost:3000"
        echo "Backend: http://localhost:3001"
        ;;
    2)
        echo ""
        echo "📖 Manual Deployment Guide:"
        echo ""
        echo "Frontend (packages/frontend/dist):"
        echo "  • Upload to Vercel, Netlify, or any static hosting"
        echo "  • Set VITE_API_BASE_URL environment variable"
        echo ""
        echo "Backend (packages/backend/dist):"
        echo "  • Deploy to Heroku, Railway, or any Node.js hosting"
        echo "  • Set NODE_ENV=production"
        echo "  • Set PORT and FRONTEND_URL environment variables"
        echo ""
        echo "See DEPLOYMENT.md for detailed instructions."
        ;;
    3)
        echo "Deployment cancelled."
        exit 0
        ;;
    *)
        echo "Invalid choice. Deployment cancelled."
        exit 1
        ;;
esac