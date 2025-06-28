'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

export default function TestConnection() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...')
  const [businesses, setBusinesses] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [roomSlots, setRoomSlots] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    async function testConnection() {
      const errorLog: string[] = []
      
      try {
        console.log('🔍 Testing Supabase connection...')
        
        // Test 1: Basic connection test
        const { data: testData, error: testError } = await supabase
          .from('Business Location')
          .select('*')
          .limit(1)
        
        if (testError) {
          console.error('❌ Connection failed:', testError)
          errorLog.push(`Connection failed: ${testError.message}`)
          setConnectionStatus('❌ Failed')
        } else {
          console.log('✅ Connection successful')
          setConnectionStatus('✅ Connected')
        }

        // Test 2: Get all businesses
        const { data: businessData, error: businessError } = await supabase
          .from('Business Location')
          .select('*')
          .order('business_name')

        if (businessError) {
          console.error('❌ Business query failed:', businessError)
          errorLog.push(`Business query failed: ${businessError.message}`)
        } else {
          console.log('✅ Businesses found:', businessData?.length || 0)
          setBusinesses(businessData || [])
        }

        // Test 3: Get all rooms
        const { data: roomsData, error: roomsError } = await supabase
          .from('Rooms')
          .select('*')
          .order('business_name')

        if (roomsError) {
          console.error('❌ Rooms query failed:', roomsError)
          errorLog.push(`Rooms query failed: ${roomsError.message}`)
        } else {
          console.log('✅ Rooms found:', roomsData?.length || 0)
          setRooms(roomsData || [])
        }

        // Test 4: Get room slots
        const { data: slotsData, error: slotsError } = await supabase
          .from('Room Slots')
          .select('*')
          .limit(10)
          .order('booking_date', { ascending: false })

        if (slotsError) {
          console.error('❌ Room slots query failed:', slotsError)
          errorLog.push(`Room slots query failed: ${slotsError.message}`)
        } else {
          console.log('✅ Room slots found:', slotsData?.length || 0)
          setRoomSlots(slotsData || [])
        }

        // Test 5: Check environment variables
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (!supabaseUrl) {
          errorLog.push('❌ NEXT_PUBLIC_SUPABASE_URL is not set')
        }
        if (!supabaseKey) {
          errorLog.push('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
        }

        setErrors(errorLog)

      } catch (error) {
        console.error('❌ Unexpected error:', error)
        setConnectionStatus('❌ Error')
        setErrors([`Unexpected error: ${error}`])
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Supabase Connection Test</h1>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Badge variant={connectionStatus.includes('✅') ? "default" : "destructive"}>
              {connectionStatus}
            </Badge>
            <span className="text-sm">
              {connectionStatus.includes('✅') ? 'Supabase connection is working' : 'Connection failed'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span>SUPABASE_URL:</span>
              <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_URL ? "default" : "destructive"}>
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span>SUPABASE_ANON_KEY:</span>
              <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "default" : "destructive"}>
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Data Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{businesses.length}</div>
              <div className="text-sm text-muted-foreground">Businesses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{rooms.length}</div>
              <div className="text-sm text-muted-foreground">Rooms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{roomSlots.length}</div>
              <div className="text-sm text-muted-foreground">Room Slots</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Names */}
      {businesses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Business Names in Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {businesses.map((business, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{business.business_name}</span>
                  <Badge variant="outline">{business.business_id}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Room Slots */}
      {roomSlots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Room Slots (First 5)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {roomSlots.slice(0, 5).map((slot, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">{slot.room_name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {slot.business_name} | {slot.booking_date}
                    </span>
                  </div>
                  <Badge variant={slot.is_available ? "default" : "secondary"}>
                    {slot.is_available ? 'Available' : 'Booked'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {connectionStatus.includes('✅') ? (
              <div>
                <p className="text-green-800">✅ Connection is working!</p>
                {businesses.length === 0 && (
                  <p className="text-yellow-800">⚠️ No businesses found - check your N8N workflow</p>
                )}
                {roomSlots.length === 0 && (
                  <p className="text-yellow-800">⚠️ No room slots found - check your N8N workflow</p>
                )}
                {businesses.length > 0 && roomSlots.length > 0 && (
                  <p className="text-green-800">✅ Data is available - check business names above</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-red-800">❌ Connection failed - check your environment variables</p>
                <ul className="list-disc list-inside text-red-800">
                  <li>Verify NEXT_PUBLIC_SUPABASE_URL is set correctly</li>
                  <li>Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is set correctly</li>
                  <li>Check your Supabase project is active</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 