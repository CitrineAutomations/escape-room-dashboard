# Supabase Setup Guide

## Quick Fix for Current Error

The application is currently showing a "supabaseUrl is required" error because the Supabase environment variables are not configured. However, the application has been updated to handle this gracefully and will use mock data instead.

## To Set Up Supabase (Optional)

If you want to connect to a real Supabase database:

1. **Create a `.env.local` file** in the project root with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: Supabase Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

2. **Get your Supabase credentials:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project or use an existing one
   - Go to Settings > API
   - Copy the "Project URL" and "anon public" key

3. **Replace the placeholder values** in your `.env.local` file with your actual Supabase credentials

## Current Status

✅ **Application is working with mock data**
- The app will continue to function using mock escape room data
- All dashboard features will work as expected
- No database connection required for development

## Database Schema (if you want to use real data)

If you set up Supabase, create these tables:

```sql
-- Room Slots table
CREATE TABLE "Room Slots" (
  id INTEGER PRIMARY KEY,
  room_id VARCHAR(10),
  booking_date DATE,
  hour TIME,
  is_available BOOLEAN,
  available_slots INTEGER,
  room_name VARCHAR(50),
  business_name VARCHAR(20)
);

-- Business Location table
CREATE TABLE "Business Location" (
  business_id VARCHAR(50) PRIMARY KEY,
  business_name VARCHAR(50)
);

-- Rooms table
CREATE TABLE "Rooms" (
  room_id VARCHAR(10) PRIMARY KEY,
  room_name VARCHAR(50),
  business_name VARCHAR(20)
);
```

## Next Steps

1. The application should now work without errors
2. You can access the dashboard at `http://localhost:3001/dashboard/escape-rooms`
3. All data will be displayed using mock data until you configure Supabase
4. When you're ready to use real data, follow the setup steps above 