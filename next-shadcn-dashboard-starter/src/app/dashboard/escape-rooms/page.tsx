'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, Users, DollarSign, Clock, Building, Calendar, RefreshCw, Settings, Download, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { EscapeRoomService } from '@/lib/escape-room-service'
import type { RoomMetrics, DailyMetrics } from '@/lib/escape-room-service'
import { DateRangePicker } from '@/components/date-range-picker'
import type { DateRange } from 'react-day-picker'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

export default function EscapeRoomDashboard() {
  const [roomMetrics, setRoomMetrics] = useState<RoomMetrics[]>([])
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([])
  const [businessSummary, setBusinessSummary] = useState<any>(null)
  const [hourlyUtilization, setHourlyUtilization] = useState<any[]>([])
  const [businesses, setBusinesses] = useState<any[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [previousDataHash, setPreviousDataHash] = useState<string>('')
  const [nextAutoRefresh, setNextAutoRefresh] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date('2025-03-01'),
    to: new Date('2025-05-31')
  })

  const { toast } = useToast()

  // Auto-refresh every 5 minutes (300000ms)
  const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000

  // Create a hash of the data to detect changes
  const createDataHash = (data: any) => {
    return JSON.stringify(data).length.toString()
  }

  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    try {
      setError(null)
      if (isManualRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      const startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined
      const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
      const businessFilter = selectedBusiness === 'all' ? undefined : selectedBusiness

      const [metrics, daily, summary, hourly, businessData] = await Promise.all([
        EscapeRoomService.getRoomMetrics(startDate, endDate, businessFilter),
        EscapeRoomService.getDailyMetrics(startDate, endDate, businessFilter),
        EscapeRoomService.getBusinessSummary(startDate, endDate, businessFilter),
        EscapeRoomService.getHourlyUtilization(startDate, endDate, businessFilter),
        EscapeRoomService.getBusinessLocations()
      ])

      const newData = { metrics, daily, summary, hourly, businessData }
      const newDataHash = createDataHash(newData)

      setRoomMetrics(metrics)
      setDailyMetrics(daily)
      setBusinessSummary(summary)
      setHourlyUtilization(hourly)
      setBusinesses(businessData)
      setLastUpdated(new Date())

      // Check if data has changed and show notification
      if (previousDataHash && newDataHash !== previousDataHash) {
        const totalRecords = (metrics?.length || 0) + (daily?.length || 0) + (hourly?.length || 0)
        toast({
          title: "Data Updated",
          description: `Fresh data loaded with ${totalRecords} records.`,
        })
      }

      setPreviousDataHash(newDataHash)

      // Check if we're using mock data by looking for the warning in console
      setUsingMockData(false) // Reset on each load
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setUsingMockData(true)
      setError('Failed to load dashboard data. Please check your connection and try again.')
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [dateRange, selectedBusiness, previousDataHash, toast])

  // Initial load
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Auto-refresh timer
  useEffect(() => {
    const updateNextRefreshTime = () => {
      const next = new Date(Date.now() + AUTO_REFRESH_INTERVAL)
      setNextAutoRefresh(next)
    }

    updateNextRefreshTime()
    
    const interval = setInterval(() => {
      loadDashboardData()
      updateNextRefreshTime()
    }, AUTO_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [loadDashboardData])

  // Countdown timer for auto-refresh
  useEffect(() => {
    if (!nextAutoRefresh) return

    const countdownInterval = setInterval(() => {
      // Force re-render to update countdown
      setNextAutoRefresh(prev => prev ? new Date(prev.getTime()) : null)
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [nextAutoRefresh])

  const formatCountdown = (targetDate: Date) => {
    const now = Date.now()
    const diff = targetDate.getTime() - now
    
    if (diff <= 0) return '0m 0s'
    
    const minutes = Math.floor(diff / 1000 / 60)
    const seconds = Math.floor((diff / 1000) % 60)
    
    return `${minutes}m ${seconds}s`
  }

  const handleManualRefresh = () => {
    loadDashboardData(true)
    toast({
      title: "Refreshing",
      description: "Loading latest data...",
    })
  }

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
  }

  const handleExportData = () => {
    try {
      const exportData = {
        roomMetrics,
        dailyMetrics,
        businessSummary,
        hourlyUtilization,
        exportDate: new Date().toISOString(),
        dateRange: {
          from: dateRange.from?.toISOString(),
          to: dateRange.to?.toISOString()
        },
        selectedBusiness
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `escape-room-dashboard-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: "Dashboard data has been exported successfully.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredRoomMetrics = selectedBusiness === 'all' 
    ? roomMetrics 
    : roomMetrics.filter(room => room.room_name?.includes(selectedBusiness))

  const topPerformingRooms = [...roomMetrics]
    .sort((a, b) => b.utilization_rate - a.utilization_rate)
    .slice(0, 3)

  const peakHours = [...hourlyUtilization]
    .sort((a, b) => b.utilization_rate - a.utilization_rate)
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading escape room data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => loadDashboardData(true)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Mock Data Warning */}
      {usingMockData && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Database connection not available. Showing mock data for demonstration purposes. 
            Set up Supabase to see real data.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className='flex items-center justify-between space-y-2'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>
            Escape Room Dashboard
          </h2>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            {lastUpdated && (
              <span>
                Last updated: {format(lastUpdated, 'MMM dd, yyyy HH:mm:ss')}
              </span>
            )}
            {nextAutoRefresh && (
              <span className="flex items-center space-x-1">
                <RefreshCw className="h-3 w-3 animate-pulse" />
                <span>
                  Auto-refresh in {formatCountdown(nextAutoRefresh)}
                </span>
              </span>
            )}
          </div>
        </div>
        <div className='hidden items-center space-x-2 md:flex'>
          <DateRangePicker 
            dateRange={dateRange} 
            onDateRangeChange={handleDateRangeChange}
          />
          <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
            <SelectTrigger className='w-[200px]'>
              <SelectValue placeholder='Select Business' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Businesses</SelectItem>
              {businesses.map((business) => (
                <SelectItem key={business.business_id} value={business.business_name}>
                  {business.business_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Select Business' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Businesses</SelectItem>
            {businesses.map((business) => (
              <SelectItem key={business.business_id} value={business.business_name}>
                {business.business_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      {/* Business Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Slots</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessSummary?.total_slots?.toLocaleString() || '0'}</div>
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
            <div className="text-2xl font-bold">{businessSummary?.total_bookings?.toLocaleString() || '0'}</div>
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
              {businessSummary?.overall_utilization?.toFixed(1) || '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Overall capacity usage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Businesses</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessSummary?.business_count || '0'}</div>
            <p className="text-xs text-muted-foreground">
              Active locations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Rooms */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Rooms</CardTitle>
          <CardDescription>
            Rooms with highest utilization rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {topPerformingRooms.length > 0 ? (
              topPerformingRooms.map((room, index) => (
                <div key={room.room_id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">#{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/dashboard/escape-rooms/${room.room_id}`} className="text-sm font-medium truncate text-primary hover:underline">
                      {room.room_name}
                    </Link>
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
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-muted-foreground">
                No room data available for the selected criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
            <div className="space-y-4">
              {filteredRoomMetrics.length > 0 ? (
                filteredRoomMetrics.map((room) => (
                  <div key={room.room_id} className="flex items-center justify-between">
                    <div>
                      <Link href={`/dashboard/escape-rooms/${room.room_id}`} className="font-medium text-primary hover:underline">
                        {room.room_name}
                      </Link>
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
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No room data available
                </div>
              )}
            </div>
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
      </div>

      {/* Daily Trends */}
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

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
} 