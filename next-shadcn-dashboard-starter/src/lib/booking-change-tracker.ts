import { supabase } from './supabase'
import type { RoomSlot, BookingChange } from './supabase'

export class BookingChangeTracker {
  /**
   * Generate unique scrape ID for tracking a complete scraping session
   */
  static generateScrapeId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const random = Math.random().toString(36).substr(2, 9)
    return `scrape_${timestamp}_${random}`
  }

  /**
   * Generate unique ID for room slot entry with enhanced uniqueness
   */
  static generateSlotId(roomId: string, bookingDate: string, hour: string, scrapeTimestamp: string): string {
    // Convert room_id to safe format (replace ! with EXCL)
    const safeRoomId = roomId.toLowerCase().replace(/!/g, 'excl')
    
    // Format date and time
    const date = bookingDate.replace(/-/g, '')
    const time = hour.replace(/:/g, '')
    
    // Create timestamp suffix from scrape timestamp with milliseconds
    const timestamp = new Date(scrapeTimestamp).getTime() // Unix timestamp in milliseconds
    
    // Add multiple entropy sources for better uniqueness
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const randomSuffix = Math.random().toString(36).substr(2, 6)
    
    return `${safeRoomId}_${date}_${time}_${timestamp}_${randomNum}_${randomSuffix}`
  }

  /**
   * Insert room slots data with time-series support (original method)
   * Each scrape creates new records instead of updating existing ones
   */
  static async insertRoomSlotsWithTimeSeries(slots: Omit<RoomSlot, 'id' | 'scrape_timestamp' | 'scrape_id'>[], scrapeId: string): Promise<RoomSlot[]> {
    const scrapeTimestamp = new Date().toISOString()
    
    const slotsWithTimestamp = slots.map(slot => ({
      ...slot,
      id: this.generateSlotId(slot.room_id, slot.booking_date, slot.hour, scrapeTimestamp),
      scrape_timestamp: scrapeTimestamp,
      scrape_id: scrapeId
    }))

    const { data, error } = await supabase
      .from('Room Slots')
      .insert(slotsWithTimestamp)
      .select()

    if (error) {
      console.error('❌ Error inserting room slots with time-series:', error)
      throw error
    }

    console.log(`✅ Inserted ${data?.length || 0} room slots with scrape_id: ${scrapeId}`)
    return data || []
  }

  /**
   * Insert room slots data with UPSERT to handle duplicates gracefully
   * This method should be used by N8N to avoid duplicate key errors
   */
  static async upsertRoomSlotsWithTimeSeries(slots: Omit<RoomSlot, 'id' | 'scrape_timestamp' | 'scrape_id'>[], scrapeId: string): Promise<RoomSlot[]> {
    const scrapeTimestamp = new Date().toISOString()
    
    const slotsWithTimestamp = slots.map(slot => ({
      ...slot,
      id: this.generateSlotId(slot.room_id, slot.booking_date, slot.hour, scrapeTimestamp),
      scrape_timestamp: scrapeTimestamp,
      scrape_id: scrapeId
    }))

    // Use UPSERT to handle duplicates - update on conflict
    const { data, error } = await supabase
      .from('Room Slots')
      .upsert(slotsWithTimestamp, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error('❌ Error upserting room slots with time-series:', error)
      throw error
    }

    console.log(`✅ Upserted ${data?.length || 0} room slots with scrape_id: ${scrapeId}`)
    return data || []
  }

  /**
   * Safe insert method that checks for existing entries first
   * Alternative to UPSERT for better duplicate handling
   */
  static async safeInsertRoomSlots(slots: Omit<RoomSlot, 'id' | 'scrape_timestamp' | 'scrape_id'>[], scrapeId: string): Promise<RoomSlot[]> {
    const scrapeTimestamp = new Date().toISOString()
    const uniqueSlots: any[] = []
    
    for (const slot of slots) {
      // Generate ID for this slot
      const id = this.generateSlotId(slot.room_id, slot.booking_date, slot.hour, scrapeTimestamp)
      
      // Check if this exact ID already exists
      const { data: existing } = await supabase
        .from('Room Slots')
        .select('id')
        .eq('id', id)
        .single()
      
      if (!existing) {
        uniqueSlots.push({
          ...slot,
          id,
          scrape_timestamp: scrapeTimestamp,
          scrape_id: scrapeId
        })
      } else {
        console.log(`⚠️ Skipping duplicate slot with ID: ${id}`)
      }
    }

    if (uniqueSlots.length === 0) {
      console.log('⚠️ No new slots to insert - all were duplicates')
      return []
    }

    const { data, error } = await supabase
      .from('Room Slots')
      .insert(uniqueSlots)
      .select()

    if (error) {
      console.error('❌ Error inserting unique room slots:', error)
      throw error
    }

    console.log(`✅ Safely inserted ${data?.length || 0} unique room slots with scrape_id: ${scrapeId}`)
    return data || []
  }

  /**
   * Detect changes between current and previous scrape
   * Compares latest scrape with the one before it
   */
  static async detectAndLogChanges(newData: RoomSlot[], scrapeId: string): Promise<BookingChange[]> {
    const changes: BookingChange[] = []
    
    for (const slot of newData) {
      try {
        // Get the two most recent entries for this slot
        const { data: previousSlots, error } = await supabase
          .from('Room Slots')
          .select('available_slots, scrape_timestamp, scrape_id')
          .eq('room_id', slot.room_id)
          .eq('booking_date', slot.booking_date)
          .eq('hour', slot.hour)
          .order('scrape_timestamp', { ascending: false })
          .limit(2)

        if (error) {
          console.error(`❌ Error fetching previous data for ${slot.room_id}:`, error)
          continue
        }

        // Check if we have both current and previous data
        if (previousSlots && previousSlots.length >= 2) {
          const current = previousSlots[0] // Most recent (current scrape)
          const previous = previousSlots[1] // Previous scrape
          
          // Only log if there's an actual change
          if (current.available_slots !== previous.available_slots) {
            const changeAmount = current.available_slots - previous.available_slots
            
            changes.push({
              room_id: slot.room_id,
              booking_date: slot.booking_date,
              hour: slot.hour,
              previous_available_slots: previous.available_slots,
              current_available_slots: current.available_slots,
              change_amount: changeAmount,
              change_timestamp: slot.scrape_timestamp,
              scrape_id: scrapeId,
              business_name: slot.business_name,
              room_name: slot.room_name
            })

            console.log(`📊 Change detected for ${slot.room_name} on ${slot.booking_date} at ${slot.hour}: ${previous.available_slots} → ${current.available_slots} (${changeAmount > 0 ? '+' : ''}${changeAmount})`)
          }
        }
      } catch (error) {
        console.error(`❌ Error processing change detection for slot ${slot.room_id}:`, error)
      }
    }
    
    // Insert detected changes into Booking Changes table (if it exists)
    if (changes.length > 0) {
      try {
        const { error } = await supabase
          .from('Booking Changes')
          .insert(changes)

        if (error) {
          console.error('❌ Error inserting booking changes:', error)
        } else {
          console.log(`✅ Logged ${changes.length} booking changes`)
        }
      } catch (error) {
        console.log('⚠️ Booking Changes table not found, skipping change logging')
      }
    }
    
    return changes
  }

  /**
   * Get booking changes for a specific time range
   */
  static async getBookingChanges(
    roomId?: string, 
    startTime?: string, 
    endTime?: string,
    businessName?: string
  ): Promise<BookingChange[]> {
    let query = supabase
      .from('Booking Changes')
      .select('*')
      .order('change_timestamp', { ascending: true })

    if (roomId) {
      query = query.eq('room_id', roomId)
    }

    if (businessName) {
      query = query.eq('business_name', businessName)
    }

    if (startTime) {
      query = query.gte('change_timestamp', startTime)
    }

    if (endTime) {
      query = query.lte('change_timestamp', endTime)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Error fetching booking changes:', error)
      return []
    }

    return data || []
  }

  /**
   * Get time-series data for a specific slot
   */
  static async getSlotTimeSeries(
    roomId: string, 
    bookingDate: string, 
    hour: string
  ): Promise<Array<{available_slots: number, scrape_timestamp: string, scrape_id: string}>> {
    const { data, error } = await supabase
      .from('Room Slots')
      .select('available_slots, scrape_timestamp, scrape_id')
      .eq('room_id', roomId)
      .eq('booking_date', bookingDate)
      .eq('hour', hour)
      .order('scrape_timestamp', { ascending: true })

    if (error) {
      console.error('❌ Error fetching slot time series:', error)
      return []
    }

    return data || []
  }

  /**
   * Get latest availability for all slots (most recent scrape only)
   */
  static async getLatestAvailability(businessName?: string): Promise<RoomSlot[]> {
    // First, get the most recent scrape_id
    let scrapeQuery = supabase
      .from('Room Slots')
      .select('scrape_id, scrape_timestamp')
      .order('scrape_timestamp', { ascending: false })
      .limit(1)

    if (businessName) {
      scrapeQuery = scrapeQuery.eq('business_name', businessName)
    }

    const { data: latestScrape } = await scrapeQuery

    if (!latestScrape || latestScrape.length === 0) {
      return []
    }

    const latestScrapeId = latestScrape[0].scrape_id

    // Get all slots from the latest scrape
    let slotsQuery = supabase
      .from('Room Slots')
      .select('*')
      .eq('scrape_id', latestScrapeId)

    if (businessName) {
      slotsQuery = slotsQuery.eq('business_name', businessName)
    }

    const { data, error } = await slotsQuery

    if (error) {
      console.error('❌ Error fetching latest availability:', error)
      return []
    }

    return data || []
  }

  /**
   * Get real-time booking velocity (changes per hour)
   */
  static async getBookingVelocity(
    businessName?: string,
    hours: number = 24
  ): Promise<Array<{hour: string, total_changes: number, bookings_made: number, cancellations: number}>> {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    let query = supabase
      .from('Booking Changes')
      .select('change_amount, change_timestamp')
      .gte('change_timestamp', startTime)

    if (businessName) {
      query = query.eq('business_name', businessName)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Error fetching booking velocity:', error)
      return []
    }

    // Group changes by hour
    const hourlyData = new Map<string, {total_changes: number, bookings_made: number, cancellations: number}>()

    data?.forEach(change => {
      const hour = new Date(change.change_timestamp).toISOString().slice(0, 13) + ':00:00'
      
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, { total_changes: 0, bookings_made: 0, cancellations: 0 })
      }

      const hourData = hourlyData.get(hour)!
      hourData.total_changes++

      if (change.change_amount < 0) {
        hourData.bookings_made += Math.abs(change.change_amount)
      } else {
        hourData.cancellations += change.change_amount
      }
    })

    return Array.from(hourlyData.entries()).map(([hour, stats]) => ({
      hour,
      ...stats
    })).sort((a, b) => a.hour.localeCompare(b.hour))
  }

  /**
   * N8N Integration: Simple method to handle scraped data from N8N
   * Call this method from N8N after saving data to Room Slots table
   * It will automatically detect changes and log them
   */
  static async processN8NScrape(businessName?: string): Promise<{
    processed: number,
    changes: number,
    latestScrapeId: string
  }> {
    console.log(`🤖 Processing N8N scrape for ${businessName || 'all businesses'}...`)
    
    try {
      // Get the latest scrape data (most recent timestamp)
      let query = supabase
        .from('Room Slots')
        .select('*')
        .order('scrape_timestamp', { ascending: false })
      
      if (businessName) {
        query = query.eq('business_name', businessName)
      }
      
      const { data: latestData, error: latestError } = await query.limit(100)
      
      if (latestError) {
        console.error('❌ Error fetching latest scrape data:', latestError)
        throw latestError
      }
      
      if (!latestData || latestData.length === 0) {
        console.log('⚠️ No data found for processing')
        return { processed: 0, changes: 0, latestScrapeId: '' }
      }
      
      // Get the latest scrape timestamp and scrape_id
      const latestTimestamp = latestData[0].scrape_timestamp
      const latestScrapeId = latestData[0].scrape_id || this.generateScrapeId()
      
      // Get all data from the latest scrape
      let latestScrapeQuery = supabase
        .from('Room Slots')
        .select('*')
        .eq('scrape_timestamp', latestTimestamp)
      
      if (businessName) {
        latestScrapeQuery = latestScrapeQuery.eq('business_name', businessName)
      }
      
      const { data: currentScrapeData, error: currentError } = await latestScrapeQuery
      
      if (currentError) {
        console.error('❌ Error fetching current scrape data:', currentError)
        throw currentError
      }
      
      // Process changes for this scrape
      const changes = await this.detectAndLogChanges(currentScrapeData || [], latestScrapeId)
      
      console.log(`✅ N8N scrape processed: ${currentScrapeData?.length || 0} slots, ${changes.length} changes detected`)
      
      return {
        processed: currentScrapeData?.length || 0,
        changes: changes.length,
        latestScrapeId
      }
      
    } catch (error) {
      console.error('❌ Error processing N8N scrape:', error)
      throw error
    }
  }

  /**
   * N8N Webhook Handler: Use this as an HTTP endpoint for N8N to call after scraping
   * This ensures change detection runs automatically after each scrape
   */
  static async handleN8NWebhook(requestBody: {
    business_name?: string,
    scrape_completed: boolean,
    timestamp: string
  }): Promise<{
    success: boolean,
    message: string,
    data?: any
  }> {
    try {
      if (!requestBody.scrape_completed) {
        return {
          success: false,
          message: 'Scrape not completed'
        }
      }
      
      console.log(`🔗 N8N webhook received for ${requestBody.business_name || 'all businesses'} at ${requestBody.timestamp}`)
      
      // Wait a moment for N8N to finish inserting all data
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Process the scrape
      const result = await this.processN8NScrape(requestBody.business_name)
      
      return {
        success: true,
        message: `Processed ${result.processed} slots, detected ${result.changes} changes`,
        data: result
      }
      
    } catch (error) {
      console.error('❌ N8N webhook error:', error)
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
} 