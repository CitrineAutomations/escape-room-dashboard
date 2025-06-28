'use client';

import { useEffect, useState } from 'react';
import { IconTrendingUp } from '@tabler/icons-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { EscapeRoomService } from '@/lib/escape-room-service';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

interface DailyData {
  date: string;
  utilization_rate: number;
  total_slots: number;
  booked_slots: number;
}

interface AreaGraphProps {
  dateRange?: DateRange;
}

const chartConfig = {
  utilization: {
    label: 'Utilization Rate'
  },
  utilization_rate: {
    label: 'Utilization Rate',
    color: 'var(--primary)'
  },
  total_slots: {
    label: 'Total Slots',
    color: 'var(--secondary)'
  }
} satisfies ChartConfig;

export function AreaGraph({ dateRange }: AreaGraphProps) {
  const [chartData, setChartData] = useState<DailyData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined
        const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
        
        const dailyMetrics = await EscapeRoomService.getDailyMetrics(startDate, endDate)
        
        const data = dailyMetrics.map(metric => ({
          date: format(new Date(metric.date), 'MMM dd'),
          utilization_rate: metric.utilization_rate,
          total_slots: metric.total_slots,
          booked_slots: metric.booked_slots
        }))
        
        setChartData(data)
      } catch (error) {
        console.error('Error loading daily data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [dateRange])

  if (loading) {
    return (
      <Card className='@container/card'>
        <CardHeader>
          <CardTitle>Daily Utilization Trends</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
          <div className='aspect-auto h-[250px] w-full flex items-center justify-center'>
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  const avgUtilization = chartData.length > 0 
    ? chartData.reduce((sum, day) => sum + day.utilization_rate, 0) / chartData.length 
    : 0

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Daily Utilization Trends</CardTitle>
        <CardDescription>
          Daily utilization rates over time
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <AreaChart
            data={chartData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillUtilization' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-utilization_rate)'
                  stopOpacity={1.0}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-utilization_rate)'
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as DailyData;
                  return (
                    <ChartTooltipContent>
                      <div className='grid gap-2'>
                        <div className='flex items-center justify-between gap-2'>
                          <div className='flex items-center gap-2'>
                            <div className='font-medium'>
                              {data.date}
                            </div>
                          </div>
                        </div>
                        <div className='grid gap-1'>
                          <div className='flex items-center justify-between gap-2'>
                            <div className='text-xs text-muted-foreground'>
                              Utilization Rate
                            </div>
                            <div className='text-xs font-medium'>
                              {data.utilization_rate.toFixed(1)}%
                            </div>
                          </div>
                          <div className='flex items-center justify-between gap-2'>
                            <div className='text-xs text-muted-foreground'>
                              Total Slots
                            </div>
                            <div className='text-xs font-medium'>
                              {data.total_slots}
                            </div>
                          </div>
                          <div className='flex items-center justify-between gap-2'>
                            <div className='text-xs text-muted-foreground'>
                              Booked Slots
                            </div>
                            <div className='text-xs font-medium'>
                              {data.booked_slots}
                            </div>
                          </div>
                        </div>
                      </div>
                    </ChartTooltipContent>
                  );
                }
                return null;
              }}
            />
            <Area
              dataKey='utilization_rate'
              type='natural'
              fill='url(#fillUtilization)'
              stroke='var(--color-utilization_rate)'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 leading-none font-medium'>
              Average utilization: {avgUtilization.toFixed(1)}%{' '}
              <IconTrendingUp className='h-4 w-4' />
            </div>
            <div className='text-muted-foreground flex items-center gap-2 leading-none'>
              {chartData.length > 0 && `${chartData[0].date} - ${chartData[chartData.length - 1].date}`}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
