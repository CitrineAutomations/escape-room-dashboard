'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EscapeRoomService } from '@/lib/escape-room-service'
import { supabase } from '@/lib/supabase'

export default function DebugDataPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const runDebugTests = async () => {
    setLoading(true)
    const results: any = {}

    try {
      // Test 1: Direct Supabase connection
      console.log('🔍 Testing direct Supabase connection...')
      const { data: businessData, error: businessError } = await supabase
        .from('Business Location')
        .select('*')
        .limit(10)
      
      results.directBusinesses = {
        data: businessData,
        error: businessError,
        count: businessData?.length || 0
      }

      // Test 2: Direct Room Slots query
      console.log('🔍 Testing direct Room Slots query...')
      const { data: slotsData, error: slotsError } = await supabase
        .from('Room Slots')
        .select('*')
        .limit(10)
      
      results.directSlots = {
        data: slotsData,
        error: slotsError,
        count: slotsData?.length || 0
      }

      // Test 3: EscapeRoomService methods
      console.log('🔍 Testing EscapeRoomService.getBusinessLocations()...')
      const serviceBusinesses = await EscapeRoomService.getBusinessLocations()
      results.serviceBusinesses = {
        data: serviceBusinesses,
        count: serviceBusinesses.length
      }

      console.log('🔍 Testing EscapeRoomService.getRoomSlots()...')
      const serviceSlots = await EscapeRoomService.getRoomSlots()
      results.serviceSlots = {
        data: serviceSlots.slice(0, 5), // First 5 for display
        count: serviceSlots.length
      }

      // Test 4: Check unique business names in slots
      if (slotsData && slotsData.length > 0) {
        const uniqueBusinessNames = Array.from(new Set(slotsData.map((slot: any) => slot.business_name)))
        results.uniqueBusinessNames = uniqueBusinessNames
      }

      // Test 5: Check date ranges
      if (slotsData && slotsData.length > 0) {
        const dates = slotsData.map((slot: any) => slot.booking_date).sort()
        results.dateRange = {
          earliest: dates[0],
          latest: dates[dates.length - 1],
          totalDates: new Set(dates).size
        }
      }

      // Test 6: Simulate exact businesses page data loading
      console.log('🔍 Simulating businesses page data loading...')
      const businessesForPage = await EscapeRoomService.getBusinessLocations()
      const roomsForPage = await EscapeRoomService.getRooms()
      
      if (businessesForPage.length > 0) {
        const firstBusiness = businessesForPage[0]
        console.log(`🔍 Testing business metrics for: ${firstBusiness.business_name}`)
        
        // Get slots for this business (same as businesses page does)
        const businessSlots = await EscapeRoomService.getRoomSlots(undefined, undefined, firstBusiness.business_name)
        
        const totalSlots = businessSlots.length
        const bookedSlots = businessSlots.filter(slot => !slot.is_available || slot.available_slots === 0).length
        const utilizationRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0
        
        results.businessPageSimulation = {
          businessName: firstBusiness.business_name,
          totalBusinesses: businessesForPage.length,
          totalRooms: roomsForPage.length,
          businessSlots: businessSlots.length,
          sampleSlots: businessSlots.slice(0, 3),
          calculatedMetrics: {
            totalSlots,
            bookedSlots,
            utilizationRate
          }
        }
      } else {
        results.businessPageSimulation = {
          error: 'No businesses found via EscapeRoomService.getBusinessLocations()'
        }
      }

      // Test 7: Business Hours Filtering Test
      console.log('🔍 Testing business hours filtering...')
      const allSlotsUnfiltered = await EscapeRoomService.getRoomSlots()
      
      // Test business name matching first
      const businessHoursConfig = EscapeRoomService.getBusinessHoursConfig()
      const configuredBusinesses = Object.keys(businessHoursConfig)
      const databaseBusinesses = Array.from(new Set(allSlotsUnfiltered.map(slot => slot.business_name)))
      
      const businessMatching = databaseBusinesses.map(dbBusiness => {
        const normalized = EscapeRoomService.normalizeBusinessName(dbBusiness)
        const matchedConfig = configuredBusinesses.find(configBusiness => 
          EscapeRoomService.normalizeBusinessName(configBusiness) === normalized
        )
        return {
          databaseName: dbBusiness,
          normalizedName: normalized,
          matchedConfig: matchedConfig || 'NO MATCH',
          hasBusinessHours: !!matchedConfig
        }
      })
      
      // Check how many slots would be filtered out by business hours
      const sampleTestSlots = [
        { business_name: 'Green Light Escape', booking_date: '2025-01-06', hour: '10:00:00' }, // Monday 10am (before 11am - should be filtered)
        { business_name: 'Green Light Escape', booking_date: '2025-01-06', hour: '11:00:00' }, // Monday 11am (should be included)
        { business_name: 'Cracked IT', booking_date: '2025-01-01', hour: '14:00:00' }, // Wednesday 2pm (before 3pm - should be filtered)
        { business_name: 'Cracked IT', booking_date: '2025-01-01', hour: '15:00:00' }, // Wednesday 3pm (should be included)
        { business_name: 'Cracked IT', booking_date: '2025-01-01', hour: '20:00:00' }, // Wednesday 8pm (should be included)
        { business_name: 'The Exit Games\t', booking_date: '2025-01-06', hour: '15:00:00' }, // Monday (CLOSED - should be filtered)
      ]
      
      results.businessHoursTest = {
        totalSlotsBeforeFiltering: allSlotsUnfiltered.length,
        businessMatching: businessMatching,
        configuredBusinesses: configuredBusinesses,
        databaseBusinesses: databaseBusinesses,
        sampleFilteringResults: sampleTestSlots.map(slot => ({
          ...slot,
          wouldBeIncluded: 'Testing...' // We'll see if the actual filtering worked
        })),
        note: 'NEW Business hours - Cracked IT: Mon-Thu 3PM-8PM, Fri 3PM-9:30PM, Sat-Sun 12PM-8PM/9:30PM | Green Light: Mon-Thu 11AM-9:30PM, Fri-Sat 11AM-10:15PM, Sun 11:30AM-8:45PM | iEscape: Daily 12PM-Midnight | Exit Games: Mon-Tue CLOSED, Wed-Fri 2:45PM-9:15PM, Sat 11AM-10:15PM, Sun 11:15AM-8:30PM'
      }

    } catch (error) {
      results.globalError = error instanceof Error ? error.message : 'Unknown error'
    }

    setDebugInfo(results)
    setLoading(false)
  }

  useEffect(() => {
    runDebugTests()
  }, [])

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Database Debug Information</h1>
        <Button onClick={runDebugTests} disabled={loading}>
          {loading ? 'Running Tests...' : 'Refresh Tests'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Direct Business Query */}
        <Card>
          <CardHeader>
            <CardTitle>Direct Business Location Query</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Count:</strong> {debugInfo.directBusinesses?.count || 0}</p>
              <p><strong>Error:</strong> {debugInfo.directBusinesses?.error ? 'Yes' : 'No'}</p>
              {debugInfo.directBusinesses?.error && (
                <pre className="bg-red-50 p-2 rounded text-sm">
                  {JSON.stringify(debugInfo.directBusinesses.error, null, 2)}
                </pre>
              )}
              {debugInfo.directBusinesses?.data && (
                <pre className="bg-gray-50 p-2 rounded text-sm max-h-40 overflow-y-auto">
                  {JSON.stringify(debugInfo.directBusinesses.data, null, 2)}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Direct Room Slots Query */}
        <Card>
          <CardHeader>
            <CardTitle>Direct Room Slots Query</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Count:</strong> {debugInfo.directSlots?.count || 0}</p>
              <p><strong>Error:</strong> {debugInfo.directSlots?.error ? 'Yes' : 'No'}</p>
              {debugInfo.directSlots?.error && (
                <pre className="bg-red-50 p-2 rounded text-sm">
                  {JSON.stringify(debugInfo.directSlots.error, null, 2)}
                </pre>
              )}
              {debugInfo.directSlots?.data && (
                <pre className="bg-gray-50 p-2 rounded text-sm max-h-40 overflow-y-auto">
                  {JSON.stringify(debugInfo.directSlots.data, null, 2)}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Method Results */}
        <Card>
          <CardHeader>
            <CardTitle>EscapeRoomService Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p><strong>Service Businesses Count:</strong> {debugInfo.serviceBusinesses?.count || 0}</p>
                {debugInfo.serviceBusinesses?.data && (
                  <pre className="bg-gray-50 p-2 rounded text-sm max-h-40 overflow-y-auto">
                    {JSON.stringify(debugInfo.serviceBusinesses.data, null, 2)}
                  </pre>
                )}
              </div>
              <div>
                <p><strong>Service Slots Count:</strong> {debugInfo.serviceSlots?.count || 0}</p>
                {debugInfo.serviceSlots?.data && (
                  <pre className="bg-gray-50 p-2 rounded text-sm max-h-40 overflow-y-auto">
                    {JSON.stringify(debugInfo.serviceSlots.data, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Names Found */}
        {debugInfo.uniqueBusinessNames && (
          <Card>
            <CardHeader>
              <CardTitle>Unique Business Names in Database</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {debugInfo.uniqueBusinessNames.map((name: string, index: number) => (
                  <div key={index} className="p-2 bg-gray-50 rounded">
                    "{name}"
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Date Range Info */}
        {debugInfo.dateRange && (
          <Card>
            <CardHeader>
              <CardTitle>Available Date Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Earliest Date:</strong> {debugInfo.dateRange.earliest}</p>
                <p><strong>Latest Date:</strong> {debugInfo.dateRange.latest}</p>
                <p><strong>Total Unique Dates:</strong> {debugInfo.dateRange.totalDates}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Businesses Page Simulation */}
        {debugInfo.businessPageSimulation && (
          <Card>
            <CardHeader>
              <CardTitle>Businesses Page Data Loading Simulation</CardTitle>
            </CardHeader>
            <CardContent>
              {debugInfo.businessPageSimulation.error ? (
                <div className="bg-red-50 p-2 rounded text-sm">
                  <strong>Error:</strong> {debugInfo.businessPageSimulation.error}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p><strong>Test Business:</strong> {debugInfo.businessPageSimulation.businessName}</p>
                      <p><strong>Total Businesses Found:</strong> {debugInfo.businessPageSimulation.totalBusinesses}</p>
                      <p><strong>Total Rooms Found:</strong> {debugInfo.businessPageSimulation.totalRooms}</p>
                    </div>
                    <div>
                      <p><strong>Business Slots:</strong> {debugInfo.businessPageSimulation.businessSlots}</p>
                      <p><strong>Total Slots:</strong> {debugInfo.businessPageSimulation.calculatedMetrics?.totalSlots || 0}</p>
                      <p><strong>Booked Slots:</strong> {debugInfo.businessPageSimulation.calculatedMetrics?.bookedSlots || 0}</p>
                      <p><strong>Utilization:</strong> {debugInfo.businessPageSimulation.calculatedMetrics?.utilizationRate?.toFixed(1) || 0}%</p>
                    </div>
                  </div>
                  
                  {debugInfo.businessPageSimulation.sampleSlots && (
                    <div>
                      <p><strong>Sample Slots:</strong></p>
                      <pre className="bg-gray-50 p-2 rounded text-sm max-h-40 overflow-y-auto">
                        {JSON.stringify(debugInfo.businessPageSimulation.sampleSlots, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Business Hours Filtering Test */}
        {debugInfo.businessHoursTest && (
          <Card>
            <CardHeader>
              <CardTitle>Business Hours Filtering Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm"><strong>Note:</strong> {debugInfo.businessHoursTest.note}</p>
                </div>
                
                <div>
                  <p><strong>Total Slots After Business Hours Filtering:</strong> {debugInfo.businessHoursTest.totalSlotsBeforeFiltering}</p>
                  <p className="text-sm text-muted-foreground">This count should exclude slots outside business hours</p>
                </div>

                <div>
                  <p><strong>Business Name Matching Analysis:</strong></p>
                  <div className="space-y-1 mt-2">
                    {debugInfo.businessHoursTest.businessMatching?.map((match: any, index: number) => (
                      <div key={index} className={`p-2 rounded text-sm ${match.hasBusinessHours ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="font-mono">
                          <span className="font-semibold">DB:</span> "{match.databaseName}" → 
                          <span className="font-semibold"> Normalized:</span> "{match.normalizedName}" → 
                          <span className="font-semibold"> Config:</span> {match.matchedConfig}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p><strong>Sample Filtering Test Cases:</strong></p>
                  <div className="space-y-2 mt-2">
                    {debugInfo.businessHoursTest.sampleFilteringResults?.map((test: any, index: number) => (
                      <div key={index} className="grid grid-cols-4 gap-2 p-2 bg-gray-50 rounded text-sm">
                        <div>{test.business_name}</div>
                        <div>{test.booking_date} {test.hour}</div>
                        <div>{new Date(test.booking_date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className={test.wouldBeIncluded === 'Included' ? 'text-green-600' : test.wouldBeIncluded === 'Filtered' ? 'text-red-600' : 'text-gray-500'}>
                          {test.wouldBeIncluded}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Global Error */}
        {debugInfo.globalError && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Global Error</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-red-50 p-2 rounded text-sm">
                {debugInfo.globalError}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 