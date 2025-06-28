'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { useEffect, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
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

export const description = 'Hourly utilization patterns for escape rooms';

interface HourlyData {
  hour: number
  utilization_rate: number
  total_slots: number
  booked_slots: number
}

interface BarGraphProps {
  dateRange?: DateRange
}

const chartConfig = {
  utilization_rate: {
    label: 'Utilization Rate',
    color: 'var(--primary)'
  },
  total_slots: {
    label: 'Total Slots',
    color: 'var(--secondary)'
  },
  booked_slots: {
    label: 'Booked Slots',
    color: 'var(--accent)'
  }
} satisfies ChartConfig;

export function BarGraph({ dateRange }: BarGraphProps) {
  const [chartData, setChartData] = useState<HourlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>('utilization_rate')

  useEffect(() => {
    const loadData = async () => {
      try {
        const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined
        const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
        
        const hourlyData = await EscapeRoomService.getHourlyUtilization(startDate, endDate)
        setChartData(hourlyData)
      } catch (error) {
        console.error('Error loading hourly data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [dateRange])

  const total = React.useMemo(
    () => ({
      utilization_rate: chartData.reduce((acc, curr) => acc + curr.utilization_rate, 0) / Math.max(chartData.length, 1),
      total_slots: chartData.reduce((acc, curr) => acc + curr.total_slots, 0),
      booked_slots: chartData.reduce((acc, curr) => acc + curr.booked_slots, 0)
    }),
    [chartData]
  );

  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || loading) {
    return (
      <Card className='@container/card !pt-3'>
        <CardHeader className='flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row'>
          <div className='flex flex-1 flex-col justify-center gap-1 px-6 !py-0'>
            <CardTitle>Hourly Utilization</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </div>
        </CardHeader>
        <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
          <div className='aspect-auto h-[250px] w-full flex items-center justify-center'>
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='@container/card !pt-3'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 !py-0'>
          <CardTitle>Hourly Utilization</CardTitle>
          <CardDescription>
            <span className='hidden @[540px]/card:block'>
              Room utilization by hour of day
            </span>
            <span className='@[540px]/card:hidden'>By hour</span>
          </CardDescription>
        </div>
        <div className='flex'>
          {['utilization_rate', 'total_slots', 'booked_slots'].map((key) => {
            const chart = key as keyof typeof chartConfig;
            if (!chart || total[key as keyof typeof total] === 0) return null;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className='data-[active=true]:bg-primary/5 hover:bg-primary/5 relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left transition-colors duration-200 even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6'
                onClick={() => setActiveChart(chart)}
              >
                <span className='text-muted-foreground text-xs'>
                  {chartConfig[chart].label}
                </span>
                <span className='text-lg leading-none font-bold sm:text-3xl'>
                  {key === 'utilization_rate' 
                    ? `${total[key as keyof typeof total].toFixed(1)}%`
                    : total[key as keyof typeof total]?.toLocaleString()
                  }
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis
              dataKey='hour'
              tickFormatter={(value) => `${value}:00`}
              className='text-xs'
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as HourlyData;
                  return (
                    <ChartTooltipContent>
                      <div className='grid gap-2'>
                        <div className='flex items-center justify-between gap-2'>
                          <div className='flex items-center gap-2'>
                            <div className='font-medium'>
                              {data.hour}:00
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
            <Bar
              dataKey={activeChart}
              fill={chartConfig[activeChart].color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
