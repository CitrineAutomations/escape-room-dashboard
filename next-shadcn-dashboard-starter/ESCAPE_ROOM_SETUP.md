# Escape Room Dashboard Setup

This dashboard visualizes escape room booking data from your Supabase database, providing insights into room utilization, booking patterns, and business performance.

## Features

### Dashboard Overview
- **Total Bookings**: Number of confirmed reservations
- **Business Locations**: Count of active escape room businesses
- **Room Utilization**: Average utilization rate across all rooms
- **Booking Trends**: Visual charts showing booking patterns over time

### Key Metrics
- **Total Slots**: Available time slots across all rooms
- **Total Bookings**: Confirmed reservations
- **Utilization Rate**: Overall capacity usage percentage
- **Average Room Utilization**: Per-room performance metric

### Analytics
- Booking trends over time
- Peak hours analysis
- Room performance comparison
- Daily utilization patterns

## Prerequisites
- Node.js 18+ installed
- Supabase project with your escape room data
- CSV data file: `Room_Slots_3months_fixed.csv`

## Setup Steps

### 1. Environment Configuration
Create a `.env.local` file in the project root with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: Supabase Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. Supabase Table Setup
Create the following table in your Supabase database:

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

### 3. Import Your Data
1. Go to your Supabase dashboard
2. Navigate to Table Editor
3. Select the `Room_Slots` table
4. Use the CSV import feature with `Room_Slots_3months_fixed.csv`

### 4. Install Dependencies
```bash
npm install
```

### 5. Start the Development Server
```bash
npm run dev
```

### 6. Access the Dashboard
Navigate to: `http://localhost:3000/dashboard/escape-rooms`

## Data Structure

The dashboard expects data with the following columns:
- `id`: Unique identifier (Primary Key)
- `