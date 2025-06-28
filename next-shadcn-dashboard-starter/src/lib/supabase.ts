import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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