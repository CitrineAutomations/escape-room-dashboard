# 🚀 Quick Cloud Deployment Checklist

## Step 1: Prepare Your Repository
- [ ] Push your code to GitHub
- [ ] Ensure all files are committed
- [ ] Check that `package.json` has correct scripts

## Step 2: Set Up Supabase Database
1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose organization and enter project name
   - Wait for setup to complete

2. **Create Database Table**
   ```sql
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
   ```

3. **Import Your Data**
   - Go to Table Editor → Room_Slots
   - Click "Import data" → "Upload CSV"
   - Upload `Room_Slots_Expanded.csv`
   - Map columns and import

4. **Get API Keys**
   - Go to Settings → API
   - Copy Project URL and anon key
   - Save service role key (keep secret!)

## Step 3: Deploy to Vercel (Recommended)
1. **Sign up for Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub account

2. **Import Project**
   - Click "New Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   Add these in Vercel project settings:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app is live! 🎉

## Step 4: Test Your Deployment
- [ ] Visit your Vercel URL
- [ ] Test dashboard functionality
- [ ] Verify data is loading from Supabase
- [ ] Test on mobile device

## Step 5: Set Up Continuous Deployment
- [ ] Enable GitHub integration in Vercel
- [ ] Push changes to trigger auto-deploy
- [ ] Set up custom domain (optional)

## 🔗 Your Live URLs
- **Frontend**: `https://your-project.vercel.app`
- **Database**: `https://your-project.supabase.co`
- **Dashboard**: `https://your-project.vercel.app/dashboard/escape-rooms`

## 📱 Access from Anywhere
Once deployed, you can:
- Access from your laptop
- Access from your phone
- Access from any device with internet
- Share with team members

## 🛠️ Local Development After Deployment
```bash
# Clone your repo on laptop
git clone <your-repo-url>
cd next-shadcn-dashboard-starter

# Install dependencies
npm install

# Set up environment
cp env.example.txt .env.local
# Add your Supabase credentials to .env.local

# Start development
npm run dev
```

## 🚨 Troubleshooting
- **Build fails**: Check Node.js version (18+)
- **Database connection error**: Verify Supabase credentials
- **Data not loading**: Check table structure and data import
- **Environment variables**: Ensure all are set in Vercel

## 📞 Support
- Vercel: [vercel.com/support](https://vercel.com/support)
- Supabase: [supabase.com/docs](https://supabase.com/docs)
- GitHub Issues: Create in your repository

Your escape room dashboard is now cloud-ready! 🌐✨ 