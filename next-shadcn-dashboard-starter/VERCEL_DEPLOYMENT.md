# Vercel Deployment Guide - Escape Room Dashboard

This guide will walk you through deploying your escape room dashboard to Vercel.

## 🚀 Pre-Deployment Checklist

### 1. Environment Variables Required

Create these environment variables in Vercel (Dashboard → Settings → Environment Variables):

#### **Supabase Configuration (Required)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### **Clerk Authentication (Required)**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your-clerk-publishable-key
CLERK_SECRET_KEY=sk_live_your-clerk-secret-key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

#### **Sentry Error Monitoring (Optional)**
```env
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
NEXT_PUBLIC_SENTRY_ORG=your-sentry-org
NEXT_PUBLIC_SENTRY_PROJECT=your-sentry-project
SENTRY_AUTH_TOKEN=your-sentry-auth-token
NEXT_PUBLIC_SENTRY_DISABLED=false
```

### 2. Database Setup (Supabase)

Ensure your Supabase database has these tables:

#### **Room Slots Table**
```sql
CREATE TABLE "Room Slots" (
  id TEXT PRIMARY KEY,
  room_id TEXT,
  booking_date DATE,
  hour TIME,
  is_available BOOLEAN,
  available_slots INTEGER,
  room_name TEXT,
  business_name TEXT,
  scrape_timestamp TIMESTAMP,
  scrape_id TEXT
);

-- Create indexes for performance
CREATE INDEX idx_room_slots_date ON "Room Slots"(booking_date);
CREATE INDEX idx_room_slots_business ON "Room Slots"(business_name);
CREATE INDEX idx_room_slots_timestamp ON "Room Slots"(scrape_timestamp);
```

#### **Business Location Table**
```sql
CREATE TABLE "Business Location" (
  business_name TEXT PRIMARY KEY,
  business_id TEXT
);
```

#### **Booking Changes Table (Optional)**
```sql
CREATE TABLE "Booking Changes" (
  id SERIAL PRIMARY KEY,
  room_id TEXT,
  booking_date DATE,
  hour TIME,
  previous_available_slots INTEGER,
  current_available_slots INTEGER,
  change_amount INTEGER,
  change_timestamp TIMESTAMP,
  scrape_id TEXT,
  business_name TEXT,
  room_name TEXT
);
```

## 📦 Deployment Steps

### Step 1: Prepare Your Repository

1. **Commit all changes**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Ensure your `package.json` has correct scripts**:
   ```json
   {
     "scripts": {
       "build": "next build",
       "start": "next start",
       "dev": "next dev --turbopack"
     }
   }
   ```

### Step 2: Deploy to Vercel

1. **Sign up/Login to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Project**:
   - Click "New Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Build Settings**:
   - Framework Preset: **Next.js**
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
   - Install Command: `npm install` (auto-detected)

4. **Add Environment Variables**:
   - In project settings, go to "Environment Variables"
   - Add each variable from the list above
   - Make sure to set them for **Production**, **Preview**, and **Development**

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (usually 2-3 minutes)

### Step 3: Verify Deployment

1. **Check build logs** for any errors
2. **Test the deployed application**:
   - Visit your deployment URL
   - Test authentication (sign in/up)
   - Check dashboard functionality
   - Verify data loading from Supabase

## 🔧 Configuration Details

### Vercel.json Configuration
Your project already includes a `vercel.json` with optimal settings:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Domain Configuration

1. **Custom Domain** (Optional):
   - Go to Project Settings → Domains
   - Add your custom domain
   - Configure DNS settings as instructed

2. **SSL Certificate**:
   - Automatically provided by Vercel
   - No additional configuration needed

## 🚨 Troubleshooting

### Common Issues:

#### **Build Failures**
- Check Node.js version (should be 18+)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

#### **Environment Variable Issues**
- Ensure all required variables are set
- Check variable names (case-sensitive)
- Verify Supabase and Clerk keys are correct

#### **Database Connection Issues**
- Test Supabase connection locally first
- Check Supabase RLS policies
- Verify service role key permissions

#### **Authentication Issues**
- Update Clerk webhook URLs to production domain
- Check Clerk dashboard settings
- Verify redirect URLs are correct

### Debug Steps:

1. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Functions
   - View runtime logs for errors

2. **Test API Endpoints**:
   - Visit `your-domain.vercel.app/api/health` (if exists)
   - Check API routes manually

3. **Verify Database Access**:
   - Test queries in Supabase dashboard
   - Check RLS policies allow access

## ⚡ Performance Optimization

### Recommended Settings:

1. **Edge Functions** (if using API routes):
   ```typescript
   export const runtime = 'edge';
   ```

2. **Image Optimization**:
   - Already configured in `next.config.ts`
   - Uses Vercel's built-in image optimization

3. **Caching**:
   - Static pages cached automatically
   - API routes use appropriate cache headers

### Monitoring:

1. **Vercel Analytics** (Free):
   - Automatically enabled
   - View in Vercel Dashboard

2. **Performance Monitoring**:
   - Use Vercel Speed Insights
   - Monitor Core Web Vitals

## 🔄 Continuous Deployment

### Automatic Deployments:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches
- **Development**: Local development only

### Manual Deployments:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from local
vercel --prod
```

## 📱 Mobile Optimization

Your dashboard is already mobile-responsive:
- Tailwind CSS responsive design
- Optimized for all screen sizes
- Touch-friendly interface

## 🔒 Security Checklist

- ✅ Environment variables secured
- ✅ Clerk authentication enabled
- ✅ Supabase RLS policies configured
- ✅ HTTPS enabled by default
- ✅ No secrets in client-side code

## 🎯 Post-Deployment Tasks

1. **Test All Features**:
   - [ ] User authentication
   - [ ] Dashboard data loading
   - [ ] Business filtering
   - [ ] Date range selection
   - [ ] Individual business pages
   - [ ] AI Assistant (if configured)

2. **Configure Monitoring**:
   - [ ] Set up error alerts
   - [ ] Monitor performance metrics
   - [ ] Configure uptime monitoring

3. **Update Documentation**:
   - [ ] Update README with live URL
   - [ ] Document any production-specific configurations
   - [ ] Share access with team members

## 🆘 Support

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Deployment Issues**: Check Vercel build logs
- **Application Issues**: Check browser console and network tab

---

**🎉 Your escape room dashboard is now live on Vercel!**

Access your dashboard at: `https://your-project-name.vercel.app` 