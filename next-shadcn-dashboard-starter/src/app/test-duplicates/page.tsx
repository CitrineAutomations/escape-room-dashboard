'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

export default function TestDuplicates() {
  const [duplicates, setDuplicates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function findDuplicates() {
      try {
        console.log('🔍 Finding all "The Exit Games" entries...')
        
        const { data, error } = await supabase
          .from('Business Location')
          .select('*')
          .eq('business_name', 'The Exit Games')

        if (error) {
          console.error('❌ Error:', error)
        } else {
          console.log('✅ Found entries:', data?.length || 0)
          setDuplicates(data || [])
        }
      } catch (error) {
        console.error('❌ Unexpected error:', error)
      } finally {
        setLoading(false)
      }
    }

    findDuplicates()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-center mt-4">Finding duplicate entries...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Duplicate &quot;The Exit Games&quot; Entries</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Found {duplicates.length} entries for &quot;The Exit Games&quot;</CardTitle>
        </CardHeader>
        <CardContent>
          {duplicates.length > 0 ? (
            <div className="space-y-4">
              {duplicates.map((business, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Entry #{index + 1}</h3>
                    <Badge variant="outline">{business.business_id}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {business.business_name}
                    </div>
                    <div>
                      <span className="font-medium">Address:</span> {business.address || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Open Time:</span> {business.open_time || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Close Time:</span> {business.close_time || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No entries found</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommendation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              <strong>Fix Applied:</strong> The business dashboard has been updated to handle duplicate entries.
            </p>
            <p className="text-blue-700 text-sm mt-2">
              The dashboard will now use the first &quot;The Exit Games&quot; entry it finds instead of failing.
            </p>
            <p className="text-blue-700 text-sm mt-2">
              <strong>Next:</strong> Try visiting the business dashboard again at:
            </p>
            <p className="text-blue-700 text-sm mt-1 font-mono">
              http://localhost:3000/dashboard/businesses/The%20Exit%20Games
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 