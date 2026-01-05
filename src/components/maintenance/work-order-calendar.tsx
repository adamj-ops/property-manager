'use client'

import { useState, useMemo } from 'react'
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { LuChevronLeft, LuChevronRight, LuWrench } from 'react-icons/lu'

import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Link } from '~/components/ui/link'
import { cx } from '~/libs/utils'

interface WorkOrderEvent {
  id: string
  requestNumber: string
  title: string
  scheduledDate: string | null
  status: string
  priority: string
  category: string
  unit: {
    unitNumber: string
    property: {
      name: string
    }
  }
}

interface WorkOrderCalendarProps {
  workOrders: WorkOrderEvent[]
  className?: string
}

const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
  EMERGENCY: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  HIGH: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  MEDIUM: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  LOW: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
}

const statusLabels: Record<string, string> = {
  SUBMITTED: 'New',
  ACKNOWLEDGED: 'Acknowledged',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  PENDING_PARTS: 'Parts',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Done',
  CANCELLED: 'Cancelled',
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function WorkOrderCalendar({ workOrders, className }: WorkOrderCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Group work orders by date
  const workOrdersByDate = useMemo(() => {
    const grouped = new Map<string, WorkOrderEvent[]>()

    workOrders.forEach((wo) => {
      if (wo.scheduledDate) {
        const dateKey = format(new Date(wo.scheduledDate), 'yyyy-MM-dd')
        const existing = grouped.get(dateKey) || []
        grouped.set(dateKey, [...existing, wo])
      }
    })

    return grouped
  }, [workOrders])

  // Get all days to display in the calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentMonth])

  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1))
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1))
  const handleToday = () => setCurrentMonth(new Date())

  return (
    <div className={cx('rounded-lg border bg-card', className)}>
      {/* Calendar Header */}
      <div className='flex items-center justify-between border-b p-4'>
        <div className='flex items-center gap-4'>
          <h2 className='text-lg font-semibold'>
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button variant='outline' size='sm' onClick={handleToday}>
            Today
          </Button>
        </div>
        <div className='flex items-center gap-1'>
          <Button variant='outline' size='icon' onClick={handlePrevMonth}>
            <LuChevronLeft className='size-4' />
          </Button>
          <Button variant='outline' size='icon' onClick={handleNextMonth}>
            <LuChevronRight className='size-4' />
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className='grid grid-cols-7 border-b'>
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className='border-r p-2 text-center text-sm font-medium text-muted-foreground last:border-r-0'
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className='grid grid-cols-7'>
        {calendarDays.map((day, idx) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayWorkOrders = workOrdersByDate.get(dateKey) || []
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isDayToday = isToday(day)

          return (
            <div
              key={dateKey}
              className={cx(
                'min-h-[120px] border-b border-r p-1',
                idx % 7 === 6 && 'border-r-0',
                !isCurrentMonth && 'bg-muted/30'
              )}
            >
              {/* Day Number */}
              <div className='mb-1 flex items-center justify-between'>
                <span
                  className={cx(
                    'flex size-7 items-center justify-center rounded-full text-sm',
                    isDayToday && 'bg-primary font-semibold text-primary-foreground',
                    !isCurrentMonth && 'text-muted-foreground'
                  )}
                >
                  {format(day, 'd')}
                </span>
                {dayWorkOrders.length > 0 && (
                  <Badge variant='secondary' className='text-xs'>
                    {dayWorkOrders.length}
                  </Badge>
                )}
              </div>

              {/* Work Orders */}
              <div className='space-y-1'>
                {dayWorkOrders.slice(0, 3).map((wo) => {
                  const colors = priorityColors[wo.priority] || priorityColors.MEDIUM

                  return (
                    <Link
                      key={wo.id}
                      to='/app/maintenance/$workOrderId'
                      params={{ workOrderId: wo.id }}
                      className={cx(
                        'block truncate rounded border px-1.5 py-0.5 text-xs transition-colors hover:opacity-80',
                        colors.bg,
                        colors.text,
                        colors.border
                      )}
                      title={`${wo.requestNumber}: ${wo.title}`}
                    >
                      <span className='font-medium'>{wo.requestNumber}</span>
                    </Link>
                  )
                })}
                {dayWorkOrders.length > 3 && (
                  <div className='px-1.5 text-xs text-muted-foreground'>
                    +{dayWorkOrders.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className='flex flex-wrap items-center gap-4 border-t p-3'>
        <span className='text-sm font-medium text-muted-foreground'>Priority:</span>
        {Object.entries(priorityColors).map(([priority, colors]) => (
          <div key={priority} className='flex items-center gap-1.5'>
            <div
              className={cx('size-3 rounded border', colors.bg, colors.border)}
            />
            <span className='text-xs text-muted-foreground'>
              {priority.charAt(0) + priority.slice(1).toLowerCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Compact list of work orders for a specific day
interface DayWorkOrderListProps {
  date: Date
  workOrders: WorkOrderEvent[]
}

export function DayWorkOrderList({ date, workOrders }: DayWorkOrderListProps) {
  if (workOrders.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-8 text-muted-foreground'>
        <LuWrench className='mb-2 size-8' />
        <p className='text-sm'>No work orders scheduled for {format(date, 'MMMM d, yyyy')}</p>
      </div>
    )
  }

  return (
    <div className='space-y-2'>
      <h3 className='font-medium'>
        Work Orders for {format(date, 'MMMM d, yyyy')}
      </h3>
      <div className='space-y-2'>
        {workOrders.map((wo) => {
          const colors = priorityColors[wo.priority] || priorityColors.MEDIUM

          return (
            <Link
              key={wo.id}
              to='/app/maintenance/$workOrderId'
              params={{ workOrderId: wo.id }}
              className='flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50'
            >
              <div className='flex items-center gap-3'>
                <Badge
                  className={cx(
                    'shrink-0',
                    colors.bg,
                    colors.text,
                    'border',
                    colors.border
                  )}
                >
                  {wo.priority}
                </Badge>
                <div>
                  <p className='font-medium'>{wo.requestNumber}</p>
                  <p className='text-sm text-muted-foreground'>{wo.title}</p>
                </div>
              </div>
              <div className='text-right'>
                <p className='text-sm'>
                  {wo.unit.property.name}
                </p>
                <p className='text-xs text-muted-foreground'>
                  Unit {wo.unit.unitNumber}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
