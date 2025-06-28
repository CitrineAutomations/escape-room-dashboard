'use client'

import { useEffect, useState } from 'react'
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaGraph } from './area-graph';
import { BarGraph } from './bar-graph';
import { PieGraph } from './pie-graph';
import { RecentSales } from './recent-sales';
import { IconTrendingUp, IconTrendingDown, IconCalendar, IconUsers, IconBuilding, IconClock, IconTarget, IconChartBar } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { EscapeRoomService } from '@/lib/escape-room-service';
import { DateRangePicker } from '@/components/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

interface DashboardStats {
  total_slots: number
  total_bookings: number
  overall_utilization: number
  average_room_utilization: number
  business_count: number
}

export default function OverViewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  })

  useEffect(() => {
    loadStats()
  }, [dateRange])

  const loadStats = async () => {
    try {
      setLoading(true)
      
      const startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined
      const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined

      const summary = await EscapeRoomService.getBusinessSummary(startDate, endDate)
      setStats(summary)
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
  }

  if (loading) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col space-y-2'>
          <div className='flex items-center justify-between space-y-2'>
            <h2 className='text-2xl font-bold tracking-tight'>
              Loading Escape Room Dashboard...
            </h2>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Escape Room Dashboard 👋
          </h2>
          <div className='hidden items-center space-x-2 md:flex'>
            <DateRangePicker 
              dateRange={dateRange} 
              onDateRangeChange={handleDateRangeChange}
            />
            <Button>Export Data</Button>
          </div>
        </div>
        
        {/* Mobile Date Range Picker */}
        <div className='md:hidden'>
          <DateRangePicker 
            dateRange={dateRange} 
            onDateRangeChange={handleDateRangeChange}
          />
        </div>
        <Tabs defaultValue='overview' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='analytics'>Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value='overview' className='space-y-4'>
            <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3'>
              <Card className='@container/card'>
                <CardHeader>
                  <CardDescription>Total Bookings</CardDescription>
                  <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                    {stats?.total_bookings || 0}
                  </CardTitle>
                  <CardAction>
                    <Badge variant='outline'>
                      <IconUsers />
                      {stats?.overall_utilization.toFixed(1) || '0'}%
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium'>
                    Out of {stats?.total_slots || 0} total slots <IconCalendar className='size-4' />
                  </div>
                  <div className='text-muted-foreground'>
                    Overall utilization rate
                  </div>
                </CardFooter>
              </Card>
              <Card className='@container/card'>
                <CardHeader>
                  <CardDescription>Business Locations</CardDescription>
                  <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                    {stats?.business_count || 0}
                  </CardTitle>
                  <CardAction>
                    <Badge variant='outline'>
                      <IconBuilding />
                      Active
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium'>
                    Escape room businesses <IconBuilding className='size-4' />
                  </div>
                  <div className='text-muted-foreground'>
                    Across all locations
                  </div>
                </CardFooter>
              </Card>
              <Card className='@container/card'>
                <CardHeader>
                  <CardDescription>Avg Room Utilization</CardDescription>
                  <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                    {stats?.average_room_utilization.toFixed(1) || '0'}%
                  </CardTitle>
                  <CardAction>
                    <Badge variant='outline'>
                      <IconTarget />
                      Per Room
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium'>
                    Average across all rooms <IconClock className='size-4' />
                  </div>
                  <div className='text-muted-foreground'>
                    Room performance metric
                  </div>
                </CardFooter>
              </Card>
            </div>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
              <div className='col-span-4'>
                <BarGraph dateRange={dateRange} />
              </div>
              <Card className='col-span-4 md:col-span-3'>
                <RecentSales dateRange={dateRange} />
              </Card>
              <div className='col-span-4'>
                <AreaGraph dateRange={dateRange} />
              </div>
              <div className='col-span-4 md:col-span-3'>
                <PieGraph dateRange={dateRange} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value='analytics' className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <IconChartBar className='h-5 w-5' />
                    Performance Insights
                  </CardTitle>
                  <CardDescription>
                    Key performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm'>Peak Hours</span>
                      <Badge variant='secondary'>Evening (18:00-21:00)</Badge>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm'>Best Day</span>
                      <Badge variant='secondary'>Weekends</Badge>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm'>Capacity</span>
                      <Badge variant='secondary'>{stats?.overall_utilization.toFixed(1) || '0'}%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <IconUsers className='h-5 w-5' />
                    Customer Insights
                  </CardTitle>
                  <CardDescription>
                    Booking and utilization patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm'>Total Bookings</span>
                      <span className='font-semibold'>{stats?.total_bookings || 0}</span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm'>Available Slots</span>
                      <span className='font-semibold'>{stats?.total_slots || 0}</span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm'>Utilization Rate</span>
                      <span className='font-semibold'>{stats?.overall_utilization.toFixed(1) || '0'}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
