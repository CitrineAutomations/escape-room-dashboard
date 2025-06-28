import pandas as pd

# Read the expanded data
df = pd.read_csv('Room_Slots_Expanded.csv')

print("=== ROOM SLOTS EXPANDED DATA VERIFICATION ===")
print(f"Total rows: {len(df)}")
print(f"Columns: {df.columns.tolist()}")
print(f"Businesses included: {df['business_name'].unique()}")
print(f"Number of unique rooms: {df['room_name'].nunique()}")
print(f"Date range: {df['booking_date'].min()} to {df['booking_date'].max()}")

print("\n=== SAMPLE DATA (first 10 rows) ===")
print(df.head(10).to_string(index=False))

print("\n=== BUSINESS SUMMARY ===")
business_summary = df.groupby('business_name').agg({
    'room_name': 'nunique',
    'id': 'count'
}).rename(columns={'room_name': 'unique_rooms', 'id': 'total_slots'})
print(business_summary)

print("\n=== ROOM SUMMARY ===")
room_summary = df.groupby(['business_name', 'room_name']).size().reset_index(name='slots_count')
print(room_summary.head(15).to_string(index=False)) 