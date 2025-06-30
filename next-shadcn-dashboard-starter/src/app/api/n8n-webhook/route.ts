import { NextRequest, NextResponse } from 'next/server'
import { BookingChangeTracker } from '@/lib/booking-change-tracker'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check if this is a data insertion request or webhook notification
    if (body.action === 'insert_data' && body.slots) {
      // Handle N8N data insertion with duplicate protection
      return await handleDataInsertion(body)
    } else {
      // Handle N8N webhook for change detection
      return await handleWebhookNotification(body)
    }
    
  } catch (error) {
    console.error('❌ N8N API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function handleDataInsertion(body: {
  action: string,
  slots: any[],
  business_name?: string,
  scrape_id?: string,
  use_upsert?: boolean
}) {
  try {
    console.log(`🔄 N8N data insertion request for ${body.business_name || 'unknown business'}: ${body.slots?.length || 0} slots`)
    
    if (!body.slots || !Array.isArray(body.slots) || body.slots.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No slots data provided'
      }, { status: 400 })
    }

    // Generate scrape ID if not provided
    const scrapeId = body.scrape_id || BookingChangeTracker.generateScrapeId()
    
    let result
    if (body.use_upsert) {
      // Use UPSERT method - safer for duplicates
      result = await BookingChangeTracker.upsertRoomSlotsWithTimeSeries(body.slots, scrapeId)
    } else {
      // Use safe insert method - checks for duplicates first
      result = await BookingChangeTracker.safeInsertRoomSlots(body.slots, scrapeId)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${result.length} room slots`,
      data: {
        inserted: result.length,
        scrape_id: scrapeId,
        slots: result
      }
    })

  } catch (error) {
    console.error('❌ N8N data insertion error:', error)
    return NextResponse.json({
      success: false,
      message: `Data insertion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
}

async function handleWebhookNotification(body: {
  business_name?: string,
  scrape_completed: boolean,
  timestamp: string
}) {
  try {
    if (!body.scrape_completed) {
      return NextResponse.json({
        success: false,
        message: 'Scrape not completed'
      }, { status: 400 })
    }
    
    console.log(`🔗 N8N webhook notification for ${body.business_name || 'all businesses'} at ${body.timestamp}`)
    
    // Wait a moment for any parallel processes to finish
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Process the scrape for change detection
    const result = await BookingChangeTracker.processN8NScrape(body.business_name)
    
    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} slots, detected ${result.changes} changes`,
      data: result
    })
    
  } catch (error) {
    console.error('❌ N8N webhook error:', error)
    return NextResponse.json({
      success: false,
      message: `Webhook processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  return NextResponse.json({
    success: true,
    message: 'N8N webhook endpoint is active',
    endpoints: {
      'POST /api/n8n-webhook': {
        'Data Insertion': {
          description: 'Insert room slots data with duplicate protection',
          body: {
            action: 'insert_data',
            slots: 'Array of room slot objects',
            business_name: 'string (optional)',
            scrape_id: 'string (optional)',
            use_upsert: 'boolean (optional, default: false)'
          }
        },
        'Webhook Notification': {
          description: 'Notify completion of scrape for change detection',
          body: {
            business_name: 'string (optional)',
            scrape_completed: true,
            timestamp: 'ISO string'
          }
        }
      }
    },
    timestamp: new Date().toISOString()
  })
} 