'use client'

import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EscapeRoomService } from '@/lib/escape-room-service';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

interface RecentBooking {
  room_name: string;
  business_name: string;
  booking_date: string;
  hour: string;
  is_available: boolean;
  available_slots: number;
}

interface RecentSalesProps {
  dateRange?: DateRange
}

export function RecentSales({ dateRange }: RecentSalesProps) {
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRecentBookings = async () => {
      try {
        setLoading(true)
        
        const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined
        const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
        
        const slots = await EscapeRoomService.getRoomSlots(startDate, endDate)
        // Get recent bookings (not available slots) and sort by date
        const bookings = slots
          .filter(slot => !slot.is_available)
          .sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime())
          .slice(0, 5)
        
        setRecentBookings(bookings)
      } catch (error) {
        console.error('Error loading recent bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRecentBookings()
  }, [dateRange])

  if (loading) {
    return (
      <Card className='h-full'>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Loading recent escape room bookings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='flex items-center space-x-4'>
                <div className='w-9 h-9 bg-muted rounded-full animate-pulse'></div>
                <div className='space-y-2 flex-1'>
                  <div className='h-4 bg-muted rounded animate-pulse'></div>
                  <div className='h-3 bg-muted rounded w-3/4 animate-pulse'></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Recent Bookings</CardTitle>
        <CardDescription>
          Latest escape room reservations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {recentBookings.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-muted-foreground'>No recent bookings found</p>
            </div>
          ) : (
            recentBookings.map((booking, index) => (
              <div key={index} className='flex items-center'>
                <Avatar className='h-9 w-9'>
                  <AvatarFallback className='bg-primary/10 text-primary'>
                    {booking.room_name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className='ml-4 space-y-1'>
                  <p className='text-sm leading-none font-medium'>{booking.room_name}</p>
                  <p className='text-muted-foreground text-sm'>
                    {format(new Date(booking.booking_date), 'MMM dd')} at {booking.hour}
                  </p>
                </div>
                <div className='ml-auto text-right'>
                  <Badge variant='secondary' className='text-xs'>
                    Booked
                  </Badge>
                  <p className='text-xs text-muted-foreground mt-1'>
                    {booking.business_name}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
