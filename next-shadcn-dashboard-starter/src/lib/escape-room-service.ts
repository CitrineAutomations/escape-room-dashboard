import { supabase, RoomSlot, RoomMetrics, DailyMetrics } from './supabase'

export type { RoomMetrics, DailyMetrics }

// Mock data for fallback when database is not available
const mockRoomSlots: RoomSlot[] = [
  // Cracked It rooms
  {
    id: 1,
    room_id: 'RT!1',
    booking_date: '2025-03-01',
    hour: '11:00:00',
    is_available: false,
    available_slots: 0,
    room_name: 'Rat Trap!',
    business_name: 'Cracked It'
  },
  {
    id: 2,
    room_id: 'PS4',
    booking_date: '2025-03-01',
    hour: '11:00:00',
    is_available: true,
    available_slots: 3,
    room_name: 'Project Skylabd',
    business_name: 'Cracked It'
  },
  {
    id: 3,
    room_id: 'MU3',
    booking_date: '2025-03-01',
    hour: '11:00:00',
    is_available: true,
    available_slots: 6,
    room_name: 'Murder University',
    business_name: 'Cracked It'
  },
  {
    id: 4,
    room_id: 'NBNW2',
    booking_date: '2025-03-01',
    hour: '11:00:00',
    is_available: false,
    available_slots: 0,
    room_name: 'New Blood, New World',
    business_name: 'Cracked It'
  },
  
  // Green Light Escape rooms
  {
    id: 5,
    room_id: 'K!1',
    booking_date: '2025-03-01',
    hour: '11:00:00',
    is_available: false,
    available_slots: 0,
    room_name: 'Kidnapped!',
    business_name: 'Green Light Escape'
  },
  {
    id: 6,
    room_id: 'CITW2',
    booking_date: '2025-03-01',
    hour: '11:00:00',
    is_available: true,
    available_slots: 2,
    room_name: 'Cabin in the Woods',
    business_name: 'Green Light Escape'
  },
  {
    id: 7,
    room_id: 'TA3',
    booking_date: '2025-03-01',
    hour: '11:00:00',
    is_available: true,
    available_slots: 4,
    room_name: 'The Attic',
    business_name: 'Green Light Escape'
  },
  {
    id: 8,
    room_id: 'JL4',
    booking_date: '2025-03-01',
    hour: '11:00:00',
    is_available: false,
    available_slots: 0,
    room_name: 'Jurassic Labs',
    business_name: 'Green Light Escape'
  },
  {
    id: 9,
    room_id: 'AE5',
    booking_date: '2025-03-01',
    hour: '11:00:00',
    is_available: true,
    available_slots: 5,
    room_name: 'Alien Escape',
    business_name: 'Green Light Escape'
  },
  {
    id: 10,
    room_id: 'BH6',
    booking_date: '2025-03-01',
    hour: '11:00:00',
    is_available: true,
    available_slots: 6,
    room_name: 'Brewery Heist',
    business_name: 'Green Light Escape'
  },
  
  // I escape rooms
  {
    id: 11,
    room_id: 'CLV1',
    booking_date: '2025-03-01',
    hour: '11:00:00',
    is_available: false,
    available_slots: 0,
    room_name: 'CLUEVIE',
    business_name: 'I escape'
  },
  {
    id: 12,
    room_id: 'DNR2',
    booking_date: '2025-03-01',
    hour: '11:00:00',
    is_available: true,
    available_slots: 3,
    room_name: 'DONOR',
    business_name: 'I escape'
  },
  {
    id: 13,
    room_id: 'GMS3',
    booking_date: '2025-03-01',
    hour: '11:00:00',
    is_available: true,
    available_slots: 6,
    room_name: 'GAME SHOW Live!',
    business_name: 'I escape'
  },
  {
    id: 14,
    room_id: 'LOT4',
    booking_date: '2025-03-01',
    hour: '11:00:00',
    is_available: false,
    available_slots: 0,
    room_name: 'LEGEND OF THE TOMB',
    business_name: 'I escape'
  },
  
  // The Exit Games rooms
  {
    id: 15,
    room_id: 'WRS3',
    booking_date: '2025-03-01',
    hour: '11:00:00',
    is_available: false,
    available_slots: 0,
    room_name: 'White Rabbit Society',
    business_name: 'The Exit Games'
  },
  {
    id: 16,
    room_id: 'FSCH1',
    booking_date: '2025-03-01',
    hour: '11:00:00',
    is_available: false,
    available_slots: 0,
    room_name: 'Front Street Casino Heist',
    business_name: 'The Exit Games'
  },
  {
    id: 17,
    room_id: 'ONV6',
    booking_date: '2025-03-01',
    hour: '11:00:00',
    is_available: true,
    available_slots: 2,
    room_name: 'Outage: No Vacancy',
    business_name: 'The Exit Games'
  },
  {
    id: 18,
    room_id: 'DGA2',
    booking_date: '2025-03-01',
    hour: '11:00:00',
    is_available: false,
    available_slots: 0,
    room_name: 'Dog Gone Alley',
    business_name: 'The Exit Games'
  },
  {
    id: 19,
    room_id: 'HRS5',
    booking_date: '2025-03-01',
    hour: '11:00:00',
    is_available: false,
    available_slots: 0,
    room_name: 'Hangover at Riddler State',
    business_name: 'The Exit Games'
  },
  {
    id: 20,
    room_id: 'HNTP4',
    booking_date: '2025-03-01',
    hour: '11:00:00',
    is_available: false,
    available_slots: 0,
    room_name: 'Hidden Needle Tattoo Parlor',
    business_name: 'The Exit Games'
  }
]

const mockBusinesses = [
  { business_id: 'cracked_it', business_name: 'Cracked It' },
  { business_id: 'green_light_escape', business_name: 'Green Light Escape' },
  { business_id: 'iescape_rooms', business_name: 'I escape' },
  { business_id: 'the_exit_games', business_name: 'The Exit Games' }
]

export class EscapeRoomService {
  // Fetch all room slots for a date range
  static async getRoomSlots(startDate?: string, endDate?: string, businessName?: string): Promise<RoomSlot[]> {
    try {
      let query = supabase
        .from('Room Slots')
        .select('*')
        .order('booking_date', { ascending: true })
        .order('hour', { ascending: true })

      if (startDate) {
        query = query.gte('booking_date', startDate)
      }
      if (endDate) {
        query = query.lte('booking_date', endDate)
      }
      if (businessName && businessName !== 'all') {
        query = query.eq('business_name', businessName)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching room slots:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.warn('Database connection failed, using mock data:', error)
      // Return mock data when database is not available
      return mockRoomSlots.filter(slot => {
        if (businessName && businessName !== 'all') {
          return slot.business_name === businessName
        }
        return true
      })
    }
  }

  // Get business locations from the expanded data
  static async getBusinessLocations() {
    try {
      // Get unique businesses from the Business Location table
      const { data, error } = await supabase
        .from('Business Location')
        .select('business_name, business_id')
        .order('business_name')

      if (error) {
        console.error('Error fetching business locations:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.warn('Database connection failed, using mock business data:', error)
      return mockBusinesses
    }
  }

  // Get rooms from the expanded data
  static async getRooms(businessName?: string) {
    try {
      let query = supabase
        .from('Rooms')
        .select('room_id, room_name, business_name')
        .order('room_name')

      if (businessName && businessName !== 'all') {
        query = query.eq('business_name', businessName)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching rooms:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.warn('Database connection failed, using mock room data:', error)
      // Return mock rooms based on the slots we have
      const mockRooms = [
        // Cracked It rooms
        { room_id: 'RT!1', room_name: 'Rat Trap!', business_name: 'Cracked It' },
        { room_id: 'PS4', room_name: 'Project Skylabd', business_name: 'Cracked It' },
        { room_id: 'MU3', room_name: 'Murder University', business_name: 'Cracked It' },
        { room_id: 'NBNW2', room_name: 'New Blood, New World', business_name: 'Cracked It' },
        
        // Green Light Escape rooms
        { room_id: 'K!1', room_name: 'Kidnapped!', business_name: 'Green Light Escape' },
        { room_id: 'CITW2', room_name: 'Cabin in the Woods', business_name: 'Green Light Escape' },
        { room_id: 'TA3', room_name: 'The Attic', business_name: 'Green Light Escape' },
        { room_id: 'JL4', room_name: 'Jurassic Labs', business_name: 'Green Light Escape' },
        { room_id: 'AE5', room_name: 'Alien Escape', business_name: 'Green Light Escape' },
        { room_id: 'BH6', room_name: 'Brewery Heist', business_name: 'Green Light Escape' },
        
        // I escape rooms
        { room_id: 'CLV1', room_name: 'CLUEVIE', business_name: 'I escape' },
        { room_id: 'DNR2', room_name: 'DONOR', business_name: 'I escape' },
        { room_id: 'GMS3', room_name: 'GAME SHOW Live!', business_name: 'I escape' },
        { room_id: 'LOT4', room_name: 'LEGEND OF THE TOMB', business_name: 'I escape' },
        
        // The Exit Games rooms
        { room_id: 'WRS3', room_name: 'White Rabbit Society', business_name: 'The Exit Games' },
        { room_id: 'FSCH1', room_name: 'Front Street Casino Heist', business_name: 'The Exit Games' },
        { room_id: 'ONV6', room_name: 'Outage: No Vacancy', business_name: 'The Exit Games' },
        { room_id: 'DGA2', room_name: 'Dog Gone Alley', business_name: 'The Exit Games' },
        { room_id: 'HRS5', room_name: 'Hangover at Riddler State', business_name: 'The Exit Games' },
        { room_id: 'HNTP4', room_name: 'Hidden Needle Tattoo Parlor', business_name: 'The Exit Games' }
      ]
      
      if (businessName && businessName !== 'all') {
        return mockRooms.filter(room => room.business_name === businessName)
      }
      return mockRooms
    }
  }

  // Get room-level metrics with proper joins
  static async getRoomMetrics(startDate?: string, endDate?: string, businessName?: string): Promise<RoomMetrics[]> {
    const slots = await this.getRoomSlots(startDate, endDate, businessName)
    const rooms = await this.getRooms(businessName)
    
    const roomMetrics = new Map<string, RoomMetrics>()

    // Initialize metrics for all rooms
    rooms.forEach(room => {
      roomMetrics.set(room.room_id, {
        room_id: room.room_id,
        room_name: room.room_name,
        total_slots: 0,
        booked_slots: 0,
        utilization_rate: 0,
        average_available_slots: 0
      })
    })

    // Calculate metrics from slots
    slots.forEach(slot => {
      if (roomMetrics.has(slot.room_id)) {
        const metrics = roomMetrics.get(slot.room_id)!
        metrics.total_slots++
        
        if (!slot.is_available) {
          metrics.booked_slots++
        }
      }
    })

    // Calculate rates and averages
    roomMetrics.forEach(metrics => {
      if (metrics.total_slots > 0) {
        metrics.utilization_rate = (metrics.booked_slots / metrics.total_slots) * 100
      }
      
      const availableSlots = slots
        .filter(slot => slot.room_id === metrics.room_id && slot.is_available)
        .map(slot => slot.available_slots)
      
      metrics.average_available_slots = availableSlots.length > 0 
        ? availableSlots.reduce((sum, slots) => sum + slots, 0) / availableSlots.length 
        : 0
    })

    return Array.from(roomMetrics.values())
  }

  // Get daily metrics
  static async getDailyMetrics(startDate?: string, endDate?: string, businessName?: string): Promise<DailyMetrics[]> {
    const slots = await this.getRoomSlots(startDate, endDate, businessName)
    
    const dailyMetrics = new Map<string, DailyMetrics>()

    slots.forEach(slot => {
      if (!dailyMetrics.has(slot.booking_date)) {
        dailyMetrics.set(slot.booking_date, {
          date: slot.booking_date,
          total_slots: 0,
          booked_slots: 0,
          utilization_rate: 0
        })
      }

      const metrics = dailyMetrics.get(slot.booking_date)!
      metrics.total_slots++
      
      if (!slot.is_available) {
        metrics.booked_slots++
      }
    })

    // Calculate utilization rates
    dailyMetrics.forEach(metrics => {
      if (metrics.total_slots > 0) {
        metrics.utilization_rate = (metrics.booked_slots / metrics.total_slots) * 100
      }
    })

    return Array.from(dailyMetrics.values()).sort((a, b) => a.date.localeCompare(b.date))
  }

  // Get hourly utilization patterns
  static async getHourlyUtilization(startDate?: string, endDate?: string, businessName?: string) {
    const slots = await this.getRoomSlots(startDate, endDate, businessName)
    
    const hourlyData = new Map<string, { total: number; booked: number }>()

    slots.forEach(slot => {
      const hour = slot.hour.split(':')[0] // Extract hour from time
      
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, { total: 0, booked: 0 })
      }

      const data = hourlyData.get(hour)!
      data.total++
      
      if (!slot.is_available) {
        data.booked++
      }
    })

    return Array.from(hourlyData.entries()).map(([hour, data]) => ({
      hour: parseInt(hour),
      utilization_rate: data.total > 0 ? (data.booked / data.total) * 100 : 0,
      total_slots: data.total,
      booked_slots: data.booked
    })).sort((a, b) => a.hour - b.hour)
  }

  // Get business summary
  static async getBusinessSummary(startDate?: string, endDate?: string, businessName?: string) {
    const slots = await this.getRoomSlots(startDate, endDate, businessName)
    const roomMetrics = await this.getRoomMetrics(startDate, endDate, businessName)
    const dailyMetrics = await this.getDailyMetrics(startDate, endDate, businessName)
    const businesses = await this.getBusinessLocations()

    const totalSlots = slots.length
    const totalBookings = slots.filter(slot => !slot.is_available).length
    const averageUtilization = roomMetrics.length > 0 
      ? roomMetrics.reduce((sum, room) => sum + room.utilization_rate, 0) / roomMetrics.length 
      : 0

    return {
      total_slots: totalSlots,
      total_bookings: totalBookings,
      overall_utilization: totalSlots > 0 ? (totalBookings / totalSlots) * 100 : 0,
      average_room_utilization: averageUtilization,
      business_count: businessName && businessName !== 'all' ? 1 : businesses.length,
      date_range: {
        start: startDate || 'earliest',
        end: endDate || 'latest'
      }
    }
  }
} 