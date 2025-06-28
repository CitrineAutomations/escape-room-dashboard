#!/bin/bash

echo "🚀 Escape Room Dashboard Cloud Deployment Script"
echo "================================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git remote add origin <your-github-repo-url>"
    echo "   git push -u origin main"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "next-shadcn-dashboard-starter/package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "✅ Git repository found"
echo "✅ Next.js project found"

# Navigate to the Next.js project
cd next-shadcn-dashboard-starter

echo ""
echo "📋 Deployment Checklist:"
echo "========================"
echo ""
echo "1. 📊 Set up Supabase Database:"
echo "   - Go to https://supabase.com"
echo "   - Create new project"
echo "   - Run the SQL from DEPLOYMENT_GUIDE.md"
echo "   - Import Room_Slots_Expanded.csv"
echo "   - Copy your API keys"
echo ""
echo "2. 🚀 Deploy to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Sign up with GitHub"
echo "   - Import your repository"
echo "   - Add environment variables"
echo "   - Deploy!"
echo ""
echo "3. 🔧 Environment Variables needed:"
echo "   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
echo "   SUPABASE_SERVICE_ROLE_KEY=your_service_key"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local template..."
    cp env.example.txt .env.local
    echo "✅ .env.local created from template"
    echo "   Please edit .env.local with your Supabase credentials"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "🔗 Useful Files Created:"
echo "========================"
echo "✅ vercel.json - Vercel configuration"
echo "✅ Dockerfile - Docker deployment"
echo "✅ docker-compose.yml - Docker Compose setup"
echo "✅ .github/workflows/deploy.yml - GitHub Actions"
echo "✅ DEPLOYMENT_GUIDE.md - Detailed deployment guide"
echo "✅ QUICK_DEPLOY.md - Quick deployment checklist"
echo ""

echo "📚 Next Steps:"
echo "=============="
echo "1. Follow QUICK_DEPLOY.md for step-by-step instructions"
echo "2. Set up Supabase database and import your data"
echo "3. Deploy to Vercel using the web interface"
echo "4. Test your live application"
echo ""

echo "🌐 Your dashboard will be accessible from anywhere once deployed!"
echo "📱 Perfect for working on your laptop and accessing from any device"
echo ""
echo "Need help? Check DEPLOYMENT_GUIDE.md for detailed instructions" 