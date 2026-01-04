import { Section, Text } from '@react-email/components'

import { EmailButton, EmailHeading, EmailLayout } from '~/emails/base'

interface PaymentReceiptEmailProps {
  tenantName: string
  amount: string
  paymentDate: string
  paymentMethod: string
  receiptNumber: string
  propertyAddress: string
  paymentLink?: string
}

export function PaymentReceiptEmail({
  tenantName,
  amount,
  paymentDate,
  paymentMethod,
  receiptNumber,
  propertyAddress,
  paymentLink,
}: PaymentReceiptEmailProps) {
  return (
    <EmailLayout preview='Payment receipt'>
      <Section className='space-y-4 text-[14px] leading-[20px] text-black'>
        <EmailHeading>
          Payment received
        </EmailHeading>
        <Text>Hi {tenantName},</Text>
        <Text>
          Thank you for your payment. Here are your receipt details:
        </Text>
        <Section className='rounded-lg border border-solid border-gray-200 p-4'>
          <Text className='m-0 text-zinc-600'>
            Receipt #: <span className='font-semibold text-black'>{receiptNumber}</span>
          </Text>
          <Text className='m-0 text-zinc-600'>
            Amount: <span className='font-semibold text-black'>{amount}</span>
          </Text>
          <Text className='m-0 text-zinc-600'>
            Date: <span className='font-semibold text-black'>{paymentDate}</span>
          </Text>
          <Text className='m-0 text-zinc-600'>
            Method: <span className='font-semibold text-black'>{paymentMethod}</span>
          </Text>
          <Text className='m-0 text-zinc-600'>
            Property: <span className='font-semibold text-black'>{propertyAddress}</span>
          </Text>
        </Section>
        {paymentLink && (
          <EmailButton href={paymentLink}>
            View receipt
          </EmailButton>
        )}
        <Text className='text-[12px] text-zinc-500'>
          If you did not authorize this payment, please contact support immediately.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default PaymentReceiptEmail
