'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

interface TestResult {
  success: boolean
  message: string
  data?: any
}

export default function TestConstraintsPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)

  const checkTableStructure = async () => {
    setLoading(true)
    const results: TestResult[] = []
    
    try {
      // Check if table is accessible and get sample data
      const { data: sampleData, error: sampleError } = await supabase
        .from('Room Slots')
        .select('*')
        .limit(3)

      if (sampleError) {
        results.push({ success: false, message: `Table access failed: ${sampleError.message}` })
      } else {
        results.push({ 
          success: true, 
          message: `✅ Table accessible. Sample of ${sampleData?.length || 0} records:`,
          data: sampleData 
        })
      }

      // Check for scrape_timestamp column specifically
      const { data: timestampCheck, error: timestampError } = await supabase
        .from('Room Slots')
        .select('scrape_timestamp, scrape_id')
        .not('scrape_timestamp', 'is', null)
        .limit(2)

      if (timestampError) {
        results.push({ success: false, message: `scrape_timestamp column check failed: ${timestampError.message}` })
      } else {
        results.push({ 
          success: true, 
          message: `✅ scrape_timestamp column exists. Records with timestamps: ${timestampCheck?.length || 0}`,
          data: timestampCheck 
        })
      }

    } catch (error) {
      results.push({ success: false, message: `Error: ${error}` })
    }

    setTestResults(results)
    setLoading(false)
  }

  const testTimeSeriesInsertion = async () => {
    setLoading(true)
    const results: TestResult[] = []
    
    try {
      const baseTime = new Date()
      const testData = [
        {
          id: `test_${Date.now()}_1`,
          room_id: 'TEST_ROOM',
          booking_date: '2025-01-15',
          hour: '15:30:00',
          is_available: true,
          available_slots: 5,
          room_name: 'Test Room',
          business_name: 'Test Business',
          total_capacity: 8,
          scrape_timestamp: new Date(baseTime.getTime()).toISOString(),
          scrape_id: `scrape_${Date.now()}_1`,
          booked_capacity: 3
        },
        {
          id: `test_${Date.now()}_2`,
          room_id: 'TEST_ROOM',
          booking_date: '2025-01-15',
          hour: '15:30:00',
          is_available: true,
          available_slots: 3,
          room_name: 'Test Room',
          business_name: 'Test Business',
          total_capacity: 8,
          scrape_timestamp: new Date(baseTime.getTime() + 15 * 60 * 1000).toISOString(),
          scrape_id: `scrape_${Date.now()}_2`,
          booked_capacity: 5
        }
      ]

      results.push({ success: true, message: '🧪 Starting time-series insertion test...' })

      // Test first insert
      const { data: insert1, error: error1 } = await supabase
        .from('Room Slots')
        .insert(testData[0])
        .select()

      if (error1) {
        results.push({ success: false, message: `❌ First insert failed: ${error1.message}` })
      } else {
        results.push({ success: true, message: '✅ First record inserted successfully' })
      }

      // Test second insert (same room/date/hour, different timestamp)
      const { data: insert2, error: error2 } = await supabase
        .from('Room Slots')
        .insert(testData[1])
        .select()

      if (error2) {
        results.push({ success: false, message: `❌ Second insert failed: ${error2.message}` })
        results.push({ success: false, message: '🔍 This suggests constraints are NOT updated for time-series data' })
      } else {
        results.push({ success: true, message: '🎉 SUCCESS: Time-series constraints working!' })
        results.push({ success: true, message: '✅ Multiple records with same room/date/hour but different timestamps allowed' })
      }

      // Query both records
      const { data: queryData, error: queryError } = await supabase
        .from('Room Slots')
        .select('room_id, booking_date, hour, scrape_timestamp, available_slots')
        .eq('room_id', 'TEST_ROOM')
        .order('scrape_timestamp', { ascending: true })

      if (queryError) {
        results.push({ success: false, message: `Query failed: ${queryError.message}` })
      } else {
        results.push({ 
          success: true, 
          message: `📊 Found ${queryData?.length || 0} time-series records for TEST_ROOM`,
          data: queryData 
        })
      }

      // Cleanup
      await supabase.from('Room Slots').delete().eq('room_id', 'TEST_ROOM')
      results.push({ success: true, message: '🧹 Test data cleaned up' })

    } catch (error) {
      results.push({ success: false, message: `Error: ${error}` })
    }

    setTestResults(results)
    setLoading(false)
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Database Constraints Test</h1>
          <p className="text-muted-foreground">
            Verify time-series data insertion capability after constraint updates
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={checkTableStructure} disabled={loading} variant="outline">
            Check Table Structure
          </Button>
          <Button onClick={testTimeSeriesInsertion} disabled={loading}>
            Test Time-Series Insert
          </Button>
          <Button onClick={clearResults} variant="ghost" disabled={loading}>
            Clear
          </Button>
        </div>
      </div>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? 'SUCCESS' : 'ERROR'}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm">{result.message}</p>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                          View data ({Array.isArray(result.data) ? result.data.length : 1} items)
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>What This Test Does</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Table Structure Check:</h4>
            <p className="text-sm text-muted-foreground">
              Verifies table accessibility and checks if scrape_timestamp and scrape_id columns exist.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Time-Series Insert Test:</h4>
            <p className="text-sm text-muted-foreground">
              Attempts to insert two records with identical room_id, booking_date, and hour but different scrape_timestamps.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Expected Results:</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>✅ <strong>Success:</strong> Both records insert without constraint violations</li>
              <li>✅ Query finds 2 records for the same slot with different timestamps</li>
              <li>❌ <strong>Failure:</strong> "duplicate key value violates unique constraint" error</li>
            </ul>
          </div>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-medium mb-2">SQL Commands Applied:</h4>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
{`-- Remove old unique constraint that blocks time-series
ALTER TABLE "Room Slots" DROP CONSTRAINT IF EXISTS room_slots_unique;

-- Add tracking columns
ALTER TABLE "Room Slots" 
ADD COLUMN IF NOT EXISTS scrape_id TEXT,
ADD COLUMN IF NOT EXISTS scrape_sequence INTEGER DEFAULT 1;

-- Create new constraint allowing multiple timestamps
ALTER TABLE "Room Slots" 
ADD CONSTRAINT room_slots_time_series_unique 
UNIQUE (room_id, booking_date, hour, scrape_timestamp);`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 