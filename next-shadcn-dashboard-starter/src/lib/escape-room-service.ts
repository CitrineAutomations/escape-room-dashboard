import { supabase, RoomSlot, RoomMetrics, DailyMetrics } from './supabase'

export type { RoomMetrics, DailyMetrics }

// Business hours configuration - define actual operating hours for each business
// Using exact database names to ensure matching
const BUSINESS_HOURS = {
  'Cracked IT': {  // Match database name exactly
    monday: { open: '15:00', close: '20:00' },    // 3PM - 8PM
    tuesday: { open: '15:00', close: '20:00' },   // 3PM - 8PM
    wednesday: { open: '15:00', close: '20:00' }, // 3PM - 8PM
    thursday: { open: '15:00', close: '20:00' },  // 3PM - 8PM
    friday: { open: '15:00', close: '21:30' },    // 3PM - 9:30PM
    saturday: { open: '12:00', close: '21:30' },  // 12PM - 9:30PM
    sunday: { open: '12:00', close: '20:00' }     // 12PM - 8PM
  },
  'Green Light Escape': {
    monday: { open: '11:00', close: '21:30' },    // 11am - 9:30pm
    tuesday: { open: '11:00', close: '21:30' },   // 11am - 9:30pm
    wednesday: { open: '11:00', close: '21:30' }, // 11am - 9:30pm
    thursday: { open: '11:00', close: '21:30' },  // 11am - 9:30pm
    friday: { open: '11:00', close: '22:15' },    // 11am - 10:15pm
    saturday: { open: '11:00', close: '22:15' },  // 11am - 10:15pm
    sunday: { open: '11:30', close: '20:45' }     // 11:30am - 8:45pm
  },
  'iEscape Rooms': {
    monday: { open: '12:00', close: '24:00' },    // 12:00pm - Midnight
    tuesday: { open: '12:00', close: '24:00' },   // 12:00pm - Midnight
    wednesday: { open: '12:00', close: '24:00' }, // 12:00pm - Midnight
    thursday: { open: '12:00', close: '24:00' },  // 12:00pm - Midnight
    friday: { open: '12:00', close: '24:00' },    // 12:00pm - Midnight
    saturday: { open: '12:00', close: '24:00' },  // 12:00pm - Midnight
    sunday: { open: '12:00', close: '24:00' }     // 12:00pm - Midnight
  },
  'The Exit Games': {  // Will handle tab character in normalization
    monday: null,                                 // CLOSED
    tuesday: null,                                // CLOSED  
    wednesday: { open: '14:45', close: '21:15' }, // 2:45PM - 9:15PM
    thursday: { open: '14:45', close: '21:15' },  // 2:45PM - 9:15PM
    friday: { open: '14:45', close: '21:15' },    // 2:45PM - 9:15PM
    saturday: { open: '11:00', close: '22:15' },  // 11:00AM - 10:15PM
    sunday: { open: '11:15', close: '20:30' }     // 11:15AM - 8:30PM
  }
}

/**
 * Export business hours configuration for easy access/modification
 */
export const getBusinessHoursConfig = () => BUSINESS_HOURS

/**
 * Check if a slot time is within business operating hours
 */
function isWithinBusinessHours(slot: RoomSlot): boolean {
  const businessName = slot.business_name
  const slotDate = new Date(slot.booking_date)
  const dayOfWeek = slotDate.getDay() // 0 = Sunday, 1 = Monday, etc.
  const slotTime = slot.hour.substring(0, 5) // Extract HH:MM format
  
  // Map day of week to business hours key
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayName = dayNames[dayOfWeek] as keyof typeof BUSINESS_HOURS['Cracked IT']
  
  // Find business hours configuration (try different name variations)
  let businessHours = null
  const normalizedSlotBusinessName = EscapeRoomService.normalizeBusinessName(businessName)
  
  for (const [configName, hours] of Object.entries(BUSINESS_HOURS)) {
    const normalizedConfigName = EscapeRoomService.normalizeBusinessName(configName)
    if (normalizedSlotBusinessName === normalizedConfigName) {
      businessHours = hours
      console.log(`✅ Matched business hours for "${businessName}" using config "${configName}"`)
      break
    }
  }
  
  // If no exact match, try some common variations
  if (!businessHours) {
    const variations = [
      businessName.replace(/\bIT\b/g, 'It'),  // IT -> It
      businessName.replace(/\bIt\b/g, 'IT'),  // It -> IT
      businessName + 's',                      // Add plural
      businessName.replace(/s$/, ''),          // Remove plural
    ]
    
    for (const variation of variations) {
      const normalizedVariation = EscapeRoomService.normalizeBusinessName(variation)
      for (const [configName, hours] of Object.entries(BUSINESS_HOURS)) {
        if (normalizedVariation === EscapeRoomService.normalizeBusinessName(configName)) {
          businessHours = hours
          console.log(`✅ Matched business hours for "${businessName}" using variation "${variation}" -> config "${configName}"`)
          break
        }
      }
      if (businessHours) break
    }
  }
  
  if (!businessHours) {
    console.warn(`⚠️ No business hours configured for: ${businessName}`)
    return true // If no hours configured, include all slots
  }
  
  const dayHours = businessHours[dayName]
  if (!dayHours) {
    console.log(`🚫 ${businessName} is CLOSED on ${dayName}`)
    return false
  }
  if (dayHours === null) {
    console.log(`🚫 ${businessName} is CLOSED on ${dayName}`)
    return false
  }
  
  // Convert times to minutes for easier comparison
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    // Handle midnight as 24:00
    if (hours === 24) {
      return 24 * 60 + minutes
    }
    return hours * 60 + minutes
  }
  
  const slotMinutes = timeToMinutes(slotTime)
  const openMinutes = timeToMinutes(dayHours.open)
  const closeMinutes = timeToMinutes(dayHours.close)
  
  const isOpen = slotMinutes >= openMinutes && slotMinutes <= closeMinutes
  
  if (!isOpen) {
    console.log(`🚫 Filtering out slot for ${businessName} at ${slotTime} on ${dayNames[dayOfWeek]} (open: ${dayHours.open}-${dayHours.close})`)
  }
  
  return isOpen
}

// PRODUCTION: All data comes from Supabase database - no mock data

export class EscapeRoomService {
  // Helper method to normalize business names for comparison
  static normalizeBusinessName(name: string): string {
    return name
      .trim()                    // Remove leading/trailing whitespace
      .replace(/\t/g, '')        // Remove tab characters
      .replace(/\s+/g, ' ')      // Normalize multiple spaces to single space
      .toLowerCase()             // Convert to lowercase for comparison
  }

  // Get business hours configuration
  static getBusinessHoursConfig() {
    return BUSINESS_HOURS
  }
  // Fetch all room slots for a date range
  static async getRoomSlots(startDate?: string, endDate?: string, businessName?: string): Promise<RoomSlot[]> {
    // Define the expected businesses with common variations
    const expectedBusinessVariations = [
      ['Cracked It', 'Cracked IT', 'cracked it', 'cracked-it'],
      ['Green Light Escape', 'green light escape', 'green-light-escape'],
      ['iEscape Rooms', 'I Escape', 'iescape rooms', 'i-escape'],
      ['The Exit Games', 'Exit Games', 'the exit games', 'exit-games']
    ]
    
    try {
      // First, get all data with filters
      let query = supabase
        .from('Room Slots')
        .select('*')
        .order('scrape_timestamp', { ascending: false })

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

      if (!data || data.length === 0) {
        return []
      }

      // Filter to only include slots from expected businesses (flexible matching)
      const filteredData = data.filter(slot => 
        expectedBusinessVariations.some(variations => 
          variations.some(variation => 
            this.normalizeBusinessName(slot.business_name) === this.normalizeBusinessName(variation)
          )
        )
      )

      // Get only the latest scrape data for each unique slot (room_id + booking_date + hour)
      const latestSlots = new Map<string, RoomSlot>()
      
      filteredData.forEach(slot => {
        const key = `${slot.room_id}_${slot.booking_date}_${slot.hour}`
        const existing = latestSlots.get(key)
        
        // Keep the slot with the most recent scrape_timestamp
        if (!existing || slot.scrape_timestamp > existing.scrape_timestamp) {
          latestSlots.set(key, slot)
        }
      })

      // Convert back to array and apply business hours filtering
      const allSlots = Array.from(latestSlots.values())
      
      // Filter by business operating hours
      const businessHoursFiltered = allSlots.filter(slot => isWithinBusinessHours(slot))
      
      // Sort the filtered results
      const result = businessHoursFiltered.sort((a, b) => {
        const dateCompare = a.booking_date.localeCompare(b.booking_date)
        if (dateCompare !== 0) return dateCompare
        return a.hour.localeCompare(b.hour)
      })

      console.log(`✅ Filtered room slots: ${result.length} of ${data.length} slots (${allSlots.length} after business filtering, ${businessHoursFiltered.length} after hours filtering)`)

      return result
    } catch (error) {
      console.error('❌ PRODUCTION ERROR: Failed to fetch room slots from database:', error)
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get business locations from the room_slots data
  static async getBusinessLocations() {
    // Define the expected businesses with common variations
    const expectedBusinessVariations = [
      ['Cracked It', 'Cracked IT', 'cracked it', 'cracked-it'],
      ['Green Light Escape', 'green light escape', 'green-light-escape'],
      ['iEscape Rooms', 'I Escape', 'iescape rooms', 'i-escape'],
      ['The Exit Games', 'Exit Games', 'the exit games', 'exit-games']
    ]
    
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

      // Filter to only include expected businesses (flexible matching)
      const filteredData = (data || []).filter(business => 
        expectedBusinessVariations.some(variations => 
          variations.some(variation => 
            this.normalizeBusinessName(business.business_name) === this.normalizeBusinessName(variation)
          )
        )
      )

      console.log(`✅ Filtered business locations: ${filteredData.length} of ${data?.length || 0} businesses`)
      console.log('Raw businesses from DB:', data?.map(b => b.business_name))
      console.log('Filtered businesses:', filteredData.map(b => b.business_name))

      return filteredData
    } catch (error) {
      console.error('❌ PRODUCTION ERROR: Failed to fetch business locations from database:', error)
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get rooms from the room_slots data
  static async getRooms(businessName?: string) {
    // Define the expected businesses with common variations
    const expectedBusinessVariations = [
      ['Cracked It', 'Cracked IT', 'cracked it', 'cracked-it'],
      ['Green Light Escape', 'green light escape', 'green-light-escape'],
      ['iEscape Rooms', 'I Escape', 'iescape rooms', 'i-escape'],
      ['The Exit Games', 'Exit Games', 'the exit games', 'exit-games']
    ]
    
    try {
      // Get unique rooms from Room Slots table since Rooms table doesn't exist
      let query = supabase
        .from('Room Slots')
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

      if (!data || data.length === 0) {
        console.log('No room data found in Room Slots table')
        return []
      }

      // Extract unique rooms (deduplicate by room_id)
      const uniqueRooms = new Map<string, any>()
      
      data.forEach(slot => {
        if (!uniqueRooms.has(slot.room_id)) {
          uniqueRooms.set(slot.room_id, {
            room_id: slot.room_id,
            room_name: slot.room_name,
            business_name: slot.business_name
          })
        }
      })

      const allRooms = Array.from(uniqueRooms.values())

      // Filter to only include rooms from expected businesses (flexible matching)
      const filteredData = allRooms.filter(room => 
        expectedBusinessVariations.some(variations => 
          variations.some(variation => 
            this.normalizeBusinessName(room.business_name) === this.normalizeBusinessName(variation)
          )
        )
      )

      console.log(`✅ Filtered rooms: ${filteredData.length} of ${allRooms.length} unique rooms`)
      console.log('Raw rooms from DB (unique business names):', Array.from(new Set(allRooms.map(r => r.business_name))))
      console.log('Filtered rooms business names:', Array.from(new Set(filteredData.map(r => r.business_name))))

      return filteredData
    } catch (error) {
      console.error('❌ PRODUCTION ERROR: Failed to fetch rooms from database:', error)
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

  // NEW: Get time-series booking changes for real-time tracking
  static async getBookingTimeSeries(roomId: string, bookingDate: string, hour: string) {
    try {
      const { data, error } = await supabase
        .from('Room Slots')
        .select('*')
        .eq('room_id', roomId)
        .eq('booking_date', bookingDate)
        .eq('hour', hour)
        .order('scrape_timestamp', { ascending: true })

      if (error) {
        console.error('Error fetching booking time series:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getBookingTimeSeries:', error)
      return []
    }
  }

  // NEW: Get operating hours analysis
  static async getOperatingHoursAnalysis(businessName?: string, startDate?: string, endDate?: string) {
    const slots = await this.getRoomSlots(startDate, endDate, businessName)
    
    // Group by business and analyze first/last hours
    const businessAnalysis = new Map()

    slots.forEach(slot => {
      if (!businessAnalysis.has(slot.business_name)) {
        businessAnalysis.set(slot.business_name, {
          business_name: slot.business_name,
          hourly_data: new Map(),
          first_hours: [],
          last_hours: []
        })
      }

      const business = businessAnalysis.get(slot.business_name)
      const hour = parseInt(slot.hour.split(':')[0])
      
      if (!business.hourly_data.has(hour)) {
        business.hourly_data.set(hour, {
          hour,
          total_slots: 0,
          booked_slots: 0,
          dates: new Set()
        })
      }

      const hourData = business.hourly_data.get(hour)
      hourData.total_slots++
      hourData.dates.add(slot.booking_date)
      
      if (!slot.is_available) {
        hourData.booked_slots++
      }
    })

    // Query Supabase Business Location table for operating hours
    let businessLocations: any[] = []
    try {
      const { data, error } = await supabase
        .from('Business Location')
        .select('business_name, open_time, close_time')

      if (error) {
        console.error('❌ Error fetching business locations for operating hours:', error)
      } else {
        businessLocations = data || []
        console.log('📍 Business locations with hours:', businessLocations)
      }
    } catch (error) {
      console.error('❌ Error querying business locations:', error)
    }

    // Calculate operating hours from Supabase Business Location table or fallback to booking data
    businessAnalysis.forEach((business, businessKey) => {
      // Find business location data for official operating hours
      const businessLocation = businessLocations.find((b: any) => 
        this.normalizeBusinessName(b.business_name) === this.normalizeBusinessName(businessKey)
      )
      
      let firstHour: number, lastHour: number
      
      if (businessLocation?.open_time && businessLocation?.close_time) {
        // Use official operating hours from Supabase Business Location table
        firstHour = parseInt(businessLocation.open_time.split(':')[0])
        lastHour = parseInt(businessLocation.close_time.split(':')[0])
        console.log(`📅 Using official hours for ${businessKey}: ${firstHour}:00 - ${lastHour}:00`)
      } else {
        // Fallback to actual booking data hours
        const hours = Array.from(business.hourly_data.keys()).sort((a: number, b: number) => a - b)
        firstHour = hours[0]
        lastHour = hours[hours.length - 1]
        console.log(`⚠️ No official hours found for ${businessKey}, using booking data: ${firstHour}:00 - ${lastHour}:00`)
      }

      business.operating_hours = {
        first_hour: firstHour,
        last_hour: lastHour,
        total_operating_hours: lastHour - firstHour + 1,
        source: businessLocation?.open_time && businessLocation?.close_time ? 'official' : 'booking_data'
      }

      // Get first hour performance (Mon-Fri for morning expansion analysis)
      const firstHourData = business.hourly_data.get(firstHour)
      if (firstHourData) {
        business.first_hour_performance = {
          hour: firstHour,
          utilization_rate: firstHourData.total_slots > 0 ? 
            (firstHourData.booked_slots / firstHourData.total_slots) * 100 : 0,
          total_bookings: firstHourData.booked_slots,
          total_slots: firstHourData.total_slots
        }
      }

      // Get last hour performance (Sun-Thu for evening expansion analysis)
      const lastHourData = business.hourly_data.get(lastHour)
      if (lastHourData) {
        business.last_hour_performance = {
          hour: lastHour,
          utilization_rate: lastHourData.total_slots > 0 ? 
            (lastHourData.booked_slots / lastHourData.total_slots) * 100 : 0,
          total_bookings: lastHourData.booked_slots,
          total_slots: lastHourData.total_slots
        }
      }

      // Clean up the hourly_data Map for JSON serialization
      business.hourly_breakdown = Array.from(business.hourly_data.values()).map(data => ({
        hour: data.hour,
        total_slots: data.total_slots,
        booked_slots: data.booked_slots,
        utilization_rate: data.total_slots > 0 ? (data.booked_slots / data.total_slots) * 100 : 0,
        unique_dates: data.dates.size
      }))
      
      delete business.hourly_data
    })

    return Array.from(businessAnalysis.values())
  }

  // NEW: Get morning/evening booking trends by day of week
  static async getMorningEveningTrends(businessName?: string, startDate?: string, endDate?: string) {
    const slots = await this.getRoomSlots(startDate, endDate, businessName)
    const operatingHours = await this.getOperatingHoursAnalysis(businessName, startDate, endDate)
    
    const trends = new Map()

    slots.forEach(slot => {
      const date = new Date(slot.booking_date)
      const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
      const hour = parseInt(slot.hour.split(':')[0])
      
      // Find the business operating hours
      const businessHours = operatingHours.find(b => b.business_name === slot.business_name)
      if (!businessHours) return

      const isFirstHour = hour === businessHours.operating_hours.first_hour
      const isLastHour = hour === businessHours.operating_hours.last_hour

      if (!isFirstHour && !isLastHour) return

      const key = `${slot.business_name}_${dayOfWeek}_${isFirstHour ? 'first' : 'last'}`
      
      if (!trends.has(key)) {
        trends.set(key, {
          business_name: slot.business_name,
          day_of_week: dayOfWeek,
          day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
          hour_type: isFirstHour ? 'first' : 'last',
          hour: hour,
          total_slots: 0,
          booked_slots: 0
        })
      }

      const trend = trends.get(key)
      trend.total_slots++
      
      if (!slot.is_available) {
        trend.booked_slots++
      }
    })

    // Calculate utilization rates and identify expansion opportunities
    const trendAnalysis = Array.from(trends.values()).map(trend => ({
      ...trend,
      utilization_rate: trend.total_slots > 0 ? (trend.booked_slots / trend.total_slots) * 100 : 0
    }))

    return trendAnalysis
  }

  // NEW: Detect expansion/contraction opportunities
  static async getExpansionOpportunities(businessName?: string, startDate?: string, endDate?: string) {
    const morningEveningTrends = await this.getMorningEveningTrends(businessName, startDate, endDate)
    const operatingHours = await this.getOperatingHoursAnalysis(businessName, startDate, endDate)
    
    const opportunities = []

    operatingHours.forEach(business => {
      const businessTrends = morningEveningTrends.filter(t => t.business_name === business.business_name)
      
      // Morning expansion opportunity (Mon-Fri first hour >= 70% utilization)
      const morningTrends = businessTrends.filter(t => 
        t.hour_type === 'first' && 
        t.day_of_week >= 1 && t.day_of_week <= 5 // Mon-Fri
      )
      
      const avgMorningUtilization = morningTrends.length > 0 
        ? morningTrends.reduce((sum, t) => sum + t.utilization_rate, 0) / morningTrends.length 
        : 0

      if (avgMorningUtilization >= 70) {
        opportunities.push({
          business_name: business.business_name,
          type: 'morning_expansion',
          current_first_hour: business.operating_hours.first_hour,
          suggested_new_hour: business.operating_hours.first_hour - 1,
          avg_utilization: avgMorningUtilization,
          confidence: avgMorningUtilization > 85 ? 'high' : 'medium',
          reason: `First hour (${business.operating_hours.first_hour}:00) shows ${avgMorningUtilization.toFixed(1)}% utilization on weekdays`
        })
      }

      // Evening expansion opportunity (Sun-Thu last hour >= 70% utilization)
      const eveningTrends = businessTrends.filter(t => 
        t.hour_type === 'last' && 
        (t.day_of_week === 0 || (t.day_of_week >= 1 && t.day_of_week <= 4)) // Sun, Mon-Thu
      )
      
      const avgEveningUtilization = eveningTrends.length > 0 
        ? eveningTrends.reduce((sum, t) => sum + t.utilization_rate, 0) / eveningTrends.length 
        : 0

      if (avgEveningUtilization >= 70) {
        opportunities.push({
          business_name: business.business_name,
          type: 'evening_expansion',
          current_last_hour: business.operating_hours.last_hour,
          suggested_new_hour: business.operating_hours.last_hour + 1,
          avg_utilization: avgEveningUtilization,
          confidence: avgEveningUtilization > 85 ? 'high' : 'medium',
          reason: `Last hour (${business.operating_hours.last_hour}:00) shows ${avgEveningUtilization.toFixed(1)}% utilization on Sun-Thu`
        })
      }

      // Contraction opportunities (< 30% utilization)
      if (business.first_hour_performance?.utilization_rate < 30) {
        opportunities.push({
          business_name: business.business_name,
          type: 'morning_contraction',
          current_first_hour: business.operating_hours.first_hour,
          suggested_new_hour: business.operating_hours.first_hour + 1,
          avg_utilization: business.first_hour_performance.utilization_rate,
          confidence: business.first_hour_performance.utilization_rate < 15 ? 'high' : 'medium',
          reason: `First hour shows only ${business.first_hour_performance.utilization_rate.toFixed(1)}% utilization`
        })
      }

      if (business.last_hour_performance?.utilization_rate < 30) {
        opportunities.push({
          business_name: business.business_name,
          type: 'evening_contraction',
          current_last_hour: business.operating_hours.last_hour,
          suggested_new_hour: business.operating_hours.last_hour - 1,
          avg_utilization: business.last_hour_performance.utilization_rate,
          confidence: business.last_hour_performance.utilization_rate < 15 ? 'high' : 'medium',
          reason: `Last hour shows only ${business.last_hour_performance.utilization_rate.toFixed(1)}% utilization`
        })
      }
    })

    return opportunities
  }
} 