import { differenceInDays } from 'date-fns'
import { LuCircleAlert, LuCircleCheck, LuClock, LuTriangleAlert } from 'react-icons/lu'

import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { MN_COMPLIANCE, getDaysUntilDeadline, isDispositionOverdue } from '~/services/move-out.schema'

interface ComplianceWarningsProps {
  deadlineDate: Date
  sentDate?: Date | null
  bankName?: string | null
  accountLast4?: string | null
  itemizedDeductions?: any[] | null
  className?: string
}

export function ComplianceWarnings({
  deadlineDate,
  sentDate,
  bankName,
  accountLast4,
  itemizedDeductions,
  className,
}: ComplianceWarningsProps) {
  const isOverdue = isDispositionOverdue(deadlineDate, sentDate)
  const daysRemaining = getDaysUntilDeadline(deadlineDate)
  const isSent = !!sentDate
  const isUrgent = daysRemaining <= 5 && !isSent

  // Check for missing required info
  const missingInfo: string[] = []
  if (!bankName) missingInfo.push('Bank name')
  if (!accountLast4) missingInfo.push('Account last 4 digits')

  return (
    <div className={className}>
      {/* Deadline Status */}
      {isOverdue && !isSent && (
        <Alert variant='destructive' className='mb-4'>
          <LuTriangleAlert className='size-4' />
          <AlertTitle>Deadline Exceeded!</AlertTitle>
          <AlertDescription>
            The {MN_COMPLIANCE.RETURN_DEADLINE_DAYS}-day deadline has passed. Minnesota law requires
            deposit disposition within 21 days of move-out. Immediate action required.
          </AlertDescription>
        </Alert>
      )}

      {isUrgent && !isOverdue && (
        <Alert className='mb-4 border-yellow-500 bg-yellow-50 text-yellow-800'>
          <LuClock className='size-4' />
          <AlertTitle>Deadline Approaching</AlertTitle>
          <AlertDescription>
            Only {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining to send the deposit
            disposition letter. Act now to ensure MN compliance.
          </AlertDescription>
        </Alert>
      )}

      {isSent && (
        <Alert className='mb-4 border-green-500 bg-green-50 text-green-800'>
          <LuCircleCheck className='size-4' />
          <AlertTitle>Letter Sent</AlertTitle>
          <AlertDescription>
            Disposition letter was sent on {new Date(sentDate).toLocaleDateString()}.
          </AlertDescription>
        </Alert>
      )}

      {/* Missing Required Info */}
      {missingInfo.length > 0 && !isSent && (
        <Alert className='mb-4 border-orange-500 bg-orange-50 text-orange-800'>
          <LuCircleAlert className='size-4' />
          <AlertTitle>Missing Required Information</AlertTitle>
          <AlertDescription>
            <p className='mb-2'>
              MN law requires the following disclosures in the disposition letter:
            </p>
            <ul className='list-inside list-disc'>
              {missingInfo.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Deadline Badge */}
      {!isSent && (
        <div className='flex items-center gap-2'>
          <span className='text-sm text-muted-foreground'>Deadline:</span>
          <Badge
            variant={isOverdue ? 'destructive' : isUrgent ? 'secondary' : 'outline'}
            className={
              isOverdue
                ? ''
                : isUrgent
                  ? 'bg-yellow-100 text-yellow-800'
                  : ''
            }
          >
            {isOverdue
              ? `${Math.abs(daysRemaining)} days overdue`
              : `${daysRemaining} days remaining`}
          </Badge>
        </div>
      )}
    </div>
  )
}

interface DeadlineCountdownProps {
  deadlineDate: Date
  sentDate?: Date | null
  size?: 'sm' | 'md' | 'lg'
}

export function DeadlineCountdown({ deadlineDate, sentDate, size = 'md' }: DeadlineCountdownProps) {
  const isOverdue = isDispositionOverdue(deadlineDate, sentDate)
  const daysRemaining = getDaysUntilDeadline(deadlineDate)
  const isSent = !!sentDate

  if (isSent) {
    return (
      <Badge variant='outline' className='border-green-500 bg-green-50 text-green-700'>
        <LuCircleCheck className='mr-1 size-3' />
        Sent
      </Badge>
    )
  }

  if (isOverdue) {
    return (
      <Badge variant='destructive'>
        <LuTriangleAlert className='mr-1 size-3' />
        {Math.abs(daysRemaining)}d overdue
      </Badge>
    )
  }

  if (daysRemaining <= 5) {
    return (
      <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
        <LuClock className='mr-1 size-3' />
        {daysRemaining}d left
      </Badge>
    )
  }

  return (
    <Badge variant='outline'>
      <LuClock className='mr-1 size-3' />
      {daysRemaining}d left
    </Badge>
  )
}
