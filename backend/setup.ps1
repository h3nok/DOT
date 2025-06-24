# Digital Organisms Theory Platform - Backend Setup Script (PowerShell)
# This script sets up the production backend with real metrics

Write-Host "🚀 Setting up Digital Organisms Theory Platform Backend..." -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan

# Check if Python is installed
try {
    $pythonVersion = python --version 2>$null
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python 3 is required but not installed." -ForegroundColor Red
    exit 1
}

# Navigate to backend directory
Set-Location backend

# Install dependencies
Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Initialize database
Write-Host "🗄️ Initializing database with production structure..." -ForegroundColor Yellow
python init_database.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database initialization failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database initialized with real metrics structure" -ForegroundColor Green

# Display completion message
Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your Digital Organisms Theory platform is ready with:" -ForegroundColor White
Write-Host "• Real member tracking" -ForegroundColor White
Write-Host "• Article and research metrics" -ForegroundColor White
Write-Host "• Discussion analytics" -ForegroundColor White
Write-Host "• Integration monitoring" -ForegroundColor White
Write-Host "• Historical data tracking" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start the server: python src/main.py" -ForegroundColor White
Write-Host "2. Access metrics at: http://localhost:5000/api/metrics/dashboard" -ForegroundColor White
Write-Host "3. Set up the scheduler: python src/scheduler/metrics_scheduler.py" -ForegroundColor White
Write-Host ""
Write-Host "API Endpoints available:" -ForegroundColor Yellow
Write-Host "• GET /api/metrics/dashboard - Main dashboard metrics" -ForegroundColor White
Write-Host "• GET /api/metrics/platform - Detailed platform metrics" -ForegroundColor White
Write-Host "• GET /api/metrics/historical - Historical trends" -ForegroundColor White
Write-Host "• GET /api/metrics/research - Research impact metrics" -ForegroundColor White
Write-Host "• GET /api/integrations - Integration management" -ForegroundColor White
Write-Host ""
Write-Host "Ready for production! 🚀" -ForegroundColor Green
