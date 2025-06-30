# Real-Time Booking Change Tracking Setup

## Problem
Currently, Room Slots table only stores latest snapshot. When scraping every 15 minutes, we lose historical changes.

## Solution: Time-Series Data Structure

### Option 1: Enhanced Room Slots Table (Recommended)
Keep existing table but modify the constraint to allow multiple entries per slot:

```sql
-- Remove unique constraint that prevents time-series data
ALTER TABLE "Room Slots" DROP CONSTRAINT IF EXISTS room_slots_unique;

-- Add new columns for tracking
ALTER TABLE "Room Slots" 
ADD COLUMN IF NOT EXISTS scrape_id TEXT,
ADD COLUMN IF NOT EXISTS scrape_sequence INTEGER DEFAULT 1;

-- Create new composite unique constraint
ALTER TABLE "Room Slots" 
ADD CONSTRAINT room_slots_time_series_unique 
UNIQUE (room_id, booking_date, hour, scrape_timestamp);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_room_slots_scrape_time 
ON "Room Slots" (room_id, booking_date, hour, scrape_timestamp DESC);
```

### Option 2: Separate Booking Changes Table
Create a dedicated table for tracking changes:

```sql
CREATE TABLE IF NOT EXISTS "Booking Changes" (
  id BIGSERIAL PRIMARY KEY,
  room_id TEXT NOT NULL,
  booking_date DATE NOT NULL,
  hour TIME NOT NULL,
  business_name TEXT NOT NULL,
  room_name TEXT NOT NULL,
  previous_available_slots INTEGER,
  current_available_slots INTEGER NOT NULL,
  change_amount INTEGER NOT NULL,
  change_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scrape_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_booking_changes_room_date ON "Booking Changes" (room_id, booking_date);
CREATE INDEX idx_booking_changes_timestamp ON "Booking Changes" (change_timestamp DESC);
CREATE INDEX idx_booking_changes_scrape ON "Booking Changes" (scrape_id);
```

## Data Insertion Strategy

### Current Scraping Process:
```
1. Scrape website at 9:00 AM → Insert latest data
2. Scrape website at 9:15 AM → Update/Replace data (loses 9:00 AM state)
```

### New Time-Series Process:
```
1. Scrape website at 9:00 AM → Insert with scrape_timestamp='2025-01-01T09:00:00'
2. Scrape website at 9:15 AM → Insert with scrape_timestamp='2025-01-01T09:15:00'
3. Compare changes → Insert change record if different
```

## Implementation Code

### 1. Modified Data Insertion
```typescript
// Generate unique scrape ID for each run
const scrapeId = `scrape_${new Date().toISOString()}_${Math.random().toString(36).substr(2, 9)}`
const scrapeTimestamp = new Date().toISOString()

// Insert room slot data with time-series support
const roomSlotData = {
  room_id: 'RT!1',
  booking_date: '2025-01-01',
  hour: '15:30:00',
  available_slots: 5,
  total_capacity: 8,
  scrape_timestamp: scrapeTimestamp,
  scrape_id: scrapeId,
  // ... other fields
}
```

### 2. Change Detection Logic
```typescript
export class BookingChangeTracker {
  static async detectAndLogChanges(newData: RoomSlot[], scrapeId: string) {
    const changes: BookingChange[] = []
    
    for (const slot of newData) {
      // Get previous state for this slot
      const { data: previousSlot } = await supabase
        .from('Room Slots')
        .select('available_slots, scrape_timestamp')
        .eq('room_id', slot.room_id)
        .eq('booking_date', slot.booking_date)
        .eq('hour', slot.hour)
        .order('scrape_timestamp', { ascending: false })
        .limit(2) // Get current and previous
      
      if (previousSlot && previousSlot.length >= 2) {
        const current = previousSlot[0].available_slots
        const previous = previousSlot[1].available_slots
        
        if (current !== previous) {
          changes.push({
            room_id: slot.room_id,
            booking_date: slot.booking_date,
            hour: slot.hour,
            previous_available_slots: previous,
            current_available_slots: current,
            change_amount: current - previous,
            change_timestamp: slot.scrape_timestamp,
            scrape_id: scrapeId,
            business_name: slot.business_name,
            room_name: slot.room_name
          })
        }
      }
    }
    
    // Insert detected changes
    if (changes.length > 0) {
      await supabase.from('Booking Changes').insert(changes)
    }
    
    return changes
  }
}
```

### 3. Real-Time Query Examples
```typescript
// Get booking changes for a specific time range
const getBookingChanges = async (roomId: string, startTime: string, endTime: string) => {
  const { data } = await supabase
    .from('Booking Changes')
    .select('*')
    .eq('room_id', roomId)
    .gte('change_timestamp', startTime)
    .lte('change_timestamp', endTime)
    .order('change_timestamp', { ascending: true })
  
  return data
}

// Get time-series data for a slot
const getSlotTimeSeries = async (roomId: string, date: string, hour: string) => {
  const { data } = await supabase
    .from('Room Slots')
    .select('available_slots, scrape_timestamp')
    .eq('room_id', roomId)
    .eq('booking_date', date)
    .eq('hour', hour)
    .order('scrape_timestamp', { ascending: true })
  
  return data
}
```

## Benefits
1. **Track Real-Time Changes**: See exactly when bookings occur
2. **Historical Analysis**: Analyze booking patterns over time
3. **Change Alerts**: Detect sudden availability drops/increases
4. **Revenue Tracking**: Monitor booking velocity and demand
5. **Peak Time Analysis**: Identify exact times of high booking activity

## Next Steps
1. Choose Option 1 or Option 2 based on your needs
2. Update Supabase table structure
3. Modify scraping code to use time-series insertion
4. Implement change detection logic
5. Update dashboard to show real-time changes 