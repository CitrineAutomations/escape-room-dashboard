# How to Use the LLM Data Extraction Guide

## Quick Start

1. **Share the Guide**: Send `ESCAPE_ROOM_DATA_EXTRACTION_GUIDE.md` to your LLM
2. **Provide Website Info**: Include the target website URL and any sample HTML
3. **Get JavaScript Code**: The LLM will generate N8N-ready scraping code
4. **Integrate**: Use the code in your N8N workflow

## Example LLM Prompt

```
I need you to generate JavaScript code for scraping escape room booking data. 

Please read the attached ESCAPE_ROOM_DATA_EXTRACTION_GUIDE.md file which contains:
- Exact data structure requirements
- All required fields and formats
- JavaScript code template
- Helper functions
- Integration instructions

Target website: [YOUR_WEBSITE_URL]
Sample HTML: [PASTE_HTML_HERE_IF_AVAILABLE]

Generate JavaScript code that:
1. Extracts all required fields from the guide
2. Handles the specific HTML structure of this website  
3. Returns data in the exact format specified
4. Includes error handling
5. Works in an N8N JavaScript code node

The code should integrate with our existing Supabase database and webhook system.
```

## What the LLM Will Generate

The LLM will create JavaScript code that extracts:

### Required Fields:
- `id` - Unique identifier
- `room_id` - Room identifier (e.g., "RT1", "K!1")
- `booking_date` - Date in YYYY-MM-DD format
- `hour` - Time in HH:MM:SS format
- `is_available` - Boolean availability
- `available_slots` - Number of spots available
- `room_name` - Human-readable room name
- `business_name` - Business name
- `scrape_timestamp` - When data was scraped

### Optional Fields:
- `total_capacity` - Maximum room capacity
- `booked_capacity` - Already booked spots
- `scrape_id` - Groups data from same scrape session

## Integration Flow

```
LLM Generated Code → N8N JavaScript Node → Supabase → Webhook → Dashboard
```

1. **JavaScript Node**: Runs the LLM-generated scraping code
2. **Supabase Node**: Saves extracted data to "Room Slots" table
3. **HTTP Request Node**: Calls `/api/n8n-webhook` endpoint
4. **Automatic Processing**: Change detection and dashboard updates

## Files You Need

- ✅ `ESCAPE_ROOM_DATA_EXTRACTION_GUIDE.md` - Complete specification
- ✅ `N8N_INTEGRATION_GUIDE.md` - Integration instructions
- ✅ Your website URL and sample HTML

## Expected Output Format

```javascript
[
  {
    id: "rt1_20250115_153000_20250115153000_abc123",
    room_id: "RT1",
    booking_date: "2025-01-15", 
    hour: "15:30:00",
    is_available: true,
    available_slots: 6,
    room_name: "The Heist",
    business_name: "The Exit Games",
    total_capacity: 8,
    booked_capacity: 2,
    scrape_timestamp: "2025-01-15T15:30:00.000Z",
    scrape_id: "scrape_20250115_153000"
  }
  // ... more entries
]
```

This data structure is designed to work seamlessly with your existing dashboard and change tracking system. 