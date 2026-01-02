import { Section, Text } from '@react-email/components'

import { EmailButton, EmailHeading, EmailLayout } from '~/emails/base'

interface LeaseExpirationEmailProps {
  tenantName: string
  unitAddress: string
  expirationDate: string
  renewalLink: string
}

export function LeaseExpirationEmail({
  tenantName,
  unitAddress,
  expirationDate,
  renewalLink,
}: LeaseExpirationEmailProps) {
  return (
    <EmailLayout preview='Lease expiration notice'>
      <Section className='space-y-4 text-[14px] leading-[20px] text-black'>
        <EmailHeading>
          Lease expiring on {expirationDate}
        </EmailHeading>
        <Text>Hi {tenantName},</Text>
        <Text>
          This is a reminder that your lease for <strong>{unitAddress}</strong> is scheduled to
          expire on <strong>{expirationDate}</strong>. Please review your options and let us know
          if you would like to renew.
        </Text>
        <EmailButton href={renewalLink}>
          Review renewal options
        </EmailButton>
        <Text>
          If you have any questions about renewal terms or next steps, please reply to this email
          and our team will assist you.
        </Text>
        <Text className='text-[12px] text-zinc-500'>
          This notice was sent automatically. If you recently renewed, you can ignore this message.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default LeaseExpirationEmail
