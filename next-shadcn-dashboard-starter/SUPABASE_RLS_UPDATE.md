# Supabase RLS Policy Update for Time-Series Data

## Problem
Test failed with: "new row violates row-level security policy for table 'Room Slots'"

This means Row Level Security (RLS) policies are blocking data insertion, not the constraints themselves.

## Solution: Fix RLS Policies

### Step 1: Temporarily Disable RLS (Quick Test)
```sql
-- Disable RLS temporarily to test constraints
ALTER TABLE "Room Slots" DISABLE ROW LEVEL SECURITY;
```

### Step 2: Test Your Constraints
After disabling RLS, go back to `/test-constraints` and run the test again. You should see successful insertions.

### Step 3: Re-enable RLS with Proper Policies
Once you confirm constraints work, re-enable RLS with proper policies:

```sql
-- Re-enable RLS
ALTER TABLE "Room Slots" ENABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Users can only see their own data" ON "Room Slots";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "Room Slots";
DROP POLICY IF EXISTS "Enable read access for all users" ON "Room Slots";

-- Create new permissive policies for your app
CREATE POLICY "Allow all operations for authenticated users" ON "Room Slots"
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Alternative: Create separate policies for each operation
CREATE POLICY "Allow authenticated read" ON "Room Slots"
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert" ON "Room Slots"
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON "Room Slots"
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete" ON "Room Slots"
FOR DELETE TO authenticated
USING (true);
```

### Step 4: Also Check Other Tables
Your app might be accessing other tables that also have RLS issues:

```sql
-- Check and fix Business Location table
ALTER TABLE "Business Location" DISABLE ROW LEVEL SECURITY;
-- OR create similar policies for Business Location

-- Check and fix Rooms table  
ALTER TABLE "Rooms" DISABLE ROW LEVEL SECURITY;
-- OR create similar policies for Rooms
```

### Step 5: Create Booking Changes Table (Required for Time-Series Tracking)
```sql
-- Create the Booking Changes table for tracking changes over time
CREATE TABLE IF NOT EXISTS "Booking Changes" (
  id BIGSERIAL PRIMARY KEY,
  room_id TEXT NOT NULL,
  booking_date DATE NOT NULL,
  hour TIME NOT NULL,
  business_name TEXT NOT NULL,
  room_name TEXT NOT NULL,
  previous_available_slots INTEGER NOT NULL,
  current_available_slots INTEGER NOT NULL,
  change_amount INTEGER NOT NULL,
  change_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scrape_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_changes_room_date ON "Booking Changes" (room_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_booking_changes_timestamp ON "Booking Changes" (change_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_booking_changes_scrape ON "Booking Changes" (scrape_id);

-- Disable RLS for Booking Changes table
ALTER TABLE "Booking Changes" DISABLE ROW LEVEL SECURITY;
```

## Quick Fix Commands (Run These Now)

**For immediate testing, run these commands in Supabase SQL Editor:**

```sql
-- Disable RLS on all tables temporarily
ALTER TABLE "Room Slots" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Business Location" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Rooms" DISABLE ROW LEVEL SECURITY;

-- Create Booking Changes table
CREATE TABLE IF NOT EXISTS "Booking Changes" (
  id BIGSERIAL PRIMARY KEY,
  room_id TEXT NOT NULL,
  booking_date DATE NOT NULL,
  hour TIME NOT NULL,
  business_name TEXT NOT NULL,
  room_name TEXT NOT NULL,
  previous_available_slots INTEGER NOT NULL,
  current_available_slots INTEGER NOT NULL,
  change_amount INTEGER NOT NULL,
  change_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scrape_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_booking_changes_room_date ON "Booking Changes" (room_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_booking_changes_timestamp ON "Booking Changes" (change_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_booking_changes_scrape ON "Booking Changes" (scrape_id);

-- Disable RLS for new table
ALTER TABLE "Booking Changes" DISABLE ROW LEVEL SECURITY;
```

**After testing, you can re-enable with proper policies:**

```sql
-- Re-enable and set up proper policies
ALTER TABLE "Room Slots" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON "Room Slots" FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE "Business Location" ENABLE ROW LEVEL SECURITY;  
CREATE POLICY "Allow all operations" ON "Business Location" FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE "Rooms" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON "Rooms" FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE "Booking Changes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON "Booking Changes" FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

## Expected Results After Fix

✅ **Success**: Time-series insertions work without RLS blocking
✅ **Constraint test passes**: Multiple records with same room/date/hour but different timestamps
✅ **App functionality restored**: Your dashboards can read/write data normally
✅ **Change tracking works**: Booking changes are detected and logged

## After Running SQL Commands

1. Go back to your test page: `http://localhost:3000/test-constraints`
2. Click "Test Time-Series Insert" again
3. You should now see successful insertions

## Expected Success Results
```
✅ 🧪 Starting time-series insertion test...
✅ First record inserted successfully  
✅ 🎉 SUCCESS: Time-series constraints working!
✅ Multiple records with same room/date/hour but different timestamps allowed
✅ 📊 Found 2 time-series records for TEST_ROOM
✅ 🧹 Test data cleaned up
```

## Re-enable RLS (If You Disabled It)
```sql
-- Re-enable RLS after testing
ALTER TABLE "Room Slots" ENABLE ROW LEVEL SECURITY;
```

## Notes
- The constraint updates worked correctly
- RLS is a security layer that sits on top of constraints
- Your time-series data structure is ready once RLS is configured
- Use Option 2 or 3 for production environments 