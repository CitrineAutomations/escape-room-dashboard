import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

def generate_room_slots():
    # Read the existing room slots data to understand the date range and time slots
    room_slots_df = pd.read_csv('Room Slots_rows_old.csv')
    
    # Read the rooms data to get all businesses and rooms
    rooms_df = pd.read_csv('Rooms_rows (1)_use.csv')
    
    # Get unique dates and hours from existing data
    existing_dates = room_slots_df['booking_date'].unique()
    existing_hours = room_slots_df['hour'].unique()
    
    # Filter rooms to exclude "I escape" business since it's already in the slots data
    new_rooms_df = rooms_df[rooms_df['business_name'] != 'iEscape Rooms'].copy()
    
    # Create new room slots data
    new_slots_data = []
    slot_id = room_slots_df['id'].max() + 1  # Start from the next available ID
    
    for _, room in new_rooms_df.iterrows():
        for date in existing_dates:
            for hour in existing_hours:
                # Generate random availability and slots
                is_available = random.choice([True, False])
                if is_available:
                    # Random available slots between 0 and room capacity
                    available_slots = random.randint(0, room['capacity'])
                else:
                    available_slots = 0
                
                new_slot = {
                    'room_id': room['room_id'],
                    'booking_date': date,
                    'hour': hour,
                    'is_available': is_available,
                    'available_slots': available_slots,
                    'room_name': room['room_name'],
                    'id': slot_id,
                    'business_name': room['business_name']
                }
                
                new_slots_data.append(new_slot)
                slot_id += 1
    
    # Create DataFrame from new slots
    new_slots_df = pd.DataFrame(new_slots_data)
    
    # Combine with existing data
    combined_df = pd.concat([room_slots_df, new_slots_df], ignore_index=True)
    
    # Sort by date, hour, and business name for better organization
    combined_df = combined_df.sort_values(['booking_date', 'hour', 'business_name', 'room_name'])
    
    # Save the combined data
    combined_df.to_csv('Room_Slots_Expanded.csv', index=False)
    
    print(f"Generated {len(new_slots_data)} new room slots")
    print(f"Total room slots: {len(combined_df)}")
    print(f"Businesses included: {combined_df['business_name'].unique()}")
    print(f"Rooms included: {len(combined_df['room_name'].unique())}")
    
    return combined_df

if __name__ == "__main__":
    generate_room_slots() 