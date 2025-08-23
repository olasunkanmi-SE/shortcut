#!/bin/bash

# Development setup script for the fullstack monorepo

echo "🚀 Setting up Fullstack TypeScript Monorepo"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Warning: Node.js version should be 18 or higher. Current version: $(node -v)"
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
if npm install --legacy-peer-deps; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Setup environment files
echo "🔧 Setting up environment files..."

# Backend .env
if [ ! -f "packages/backend/.env" ]; then
    cp packages/backend/.env.example packages/backend/.env
    echo "✅ Created backend .env file"
else
    echo "ℹ️  Backend .env file already exists"
fi

# Frontend .env
if [ ! -f "packages/frontend/.env" ]; then
    cp packages/frontend/.env.example packages/frontend/.env
    echo "✅ Created frontend .env file"
else
    echo "ℹ️  Frontend .env file already exists"
fi

echo ""
echo "🎉 Setup complete! You can now:"
echo ""
echo "  📁 Open VS Code workspace:"
echo "     code shortcut.code-workspace"
echo ""
echo "  🏃 Start development servers:"
echo "     npm run dev"
echo ""
echo "  🌐 Access the application:"
echo "     • Frontend: http://localhost:5173"
echo "     • Backend:  http://localhost:3001"
echo "     • API Health: http://localhost:3001/health"
echo ""
echo "  🧪 Run tests:"
echo "     npm run test"
echo ""
echo "Happy coding! 🎯"