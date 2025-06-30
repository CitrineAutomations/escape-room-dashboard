'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building, Users, Clock, TrendingUp, ArrowRight, MapPin, Search, Filter, SortAsc, SortDesc, CalendarDays, RefreshCw } from 'lucide-react'
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
  
  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
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

      // Format dates for API calls
      const startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined
      const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined

      console.log(`🔍 Fetching business locations and rooms data...`)
      const [businessData, roomData] = await Promise.all([
        EscapeRoomService.getBusinessLocations(),
        EscapeRoomService.getRooms()
      ])
      console.log(`✅ Fetched ${businessData.length} businesses and ${roomData.length} rooms`)

      // Calculate business metrics with date filtering
      const businessMetrics = await Promise.all(
        businessData.map(async (business) => {
          try {
            console.log(`🔍 Fetching business summary for ${business.business_name} (${startDate} to ${endDate})`)
            const summary = await EscapeRoomService.getBusinessSummary(startDate, endDate, business.business_name)
            console.log(`✅ Business summary for ${business.business_name}:`, summary)
            return {
              ...business,
              room_count: roomData.filter(room => room.business_name === business.business_name).length,
              total_slots: summary.total_slots,
              total_bookings: summary.total_bookings,
              utilization_rate: summary.overall_utilization
            }
          } catch (error) {
            console.error(`❌ Failed to get summary for ${business.business_name}:`, error)
            console.error(`   Error details:`, error instanceof Error ? error.message : error)
            console.error(`   Date range: ${startDate} to ${endDate}`)
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

      // Calculate room metrics with date filtering
      const roomMetrics = await Promise.all(
        roomData.map(async (room) => {
          try {
            const metrics = await EscapeRoomService.getRoomMetrics(startDate, endDate, room.business_name)
            const roomMetric = metrics.find(m => m.room_id === room.room_id)
            return {
              ...room,
              total_slots: roomMetric?.total_slots || 0,
              booked_slots: roomMetric?.booked_slots || 0,
              utilization_rate: roomMetric?.utilization_rate || 0
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

      toast({
        title: isManualRefresh ? "Manual Refresh Complete" : "Data Loaded",
        description: `Loaded data for ${businessMetrics.length} businesses${startDate ? ` from ${startDate} to ${endDate}` : ''}`,
      })

    } catch (error) {
      console.error('Error loading business data:', error)
      setUsingMockData(true)
      setError('Failed to load business data. Using mock data for demonstration.')
      
      // Use mock data
      const mockBusinesses: Business[] = [
        {
          business_id: 'cracked_it',
          business_name: 'Cracked It',
          room_count: 4,
          total_slots: 16192,
          total_bookings: 8096,
          utilization_rate: 50.0
        },
        {
          business_id: 'green_light_escape',
          business_name: 'Green Light Escape',
          room_count: 6,
          total_slots: 24288,
          total_bookings: 14573,
          utilization_rate: 60.0
        },
        {
          business_id: 'iescape_rooms',
          business_name: 'iEscape Rooms',
          room_count: 4,
          total_slots: 16192,
          total_bookings: 8096,
          utilization_rate: 50.0
        },
        {
          business_id: 'the_exit_games',
          business_name: 'The Exit Games',
          room_count: 6,
          total_slots: 24288,
          total_bookings: 19430,
          utilization_rate: 80.0
        }
      ]

      const mockRooms: Room[] = [
        // Cracked It rooms
        { room_id: 'RT!1', room_name: 'Rat Trap!', business_name: 'Cracked It', total_slots: 4048, booked_slots: 2024, utilization_rate: 50.0 },
        { room_id: 'PS4', room_name: 'Project Skylabd', business_name: 'Cracked It', total_slots: 4048, booked_slots: 2834, utilization_rate: 70.0 },
        { room_id: 'MU3', room_name: 'Murder University', business_name: 'Cracked It', total_slots: 4048, booked_slots: 1619, utilization_rate: 40.0 },
        { room_id: 'NBNW2', room_name: 'New Blood, New World', business_name: 'Cracked It', total_slots: 4048, booked_slots: 1619, utilization_rate: 40.0 },
        
        // Green Light Escape rooms
        { room_id: 'K!1', room_name: 'Kidnapped!', business_name: 'Green Light Escape', total_slots: 4048, booked_slots: 2429, utilization_rate: 60.0 },
        { room_id: 'CITW2', room_name: 'Cabin in the Woods', business_name: 'Green Light Escape', total_slots: 4048, booked_slots: 2834, utilization_rate: 70.0 },
        { room_id: 'TA3', room_name: 'The Attic', business_name: 'Green Light Escape', total_slots: 4048, booked_slots: 2024, utilization_rate: 50.0 },
        { room_id: 'JL4', room_name: 'Jurassic Labs', business_name: 'Green Light Escape', total_slots: 4048, booked_slots: 3643, utilization_rate: 90.0 },
        { room_id: 'AE5', room_name: 'Alien Escape', business_name: 'Green Light Escape', total_slots: 4048, booked_slots: 2024, utilization_rate: 50.0 },
        { room_id: 'BH6', room_name: 'Brewery Heist', business_name: 'Green Light Escape', total_slots: 4048, booked_slots: 1619, utilization_rate: 40.0 },
        
        // iEscape Rooms
        { room_id: 'CLV1', room_name: 'CLUEVIE', business_name: 'iEscape Rooms', total_slots: 4048, booked_slots: 2024, utilization_rate: 50.0 },
        { room_id: 'DNR2', room_name: 'DONOR', business_name: 'iEscape Rooms', total_slots: 4048, booked_slots: 2834, utilization_rate: 70.0 },
        { room_id: 'GMS3', room_name: 'GAME SHOW Live!', business_name: 'iEscape Rooms', total_slots: 4048, booked_slots: 1619, utilization_rate: 40.0 },
        { room_id: 'LOT4', room_name: 'LEGEND OF THE TOMB', business_name: 'iEscape Rooms', total_slots: 4048, booked_slots: 3643, utilization_rate: 90.0 },
        
        // The Exit Games rooms
        { room_id: 'WRS3', room_name: 'White Rabbit Society', business_name: 'The Exit Games', total_slots: 4048, booked_slots: 3238, utilization_rate: 80.0 },
        { room_id: 'FSCH1', room_name: 'Front Street Casino Heist', business_name: 'The Exit Games', total_slots: 4048, booked_slots: 3643, utilization_rate: 90.0 },
        { room_id: 'ONV6', room_name: 'Outage: No Vacancy', business_name: 'The Exit Games', total_slots: 4048, booked_slots: 2834, utilization_rate: 70.0 },
        { room_id: 'DGA2', room_name: 'Dog Gone Alley', business_name: 'The Exit Games', total_slots: 4048, booked_slots: 3238, utilization_rate: 80.0 },
        { room_id: 'HRS5', room_name: 'Hangover at Riddler State', business_name: 'The Exit Games', total_slots: 4048, booked_slots: 3643, utilization_rate: 90.0 },
        { room_id: 'HNTP4', room_name: 'Hidden Needle Tattoo Parlor', business_name: 'The Exit Games', total_slots: 4048, booked_slots: 3238, utilization_rate: 80.0 }
      ]

      setBusinesses(mockBusinesses)
      setRooms(mockRooms)
      setLastUpdated(new Date())
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