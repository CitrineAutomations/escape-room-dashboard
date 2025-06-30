'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Users, Clock, RefreshCw, ArrowLeft, MapPin, Phone, Activity, BarChart3, AlertTriangle, CheckCircle, ArrowUp, ArrowDown, Calendar, Building } from 'lucide-react'
import { format } from 'date-fns'
import { DateRangePicker } from '@/components/date-range-picker'
import type { DateRange } from 'react-day-picker'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { EscapeRoomService } from '@/lib/escape-room-service'

// Helper functions for business hours and operating status
const getBusinessHours = (businessName: string) => {
  const config = EscapeRoomService.getBusinessHoursConfig()
  const normalizedName = EscapeRoomService.normalizeBusinessName(businessName)
  
  for (const [configName, hours] of Object.entries(config)) {
    if (EscapeRoomService.normalizeBusinessName(configName) === normalizedName) {
      return { businessName: configName, hours }
    }
  }
  return null
}

const isCurrentlyOpen = (businessHours: any) => {
  if (!businessHours) return false
  
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayName = dayNames[dayOfWeek] as keyof typeof businessHours.hours
  
  const todayHours = businessHours.hours[dayName]
  if (!todayHours || todayHours === null) {
    return false // Closed today
  }
  
  const currentTime = now.getHours() * 60 + now.getMinutes()
  const [openHour, openMin] = todayHours.open.split(':').map(Number)
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number)
  
  const openTime = openHour * 60 + openMin
  let closeTime = closeHour * 60 + closeMin
  
  // Handle midnight (24:00)
  if (closeHour === 24) {
    closeTime = 24 * 60
  }
  
  return currentTime >= openTime && currentTime <= closeTime
}

const formatBusinessHours = (hours: any) => {
  if (!hours) return null
  
  const days = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' }
  ]
  
  const formatTime = (time: string) => {
    if (time === '24:00') return '12:00 AM'
    const [hour, min] = time.split(':').map(Number)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${min.toString().padStart(2, '0')} ${ampm}`
  }
  
  return days.map(day => {
    const dayHours = hours[day.key as keyof typeof hours]
    if (!dayHours || dayHours === null) {
      return { day: day.label, status: 'CLOSED' }
    }
    
    return {
      day: day.label,
      status: 'OPEN',
      open: formatTime(dayHours.open),
      close: formatTime(dayHours.close)
    }
  })
}

export default function BusinessDashboard() {
  const params = useParams()
  const businessName = decodeURIComponent(params.businessId as string).trim()
  
  // Map business names between different tables
  const mapBusinessName = (name: string) => {
    const mapping: { [key: string]: string } = {
      'iEscape Rooms': 'I Escape', // Map from URL to Business Location table
      'I Escape': 'iEscape Rooms', // Map from Business Location to Room Slots table
      'Cracked It': 'Cracked IT',  // Map from URL to Business Location table
      'Cracked IT': 'Cracked It',  // Map from Business Location to Room Slots table
      'Green Light Escape': 'Green Light Escape' // Ensure consistent naming
    }
    const mapped = mapping[name] || name
    console.log(`🔄 Business name mapping: "${name}" -> "${mapped}"`)
    return mapped
  }
  
  console.log('🔍 Decoded business name:', JSON.stringify(businessName)) // Debug log
  
  const [businessInfo, setBusinessInfo] = useState<any>(null)
  const [rooms, setRooms] = useState<any[]>([])
  const [roomSlots, setRoomSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  })
  const [operatingHours, setOperatingHours] = useState<any>(null)
  const [expansionOpportunities, setExpansionOpportunities] = useState<any[]>([])
  const [morningEveningTrends, setMorningEveningTrends] = useState<any[]>([])

  const { toast } = useToast()

  // Business hours and operating status
  const businessHours = getBusinessHours(businessName)
  const isOpen = isCurrentlyOpen(businessHours)
  const formattedHours = formatBusinessHours(businessHours?.hours)

  // Auto-refresh every 5 minutes (300000ms) to match scraping frequency
  const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000

  const loadBusinessData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      console.log('🔍 Looking for business:', businessName)
      console.log('🔍 Raw URL parameter:', params.businessId)
      console.log('🔍 Expected businesses: Cracked It, Green Light Escape, iEscape Rooms, The Exit Games')

      // Use business name from URL directly
      setBusinessInfo({ business_name: businessName })

      // Get rooms for this business using EscapeRoomService (includes filtering)
      console.log('🔍 Fetching rooms for business:', businessName)
      const roomsData = await EscapeRoomService.getRooms(businessName)
      console.log('✅ Rooms found:', roomsData?.length || 0, 'rooms')
      
      if (roomsData && roomsData.length > 0) {
        console.log('🏠 Sample room data:', roomsData[0])
        console.log('🏠 Unique business names in rooms:', Array.from(new Set(roomsData.map(r => r.business_name))))
      } else {
        console.log('⚠️ No rooms data found for business:', businessName)
        console.log('🔍 This might indicate a business name mismatch between URL and database')
      }
      
      setRooms(roomsData || [])

      // Get room slots data with date filtering using EscapeRoomService (includes filtering)
      const startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined
      const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined

      console.log(`🔍 Fetching room slots for ${businessName} (${startDate} to ${endDate})`)
      const slotsData = await EscapeRoomService.getRoomSlots(startDate, endDate, businessName)
      console.log('✅ Room slots found:', slotsData?.length || 0, 'slots')
      
      if (slotsData && slotsData.length > 0) {
        console.log('📋 Sample slot data:', slotsData[0])
        console.log('📋 Unique business names in slots:', Array.from(new Set(slotsData.map(s => s.business_name))))
      } else {
        console.log('⚠️ No room slots data found for business:', businessName)
        console.log('🔍 Try checking if the business name matches exactly in the database')
      }
      
      setRoomSlots(slotsData || [])

      // Get operating hours analysis
      try {
        const [operatingHoursData, expansionOpportunitiesData, morningEveningTrendsData] = await Promise.all([
          EscapeRoomService.getOperatingHoursAnalysis(businessName, startDate, endDate),
          EscapeRoomService.getExpansionOpportunities(businessName, startDate, endDate),
          EscapeRoomService.getMorningEveningTrends(businessName, startDate, endDate)
        ])

        const businessOperatingHours = operatingHoursData.find(b => b.business_name === businessName)
        setOperatingHours(businessOperatingHours)
        setExpansionOpportunities(expansionOpportunitiesData.filter(o => o.business_name === businessName))
        setMorningEveningTrends(morningEveningTrendsData.filter(t => t.business_name === businessName))
        
        console.log('✅ Operating hours analysis completed')
      } catch (error) {
        console.error('⚠️ Error loading operating hours analysis:', error)
        // Don't fail the whole load if this fails
      }

      setLastUpdated(new Date())

      toast({
        title: isManualRefresh ? "Manual Refresh Complete" : "Data Loaded",
        description: `Loaded ${slotsData?.length || 0} time slots for ${businessName}`,
      })

    } catch (error) {
      console.error('❌ Error loading business data:', error)
      toast({
        title: "Error",
        description: "Failed to load business data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [businessName, dateRange, toast])

  // Initial load
  useEffect(() => {
    loadBusinessData()
  }, [loadBusinessData])

  // Auto-refresh timer
  useEffect(() => {
    const interval = setInterval(() => {
      loadBusinessData()
    }, AUTO_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [loadBusinessData])

  const handleManualRefresh = () => {
    loadBusinessData(true)
  }

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
  }

  // Calculate real-time availability metrics
  const calculateAvailabilityMetrics = () => {
    if (!roomSlots.length) return { 
      totalSlots: 0, 
      availableSlots: 0, 
      bookedSlots: 0, 
      utilizationRate: 0,
      totalCapacity: 0,
      bookedCapacity: 0,
      availableCapacity: 0
    }

    const totalSlots = roomSlots.length
    const availableSlots = roomSlots.filter(slot => slot.is_available).length
    const bookedSlots = totalSlots - availableSlots
    const utilizationRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0

    // Calculate capacity metrics
    const totalCapacity = roomSlots.reduce((sum, slot) => sum + (slot.total_capacity || 0), 0)
    const bookedCapacity = roomSlots.reduce((sum, slot) => sum + (slot.booked_capacity || 0), 0)
    const availableCapacity = roomSlots.reduce((sum, slot) => sum + (slot.available_slots || 0), 0)

    return { 
      totalSlots, 
      availableSlots, 
      bookedSlots, 
      utilizationRate,
      totalCapacity,
      bookedCapacity,
      availableCapacity
    }
  }



  // Calculate room performance with capacity insights
  const calculateRoomPerformance = () => {
    const roomMetrics = rooms.map((room: any) => {
      const roomSlotsForRoom = roomSlots.filter((slot: any) => slot.room_id === room.room_id)
      const totalSlots = roomSlotsForRoom.length
      const bookedSlots = roomSlotsForRoom.filter((slot: any) => !slot.is_available).length
      const utilizationRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0

      // Calculate capacity utilization
      const totalCapacity = roomSlotsForRoom.reduce((sum, slot) => sum + (slot.total_capacity || 0), 0)
      const bookedCapacity = roomSlotsForRoom.reduce((sum, slot) => sum + (slot.booked_capacity || 0), 0)
      const capacityUtilization = totalCapacity > 0 ? (bookedCapacity / totalCapacity) * 100 : 0

      return {
        room_id: room.room_id,
        room_name: room.room_name,
        total_slots: totalSlots,
        booked_slots: bookedSlots,
        utilization_rate: utilizationRate,
        capacity: room.capacity,
        capacity_utilization: capacityUtilization,
        total_capacity: totalCapacity,
        booked_capacity: bookedCapacity
      }
    })

    return roomMetrics.sort((a, b) => b.utilization_rate - a.utilization_rate)
  }

  // Calculate peak hours and demand patterns
  const calculateDemandPatterns = () => {
    const hourlyData = new Map()
    const dailyData = new Map()

    roomSlots.forEach((slot: any) => {
      // Hourly patterns
      const hour = slot.hour?.split(':')[0] || '0'
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, { total: 0, booked: 0 })
      }
      const hourData = hourlyData.get(hour)
      hourData.total++
      if (!slot.is_available) {
        hourData.booked++
      }

      // Daily patterns
      const date = new Date(slot.booking_date)
      const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]
      
      if (!dailyData.has(dayName)) {
        dailyData.set(dayName, { total: 0, booked: 0 })
      }
      const dayData = dailyData.get(dayName)
      dayData.total++
      if (!slot.is_available) {
        dayData.booked++
      }
    })

    const peakHours = Array.from(hourlyData.entries()).map(([hour, data]: [string, any]) => ({
      hour: parseInt(hour),
      utilization_rate: data.total > 0 ? (data.booked / data.total) * 100 : 0,
      total_bookings: data.booked
    })).sort((a, b) => b.utilization_rate - a.utilization_rate).slice(0, 5)

    const peakDays = Array.from(dailyData.entries()).map(([day, data]: [string, any]) => ({
      day,
      utilization_rate: data.total > 0 ? (data.booked / data.total) * 100 : 0,
      total_bookings: data.booked
    })).sort((a, b) => b.utilization_rate - a.utilization_rate)

    return { peakHours, peakDays }
  }

  const metrics = calculateAvailabilityMetrics()
  const roomPerformance = calculateRoomPerformance()
  const topPerformingRooms = roomPerformance.slice(0, 3)
  const { peakHours, peakDays } = calculateDemandPatterns()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading business data...</p>
        </div>
      </div>
    )
  }

  if (!businessInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Business Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The business "{businessName}" could not be found in the database.
          </p>
          <Link href="/dashboard/businesses">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to All Businesses
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6 pb-12 overflow-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className='flex items-center justify-between space-y-2'>
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <Link href="/dashboard/businesses">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to All Businesses
              </Button>
            </Link>
          </div>
          <h2 className='text-2xl font-bold tracking-tight'>
            {businessInfo.business_name}
          </h2>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
            <span className="flex items-center space-x-1">
              <Activity className="h-3 w-3" />
              <span>Live Data (Updated every 15 mins)</span>
            </span>
            {lastUpdated && (
              <span>
                Last updated: {format(lastUpdated, 'MMM dd, HH:mm')}
              </span>
            )}
          </div>
        </div>
        <div className='hidden items-center space-x-2 md:flex'>
          <DateRangePicker 
            dateRange={dateRange} 
            onDateRangeChange={handleDateRangeChange}
          />
          <Button 
            onClick={handleManualRefresh} 
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className='md:hidden space-y-2'>
        <DateRangePicker 
          dateRange={dateRange} 
          onDateRangeChange={handleDateRangeChange}
        />
        <Button 
          onClick={handleManualRefresh} 
          disabled={refreshing}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Business Hours & Operating Status */}
      {businessHours && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Operating Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>Operating Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className={`font-semibold ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
                  {isOpen ? 'Currently Open' : 'Currently Closed'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                All displayed data is filtered to show only slots during business operating hours (EST).
              </p>
            </CardContent>
          </Card>

          {/* Business Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Business Hours (EST)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {formattedHours?.map((dayInfo, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{dayInfo.day}</span>
                    {dayInfo.status === 'CLOSED' ? (
                      <Badge variant="secondary" className="text-xs">CLOSED</Badge>
                    ) : (
                      <span className="text-muted-foreground">
                        {dayInfo.open} - {dayInfo.close}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-time Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Now</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.availableSlots.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.availableCapacity.toLocaleString()} spots open
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fully Booked</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.bookedSlots.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.bookedCapacity.toLocaleString()} people booked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.utilizationRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.bookedSlots.toLocaleString()} of {metrics.totalSlots.toLocaleString()} slots booked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Demand Patterns */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Peak Hours</CardTitle>
            <CardDescription>
              Highest demand time slots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {peakHours.map((hour, index) => (
                <div key={hour.hour} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">#{index + 1}</span>
                    </div>
                    <span className="font-medium">{hour.hour}:00</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">{hour.total_bookings} bookings</span>
                    <Badge variant={hour.utilization_rate > 70 ? "default" : "secondary"}>
                      {hour.utilization_rate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peak Days</CardTitle>
            <CardDescription>
              Busiest days of the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {peakDays.slice(0, 5).map((day, index) => (
                <div key={day.day} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">#{index + 1}</span>
                    </div>
                    <span className="font-medium">{day.day}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">{day.total_bookings} bookings</span>
                    <Badge variant={day.utilization_rate > 70 ? "default" : "secondary"}>
                      {day.utilization_rate.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
          </CardContent>
        </Card>
      </div>

      {/* Room Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Room Performance Analysis</CardTitle>
          <CardDescription>
            Detailed performance metrics for each escape room
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roomPerformance.map((room) => (
              <div key={room.room_id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{room.room_name}</h4>
                  <Badge variant={room.utilization_rate > 70 ? "default" : "secondary"}>
                    {room.utilization_rate.toFixed(1)}% utilization
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Time Slots</p>
                    <p className="font-medium">{room.booked_slots} / {room.total_slots}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Capacity Used</p>
                    <p className="font-medium">{room.booked_capacity} / {room.total_capacity}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Capacity Rate</p>
                    <p className="font-medium">{room.capacity_utilization.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max Capacity</p>
                    <p className="font-medium">{room.capacity} people</p>
                  </div>
                </div>
                <div className="mt-2">
                  <Progress value={room.utilization_rate} className="h-2" />
                </div>
              </div>
            ))}
          </div>
          </CardContent>
        </Card>

      {/* Operating Hours Analysis */}
      {operatingHours && (
        <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
              <CardTitle>Operating Hours Analysis</CardTitle>
            <CardDescription>
                Current operating schedule and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {operatingHours.operating_hours.first_hour}:00
                    </div>
                    <p className="text-sm text-blue-600">First Hour</p>
                    <p className="text-xs text-muted-foreground">
                      {operatingHours.first_hour_performance?.utilization_rate.toFixed(1)}% utilization
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {operatingHours.operating_hours.last_hour}:00
                    </div>
                    <p className="text-sm text-purple-600">Last Hour</p>
                    <p className="text-xs text-muted-foreground">
                      {operatingHours.last_hour_performance?.utilization_rate.toFixed(1)}% utilization
                    </p>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Operating Hours</span>
                    <span className="text-sm text-muted-foreground">
                      {operatingHours.operating_hours.total_operating_hours} hours/day
                    </span>
                      </div>
                  <div className="text-xs text-muted-foreground">
                    {operatingHours.operating_hours.first_hour}:00 - {operatingHours.operating_hours.last_hour}:00
                  </div>
                </div>
              </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
              <CardTitle>Expansion Opportunities</CardTitle>
              <CardDescription>
                AI-detected opportunities to optimize hours
              </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="space-y-3">
                {expansionOpportunities.length > 0 ? (
                  expansionOpportunities.map((opportunity, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      opportunity.type.includes('expansion') 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-orange-50 border-orange-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {opportunity.type.includes('expansion') ? (
                            <ArrowUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-orange-600" />
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              {opportunity.type.includes('morning') ? 'Morning' : 'Evening'} {' '}
                              {opportunity.type.includes('expansion') ? 'Expansion' : 'Contraction'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {opportunity.reason}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={opportunity.confidence === 'high' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {opportunity.confidence}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Suggested: {opportunity.type.includes('expansion') ? 'Add' : 'Remove'} {' '}
                        {opportunity.type.includes('morning') 
                          ? `${opportunity.suggested_new_hour}:00 slot` 
                          : `${opportunity.suggested_new_hour}:00 slot`
                        }
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm">No optimization opportunities detected</p>
                    <p className="text-xs">Current hours appear well-balanced</p>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Morning/Evening Trends */}
      {morningEveningTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Morning & Evening Trends</CardTitle>
            <CardDescription>
              First and last hour performance by day of week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {morningEveningTrends.map((trend, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{trend.day_name}</span>
                    <Badge 
                      variant={trend.utilization_rate > 70 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {trend.utilization_rate.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {trend.hour_type === 'first' ? 'First' : 'Last'} hour ({trend.hour}:00)
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {trend.booked_slots}/{trend.total_slots} slots booked
                  </div>
                  <div className="mt-2">
                    <Progress value={trend.utilization_rate} className="h-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Toaster />
    </div>
  )
} 