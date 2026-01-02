import { Section, Text } from '@react-email/components'

import { EmailButton, EmailHeading, EmailLayout } from '~/emails/base'

interface LateFeeNoticeEmailProps {
  tenantName: string
  rentAmount: string
  lateFee: string
  totalDue: string
  dueDate: string
  paymentLink: string
}

export function LateFeeNoticeEmail({
  tenantName,
  rentAmount,
  lateFee,
  totalDue,
  dueDate,
  paymentLink,
}: LateFeeNoticeEmailProps) {
  return (
    <EmailLayout preview='Late fee added to your account'>
      <Section className='space-y-4 text-[14px] leading-[20px] text-black'>
        <EmailHeading>
          Late fee notice
        </EmailHeading>
        <Text>Hi {tenantName},</Text>
        <Text>
          A late fee has been applied to your account for the current rent period.
        </Text>
        <Text>
          <strong>Rent:</strong> {rentAmount}
          <br />
          <strong>Late fee:</strong> {lateFee}
          <br />
          <strong>Total due:</strong> {totalDue}
          <br />
          <strong>Due by:</strong> {dueDate}
        </Text>
        <EmailButton href={paymentLink}>
          Pay balance
        </EmailButton>
        <Text className='text-[12px] text-zinc-500'>
          To avoid additional fees or notices, please submit payment before the due date. If you
          believe this was applied in error, reply to this email so we can review your account.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default LateFeeNoticeEmail
