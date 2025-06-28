'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { IconTrendingUp } from '@tabler/icons-react';
import { Label, Pie, PieChart } from 'recharts';

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

interface RoomData {
  room_name: string;
  utilization_rate: number;
  total_slots: number;
  booked_slots: number;
  fill: string;
}

interface PieGraphProps {
  dateRange?: DateRange;
}

const chartConfig = {
  utilization: {
    label: 'Utilization'
  },
  room1: {
    label: 'Room 1',
    color: 'var(--primary)'
  },
  room2: {
    label: 'Room 2',
    color: 'var(--secondary)'
  },
  room3: {
    label: 'Room 3',
    color: 'var(--accent)'
  },
  room4: {
    label: 'Room 4',
    color: 'var(--muted)'
  }
} satisfies ChartConfig;

export function PieGraph({ dateRange }: PieGraphProps) {
  const [chartData, setChartData] = useState<RoomData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined
        const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
        
        const roomMetrics = await EscapeRoomService.getRoomMetrics(startDate, endDate)
        
        const data = roomMetrics.map((room, index) => ({
          room_name: room.room_name,
          utilization_rate: room.utilization_rate,
          total_slots: room.total_slots,
          booked_slots: room.booked_slots,
          fill: `var(--${index === 0 ? 'primary' : index === 1 ? 'secondary' : index === 2 ? 'accent' : 'muted'})`
        }))
        
        setChartData(data)
      } catch (error) {
        console.error('Error loading room data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [dateRange])

  const totalUtilization = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.utilization_rate, 0);
  }, [chartData]);

  const avgUtilization = chartData.length > 0 ? totalUtilization / chartData.length : 0;

  if (loading) {
    return (
      <Card className='@container/card'>
        <CardHeader>
          <CardTitle>Room Utilization Distribution</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
          <div className='mx-auto aspect-square h-[250px] flex items-center justify-center'>
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Room Utilization Distribution</CardTitle>
        <CardDescription>
          <span className='hidden @[540px]/card:block'>
            Utilization rates by room
          </span>
          <span className='@[540px]/card:hidden'>Room distribution</span>
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square h-[250px]'
        >
          <PieChart>
            <defs>
              {chartData.map((room, index) => (
                <linearGradient
                  key={room.room_name}
                  id={`fill${room.room_name.replace(/\s+/g, '')}`}
                  x1='0'
                  y1='0'
                  x2='0'
                  y2='1'
                >
                  <stop
                    offset='0%'
                    stopColor={room.fill}
                    stopOpacity={1}
                  />
                  <stop
                    offset='100%'
                    stopColor={room.fill}
                    stopOpacity={0.8}
                  />
                </linearGradient>
              ))}
            </defs>
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as RoomData;
                  return (
                    <ChartTooltipContent>
                      <div className='grid gap-2'>
                        <div className='flex items-center justify-between gap-2'>
                          <div className='font-medium'>
                            {data.room_name}
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
                              Booked Slots
                            </div>
                            <div className='text-xs font-medium'>
                              {data.booked_slots} / {data.total_slots}
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
            <Pie
              data={chartData.map((item) => ({
                ...item,
                fill: `url(#fill${item.room_name.replace(/\s+/g, '')})`
              }))}
              dataKey='utilization_rate'
              nameKey='room_name'
              innerRadius={60}
              strokeWidth={2}
              stroke='var(--background)'
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor='middle'
                        dominantBaseline='middle'
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className='fill-foreground text-3xl font-bold'
                        >
                          {avgUtilization.toFixed(1)}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className='fill-muted-foreground text-sm'
                        >
                          Avg Utilization
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm'>
        <div className='flex items-center gap-2 leading-none font-medium'>
          {chartData.length > 0 && `${chartData[0].room_name} leads with ${chartData[0].utilization_rate.toFixed(1)}%`}{' '}
          <IconTrendingUp className='h-4 w-4' />
        </div>
        <div className='text-muted-foreground leading-none'>
          {chartData.length} rooms analyzed
        </div>
      </CardFooter>
    </Card>
  );
}
