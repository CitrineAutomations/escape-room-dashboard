# Escape Room Data Extraction Guide for LLM Code Generation

## Overview
This document provides the exact specifications for extracting escape room booking data from websites. Use this guide to instruct an LLM to generate JavaScript code for N8N workflows that scrape booking availability data.

## Target Data Structure

The LLM should generate JavaScript code that extracts data and formats it into this exact structure:

```javascript
const extractedData = [
  {
    id: "unique_identifier_per_entry",
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
  // ... more entries for each time slot
]
```

## Required Data Fields

### 1. **id** (string, required)
- **Purpose**: Unique identifier for each booking slot entry
- **Format**: `{room_id_safe}_{date}_{time}_{timestamp}_{random}`
- **Example**: `"rt1_20250115_153000_20250115153000_abc123"`
- **Generation Logic**:
  ```javascript
  const generateId = (roomId, date, hour) => {
    const safeRoomId = roomId.toLowerCase().replace(/[!@#$%^&*()]/g, '')
    const dateStr = date.replace(/-/g, '')
    const timeStr = hour.replace(/:/g, '')
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
    const random = Math.random().toString(36).substr(2, 6)
    return `${safeRoomId}_${dateStr}_${timeStr}_${timestamp}_${random}`
  }
  ```

### 2. **room_id** (string, required)
- **Purpose**: Unique identifier for each escape room
- **Examples**: `"RT1"`, `"PS4"`, `"K!1"`, `"CITW2"`
- **Note**: May contain special characters like `!`
- **Extraction**: Usually found in HTML data attributes, URLs, or form values

### 3. **booking_date** (string, required)
- **Purpose**: The date for which the booking slot is available
- **Format**: `"YYYY-MM-DD"`
- **Examples**: `"2025-01-15"`, `"2025-03-22"`
- **Extraction**: Parse from date pickers, calendar widgets, or URL parameters

### 4. **hour** (string, required)
- **Purpose**: The time slot for the booking
- **Format**: `"HH:MM:SS"` (24-hour format)
- **Examples**: `"15:30:00"`, `"09:00:00"`, `"21:45:00"`
- **Extraction**: Parse from time slot buttons, dropdown menus, or schedule grids

### 5. **is_available** (boolean, required)
- **Purpose**: Whether the time slot is available for booking
- **Values**: `true` (available) or `false` (fully booked)
- **Logic**: 
  - `true` if `available_slots > 0`
  - `false` if `available_slots === 0`

### 6. **available_slots** (integer, required)
- **Purpose**: Number of people/spots still available for booking
- **Examples**: `6`, `0`, `4`
- **Extraction**: Usually displayed as "X spots left" or similar text
- **Calculation**: `total_capacity - booked_capacity`

### 7. **room_name** (string, required)
- **Purpose**: Human-readable name of the escape room
- **Examples**: `"The Heist"`, `"Murder Mystery"`, `"Alien Escape"`
- **Extraction**: Usually displayed as the main room title or heading

### 8. **business_name** (string, required)
- **Purpose**: Name of the escape room business/location
- **Examples**: `"The Exit Games"`, `"Cracked It"`, `"Green Light Escape"`, `"iEscape Rooms"`
- **Note**: Must match exactly with database entries
- **Extraction**: Usually in the header, footer, or URL of the website

### 9. **total_capacity** (integer, optional)
- **Purpose**: Maximum number of people the room can accommodate
- **Examples**: `8`, `6`, `10`
- **Default**: Can be calculated from booking patterns if not explicitly shown

### 10. **booked_capacity** (integer, optional)
- **Purpose**: Number of spots already booked
- **Calculation**: `total_capacity - available_slots`
- **Examples**: `2`, `8`, `0`

### 11. **scrape_timestamp** (string, required)
- **Purpose**: When this data was scraped
- **Format**: ISO 8601 timestamp
- **Generation**: `new Date().toISOString()`
- **Example**: `"2025-01-15T15:30:00.000Z"`

### 12. **scrape_id** (string, optional)
- **Purpose**: Groups all data from the same scraping session
- **Format**: `"scrape_YYYYMMDD_HHMMSS"`
- **Generation**: `"scrape_" + new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 13)`
- **Example**: `"scrape_20250115_153000"`

## Common Website Patterns to Look For

### 1. **Calendar/Date Selection**
```html
<!-- Look for date pickers or calendar widgets -->
<input type="date" value="2025-01-15">
<div class="calendar-day" data-date="2025-01-15">15</div>
<button class="date-btn" data-date="01/15/2025">Jan 15</button>
```

### 2. **Time Slot Grids**
```html
<!-- Time slots often appear as buttons or grid items -->
<button class="time-slot available" data-time="15:30">3:30 PM (6 left)</button>
<div class="slot unavailable" data-hour="16:00">4:00 PM - SOLD OUT</div>
<span class="booking-slot" data-capacity="4">5:30 PM - 4 spots</span>
```

### 3. **Room Information**
```html
<!-- Room details usually in headers or data attributes -->
<h2 class="room-title">The Heist</h2>
<div class="room-card" data-room-id="RT1" data-capacity="8">
<meta property="room:name" content="Murder Mystery">
```

### 4. **Availability Indicators**
```html
<!-- Various ways availability is shown -->
<span class="spots-left">6 spots remaining</span>
<div class="availability">Available (4/8)</div>
<button disabled>SOLD OUT</button>
<span class="full-booking">No availability</span>
```

## JavaScript Code Template for LLM

Provide this template to the LLM as a starting point:

```javascript
// N8N JavaScript Code Node Template
// This code should be adapted based on the specific website structure

const extractBookingData = () => {
  const results = [];
  const scrapeTimestamp = new Date().toISOString();
  const scrapeId = `scrape_${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 13)}`;
  
  // TODO: Replace with actual selectors from the website
  const rooms = document.querySelectorAll('.room-card'); // Adjust selector
  
  rooms.forEach(roomElement => {
    // Extract room information
    const roomId = roomElement.getAttribute('data-room-id'); // Adjust
    const roomName = roomElement.querySelector('.room-title').textContent; // Adjust
    const businessName = "The Exit Games"; // Set based on website
    const totalCapacity = parseInt(roomElement.getAttribute('data-capacity')) || 8; // Adjust
    
    // Extract time slots for this room
    const timeSlots = roomElement.querySelectorAll('.time-slot'); // Adjust selector
    
    timeSlots.forEach(slotElement => {
      // Extract time slot information
      const hour = slotElement.getAttribute('data-time'); // Adjust
      const bookingDate = document.querySelector('.selected-date').value; // Adjust
      
      // Extract availability
      const availabilityText = slotElement.textContent;
      const availableSlots = extractAvailableSlots(availabilityText);
      const isAvailable = availableSlots > 0;
      const bookedCapacity = totalCapacity - availableSlots;
      
      // Generate unique ID
      const id = generateId(roomId, bookingDate, hour);
      
      // Create data entry
      results.push({
        id,
        room_id: roomId,
        booking_date: bookingDate,
        hour: formatTime(hour),
        is_available: isAvailable,
        available_slots: availableSlots,
        room_name: roomName,
        business_name: businessName,
        total_capacity: totalCapacity,
        booked_capacity: bookedCapacity,
        scrape_timestamp: scrapeTimestamp,
        scrape_id: scrapeId
      });
    });
  });
  
  return results;
};

// Helper functions (customize based on website format)
const extractAvailableSlots = (text) => {
  // Examples of text patterns to parse:
  // "6 spots left" -> 6
  // "Available (4/8)" -> 4  
  // "SOLD OUT" -> 0
  // "3:30 PM (2 remaining)" -> 2
  
  if (text.includes('SOLD OUT') || text.includes('No availability')) {
    return 0;
  }
  
  const match = text.match(/(\d+)\s*(spots?|remaining|left|available)/i);
  return match ? parseInt(match[1]) : 0;
};

const formatTime = (timeStr) => {
  // Convert various time formats to "HH:MM:SS"
  // "3:30 PM" -> "15:30:00"
  // "15:30" -> "15:30:00"
  
  if (timeStr.includes('PM') || timeStr.includes('AM')) {
    // Convert 12-hour to 24-hour format
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
  }
  
  // Already in 24-hour format, just add seconds if missing
  return timeStr.includes(':') ? `${timeStr}:00` : timeStr;
};

const generateId = (roomId, date, hour) => {
  const safeRoomId = roomId.toLowerCase().replace(/[!@#$%^&*()]/g, '');
  const dateStr = date.replace(/-/g, '');
  const timeStr = hour.replace(/:/g, '');
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const random = Math.random().toString(36).substr(2, 6);
  return `${safeRoomId}_${dateStr}_${timeStr}_${timestamp}_${random}`;
};

// Execute the extraction
return extractBookingData();
```

## Instructions for LLM

When asking an LLM to generate scraping code, provide:

1. **This entire document** as context
2. **The website URL** to scrape
3. **Sample HTML** from the booking page (if available)
4. **Specific selectors** if you've identified them

### Example LLM Prompt:
```
Using the attached ESCAPE_ROOM_DATA_EXTRACTION_GUIDE.md, generate JavaScript code for N8N that scrapes booking data from [WEBSITE_URL]. 

The code should:
1. Extract all the required fields specified in the guide
2. Handle the specific HTML structure of this website
3. Return data in the exact format shown in the guide
4. Include error handling for missing elements
5. Work within an N8N JavaScript code node

Website URL: [INSERT_URL_HERE]
Sample HTML: [INSERT_HTML_SAMPLE_IF_AVAILABLE]
```

## Validation Checklist

The generated code should:
- ✅ Extract all required fields (id, room_id, booking_date, hour, etc.)
- ✅ Generate unique IDs for each entry
- ✅ Handle both available and unavailable time slots
- ✅ Parse time formats correctly (12-hour to 24-hour conversion)
- ✅ Include proper error handling
- ✅ Return data in the exact structure specified
- ✅ Work with the N8N-Supabase-Webhook integration flow

## Integration with N8N Workflow

After the LLM generates the scraping code, your N8N workflow should:

1. **JavaScript Node** → Execute the generated scraping code
2. **Supabase Node** → Save extracted data to "Room Slots" table  
3. **HTTP Request Node** → Call webhook `/api/n8n-webhook`
4. **Done** → Automatic change detection and dashboard updates

This ensures the scraped data integrates seamlessly with your existing dashboard and change tracking system. 