'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, Users, Clock, Building, RefreshCw, Download, ArrowLeft, Calendar, BarChart3, Activity } from 'lucide-react'
import { format } from 'date-fns'
import { EscapeRoomService } from '@/lib/escape-room-service'
import type { RoomMetrics, DailyMetrics } from '@/lib/escape-room-service'
import { DateRangePicker } from '@/components/date-range-picker'
import type { DateRange } from 'react-day-picker'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function RoomDetailPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string

  const [roomData, setRoomData] = useState<any>(null)
  const [roomSlots, setRoomSlots] = useState<any[]>([])
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([])
  const [hourlyUtilization, setHourlyUtilization] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date('2025-03-01'),
    to: new Date('2025-05-31')
  })

  const { toast } = useToast()

  const loadRoomData = async (isManualRefresh = false) => {
    try {
      setError(null)
      if (isManualRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined
      const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined

      // Get room-specific data
      const [slots, daily, hourly] = await Promise.all([
        EscapeRoomService.getRoomSlots(startDate, endDate, undefined), // Get all slots first
        EscapeRoomService.getDailyMetrics(startDate, endDate, undefined),
        EscapeRoomService.getHourlyUtilization(startDate, endDate, undefined)
      ])

      // Filter for specific room
      const roomSlotsData = slots.filter(slot => slot.room_id === roomId)
      const roomDailyData = daily.filter(metric => {
        // Check if this date has data for our room
        return roomSlotsData.some(slot => slot.booking_date === metric.date)
      })
      const roomHourlyData = hourly.map(hour => {
        const hourSlots = roomSlotsData.filter(slot => {
          const slotHour = parseInt(slot.hour.split(':')[0])
          return slotHour === hour.hour
        })
        
        const totalSlots = hourSlots.length
        const bookedSlots = hourSlots.filter(slot => !slot.is_available).length
        
        return {
          hour: hour.hour,
          utilization_rate: totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0,
          total_slots: totalSlots,
          booked_slots: bookedSlots
        }
      })

      // Calculate room metrics
      const totalSlots = roomSlotsData.length
      const bookedSlots = roomSlotsData.filter(slot => !slot.is_available).length
      const utilizationRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0
      const averageAvailableSlots = roomSlotsData
        .filter(slot => slot.is_available)
        .reduce((sum, slot) => sum + slot.available_slots, 0) / 
        Math.max(roomSlotsData.filter(slot => slot.is_available).length, 1)

      const roomInfo = roomSlotsData[0] || {}
      
      setRoomData({
        room_id: roomId,
        room_name: roomInfo.room_name || 'Unknown Room',
        business_name: roomInfo.business_name || 'Unknown Business',
        total_slots: totalSlots,
        booked_slots: bookedSlots,
        utilization_rate: utilizationRate,
        average_available_slots: averageAvailableSlots
      })

      setRoomSlots(roomSlotsData)
      setDailyMetrics(roomDailyData)
      setHourlyUtilization(roomHourlyData)

    } catch (error) {
      console.error('Error loading room data:', error)
      setError('Failed to load room data. Please check your connection and try again.')
      toast({
        title: "Error",
        description: "Failed to load room data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (roomId) {
      loadRoomData()
    }
  }, [roomId, dateRange])

  const handleManualRefresh = () => {
    loadRoomData(true)
    toast({
      title: "Refreshing",
      description: "Loading latest room data...",
    })
  }

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
  }

  const handleExportData = () => {
    try {
      const exportData = {
        roomData,
        roomSlots,
        dailyMetrics,
        hourlyUtilization,
        exportDate: new Date().toISOString(),
        dateRange: {
          from: dateRange.from?.toISOString(),
          to: dateRange.to?.toISOString()
        }
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `room-${roomId}-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: "Room data has been exported successfully.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const peakHours = [...hourlyUtilization]
    .sort((a, b) => b.utilization_rate - a.utilization_rate)
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading room data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => loadRoomData(true)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (!roomData) {
    return (
      <div className="space-y-6 p-6">
        <Alert>
          <AlertDescription>Room not found. Please check the room ID.</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/dashboard/escape-rooms')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className='flex items-center justify-between space-y-2'>
        <div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/dashboard/escape-rooms')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>
                {roomData.room_name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {roomData.business_name} • Room ID: {roomData.room_id}
              </p>
            </div>
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
          <Button onClick={handleExportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className='md:hidden space-y-2'>
        <DateRangePicker 
          dateRange={dateRange} 
          onDateRangeChange={handleDateRangeChange}
        />
        <div className="flex space-x-2">
          <Button 
            onClick={handleManualRefresh} 
            disabled={refreshing}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button onClick={handleExportData} variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Room Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Slots</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roomData.total_slots.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Available time slots
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Booked Slots</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roomData.booked_slots.toLocaleString()}</div>
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
              {roomData.utilization_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Capacity usage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Available</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roomData.average_available_slots.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Slots per available time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Peak Hours & Daily Trends */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Peak Hours</CardTitle>
            <CardDescription>
              Most popular booking times for this room
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {peakHours.length > 0 ? (
                peakHours.map((hour) => (
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
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hourly data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Utilization Trends</CardTitle>
            <CardDescription>
              Average utilization by day of the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-7">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                const dayData = dailyMetrics.filter(metric => {
                  const date = new Date(metric.date)
                  return date.getDay() === index
                })
                
                const avgUtilization = dayData.length > 0 
                  ? dayData.reduce((sum, d) => sum + d.utilization_rate, 0) / dayData.length 
                  : 0

                return (
                  <div key={day} className="text-center">
                    <p className="text-sm font-medium">{day}</p>
                    <p className="text-2xl font-bold">{avgUtilization.toFixed(1)}%</p>
                    <div className="w-full bg-secondary rounded-full h-2 mt-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${avgUtilization}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>
            Latest booking activity for this room
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roomSlots.slice(0, 10).map((slot) => (
              <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{slot.booking_date}</p>
                  <p className="text-sm text-muted-foreground">
                    {slot.hour} • {slot.room_name}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={slot.is_available ? "secondary" : "default"}>
                    {slot.is_available ? 'Available' : 'Booked'}
                  </Badge>
                  {slot.is_available && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {slot.available_slots} slots
                    </p>
                  )}
                </div>
              </div>
            ))}
            {roomSlots.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No booking data available for the selected date range
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
} 