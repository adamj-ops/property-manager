'use client'

import { differenceInHours, differenceInMinutes, format, isPast } from 'date-fns'
import { LuClock, LuCheck, LuTriangleAlert } from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { cx } from '~/libs/utils'

interface SLAIndicatorProps {
  type: 'response' | 'resolution'
  dueAt: Date | string | null
  achievedAt?: Date | string | null // firstRespondedAt or completedAt
  status: string
  className?: string
}

export function SLAIndicator({
  type,
  dueAt,
  achievedAt,
  status,
  className,
}: SLAIndicatorProps) {
  if (!dueAt) return null

  const dueDate = new Date(dueAt)
  const achievedDate = achievedAt ? new Date(achievedAt) : null
  const now = new Date()

  // Calculate SLA status
  const isAchieved = !!achievedDate
  const wasMetOnTime = isAchieved && achievedDate <= dueDate
  const isOverdue = !isAchieved && isPast(dueDate)
  const isAtRisk = !isAchieved && !isOverdue && differenceInHours(dueDate, now) <= 2

  // For completed/cancelled work orders, only show if SLA was met or breached
  const isTerminalStatus = ['COMPLETED', 'CANCELLED'].includes(status)
  if (isTerminalStatus && type === 'response' && !achievedDate) return null
  if (isTerminalStatus && type === 'resolution' && status !== 'COMPLETED') return null

  // Calculate time remaining or overdue
  const getTimeLabel = () => {
    if (isAchieved) {
      const hoursToAchieve = differenceInHours(achievedDate, dueDate)
      if (wasMetOnTime) {
        const minutesEarly = Math.abs(differenceInMinutes(dueDate, achievedDate))
        if (minutesEarly >= 60) {
          return `${Math.floor(minutesEarly / 60)}h early`
        }
        return `${minutesEarly}m early`
      } else {
        return `${Math.abs(hoursToAchieve)}h late`
      }
    }

    if (isOverdue) {
      const hoursOverdue = differenceInHours(now, dueDate)
      if (hoursOverdue >= 24) {
        return `${Math.floor(hoursOverdue / 24)}d overdue`
      }
      return `${hoursOverdue}h overdue`
    }

    const hoursRemaining = differenceInHours(dueDate, now)
    if (hoursRemaining >= 24) {
      return `${Math.floor(hoursRemaining / 24)}d left`
    }
    if (hoursRemaining >= 1) {
      return `${hoursRemaining}h left`
    }
    const minutesRemaining = differenceInMinutes(dueDate, now)
    return `${minutesRemaining}m left`
  }

  const getStatusConfig = () => {
    if (isAchieved && wasMetOnTime) {
      return {
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        Icon: LuCheck,
      }
    }
    if (isAchieved && !wasMetOnTime) {
      return {
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        Icon: LuTriangleAlert,
      }
    }
    if (isOverdue) {
      return {
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 animate-pulse',
        Icon: LuTriangleAlert,
      }
    }
    if (isAtRisk) {
      return {
        variant: 'secondary' as const,
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
        Icon: LuClock,
      }
    }
    return {
      variant: 'outline' as const,
      className: '',
      Icon: LuClock,
    }
  }

  const config = getStatusConfig()
  const label = type === 'response' ? 'Response' : 'Resolution'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={config.variant}
            className={cx('gap-1 text-xs', config.className, className)}
          >
            <config.Icon className='size-3' />
            {label}: {getTimeLabel()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className='text-xs'>
            <p className='font-medium'>{label} SLA</p>
            <p>Due: {format(dueDate, 'MMM d, yyyy h:mm a')}</p>
            {achievedDate && (
              <p>Achieved: {format(achievedDate, 'MMM d, yyyy h:mm a')}</p>
            )}
            {!achievedDate && isOverdue && (
              <p className='text-destructive'>SLA Breached</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface SLAStatusBadgesProps {
  slaResponseDueAt: Date | string | null
  slaResolutionDueAt: Date | string | null
  firstRespondedAt?: Date | string | null
  completedAt?: Date | string | null
  status: string
  className?: string
}

export function SLAStatusBadges({
  slaResponseDueAt,
  slaResolutionDueAt,
  firstRespondedAt,
  completedAt,
  status,
  className,
}: SLAStatusBadgesProps) {
  const hasAnySLA = slaResponseDueAt || slaResolutionDueAt

  if (!hasAnySLA) return null

  return (
    <div className={cx('flex flex-wrap gap-1', className)}>
      <SLAIndicator
        type='response'
        dueAt={slaResponseDueAt}
        achievedAt={firstRespondedAt}
        status={status}
      />
      <SLAIndicator
        type='resolution'
        dueAt={slaResolutionDueAt}
        achievedAt={completedAt}
        status={status}
      />
    </div>
  )
}
