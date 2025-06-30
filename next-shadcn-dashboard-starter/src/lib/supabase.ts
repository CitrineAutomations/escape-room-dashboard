import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are properly configured
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
  )
}

// Create client with fallback values to prevent crashes
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Types for our escape room data
export interface RoomSlot {
  id: number
  room_id: string
  booking_date: string
  hour: string
  is_available: boolean
  available_slots: number
  room_name: string
  business_name: string
  total_capacity?: number
  booked_capacity?: number
  scrape_timestamp: string
  scrape_id?: string
}

export interface RoomMetrics {
  room_id: string
  room_name: string
  total_slots: number
  booked_slots: number
  utilization_rate: number
  average_available_slots: number
}

export interface DailyMetrics {
  date: string
  total_slots: number
  booked_slots: number
  utilization_rate: number
}

// New interface for tracking booking changes over time
export interface BookingChange {
  id?: number
  room_id: string
  booking_date: string
  hour: string
  previous_available_slots: number
  current_available_slots: number
  change_amount: number
  change_timestamp: string
  scrape_id: string
  business_name: string
  room_name: string
} 