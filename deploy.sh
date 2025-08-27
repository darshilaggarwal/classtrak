#!/bin/bash

echo "🚀 ClassTrack Deployment Script"
echo "================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if remote origin is set
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ Git remote origin not found. Please add your GitHub repository:"
    echo "   git remote add origin https://github.com/yourusername/classtrack.git"
    exit 1
fi

echo "✅ Git repository is ready"

# Check if backend package.json exists
if [ ! -f "backend/package.json" ]; then
    echo "❌ Backend package.json not found"
    exit 1
fi

# Check if frontend package.json exists
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Frontend package.json not found"
    exit 1
fi

echo "✅ Project structure is valid"

echo ""
echo "📋 Deployment Checklist:"
echo "1. ✅ Git repository ready"
echo "2. ✅ Project structure valid"
echo "3. ⏳ Set up MongoDB Atlas"
echo "4. ⏳ Set up Gmail for OTP"
echo "5. ⏳ Deploy on Render"
echo ""

echo "🔧 Next Steps:"
echo ""
echo "1. Set up MongoDB Atlas:"
echo "   - Go to https://www.mongodb.com/atlas"
echo "   - Create a free cluster"
echo "   - Get your connection string"
echo ""
echo "2. Set up Gmail for OTP:"
echo "   - Enable 2FA on your Gmail"
echo "   - Generate an App Password"
echo ""
echo "3. Deploy on Render:"
echo "   - Go to https://dashboard.render.com"
echo "   - Create a new Web Service for backend"
echo "   - Create a new Static Site for frontend"
echo "   - Use the configuration from render.yaml"
echo ""
echo "4. Set Environment Variables:"
echo "   Backend:"
echo "   - NODE_ENV=production"
echo "   - MONGODB_URI=your_mongodb_connection_string"
echo "   - JWT_SECRET=your_jwt_secret_key"
echo "   - EMAIL_USER=your_email@gmail.com"
echo "   - EMAIL_PASS=your_email_app_password"
echo "   - FRONTEND_URL=https://your-frontend-url.onrender.com"
echo ""
echo "   Frontend:"
echo "   - VITE_API_URL=https://your-backend-url.onrender.com"
echo ""

echo "📚 For detailed instructions, see README.md"
echo "�� Happy deploying!"
