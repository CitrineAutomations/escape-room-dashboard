'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

export default function TestExitGames() {
  const [businessData, setBusinessData] = useState<any>(null)
  const [roomsData, setRoomsData] = useState<any[]>([])
  const [slotsData, setSlotsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    async function testExitGames() {
      const errorLog: string[] = []
      
      try {
        console.log('🔍 Testing "The Exit Games" specifically...')
        
        // Test 1: Get "The Exit Games" business info
        const { data: business, error: businessError } = await supabase
          .from('Business Location')
          .select('*')
          .eq('business_name', 'The Exit Games')
          .single()

        if (businessError) {
          console.error('❌ Error fetching "The Exit Games":', businessError)
          errorLog.push(`Business error: ${businessError.message}`)
        } else {
          console.log('✅ "The Exit Games" found:', business)
          setBusinessData(business)
        }

        // Test 2: Get rooms for "The Exit Games"
        const { data: rooms, error: roomsError } = await supabase
          .from('Rooms')
          .select('*')
          .eq('business_name', 'The Exit Games')

        if (roomsError) {
          console.error('❌ Error fetching rooms:', roomsError)
          errorLog.push(`Rooms error: ${roomsError.message}`)
        } else {
          console.log('✅ Rooms for "The Exit Games":', rooms?.length || 0)
          setRoomsData(rooms || [])
        }

        // Test 3: Get ALL room slots for "The Exit Games" (no date filtering)
        const { data: slots, error: slotsError } = await supabase
          .from('Room Slots')
          .select('*')
          .eq('business_name', 'The Exit Games')

        if (slotsError) {
          console.error('❌ Error fetching room slots:', slotsError)
          errorLog.push(`Slots error: ${slotsError.message}`)
        } else {
          console.log('✅ Room slots for "The Exit Games":', slots?.length || 0)
          if (slots && slots.length > 0) {
            console.log('📊 Sample slots:', slots.slice(0, 3))
          }
          setSlotsData(slots || [])
        }

        // Test 4: Check for any room slots with different business name variations
        const { data: allSlots, error: allSlotsError } = await supabase
          .from('Room Slots')
          .select('business_name')
          .ilike('business_name', '%Exit%')

        if (!allSlotsError && allSlots) {
          console.log('🔍 All slots with "Exit" in name:', allSlots)
          const uniqueNames = [...new Set(allSlots.map(slot => slot.business_name))]
          console.log('📝 Unique business names with "Exit":', uniqueNames)
        }

        setErrors(errorLog)

      } catch (error) {
        console.error('❌ Unexpected error:', error)
        setErrors([`Unexpected error: ${error}`])
      } finally {
        setLoading(false)
      }
    }

    testExitGames()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-center mt-4">Testing "The Exit Games" data...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">"The Exit Games" Data Test</h1>

      {/* Business Info */}
      {businessData && (
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Name:</span>
                <span>{businessData.business_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">ID:</span>
                <Badge variant="outline">{businessData.business_id}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Address:</span>
                <span>{businessData.address || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rooms */}
      <Card>
        <CardHeader>
          <CardTitle>Rooms ({roomsData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {roomsData.length > 0 ? (
            <div className="space-y-2">
              {roomsData.map((room, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{room.room_name}</span>
                  <div className="flex space-x-2">
                    <Badge variant="outline">{room.room_id}</Badge>
                    <Badge variant="secondary">Capacity: {room.capacity}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No rooms found for "The Exit Games"</p>
          )}
        </CardContent>
      </Card>

      {/* Room Slots */}
      <Card>
        <CardHeader>
          <CardTitle>Room Slots ({slotsData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {slotsData.length > 0 ? (
            <div className="space-y-2">
              {slotsData.slice(0, 10).map((slot, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">{slot.room_name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {slot.booking_date} at {slot.hour}
                    </span>
                  </div>
                  <Badge variant={slot.is_available ? "default" : "secondary"}>
                    {slot.is_available ? 'Available' : 'Booked'}
                  </Badge>
                </div>
              ))}
              {slotsData.length > 10 && (
                <p className="text-sm text-muted-foreground">
                  Showing first 10 of {slotsData.length} slots
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-yellow-800">
                <strong>No room slots found for "The Exit Games"</strong>
              </p>
              <p className="text-yellow-700 text-sm mt-2">
                This means either:
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-700 mt-1">
                <li>The N8N workflow hasn't created room slots for this business yet</li>
                <li>The business name in the Room Slots table is different</li>
                <li>There's a data synchronization issue</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Errors Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-red-800">
                  {error}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Business Found:</span>
              <Badge variant={businessData ? "default" : "destructive"}>
                {businessData ? '✅ Yes' : '❌ No'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Rooms Found:</span>
              <Badge variant={roomsData.length > 0 ? "default" : "destructive"}>
                {roomsData.length > 0 ? `✅ ${roomsData.length}` : '❌ None'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Room Slots Found:</span>
              <Badge variant={slotsData.length > 0 ? "default" : "destructive"}>
                {slotsData.length > 0 ? `✅ ${slotsData.length}` : '❌ None'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 