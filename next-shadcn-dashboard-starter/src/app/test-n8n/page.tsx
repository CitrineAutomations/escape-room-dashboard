'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TestResult {
  success: boolean
  message: string
  data?: any
}

export default function TestN8NPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result])
  }

  const clearResults = () => {
    setResults([])
  }

  // Test health check endpoint
  const testHealthCheck = async () => {
    setLoading(true)
    addResult({ success: true, message: '🏃‍♂️ Testing API health check...' })

    try {
      const response = await fetch('/api/n8n-webhook', {
        method: 'GET'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        addResult({ 
          success: true, 
          message: '✅ Health check passed - API is active',
          data
        })
      } else {
        addResult({ 
          success: false, 
          message: `❌ Health check failed: ${data.message}`
        })
      }
    } catch (error) {
      addResult({ 
        success: false, 
        message: `❌ Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setLoading(false)
    }
  }

  // Test duplicate-safe data insertion
  const testSafeDataInsertion = async () => {
    setLoading(true)
    addResult({ success: true, message: '🛡️ Testing duplicate-safe data insertion...' })

    const testSlots = [
      {
        room_id: 'TEST_FSCH1',
        booking_date: '2025-06-28',
        hour: '17:15:00',
        is_available: true,
        available_slots: 6,
        room_name: 'Test Casino Heist',
        business_name: 'Test Exit Games',
        total_capacity: 8,
        booked_capacity: 2
      },
      {
        room_id: 'TEST_WRS3',
        booking_date: '2025-06-28',
        hour: '18:30:00',
        is_available: false,
        available_slots: 0,
        room_name: 'Test White Rabbit Society',
        business_name: 'Test Exit Games',
        total_capacity: 6,
        booked_capacity: 6
      }
    ]

    try {
      // First insertion
      addResult({ success: true, message: '📝 Inserting test data (first time)...' })
      const response1 = await fetch('/api/n8n-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'insert_data',
          slots: testSlots,
          business_name: 'Test Exit Games',
          use_upsert: false // Test safe insert first
        })
      })

      const data1 = await response1.json()
      
      if (response1.ok) {
        addResult({ 
          success: true, 
          message: `✅ First insertion successful: ${data1.message}`,
          data: data1.data
        })

        // Second insertion (should handle duplicates)
        addResult({ success: true, message: '📝 Inserting same data again (testing duplicate handling)...' })
        
        const response2 = await fetch('/api/n8n-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'insert_data',
            slots: testSlots,
            business_name: 'Test Exit Games',
            use_upsert: false // This should skip duplicates
          })
        })

        const data2 = await response2.json()
        
        if (response2.ok) {
          addResult({ 
            success: true, 
            message: `✅ Duplicate handling successful: ${data2.message}`,
            data: data2.data
          })
        } else {
          addResult({ 
            success: false, 
            message: `❌ Duplicate handling failed: ${data2.message}`
          })
        }

      } else {
        addResult({ 
          success: false, 
          message: `❌ First insertion failed: ${data1.message}`
        })
      }

    } catch (error) {
      addResult({ 
        success: false, 
        message: `❌ Safe insertion test error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setLoading(false)
    }
  }

  // Test UPSERT functionality  
  const testUpsertInsertion = async () => {
    setLoading(true)
    addResult({ success: true, message: '🔄 Testing UPSERT data insertion...' })

    const testSlots = [
      {
        room_id: 'UPSERT_TEST1',
        booking_date: '2025-06-28',
        hour: '19:00:00',
        is_available: true,
        available_slots: 4,
        room_name: 'Upsert Test Room 1',
        business_name: 'Test Business',
        total_capacity: 8,
        booked_capacity: 4
      }
    ]

    try {
      // First UPSERT
      addResult({ success: true, message: '📝 First UPSERT...' })
      const response1 = await fetch('/api/n8n-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'insert_data',
          slots: testSlots,
          business_name: 'Test Business',
          use_upsert: true
        })
      })

      const data1 = await response1.json()
      
      if (response1.ok) {
        addResult({ 
          success: true, 
          message: `✅ First UPSERT successful: ${data1.message}`
        })

        // Modified data for second UPSERT
        const modifiedSlots = [
          {
            ...testSlots[0],
            available_slots: 2, // Changed value
            booked_capacity: 6   // Changed value
          }
        ]

        addResult({ success: true, message: '📝 Second UPSERT with modified data...' })
        
        const response2 = await fetch('/api/n8n-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'insert_data',
            slots: modifiedSlots,
            business_name: 'Test Business',
            use_upsert: true
          })
        })

        const data2 = await response2.json()
        
        if (response2.ok) {
          addResult({ 
            success: true, 
            message: `✅ UPSERT update successful: ${data2.message}`
          })
        } else {
          addResult({ 
            success: false, 
            message: `❌ UPSERT update failed: ${data2.message}`
          })
        }

      } else {
        addResult({ 
          success: false, 
          message: `❌ First UPSERT failed: ${data1.message}`
        })
      }

    } catch (error) {
      addResult({ 
        success: false, 
        message: `❌ UPSERT test error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setLoading(false)
    }
  }

  // Test change detection webhook
  const testChangeDetection = async () => {
    setLoading(true)
    addResult({ success: true, message: '📊 Testing change detection webhook...' })

    try {
      const response = await fetch('/api/n8n-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: 'Test Exit Games',
          scrape_completed: true,
          timestamp: new Date().toISOString()
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        addResult({ 
          success: true, 
          message: `✅ Change detection successful: ${data.message}`,
          data: data.data
        })
      } else {
        addResult({ 
          success: false, 
          message: `❌ Change detection failed: ${data.message}`
        })
      }

    } catch (error) {
      addResult({ 
        success: false, 
        message: `❌ Change detection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setLoading(false)
    }
  }

  // Simulate the exact error scenario
  const testDuplicateScenario = async () => {
    setLoading(true)
    addResult({ success: true, message: '🚨 Simulating your exact duplicate error scenario...' })

    // Use the exact ID format from your error
    const problematicSlot = {
      room_id: 'FSCH1',
      booking_date: '2025-06-28',
      hour: '17:15:00',
      is_available: true,
      available_slots: 6,
      room_name: 'Front Street Casino Heist',
      business_name: 'The Exit Games',
      total_capacity: 8,
      booked_capacity: 2
    }

    try {
      // Insert the same data multiple times rapidly
      addResult({ success: true, message: '📝 Inserting same data 3 times rapidly...' })
      
      const promises = []
      for (let i = 0; i < 3; i++) {
        promises.push(
          fetch('/api/n8n-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'insert_data',
              slots: [problematicSlot],
              business_name: 'The Exit Games',
              use_upsert: true // Use UPSERT to handle duplicates
            })
          })
        )
      }

      const responses = await Promise.all(promises)
      const results = await Promise.all(responses.map(r => r.json()))

      let successCount = 0
      let errorCount = 0

      results.forEach((result, index) => {
        if (result.success) {
          successCount++
          addResult({ 
            success: true, 
            message: `✅ Request ${index + 1}: ${result.message}`
          })
        } else {
          errorCount++
          addResult({ 
            success: false, 
            message: `❌ Request ${index + 1}: ${result.message}`
          })
        }
      })

      if (errorCount === 0) {
        addResult({ 
          success: true, 
          message: `🎉 SUCCESS! All ${successCount} rapid requests handled without duplicate errors!`
        })
      } else {
        addResult({ 
          success: false, 
          message: `⚠️ ${successCount} succeeded, ${errorCount} failed - may need further adjustment`
        })
      }

    } catch (error) {
      addResult({ 
        success: false, 
        message: `❌ Duplicate scenario test error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">N8N Integration Testing</h1>
        <div className="space-x-2">
          <Button onClick={clearResults} variant="outline">
            Clear Results
          </Button>
        </div>
      </div>

      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Health Check</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Test if the API endpoint is responding
            </p>
            <Button 
              onClick={testHealthCheck} 
              disabled={loading}
              className="w-full"
            >
              Test Health Check
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Safe Insert</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Test duplicate-safe insertion with duplicate detection
            </p>
            <Button 
              onClick={testSafeDataInsertion} 
              disabled={loading}
              className="w-full"
            >
              Test Safe Insert
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">UPSERT Method</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Test UPSERT functionality for handling duplicates
            </p>
            <Button 
              onClick={testUpsertInsertion} 
              disabled={loading}
              className="w-full"
            >
              Test UPSERT
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Change Detection</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Test change detection webhook processing
            </p>
            <Button 
              onClick={testChangeDetection} 
              disabled={loading}
              className="w-full"
            >
              Test Webhook
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">🚨 Duplicate Error Simulation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Simulate your exact error scenario with multiple rapid inserts
            </p>
            <Button 
              onClick={testDuplicateScenario} 
              disabled={loading}
              className="w-full"
              variant="destructive"
            >
              Test Duplicate Scenario
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Alert>
        <AlertDescription>
          <strong>How to fix your N8N workflow:</strong><br/>
          1. Replace your Supabase insert node with an HTTP Request to <code>/api/n8n-webhook</code><br/>
          2. Set the body to: <code>{`{"action": "insert_data", "slots": [...], "use_upsert": true}`}</code><br/>
          3. This will eliminate all duplicate key errors while preserving your data
        </AlertDescription>
      </Alert>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="flex items-start gap-2 p-2 rounded border">
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? "OK" : "ERROR"}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm">{result.message}</p>
                    {result.data && (
                      <pre className="text-xs text-muted-foreground mt-1 overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Running tests...</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
} 