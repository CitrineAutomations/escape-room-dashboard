'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Users, Clock, RefreshCw, ArrowLeft, MapPin, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { DateRangePicker } from '@/components/date-range-picker'
import type { DateRange } from 'react-day-picker'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function BusinessDashboard() {
  const params = useParams()
  const businessName = decodeURIComponent(params.businessId as string).trim()
  
  console.log('🔍 Decoded business name:', JSON.stringify(businessName)) // Debug log
  
  const [businessInfo, setBusinessInfo] = useState<any>(null)
  const [rooms, setRooms] = useState<any[]>([])
  const [roomSlots, setRoomSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date('2025-03-01'),
    to: new Date('2025-05-31')
  })

  const { toast } = useToast()

  // Auto-refresh every 5 minutes (300000ms)
  const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000

  const loadBusinessData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      console.log('🔍 Looking for business:', businessName)

      // Skip business info lookup - use business name from URL directly
      setBusinessInfo({ business_name: businessName })

      // 2. Get rooms for this business from Rooms table
      const { data: roomsData, error: roomsError } = await supabase
        .from('Rooms')
        .select('*')
        .eq('business_name', businessName)

      if (roomsError) {
        console.error('❌ Error fetching rooms:', roomsError)
        throw roomsError
      }

      console.log('✅ Rooms found:', roomsData?.length || 0, 'rooms')
      setRooms(roomsData || [])

      // 3. Get room slots data with date filtering
      const startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined
      const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined

      console.log('📅 Date range:', startDate, 'to', endDate)

      // Temporarily remove date filtering to see all available data
      let roomSlotsQuery = supabase
        .from('Room Slots')
        .select('*')
        .eq('business_name', businessName)

      // Uncomment these lines when you want to add date filtering back
      // if (startDate) {
      //   roomSlotsQuery = roomSlotsQuery.gte('booking_date', startDate)
      // }
      // if (endDate) {
      //   roomSlotsQuery = roomSlotsQuery.lte('booking_date', endDate)
      // }

      const { data: slotsData, error: slotsError } = await roomSlotsQuery

      if (slotsError) {
        console.error('❌ Error fetching room slots:', slotsError)
        throw slotsError
      }

      console.log('✅ Room slots found:', slotsData?.length || 0, 'slots')
      if (slotsData && slotsData.length > 0) {
        console.log('📊 Sample slot:', slotsData[0])
        // Show date range of available data
        const dates = slotsData.map((slot: any) => slot.booking_date).sort()
        console.log('📅 Available date range:', dates[0], 'to', dates[dates.length - 1])
      }

      setRoomSlots(slotsData || [])
      setLastUpdated(new Date())

      toast({
        title: isManualRefresh ? "Manual Refresh Complete" : "Data Loaded",
        description: `Loaded data for ${businessName}`,
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

  // Calculate metrics from the actual data
  const calculateMetrics = () => {
    if (!roomSlots.length) return { totalSlots: 0, totalBookings: 0, utilizationRate: 0 }

    const totalSlots = roomSlots.length
    const totalBookings = roomSlots.filter((slot: any) => !slot.is_available).length
    const utilizationRate = totalSlots > 0 ? (totalBookings / totalSlots) * 100 : 0

    return { totalSlots, totalBookings, utilizationRate }
  }

  // Calculate room performance
  const calculateRoomPerformance = () => {
    const roomMetrics = rooms.map((room: any) => {
      const roomSlotsForRoom = roomSlots.filter((slot: any) => slot.room_id === room.room_id)
      const totalSlots = roomSlotsForRoom.length
      const bookedSlots = roomSlotsForRoom.filter((slot: any) => !slot.is_available).length
      const utilizationRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0

      return {
        room_id: room.room_id,
        room_name: room.room_name,
        total_slots: totalSlots,
        booked_slots: bookedSlots,
        utilization_rate: utilizationRate,
        capacity: room.capacity
      }
    })

    return roomMetrics.sort((a, b) => b.utilization_rate - a.utilization_rate)
  }

  // Calculate hourly utilization
  const calculateHourlyUtilization = () => {
    const hourlyData = new Map()

    roomSlots.forEach((slot: any) => {
      const hour = slot.hour?.split(':')[0] || '0'
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, { total: 0, booked: 0 })
      }
      const data = hourlyData.get(hour)
      data.total++
      if (!slot.is_available) {
        data.booked++
      }
    })

    return Array.from(hourlyData.entries()).map(([hour, data]: [string, any]) => ({
      hour: parseInt(hour),
      utilization_rate: data.total > 0 ? (data.booked / data.total) * 100 : 0
    })).sort((a, b) => b.utilization_rate - a.utilization_rate).slice(0, 5)
  }

  const metrics = calculateMetrics()
  const roomPerformance = calculateRoomPerformance()
  const topPerformingRooms = roomPerformance.slice(0, 3)
  const peakHours = calculateHourlyUtilization()

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
    <div className="space-y-6 p-6">
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
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            {businessInfo.open_time && businessInfo.close_time && (
              <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{businessInfo.open_time} - {businessInfo.close_time}</span>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
            {lastUpdated && (
              <span>
                Last updated: {format(lastUpdated, 'MMM dd, yyyy HH:mm:ss')}
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

      {/* Business Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Slots</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSlots.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Available time slots
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalBookings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Confirmed reservations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.utilizationRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Overall capacity usage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Rooms */}
      {topPerformingRooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Rooms</CardTitle>
            <CardDescription>
              Rooms with highest utilization rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {topPerformingRooms.map((room, index) => (
                <div key={room.room_id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">#{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{room.room_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {room.booked_slots} / {room.total_slots} slots
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={room.utilization_rate > 70 ? "default" : "secondary"}>
                      {room.utilization_rate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Room Performance & Peak Hours */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Room Performance</CardTitle>
            <CardDescription>
              Utilization rates by escape room
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roomPerformance.length > 0 ? (
              <div className="space-y-4">
                {roomPerformance.map((room) => (
                  <div key={room.room_id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{room.room_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {room.booked_slots} / {room.total_slots} slots booked
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={room.utilization_rate > 70 ? "default" : "secondary"}>
                        {room.utilization_rate.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No room data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peak Hours</CardTitle>
            <CardDescription>
              Most popular booking times
            </CardDescription>
          </CardHeader>
          <CardContent>
            {peakHours.length > 0 ? (
              <div className="space-y-3">
                {peakHours.map((hour) => (
                  <div key={hour.hour} className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {hour.hour}:00
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${hour.utilization_rate}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12">
                        {hour.utilization_rate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No hourly data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Status */}
      {roomSlots.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-yellow-800">
                <strong>No room slots data found for "The Exit Games".</strong>
              </p>
              <p className="text-yellow-700 text-sm mt-2">
                This could mean:
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-700 mt-1">
                <li>Your N8N workflow hasn't processed data for "The Exit Games" yet</li>
                <li>The business name in the database might be different</li>
                <li>Data is being inserted into different tables</li>
                <li>The Room Slots table is empty</li>
              </ul>
              <p className="text-yellow-700 text-sm mt-2">
                <strong>Next steps:</strong> Check your Supabase dashboard to see what business names and data exist in your tables.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {roomSlots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-green-800">
                <strong>✅ Found {roomSlots.length} room slots for "The Exit Games"</strong>
              </p>
              <p className="text-green-700 text-sm mt-2">
                Date range: {roomSlots.map((slot: any) => slot.booking_date).sort()[0]} to {roomSlots.map((slot: any) => slot.booking_date).sort().reverse()[0]}
              </p>
              <p className="text-green-700 text-sm mt-1">
                Rooms: {roomSlots.map((slot: any) => slot.room_name).filter((name: string, index: number, arr: string[]) => arr.indexOf(name) === index).join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
} 