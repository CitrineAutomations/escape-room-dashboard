'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export default function TestBusinessLookup() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const testBusinessLookup = async (businessName: string) => {
    setLoading(true)
    const testResults: any = {}
    
    try {
      console.log('🔍 Testing business lookup for:', businessName)
      
      // Test 1: Exact match with .single()
      try {
        const { data: singleData, error: singleError } = await supabase
          .from('Business Location')
          .select('*')
          .eq('business_name', businessName)
          .single()
        
        testResults.single = {
          success: !singleError,
          data: singleData,
          error: singleError?.message
        }
        console.log('✅ Single query result:', testResults.single)
      } catch (error) {
        testResults.single = {
          success: false,
          data: null,
          error: error instanceof Error ? error.message : String(error)
        }
        console.log('❌ Single query failed:', testResults.single)
      }

      // Test 2: Exact match with .limit(1).maybeSingle()
      try {
        const { data: limitData, error: limitError } = await supabase
          .from('Business Location')
          .select('*')
          .eq('business_name', businessName)
          .limit(1)
          .maybeSingle()
        
        testResults.limit = {
          success: !limitError,
          data: limitData,
          error: limitError?.message
        }
        console.log('✅ Limit query result:', testResults.limit)
      } catch (error) {
        testResults.limit = {
          success: false,
          data: null,
          error: error instanceof Error ? error.message : String(error)
        }
        console.log('❌ Limit query failed:', testResults.limit)
      }

      // Test 3: Get all matches
      try {
        const { data: allData, error: allError } = await supabase
          .from('Business Location')
          .select('*')
          .eq('business_name', businessName)
        
        testResults.all = {
          success: !allError,
          data: allData,
          count: allData?.length || 0,
          error: allError?.message
        }
        console.log('✅ All query result:', testResults.all)
      } catch (error) {
        testResults.all = {
          success: false,
          data: null,
          count: 0,
          error: error instanceof Error ? error.message : String(error)
        }
        console.log('❌ All query failed:', testResults.all)
      }

      // Test 4: Case insensitive search
      try {
        const { data: ilikeData, error: ilikeError } = await supabase
          .from('Business Location')
          .select('*')
          .ilike('business_name', `%${businessName}%`)
        
        testResults.ilike = {
          success: !ilikeError,
          data: ilikeData,
          count: ilikeData?.length || 0,
          error: ilikeError?.message
        }
        console.log('✅ ILIKE query result:', testResults.ilike)
      } catch (error) {
        testResults.ilike = {
          success: false,
          data: null,
          count: 0,
          error: error instanceof Error ? error.message : String(error)
        }
        console.log('❌ ILIKE query failed:', testResults.ilike)
      }

      // Test 5: Get all business names to see what exists
      try {
        const { data: allBusinesses, error: allBusinessesError } = await supabase
          .from('Business Location')
          .select('business_name')
          .order('business_name')
        
        testResults.allBusinesses = {
          success: !allBusinessesError,
          data: allBusinesses,
          count: allBusinesses?.length || 0,
          error: allBusinessesError?.message
        }
        console.log('✅ All businesses result:', testResults.allBusinesses)
      } catch (error) {
        testResults.allBusinesses = {
          success: false,
          data: null,
          count: 0,
          error: error instanceof Error ? error.message : String(error)
        }
        console.log('❌ All businesses query failed:', testResults.allBusinesses)
      }

    } catch (error) {
      console.error('❌ Unexpected error:', error)
      testResults.error = error instanceof Error ? error.message : String(error)
    }
    
    setResults(testResults)
    setLoading(false)
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Business Lookup Debug Test</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Test Different Business Names</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button 
              onClick={() => testBusinessLookup('The Exit Games')}
              disabled={loading}
              className="w-full"
            >
              Test &quot;The Exit Games&quot;
            </Button>
            <Button 
              onClick={() => testBusinessLookup('The Exit Games\t')}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              Test &quot;The Exit Games&quot; with tab character
            </Button>
            <Button 
              onClick={() => testBusinessLookup('The Exit Games ')}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              Test &quot;The Exit Games&quot; with trailing space
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-center mt-4">Testing business lookup...</p>
          </CardContent>
        </Card>
      )}

      {Object.keys(results).length > 0 && (
        <div className="space-y-6">
          {/* Single Query Result */}
          {results.single && (
            <Card>
              <CardHeader>
                <CardTitle>Single Query (.single())</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span>Success:</span>
                    <Badge variant={results.single.success ? "default" : "destructive"}>
                      {results.single.success ? '✅ Yes' : '❌ No'}
                    </Badge>
                  </div>
                  {results.single.error && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800">
                      Error: {results.single.error}
                    </div>
                  )}
                  {results.single.data && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded text-green-800">
                      Data: {JSON.stringify(results.single.data, null, 2)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Limit Query Result */}
          {results.limit && (
            <Card>
              <CardHeader>
                <CardTitle>Limit Query (.limit(1).maybeSingle())</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span>Success:</span>
                    <Badge variant={results.limit.success ? "default" : "destructive"}>
                      {results.limit.success ? '✅ Yes' : '❌ No'}
                    </Badge>
                  </div>
                  {results.limit.error && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800">
                      Error: {results.limit.error}
                    </div>
                  )}
                  {results.limit.data && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded text-green-800">
                      Data: {JSON.stringify(results.limit.data, null, 2)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Matches Result */}
          {results.all && (
            <Card>
              <CardHeader>
                <CardTitle>All Matches ({results.all.count} found)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span>Success:</span>
                    <Badge variant={results.all.success ? "default" : "destructive"}>
                      {results.all.success ? '✅ Yes' : '❌ No'}
                    </Badge>
                  </div>
                  {results.all.error && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800">
                      Error: {results.all.error}
                    </div>
                  )}
                  {results.all.data && results.all.data.length > 0 && (
                    <div className="space-y-2">
                      {results.all.data.map((business: any, index: number) => (
                        <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded">
                          <div className="text-sm">
                            <strong>Entry {index + 1}:</strong> {business.business_name} (ID: {business.business_id})
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Business Names */}
          {results.allBusinesses && (
            <Card>
              <CardHeader>
                <CardTitle>All Business Names in Database ({results.allBusinesses.count})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.allBusinesses.data && results.allBusinesses.data.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {results.allBusinesses.data.map((business: any, index: number) => (
                        <div key={index} className="p-2 bg-gray-50 border rounded text-sm">
                          {business.business_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
} 