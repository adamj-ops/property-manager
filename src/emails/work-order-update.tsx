import { Section, Text } from '@react-email/components'

import { EmailButton, EmailHeading, EmailLayout } from '~/emails/base'

interface WorkOrderUpdateEmailProps {
  tenantName: string
  workOrderNumber: string
  status: string
  updateMessage?: string
  viewLink: string
}

export function WorkOrderUpdateEmail({
  tenantName,
  workOrderNumber,
  status,
  updateMessage,
  viewLink,
}: WorkOrderUpdateEmailProps) {
  return (
    <EmailLayout preview='Work order status updated'>
      <Section className='space-y-4 text-[14px] leading-[20px] text-black'>
        <EmailHeading>
          Work order {workOrderNumber} is now {status}
        </EmailHeading>
        <Text>Hi {tenantName},</Text>
        <Text>
          Your maintenance request <strong>{workOrderNumber}</strong> has been updated to{' '}
          <strong>{status}</strong>.
        </Text>
        {updateMessage && (
          <Text>
            Update: {updateMessage}
          </Text>
        )}
        <EmailButton href={viewLink}>
          View request details
        </EmailButton>
        <Text>
          If you have additional information to share, reply to this email and we&apos;ll make sure
          it reaches the maintenance team.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default WorkOrderUpdateEmail
