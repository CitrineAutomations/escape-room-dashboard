'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building, Users, Clock, TrendingUp, ArrowRight, MapPin } from 'lucide-react'
import { EscapeRoomService } from '@/lib/escape-room-service'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

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

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)

  const { toast } = useToast()

  const loadBusinessData = async () => {
    try {
      setError(null)
      setLoading(true)

      const [businessData, roomData] = await Promise.all([
        EscapeRoomService.getBusinessLocations(),
        EscapeRoomService.getRooms()
      ])

      // Calculate business metrics
      const businessMetrics = await Promise.all(
        businessData.map(async (business) => {
          try {
            const summary = await EscapeRoomService.getBusinessSummary(undefined, undefined, business.business_name)
            return {
              ...business,
              room_count: roomData.filter(room => room.business_name === business.business_name).length,
              total_slots: summary.total_slots,
              total_bookings: summary.total_bookings,
              utilization_rate: summary.overall_utilization
            }
          } catch (error) {
            return {
              ...business,
              room_count: roomData.filter(room => room.business_name === business.business_name).length,
              total_slots: 0,
              total_bookings: 0,
              utilization_rate: 0
            }
          }
        })
      )

      // Calculate room metrics
      const roomMetrics = await Promise.all(
        roomData.map(async (room) => {
          try {
            const metrics = await EscapeRoomService.getRoomMetrics(undefined, undefined, room.business_name)
            const roomMetric = metrics.find(m => m.room_id === room.room_id)
            return {
              ...room,
              total_slots: roomMetric?.total_slots || 0,
              booked_slots: roomMetric?.booked_slots || 0,
              utilization_rate: roomMetric?.utilization_rate || 0
            }
          } catch (error) {
            return {
              ...room,
              total_slots: 0,
              booked_slots: 0,
              utilization_rate: 0
            }
          }
        })
      )

      setBusinesses(businessMetrics)
      setRooms(roomMetrics)
      setUsingMockData(false)

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
          business_name: 'I escape',
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
        
        // I escape rooms
        { room_id: 'CLV1', room_name: 'CLUEVIE', business_name: 'I escape', total_slots: 4048, booked_slots: 2024, utilization_rate: 50.0 },
        { room_id: 'DNR2', room_name: 'DONOR', business_name: 'I escape', total_slots: 4048, booked_slots: 2834, utilization_rate: 70.0 },
        { room_id: 'GMS3', room_name: 'GAME SHOW Live!', business_name: 'I escape', total_slots: 4048, booked_slots: 1619, utilization_rate: 40.0 },
        { room_id: 'LOT4', room_name: 'LEGEND OF THE TOMB', business_name: 'I escape', total_slots: 4048, booked_slots: 3643, utilization_rate: 90.0 },
        
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBusinessData()
  }, [])

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
    <div className="space-y-6 p-6">
      {/* Mock Data Warning */}
      {usingMockData && (
        <Alert>
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
            Business Locations
          </h2>
          <p className="text-muted-foreground">
            Overview of all escape room businesses and their rooms
          </p>
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
            <div className="text-2xl font-bold">{businesses.length}</div>
            <p className="text-xs text-muted-foreground">
              Active locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rooms.length}</div>
            <p className="text-xs text-muted-foreground">
              Escape rooms across all businesses
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
              {businesses.reduce((sum, business) => sum + (business.total_slots || 0), 0).toLocaleString()}
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
              {(businesses.reduce((sum, business) => sum + (business.utilization_rate || 0), 0) / businesses.length).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all businesses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Business List */}
      <div className="space-y-6">
        {businesses.map((business) => {
          const businessRooms = rooms.filter(room => room.business_name === business.business_name)
          
          return (
            <Card key={business.business_id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{business.business_name}</CardTitle>
                    <CardDescription>
                      {business.room_count} rooms • {business.total_slots?.toLocaleString()} total slots
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge variant={business.utilization_rate && business.utilization_rate > 70 ? "default" : "secondary"}>
                      {business.utilization_rate?.toFixed(1)}% utilization
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {businessRooms.map((room) => (
                    <div key={room.room_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <Link 
                          href={`/dashboard/escape-rooms/${room.room_id}`} 
                          className="font-medium text-primary hover:underline"
                        >
                          {room.room_name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {room.booked_slots} / {room.total_slots} slots booked
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={room.utilization_rate && room.utilization_rate > 70 ? "default" : "secondary"}>
                          {room.utilization_rate?.toFixed(1)}%
                        </Badge>
                        <Link href={`/dashboard/escape-rooms/${room.room_id}`}>
                          <Button variant="ghost" size="sm" className="ml-2">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
} 