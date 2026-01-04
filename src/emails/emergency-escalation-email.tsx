import { Section, Text, Hr, Row, Column } from '@react-email/components'

import { EmailButton, EmailHeading, EmailLayout } from '~/emails/base'

interface EmergencyEscalationEmailProps {
  recipientName: string
  requestNumber: string
  title: string
  description: string
  propertyName: string
  unitNumber: string
  category: string
  escalationLevel: number
  timeSinceCreated: string
  tenantName?: string
  tenantPhone?: string
  viewUrl: string
}

const escalationLevelLabels: Record<number, { label: string; color: string; urgency: string }> = {
  1: {
    label: 'Initial Alert',
    color: '#f59e0b', // amber
    urgency: 'Requires immediate attention',
  },
  2: {
    label: 'Escalated',
    color: '#ef4444', // red
    urgency: 'Unacknowledged emergency - action required immediately',
  },
  3: {
    label: 'Critical',
    color: '#dc2626', // dark red
    urgency: 'CRITICAL: Emergency has been unaddressed for extended period',
  },
}

export function EmergencyEscalationEmail({
  recipientName,
  requestNumber,
  title,
  description,
  propertyName,
  unitNumber,
  category,
  escalationLevel,
  timeSinceCreated,
  tenantName,
  tenantPhone,
  viewUrl,
}: EmergencyEscalationEmailProps) {
  const levelInfo = escalationLevelLabels[escalationLevel] || escalationLevelLabels[1]

  return (
    <EmailLayout preview={`EMERGENCY: ${requestNumber} - ${levelInfo.label}`}>
      {/* Emergency Banner */}
      <Section
        className='rounded-lg p-4 text-center'
        style={{ backgroundColor: levelInfo.color }}
      >
        <Text className='m-0 text-[18px] font-bold uppercase tracking-wide text-white'>
          Emergency Maintenance Alert
        </Text>
        <Text className='m-0 mt-1 text-[14px] text-white opacity-90'>
          {levelInfo.urgency}
        </Text>
      </Section>

      <Section className='mt-6'>
        <Text className='text-[14px] leading-[24px] text-black'>
          Hi {recipientName},
        </Text>
        <Text className='text-[14px] leading-[24px] text-black'>
          An emergency maintenance request requires your immediate attention. This work order has been open for <strong>{timeSinceCreated}</strong> and has been escalated to <strong>{levelInfo.label}</strong> status.
        </Text>
      </Section>

      <Hr className='mx-0 my-[20px] w-full border border-solid border-zinc-200' />

      {/* Work Order Details */}
      <Section className='rounded-lg border-2 border-red-200 bg-red-50 p-4'>
        <Row>
          <Column>
            <Text className='m-0 text-[12px] font-semibold uppercase text-zinc-500'>
              Work Order
            </Text>
            <Text className='m-0 mt-1 text-[16px] font-bold text-black'>
              {requestNumber}
            </Text>
          </Column>
          <Column align='right'>
            <Text className='m-0 text-[12px] font-semibold uppercase text-zinc-500'>
              Priority
            </Text>
            <Text
              className='m-0 mt-1 text-[16px] font-bold'
              style={{ color: levelInfo.color }}
            >
              EMERGENCY
            </Text>
          </Column>
        </Row>
      </Section>

      <Section className='mt-4'>
        <Text className='m-0 text-[12px] font-semibold uppercase text-zinc-500'>
          Issue
        </Text>
        <Text className='m-0 mt-1 text-[16px] font-medium text-black'>
          {title}
        </Text>
        <Text className='m-0 mt-2 text-[14px] text-zinc-600'>
          {description.length > 200 ? `${description.substring(0, 200)}...` : description}
        </Text>
      </Section>

      <Section className='mt-4'>
        <Row>
          <Column>
            <Text className='m-0 text-[12px] font-semibold uppercase text-zinc-500'>
              Location
            </Text>
            <Text className='m-0 mt-1 text-[14px] text-black'>
              Unit {unitNumber} • {propertyName}
            </Text>
          </Column>
          <Column align='right'>
            <Text className='m-0 text-[12px] font-semibold uppercase text-zinc-500'>
              Category
            </Text>
            <Text className='m-0 mt-1 text-[14px] text-black'>
              {category}
            </Text>
          </Column>
        </Row>
      </Section>

      {tenantName && (
        <Section className='mt-4 rounded-lg bg-zinc-100 p-3'>
          <Text className='m-0 text-[12px] font-semibold uppercase text-zinc-500'>
            Tenant Contact
          </Text>
          <Text className='m-0 mt-1 text-[14px] text-black'>
            {tenantName}
            {tenantPhone && ` • ${tenantPhone}`}
          </Text>
        </Section>
      )}

      <Hr className='mx-0 my-[20px] w-full border border-solid border-zinc-200' />

      <Section className='text-center'>
        <EmailButton href={viewUrl} style={{ backgroundColor: levelInfo.color }}>
          View & Acknowledge Emergency
        </EmailButton>
      </Section>

      <Section className='mt-6 rounded-lg bg-zinc-100 p-4'>
        <Text className='m-0 text-[12px] font-semibold text-zinc-700'>
          What you should do:
        </Text>
        <Text className='m-0 mt-2 text-[13px] leading-[20px] text-zinc-600'>
          1. Click the button above to view the work order details
          <br />
          2. Acknowledge the emergency to stop further escalations
          <br />
          3. Assign a vendor or take immediate action to resolve
          <br />
          4. Update the work order status as you progress
        </Text>
      </Section>

      <Section className='mt-8'>
        <Text className='text-[12px] leading-[16px] text-zinc-500'>
          This is an automated emergency alert. You are receiving this because you are a property manager responsible for {propertyName}.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default EmergencyEscalationEmail
