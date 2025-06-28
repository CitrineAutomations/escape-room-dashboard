# Room Slots Data Expansion Summary

## Overview
Successfully expanded the room slots data from the original file (`Room Slots_rows_old.csv`) to include all businesses and rooms from the rooms file (`Rooms_rows (1)_use.csv`).

## Original Data
- **File**: `Room Slots_rows_old.csv`
- **Business**: Only "I escape" (iEscape Rooms)
- **Rooms**: 4 rooms (CLUEVIE, DONOR, GAME SHOW Live!, LEGEND OF THE TOMB)
- **Total slots**: 16,192 entries
- **Date range**: March 1, 2025 to May 31, 2025

## New Data Added
- **Businesses added**: 
  - Cracked It (4 rooms)
  - Green Light Escape (6 rooms)
  - The Exit Games (6 rooms)

- **Rooms added**:
  - **Cracked It**: Rat Trap!, Project Skylabd, Murder University, New Blood New World
  - **Green Light Escape**: Kidnapped!, Cabin in the Woods, The Attic, Jurassic Labs, Alien Escape, Brewery Heist
  - **The Exit Games**: White Rabbit Society, Front Street Casino Heist, Outage: No Vacancy, Dog Gone Alley, Hangover at Riddler State, Hidden Needle Tattoo Parlor

## Expanded Data Results
- **File**: `Room_Slots_Expanded.csv`
- **Total slots**: 80,960 entries (5x increase)
- **Businesses**: 4 total businesses
- **Rooms**: 20 total rooms
- **Date range**: Same as original (March 1, 2025 to May 31, 2025)
- **Time slots**: Same hourly intervals as original data

## Data Structure
Each row contains:
- `room_id`: Unique room identifier
- `booking_date`: Date of the slot
- `hour`: Time slot (15-minute intervals)
- `is_available`: Boolean availability status
- `available_slots`: Number of available slots (0 if not available)
- `room_name`: Full room name
- `id`: Unique slot identifier
- `business_name`: Business name

## Generation Method
- Used the same date range and time slots as the original data
- Generated realistic availability patterns (random true/false)
- Available slots are randomly distributed between 0 and room capacity
- Maintained data consistency and proper ID sequencing

## Files Created
1. `generate_room_slots.py` - Script used to generate the expanded data
2. `verify_data.py` - Script to verify and summarize the generated data
3. `Room_Slots_Expanded.csv` - The final expanded dataset
4. `DATA_EXPANSION_SUMMARY.md` - This summary document

## Usage
The expanded data can now be used for:
- Multi-business booking systems
- Cross-business analytics
- Capacity planning across multiple escape room businesses
- Market analysis and comparison 