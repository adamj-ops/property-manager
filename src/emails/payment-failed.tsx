import { Section, Text } from '@react-email/components'

import { EmailButton, EmailHeading, EmailLayout } from '~/emails/base'

interface PaymentFailedEmailProps {
  tenantName: string
  amount: string
  paymentDate: string
  failureReason?: string
  propertyAddress: string
  paymentLink: string
}

export function PaymentFailedEmail({
  tenantName,
  amount,
  paymentDate,
  failureReason,
  propertyAddress,
  paymentLink,
}: PaymentFailedEmailProps) {
  return (
    <EmailLayout preview='Your payment could not be processed'>
      <Section className='space-y-4 text-[14px] leading-[20px] text-black'>
        <EmailHeading>
          Payment failed
        </EmailHeading>
        <Text>Hi {tenantName},</Text>
        <Text>
          We were unable to process your rent payment of <strong>{amount}</strong> for {propertyAddress}.
        </Text>
        <Text>
          <strong>Date:</strong> {paymentDate}
          <br />
          <strong>Amount:</strong> {amount}
          {failureReason && (
            <>
              <br />
              <strong>Reason:</strong> {failureReason}
            </>
          )}
        </Text>
        <Text>
          Please update your payment method or try again with a different payment option to avoid late fees.
        </Text>
        <EmailButton href={paymentLink}>
          Retry payment
        </EmailButton>
        <Text className='text-[12px] text-zinc-500'>
          If you continue to experience issues, please contact your property manager for assistance.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default PaymentFailedEmail
