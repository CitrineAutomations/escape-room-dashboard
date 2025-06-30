'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building, Users, Clock, TrendingUp, ArrowRight, MapPin, Search, Filter, SortAsc, SortDesc, CalendarDays, RefreshCw, Activity } from 'lucide-react'
import { EscapeRoomService } from '@/lib/escape-room-service'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { DateRangePicker } from '@/components/date-range-picker'
import type { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import PageContainer from '@/components/layout/page-container'

// Helper function to check if business is currently open
const isBusinessCurrentlyOpen = (businessName: string) => {
  const config = EscapeRoomService.getBusinessHoursConfig()
  const normalizedName = EscapeRoomService.normalizeBusinessName(businessName)
  
  let businessHours = null
  for (const [configName, hours] of Object.entries(config)) {
    if (EscapeRoomService.normalizeBusinessName(configName) === normalizedName) {
      businessHours = hours
      break
    }
  }
  
  if (!businessHours) return null // Unknown status
  
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayName = dayNames[dayOfWeek] as keyof typeof businessHours
  
  const todayHours = businessHours[dayName]
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

interface Business {
  business_id: string
  business_name: string
  room_count?: number
  total_slots?: number
  total_bookings?: number
  utilization_rate?: number
}

interface Room {
  room_id: string
  room_name: string
  business_name: string
  total_slots?: number
  booked_slots?: number
  utilization_rate?: number
}

type SortOption = 'name' | 'utilization' | 'rooms' | 'slots'
type SortDirection = 'asc' | 'desc'



export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [utilizationFilter, setUtilizationFilter] = useState<string>('all')
  
  // Date range state - start with undefined to auto-detect from data
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined
  })

  const { toast } = useToast()

  const loadBusinessData = useCallback(async (isManualRefresh = false) => {
    try {
      setError(null)
      if (isManualRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      console.log(`🔍 Loading business data...`)
      
      // Get basic business and room data first (without date filters)
      const [businessData, roomData] = await Promise.all([
        EscapeRoomService.getBusinessLocations(),
        EscapeRoomService.getRooms()
      ])
      console.log(`✅ Fetched ${businessData.length} businesses and ${roomData.length} rooms`)

      // Check if we have any data at all
      if (businessData.length === 0) {
        throw new Error('No business data found in database')
      }

      // Get a sample of available room slots to determine date ranges
      console.log(`🔍 Checking available data in database...`)
      const sampleSlots = await EscapeRoomService.getRoomSlots()
      
      if (sampleSlots.length === 0) {
        console.warn('⚠️ No room slots data available')
        // Use business data without metrics
        const businessMetrics = businessData.map(business => ({
          ...business,
          room_count: roomData.filter(room => room.business_name === business.business_name).length,
          total_slots: undefined,
          total_bookings: undefined,
          utilization_rate: undefined
        }))
        
        setBusinesses(businessMetrics)
        setRooms(roomData.map(room => ({ ...room, total_slots: undefined, booked_slots: undefined, utilization_rate: undefined })))
        setUsingMockData(false)
        setLastUpdated(new Date())
        
        setError('Business data loaded but no booking metrics available. Check if Room Slots data exists in database.')
        return
      }

      // Find the actual date range of available data
      const allDates = sampleSlots.map(slot => slot.booking_date).sort()
      const earliestDate = allDates[0]
      const latestDate = allDates[allDates.length - 1]
      
      console.log(`📅 Available data range: ${earliestDate} to ${latestDate}`)
      console.log(`📅 Sample slots: ${sampleSlots.length}`)

      // Use flexible date filtering - if user's range is outside available data, use available range
      let actualStartDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : earliestDate
      let actualEndDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : latestDate

      // If this is the first load or user's date range is outside available data, use available range
      if (!dateRange.from || !dateRange.to || actualStartDate > latestDate || actualEndDate < earliestDate) {
        if (dateRange.from || dateRange.to) {
          console.warn(`⚠️ User date range (${actualStartDate} to ${actualEndDate}) is outside available data range (${earliestDate} to ${latestDate})`)
        }
        actualStartDate = earliestDate
        actualEndDate = latestDate
        
        // Update the date range picker to show the actual available range
        setDateRange({
          from: new Date(earliestDate),
          to: new Date(latestDate)
        })
        
        if (dateRange.from || dateRange.to) {
          toast({
            title: "Date Range Adjusted",
            description: `Using available data range: ${earliestDate} to ${latestDate}`,
            variant: "destructive"
          })
        }
      }

      console.log(`🔍 Using date range: ${actualStartDate} to ${actualEndDate}`)

      // Calculate business metrics with the actual available date range
      const businessMetrics = await Promise.all(
        businessData.map(async (business) => {
          try {
            // Get room slots for this business in the date range
            const businessSlots = await EscapeRoomService.getRoomSlots(actualStartDate, actualEndDate, business.business_name)
            
            // Calculate metrics based on actual slot data
            const totalSlots = businessSlots.length
            const bookedSlots = businessSlots.filter(slot => !slot.is_available || slot.available_slots === 0).length
            const utilizationRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0
            
            console.log(`✅ ${business.business_name}: ${totalSlots} slots, ${bookedSlots} booked (${utilizationRate.toFixed(1)}% utilization)`)
            
            return {
              ...business,
              room_count: roomData.filter(room => room.business_name === business.business_name).length,
              total_slots: totalSlots,
              total_bookings: bookedSlots,
              utilization_rate: utilizationRate
            }
          } catch (error) {
            console.error(`❌ Failed to get data for ${business.business_name}:`, error)
            return {
              ...business,
              room_count: roomData.filter(room => room.business_name === business.business_name).length,
              total_slots: undefined,
              total_bookings: undefined,
              utilization_rate: undefined
            }
          }
        })
      )

      // Calculate room metrics
      const roomMetrics = await Promise.all(
        roomData.map(async (room) => {
          try {
            // Get room slots for this specific room in the date range
            const roomSlots = await EscapeRoomService.getRoomSlots(actualStartDate, actualEndDate, room.business_name)
            const thisRoomSlots = roomSlots.filter(slot => slot.room_id === room.room_id)
            
            const totalSlots = thisRoomSlots.length
            const bookedSlots = thisRoomSlots.filter(slot => !slot.is_available || slot.available_slots === 0).length
            const utilizationRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0
            
            return {
              ...room,
              total_slots: totalSlots,
              booked_slots: bookedSlots,
              utilization_rate: utilizationRate
            }
          } catch (error) {
            console.error(`❌ Failed to get metrics for room ${room.room_name}:`, error)
            return {
              ...room,
              total_slots: undefined,
              booked_slots: undefined,
              utilization_rate: undefined
            }
          }
        })
      )

      setBusinesses(businessMetrics)
      setRooms(roomMetrics)
      setUsingMockData(false)
      setLastUpdated(new Date())

      const businessesWithData = businessMetrics.filter(b => b.total_slots !== undefined).length
      
      toast({
        title: isManualRefresh ? "Manual Refresh Complete" : "Data Loaded",
        description: `Loaded data for ${businessesWithData}/${businessMetrics.length} businesses (${actualStartDate} to ${actualEndDate})`,
      })

    } catch (error) {
      console.error('Error loading business data:', error)
      setError(`Failed to load business data: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      // Don't use mock data - show the actual error
      setBusinesses([])
      setRooms([])
      setUsingMockData(false)
      
      toast({
        title: "Error Loading Data",
        description: error instanceof Error ? error.message : 'Failed to load business data',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [dateRange, toast])

  useEffect(() => {
    loadBusinessData()
  }, [loadBusinessData])

  // Manual refresh handler
  const handleManualRefresh = () => {
    loadBusinessData(true)
  }

  // Date range change handler
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
  }

  // Filtered and sorted businesses
  const filteredAndSortedBusinesses = useMemo(() => {
    let filtered = businesses.filter(business => 
      business.business_name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Apply utilization filter
    if (utilizationFilter === 'high') {
      filtered = filtered.filter(business => (business.utilization_rate || 0) >= 70)
    } else if (utilizationFilter === 'medium') {
      filtered = filtered.filter(business => (business.utilization_rate || 0) >= 40 && (business.utilization_rate || 0) < 70)
    } else if (utilizationFilter === 'low') {
      filtered = filtered.filter(business => (business.utilization_rate || 0) < 40)
    }

    // Sort businesses
    filtered.sort((a, b) => {
      let aValue: number | string
      let bValue: number | string

      switch (sortBy) {
        case 'name':
          aValue = a.business_name
          bValue = b.business_name
          break
        case 'utilization':
          aValue = a.utilization_rate || 0
          bValue = b.utilization_rate || 0
          break
        case 'rooms':
          aValue = a.room_count || 0
          bValue = b.room_count || 0
          break
        case 'slots':
          aValue = a.total_slots || 0
          bValue = b.total_slots || 0
          break
        default:
          aValue = a.business_name
          bValue = b.business_name
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return sortDirection === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number)
      }
    })

    return filtered
  }, [businesses, searchTerm, sortBy, sortDirection, utilizationFilter])

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  const getUtilizationBadgeVariant = (rate: number) => {
    if (rate >= 80) return "default"
    if (rate >= 60) return "secondary"
    if (rate >= 40) return "outline"
    return "destructive"
  }

  const getUtilizationLabel = (rate: number) => {
    if (rate >= 80) return "Excellent"
    if (rate >= 60) return "Good"
    if (rate >= 40) return "Fair"
    return "Needs Attention"
  }

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

  return (
    <PageContainer>
      <div className="w-full space-y-6">
        {/* Mock Data Warning */}
        {usingMockData && (
          <Alert>
            <AlertDescription>
              Database connection not available. Showing mock data for demonstration purposes. 
              Set up Supabase to see real data.
            </AlertDescription>
          </Alert>
        )}

        {/* Data Quality Warning */}
        {!usingMockData && businesses.length > 0 && businesses.some(b => b.total_slots === undefined) && (
          <Alert>
            <AlertDescription>
              ⚠️ Some business data is unavailable. This may indicate database connection issues or missing data for the selected time period. Check browser console for detailed error information.
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              Business Locations
            </h2>
            <p className="text-muted-foreground">
              Overview of all escape room businesses and their rooms
              {lastUpdated && (
                <span className="ml-2 text-xs">
                  • Last updated {format(lastUpdated, 'HH:mm:ss')}
                </span>
              )}
            </p>
          </div>
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

        {/* Date Range Picker */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Date Range:</span>
          </div>
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={utilizationFilter} onValueChange={setUtilizationFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by utilization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Businesses</SelectItem>
                <SelectItem value="high">High (70%+)</SelectItem>
                <SelectItem value="medium">Medium (40-70%)</SelectItem>
                <SelectItem value="low">Low (&lt;40%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="utilization">Utilization</SelectItem>
                <SelectItem value="rooms">Room Count</SelectItem>
                <SelectItem value="slots">Total Slots</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSortDirection}
              className="shrink-0"
            >
              {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Business Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredAndSortedBusinesses.length}</div>
              <p className="text-xs text-muted-foreground">
                {filteredAndSortedBusinesses.length === businesses.length ? 'Active locations' : `Filtered from ${businesses.length} total`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredAndSortedBusinesses.reduce((sum, business) => sum + (business.room_count || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Escape rooms across filtered businesses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Slots</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(() => {
                  const businessesWithData = filteredAndSortedBusinesses.filter(b => b.total_slots !== undefined)
                  const total = businessesWithData.reduce((sum, business) => sum + (business.total_slots || 0), 0)
                  return businessesWithData.length > 0 ? total.toLocaleString() : 'N/A'
                })()}
              </div>
              <p className="text-xs text-muted-foreground">
                Available time slots
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(() => {
                  const businessesWithData = filteredAndSortedBusinesses.filter(b => b.utilization_rate !== undefined)
                  if (businessesWithData.length === 0) return 'N/A'
                  const avg = businessesWithData.reduce((sum, business) => sum + (business.utilization_rate || 0), 0) / businessesWithData.length
                  return `${avg.toFixed(1)}%`
                })()}
              </div>
              <p className="text-xs text-muted-foreground">
                Average across filtered businesses
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Business List */}
        <div className="space-y-6">
          {filteredAndSortedBusinesses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No businesses found</h3>
                <p className="text-muted-foreground text-center">
                  Try adjusting your search terms or filters to find businesses.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedBusinesses.map((business) => {
              const businessRooms = rooms.filter(room => room.business_name === business.business_name)
              
              return (
                <Card key={business.business_id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Link 
                            href={`/dashboard/businesses/${encodeURIComponent(business.business_name)}`}
                            className="hover:underline"
                          >
                            <CardTitle className="text-xl text-primary">{business.business_name}</CardTitle>
                          </Link>
                          <Badge variant={getUtilizationBadgeVariant(business.utilization_rate || 0)}>
                            {getUtilizationLabel(business.utilization_rate || 0)}
                          </Badge>
                          {(() => {
                            const isOpen = isBusinessCurrentlyOpen(business.business_name)
                            if (isOpen === null) return null
                            return (
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className={`text-xs font-medium ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
                                  {isOpen ? 'Open' : 'Closed'}
                                </span>
                              </div>
                            )
                          })()}
                        </div>
                        <CardDescription className="mt-1">
                          {business.room_count} rooms • {business.total_slots !== undefined ? business.total_slots.toLocaleString() : 'N/A'} total slots
                        </CardDescription>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <div className="text-2xl font-bold">
                          {business.utilization_rate !== undefined ? `${business.utilization_rate.toFixed(1)}%` : 'N/A'}
                        </div>
                        <Progress value={business.utilization_rate || 0} className="w-24" />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Business Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="text-center">
                          <div className="text-lg font-semibold">{business.room_count}</div>
                          <div className="text-xs text-muted-foreground">Rooms</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">
                            {business.total_slots !== undefined ? business.total_slots.toLocaleString() : 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">Total Slots</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">
                            {business.total_bookings !== undefined ? business.total_bookings.toLocaleString() : 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">Bookings</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">
                            {business.utilization_rate !== undefined ? `${business.utilization_rate.toFixed(1)}%` : 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">Utilization</div>
                        </div>
                      </div>

                      {/* Rooms Grid */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Rooms</h4>
                          <Link href={`/dashboard/businesses/${encodeURIComponent(business.business_name)}`}>
                            <Button variant="outline" size="sm">
                              View Details
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                        
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {businessRooms.map((room) => (
                            <div key={room.room_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex-1">
                                <span className="font-medium">
                                  {room.room_name}
                                </span>
                                <p className="text-sm text-muted-foreground">
                                  {room.booked_slots !== undefined && room.total_slots !== undefined 
                                    ? `${room.booked_slots} / ${room.total_slots} slots booked`
                                    : 'Data unavailable'
                                  }
                                </p>
                                <Progress value={room.utilization_rate || 0} className="mt-1" />
                              </div>
                              <div className="text-right ml-3">
                                <Badge variant={getUtilizationBadgeVariant(room.utilization_rate || 0)} className="mb-1">
                                  {room.utilization_rate !== undefined ? `${room.utilization_rate.toFixed(1)}%` : 'N/A'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Toast notifications */}
        <Toaster />
      </div>
    </PageContainer>
  )
} 