# N8N Integration Guide for Real-Time Booking Change Tracking

## Overview

This integration allows N8N to automatically save scraped booking data and trigger change detection. The system now includes **duplicate protection** to prevent the "duplicate key" errors you've been experiencing.

## 🔧 DUPLICATE KEY ERROR SOLUTION

**Problem**: N8N was getting "duplicate key value violates unique constraint" errors when inserting data.

**Solution**: Use the new **duplicate-safe API endpoints** instead of direct Supabase inserts.

## 🚀 New N8N Workflow Setup (Recommended)

### Option A: Safe Data Insertion (Recommended)

Instead of using Supabase nodes directly, use our API endpoint:

```
1. [Schedule Trigger] → Every 15 minutes
2. [HTTP Request] → Scrape booking website  
3. [Function] → Process scraped data
4. [HTTP Request] → Save data via our API (duplicate-safe)
5. [HTTP Request] → Trigger change detection (optional)
```

#### Step 4: Save Data with Duplicate Protection

**HTTP Request Node Configuration:**
- **Method**: POST
- **URL**: `http://localhost:3000/api/n8n-webhook` (or your production URL)
- **Headers**: 
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Body**:
  ```json
  {
    "action": "insert_data",
    "slots": {{ $json.extractedData }},
    "business_name": "The Exit Games",
    "use_upsert": true
  }
  ```

#### Step 5: Trigger Change Detection (Optional)

**HTTP Request Node Configuration:**
- **Method**: POST  
- **URL**: `http://localhost:3000/api/n8n-webhook`
- **Body**:
  ```json
  {
    "business_name": "The Exit Games",
    "scrape_completed": true,
    "timestamp": "{{ new Date().toISOString() }}"
  }
  ```

### Option B: Direct Supabase + Webhook (Legacy)

If you prefer to keep using Supabase nodes directly:

```
1. [Schedule Trigger] → Every 15 minutes
2. [HTTP Request] → Scrape booking website
3. [Function] → Process scraped data  
4. [Supabase] → Save to "Room Slots" table
5. [HTTP Request] → Call webhook for change detection
```

**⚠️ Note**: This approach may still cause duplicate errors if N8N retries or runs multiple times.

## 📋 API Endpoint Reference

### POST /api/n8n-webhook

#### Data Insertion (Duplicate-Safe)
```json
{
  "action": "insert_data",
  "slots": [
    {
      "room_id": "FSCH1",
      "booking_date": "2025-01-15",
      "hour": "15:30:00",
      "is_available": true,
      "available_slots": 6,
      "room_name": "Front Street Casino Heist",
      "business_name": "The Exit Games",
      "total_capacity": 8,
      "booked_capacity": 2
    }
  ],
  "business_name": "The Exit Games",
  "use_upsert": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully processed 20 room slots",
  "data": {
    "inserted": 20,
    "scrape_id": "scrape_2025-01-15T15-30-00-000Z_abc123",
    "slots": [...]
  }
}
```

#### Change Detection Webhook
```json
{
  "business_name": "The Exit Games",
  "scrape_completed": true,
  "timestamp": "2025-01-15T15:30:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Processed 20 slots, detected 3 changes",
  "data": {
    "processed": 20,
    "changes": 3,
    "latestScrapeId": "scrape_2025-01-15T15-30-00-000Z_abc123"
  }
}
```

## 🛡️ Duplicate Protection Methods

### Method 1: UPSERT (Recommended)
Set `"use_upsert": true` in your request. This will:
- Insert new records
- Update existing records if ID already exists
- Never throw duplicate key errors

### Method 2: Safe Insert (Alternative)  
Set `"use_upsert": false` or omit it. This will:
- Check if each ID already exists before inserting
- Skip duplicates with a warning
- Only insert truly new records

## 🔍 Enhanced ID Generation

The new system generates more unique IDs:
```
Format: {room_id}_{date}_{time}_{timestamp_ms}_{random_num}_{random_suffix}
Example: fsch1_20250628_171500_1719851734000_123_4v105n
```

This includes:
- **timestamp_ms**: Unix timestamp in milliseconds
- **random_num**: 3-digit random number  
- **random_suffix**: 6-character random string

## 🧪 Testing the Integration

Visit `http://localhost:3000/test-n8n` to test:

1. **API Health Check** - Verify endpoint is working
2. **Data Insertion Test** - Test duplicate-safe insertion
3. **Change Detection Test** - Test webhook processing
4. **View Results** - See inserted data and detected changes

## 📊 Benefits of New Approach

### ✅ Advantages
- **No More Duplicate Errors** - Handles retries and duplicates gracefully
- **Better Error Handling** - Clear error messages and logging
- **Flexible Options** - Choose between UPSERT or safe insert
- **Enhanced Uniqueness** - Better ID generation prevents collisions
- **Automatic Processing** - Change detection still works automatically

### 🔄 Migration from Old Setup

If you're currently getting duplicate errors:

1. **Replace Supabase Insert Node** with HTTP Request to `/api/n8n-webhook`
2. **Set `"action": "insert_data"`** in the request body
3. **Add `"use_upsert": true`** for maximum safety
4. **Keep existing change detection webhook** (or remove if using combined approach)

## 🏁 Complete Example N8N Workflow

```javascript
// N8N Function Node - Process Scraped Data
const scrapedData = [
  {
    room_id: "FSCH1",
    booking_date: "2025-06-28", 
    hour: "17:15:00",
    is_available: true,
    available_slots: 6,
    room_name: "Front Street Casino Heist",
    business_name: "The Exit Games",
    total_capacity: 8,
    booked_capacity: 2
  }
  // ... more slots
];

// Return data for next node
return {
  extractedData: scrapedData,
  business_name: "The Exit Games"
};
```

```json
// N8N HTTP Request Node - Save Data
{
  "method": "POST",
  "url": "http://localhost:3000/api/n8n-webhook",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "action": "insert_data",
    "slots": "{{ $json.extractedData }}",
    "business_name": "{{ $json.business_name }}",
    "use_upsert": true
  }
}
```

This setup will **completely eliminate** the duplicate key errors you were experiencing while maintaining all the benefits of real-time change tracking.

## 🆘 Troubleshooting Duplicate Errors

If you're still getting duplicates:

1. **Check N8N Triggers** - Make sure your workflow isn't running multiple times
2. **Verify Timestamps** - Ensure unique timestamps in your data
3. **Use UPSERT Mode** - Set `"use_upsert": true` for maximum safety
4. **Check Logs** - Look at server logs for duplicate warnings
5. **Test Endpoint** - Visit `/test-n8n` to verify API is working

The new system is designed to handle any duplicate scenarios gracefully while preserving your time-series data for analysis.

## Architecture

```
N8N Scraper → Supabase "Room Slots" → Webhook → Change Detection → "Booking Changes" Table
```

## Setup Instructions

### 1. N8N Workflow Configuration

Add these steps to your N8N workflow **AFTER** saving data to Supabase:

#### Option A: Webhook Call (Recommended)
Add an HTTP Request node with:
- **Method**: POST
- **URL**: `http://localhost:3000/api/n8n-webhook` (or your production URL)
- **Headers**: 
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Body**:
  ```json
  {
    "business_name": "{{ $json.business_name }}",
    "scrape_completed": true,
    "timestamp": "{{ new Date().toISOString() }}"
  }
  ```

#### Option B: Direct Database Call
If you prefer to call the function directly, add a Code node:
```javascript
// After saving data to Supabase
const response = await fetch('http://localhost:3000/api/n8n-webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    business_name: 'The Exit Games', // or whatever business you scraped
    scrape_completed: true,
    timestamp: new Date().toISOString()
  })
});

return await response.json();
```

### 2. Required Supabase Schema

Make sure your Supabase "Room Slots" table includes these columns:
- `id` (text, primary key)
- `room_id` (text)
- `booking_date` (date)
- `hour` (time)
- `is_available` (boolean)
- `available_slots` (integer)
- `room_name` (text)
- `business_name` (text)
- `total_capacity` (integer, optional)
- `booked_capacity` (integer, optional)
- `scrape_timestamp` (timestamp) - **REQUIRED for time-series**
- `scrape_id` (text, optional)

### 3. N8N Data Format

When saving to Supabase, ensure your data includes:
```json
{
  "id": "unique_id_per_entry",
  "room_id": "RT1",
  "booking_date": "2025-01-15",
  "hour": "15:30:00",
  "is_available": true,
  "available_slots": 6,
  "room_name": "The Heist",
  "business_name": "The Exit Games",
  "total_capacity": 8,
  "booked_capacity": 2,
  "scrape_timestamp": "2025-01-15T15:30:00.000Z",
  "scrape_id": "scrape_20250115_153000"
}
```

## How It Works

### 1. Data Storage
- N8N scrapes booking data and saves to "Room Slots" table
- Each scrape gets a unique `scrape_timestamp`
- Multiple entries per slot are allowed (time-series data)

### 2. Change Detection
- After N8N completes scraping, it calls the webhook
- System compares latest scrape with previous scrape
- Changes are detected by comparing `available_slots` values
- Changes are logged to "Booking Changes" table

### 3. Dashboard Updates
- Business dashboards automatically show latest data
- Historical data is preserved for trending analysis
- Real-time metrics update with each scrape

## Testing

Visit `http://localhost:3000/test-n8n` to test the integration:

1. **Direct Integration Test** - Tests the processing function directly
2. **Webhook Test** - Tests the N8N webhook endpoint
3. **View Results** - See processed slots and detected changes

## API Endpoints

### POST /api/n8n-webhook
Webhook endpoint for N8N to call after scraping.

**Request Body:**
```json
{
  "business_name": "The Exit Games",
  "scrape_completed": true,
  "timestamp": "2025-01-15T15:30:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Processed 20 slots, detected 3 changes",
  "data": {
    "processed": 20,
    "changes": 3,
    "latestScrapeId": "scrape_2025-01-15T15-30-00-000Z_abc123"
  }
}
```

### GET /api/n8n-webhook
Health check endpoint to verify the webhook is active.

## Benefits of This Approach

### ✅ Advantages
1. **No CSV Files** - Direct database integration
2. **Automatic Processing** - No manual intervention needed
3. **Historical Data** - Complete time-series for analysis
4. **Real-Time Alerts** - Immediate change detection
5. **Scalable** - Handles multiple businesses automatically

### 🚫 No Longer Needed
1. ~~CSV file generation~~
2. ~~Manual data imports~~
3. ~~File-based storage~~
4. ~~Separate change detection scripts~~

## Troubleshooting

### Common Issues

1. **"No data found for processing"**
   - Check if N8N is actually saving data to Supabase
   - Verify the `scrape_timestamp` field is being set

2. **"Error fetching latest scrape data"**
   - Check Supabase connection and credentials
   - Verify table name is "Room Slots" (with space)

3. **Webhook not responding**
   - Ensure your Next.js server is running
   - Check the webhook URL is correct
   - Verify N8N can reach your server

### Debug Steps

1. Check server logs for webhook calls
2. Visit `/test-n8n` to test integration
3. Verify data in Supabase "Room Slots" table
4. Check "Booking Changes" table for logged changes

## Example N8N Workflow

```
1. [Schedule Trigger] → Every 15 minutes
2. [HTTP Request] → Scrape booking website
3. [Function] → Process scraped data
4. [Supabase] → Save to "Room Slots" table
5. [HTTP Request] → Call webhook (POST /api/n8n-webhook)
6. [Done] → Change detection happens automatically
```

## Production Deployment

For production, update the webhook URL in your N8N workflow:
```
https://your-domain.com/api/n8n-webhook
```

The system is now fully automated and will:
- Store all scraping data in Supabase
- Automatically detect booking changes
- Update dashboards in real-time
- Maintain historical data for analysis 