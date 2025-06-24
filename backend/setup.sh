#!/bin/bash

# Digital Organisms Theory Platform - Backend Setup Script
# This script sets up the production backend with real metrics

echo "🚀 Setting up Digital Organisms Theory Platform Backend..."
echo "================================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

echo "✅ Python 3 found"

# Navigate to backend directory
cd backend

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Initialize database
echo "🗄️ Initializing database with production structure..."
python init_database.py

if [ $? -ne 0 ]; then
    echo "❌ Database initialization failed"
    exit 1
fi

echo "✅ Database initialized with real metrics structure"

# Start the server
echo ""
echo "🎉 Setup Complete!"
echo "================================================="
echo ""
echo "Your Digital Organisms Theory platform is ready with:"
echo "• Real member tracking"
echo "• Article and research metrics"
echo "• Discussion analytics"
echo "• Integration monitoring"
echo "• Historical data tracking"
echo ""
echo "Next steps:"
echo "1. Start the server: python src/main.py"
echo "2. Access metrics at: http://localhost:5000/api/metrics/dashboard"
echo "3. Set up the scheduler: python src/scheduler/metrics_scheduler.py"
echo ""
echo "API Endpoints available:"
echo "• GET /api/metrics/dashboard - Main dashboard metrics"
echo "• GET /api/metrics/platform - Detailed platform metrics"
echo "• GET /api/metrics/historical - Historical trends"
echo "• GET /api/metrics/research - Research impact metrics"
echo "• GET /api/integrations - Integration management"
echo ""
echo "Ready for production! 🚀"
