'use client'

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { cn } from '@/lib/utils'
import type { DateRange as CalendarDateRange } from 'react-day-picker'

interface DateRangePickerProps {
  dateRange: CalendarDateRange
  onDateRangeChange: (range: CalendarDateRange) => void
  className?: string
}

const presetRanges = [
  {
    label: 'Today',
    value: 'today',
    getRange: (): CalendarDateRange => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date())
    })
  },
  {
    label: 'Yesterday',
    value: 'yesterday',
    getRange: (): CalendarDateRange => ({
      from: startOfDay(subDays(new Date(), 1)),
      to: endOfDay(subDays(new Date(), 1))
    })
  },
  {
    label: 'Last 7 Days',
    value: 'last7days',
    getRange: (): CalendarDateRange => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date())
    })
  },
  {
    label: 'Last 30 Days',
    value: 'last30days',
    getRange: (): CalendarDateRange => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date())
    })
  },
  {
    label: 'This Week',
    value: 'thisweek',
    getRange: (): CalendarDateRange => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 })
    })
  },
  {
    label: 'Last Week',
    value: 'lastweek',
    getRange: (): CalendarDateRange => ({
      from: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
      to: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })
    })
  },
  {
    label: 'This Month',
    value: 'thismonth',
    getRange: (): CalendarDateRange => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    })
  },
  {
    label: 'Last Month',
    value: 'lastmonth',
    getRange: (): CalendarDateRange => ({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1))
    })
  },
  {
    label: 'Last 3 Months',
    value: 'last3months',
    getRange: (): CalendarDateRange => ({
      from: startOfDay(subMonths(new Date(), 3)),
      to: endOfDay(new Date())
    })
  },
  {
    label: 'Custom Range',
    value: 'custom',
    getRange: (): CalendarDateRange => ({
      from: startOfDay(subDays(new Date(), 30)),
      to: endOfDay(new Date())
    })
  }
]

export function DateRangePicker({ dateRange, onDateRangeChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string>('last30days')

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset)
    const presetRange = presetRanges.find(p => p.value === preset)
    if (presetRange) {
      onDateRangeChange(presetRange.getRange())
    }
  }

  const formatDateRange = () => {
    if (!dateRange.from) return 'Select date range'
    
    if (!dateRange.to) {
      return format(dateRange.from, 'MMM dd, yyyy')
    }
    
    if (dateRange.from.getTime() === dateRange.to.getTime()) {
      return format(dateRange.from, 'MMM dd, yyyy')
    }
    
    return `${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          {presetRanges.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start text-left font-normal',
              !dateRange.from && 'text-muted-foreground'
            )}
          >
            <IconCalendar className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={dateRange}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                onDateRangeChange({ from: range.from, to: range.to })
                setSelectedPreset('custom')
              }
            }}
            numberOfMonths={2}
            disabled={(date) => date > new Date() || date < new Date('2020-01-01')}
          />
        </PopoverContent>
      </Popover>

      {selectedPreset === 'custom' && dateRange.from && dateRange.to && (
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newFrom = subDays(dateRange.from!, 1)
              const newTo = subDays(dateRange.to!, 1)
              onDateRangeChange({ from: newFrom, to: newTo })
            }}
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newFrom = new Date(dateRange.from!.getTime() + 24 * 60 * 60 * 1000)
              const newTo = new Date(dateRange.to!.getTime() + 24 * 60 * 60 * 1000)
              if (newTo <= new Date()) {
                onDateRangeChange({ from: newFrom, to: newTo })
              }
            }}
          >
            <IconChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
} 