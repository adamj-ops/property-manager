import { Section, Table, TableBody, TableCell, TableRow, Text } from '@react-email/components'

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
        <Table className='w-full text-[14px]'>
          <TableBody>
            <TableRow>
              <TableCell className='py-1 text-zinc-600'>Receipt #</TableCell>
              <TableCell className='py-1 font-semibold text-black'>{receiptNumber}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className='py-1 text-zinc-600'>Amount</TableCell>
              <TableCell className='py-1 font-semibold text-black'>{amount}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className='py-1 text-zinc-600'>Date</TableCell>
              <TableCell className='py-1 font-semibold text-black'>{paymentDate}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className='py-1 text-zinc-600'>Method</TableCell>
              <TableCell className='py-1 font-semibold text-black'>{paymentMethod}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className='py-1 text-zinc-600'>Property</TableCell>
              <TableCell className='py-1 font-semibold text-black'>{propertyAddress}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
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
