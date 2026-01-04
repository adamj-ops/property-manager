import { Section, Text, Hr, Row, Column } from '@react-email/components'

import { EmailButton, EmailHeading, EmailLayout } from '~/emails/base'

interface MaintenanceStatusEmailProps {
  recipientName: string
  requestNumber: string
  title: string
  propertyName: string
  unitNumber: string
  previousStatus: string | null
  newStatus: string
  statusNote?: string
  viewUrl: string
}

const statusLabels: Record<string, string> = {
  SUBMITTED: 'Submitted',
  ACKNOWLEDGED: 'Acknowledged',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  PENDING_PARTS: 'Pending Parts',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const statusDescriptions: Record<string, string> = {
  SUBMITTED: 'Your maintenance request has been received and is awaiting review.',
  ACKNOWLEDGED: 'Your request has been reviewed and acknowledged by our team.',
  SCHEDULED: 'Your maintenance has been scheduled. A technician will arrive soon.',
  IN_PROGRESS: 'Work is currently being performed on your request.',
  PENDING_PARTS: 'We are waiting for parts to arrive before continuing.',
  ON_HOLD: 'Your request has been temporarily placed on hold.',
  COMPLETED: 'Great news! Your maintenance request has been completed.',
  CANCELLED: 'This maintenance request has been cancelled.',
}

export function MaintenanceStatusEmail({
  recipientName,
  requestNumber,
  title,
  propertyName,
  unitNumber,
  previousStatus,
  newStatus,
  statusNote,
  viewUrl,
}: MaintenanceStatusEmailProps) {
  const statusLabel = statusLabels[newStatus] || newStatus
  const statusDescription = statusDescriptions[newStatus] || ''

  return (
    <EmailLayout preview={`Work Order ${requestNumber} - Status: ${statusLabel}`}>
      <Section className='text-center'>
        <EmailHeading>
          Maintenance Update
        </EmailHeading>
      </Section>

      <Section>
        <Text className='text-[14px] leading-[24px] text-black'>
          Hi {recipientName},
        </Text>
        <Text className='text-[14px] leading-[24px] text-black'>
          {statusDescription}
        </Text>
      </Section>

      <Hr className='mx-0 my-[20px] w-full border border-solid border-zinc-200' />

      <Section className='rounded-lg bg-zinc-50 p-4'>
        <Row>
          <Column>
            <Text className='m-0 text-[12px] font-semibold uppercase text-zinc-500'>
              Work Order
            </Text>
            <Text className='m-0 mt-1 text-[14px] font-medium text-black'>
              {requestNumber}
            </Text>
          </Column>
          <Column align='right'>
            <Text className='m-0 text-[12px] font-semibold uppercase text-zinc-500'>
              Status
            </Text>
            <Text className='m-0 mt-1 text-[14px] font-medium text-black'>
              {previousStatus ? `${statusLabels[previousStatus] || previousStatus} → ` : ''}
              {statusLabel}
            </Text>
          </Column>
        </Row>
      </Section>

      <Section className='mt-4'>
        <Text className='m-0 text-[12px] font-semibold uppercase text-zinc-500'>
          Issue
        </Text>
        <Text className='m-0 mt-1 text-[14px] text-black'>
          {title}
        </Text>
      </Section>

      <Section className='mt-4'>
        <Text className='m-0 text-[12px] font-semibold uppercase text-zinc-500'>
          Location
        </Text>
        <Text className='m-0 mt-1 text-[14px] text-black'>
          Unit {unitNumber} • {propertyName}
        </Text>
      </Section>

      {statusNote && (
        <Section className='mt-4'>
          <Text className='m-0 text-[12px] font-semibold uppercase text-zinc-500'>
            Note from Management
          </Text>
          <Text className='m-0 mt-1 rounded-lg bg-zinc-100 p-3 text-[14px] italic text-zinc-700'>
            "{statusNote}"
          </Text>
        </Section>
      )}

      <Hr className='mx-0 my-[20px] w-full border border-solid border-zinc-200' />

      <Section className='text-center'>
        <EmailButton href={viewUrl}>
          View Work Order Details
        </EmailButton>
      </Section>

      <Section className='mt-8'>
        <Text className='text-[12px] leading-[16px] text-zinc-500'>
          If you have any questions about this maintenance request, please reply to this email or contact your property management office.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default MaintenanceStatusEmail
