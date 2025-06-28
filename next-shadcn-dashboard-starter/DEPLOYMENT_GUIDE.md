# Cloud Deployment Guide for Escape Room Dashboard

This guide will help you deploy your escape room dashboard to the cloud so you can work on it from your laptop.

## 🚀 Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest)
1. **Sign up for Vercel**: Go to [vercel.com](https://vercel.com) and create an account
2. **Connect GitHub**: Link your GitHub account to Vercel
3. **Import Project**: Click "New Project" and select your repository
4. **Configure Environment Variables**: Add your Supabase credentials
5. **Deploy**: Click "Deploy" - your app will be live in minutes!

### Option 2: Netlify
1. **Sign up for Netlify**: Go to [netlify.com](https://netlify.com)
2. **Connect Repository**: Link your GitHub repository
3. **Build Settings**: Set build command to `npm run build`
4. **Deploy**: Your app will be deployed automatically

## 📊 Database Setup (Supabase)

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details and create

### 2. Set Up Database Tables
Run this SQL in your Supabase SQL Editor:

```sql
-- Create the main room slots table
CREATE TABLE Room_Slots (
  id INTEGER PRIMARY KEY,
  room_id VARCHAR(10),
  booking_date DATE,
  hour TIME,
  is_available BOOLEAN,
  available_slots INTEGER,
  room_name VARCHAR(50),
  business_name VARCHAR(20)
);

-- Create indexes for better performance
CREATE INDEX idx_room_slots_date ON Room_Slots(booking_date);
CREATE INDEX idx_room_slots_business ON Room_Slots(business_name);
CREATE INDEX idx_room_slots_room ON Room_Slots(room_id);
```

### 3. Import Your Data
1. Go to Supabase Dashboard → Table Editor
2. Select the `Room_Slots` table
3. Click "Import data" → "Upload CSV"
4. Upload your `Room_Slots_Expanded.csv` file
5. Map columns and import

## 🔧 Environment Variables

### For Vercel/Netlify:
Add these environment variables in your deployment platform:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Clerk Authentication (if using)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

### How to Get Supabase Keys:
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the Project URL and anon/public key
4. For service role key, use the service_role key (keep this secret!)

## 🐳 Docker Deployment (Alternative)

If you prefer Docker, create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## 📱 Mobile Access

Once deployed, you can access your dashboard from:
- **Desktop**: Your deployment URL
- **Mobile**: Same URL, responsive design
- **Tablet**: Optimized for all screen sizes

## 🔄 Continuous Deployment

### GitHub Actions (Optional)
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🛠️ Local Development

After deployment, you can still develop locally:

```bash
# Clone your repository
git clone <your-repo-url>
cd next-shadcn-dashboard-starter

# Install dependencies
npm install

# Set up environment variables
cp env.example.txt .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

## 📊 Monitoring & Analytics

### Vercel Analytics
- Built-in performance monitoring
- Real-time analytics
- Error tracking

### Supabase Monitoring
- Database performance
- Query analytics
- Real-time logs

## 🔒 Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **CORS**: Configure Supabase RLS policies
3. **Authentication**: Use Clerk or similar for user management
4. **HTTPS**: Automatically handled by Vercel/Netlify

## 🚨 Troubleshooting

### Common Issues:
1. **Build Failures**: Check Node.js version compatibility
2. **Database Connection**: Verify Supabase credentials
3. **Environment Variables**: Ensure all required vars are set
4. **Import Errors**: Check CSV format and column mapping

### Support:
- Vercel: [vercel.com/support](https://vercel.com/support)
- Supabase: [supabase.com/docs](https://supabase.com/docs)
- GitHub Issues: Create issue in your repository

## 🎯 Next Steps

After deployment:
1. Test all features on the live site
2. Set up monitoring and alerts
3. Configure custom domain (optional)
4. Set up backup strategies
5. Plan for scaling

Your escape room dashboard will now be accessible from anywhere with an internet connection! 🌐 