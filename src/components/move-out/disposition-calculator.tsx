import { LuDollarSign, LuMinus, LuPercent, LuPlus } from 'react-icons/lu'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'

interface DispositionCalculatorProps {
  originalDeposit: number
  interestAccrued: number
  deductions: {
    description: string
    amount: number
    isNormalWear?: boolean
    isPreExisting?: boolean
  }[]
  className?: string
}

export function DispositionCalculator({
  originalDeposit,
  interestAccrued,
  deductions,
  className,
}: DispositionCalculatorProps) {
  // Filter to only deductible items
  const deductibleItems = deductions.filter((d) => !d.isNormalWear && !d.isPreExisting)
  const nonDeductibleItems = deductions.filter((d) => d.isNormalWear || d.isPreExisting)

  const totalDeductions = deductibleItems.reduce((sum, d) => sum + d.amount, 0)
  const subtotal = originalDeposit + interestAccrued
  const refundAmount = Math.max(0, subtotal - totalDeductions)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <LuDollarSign className='size-5' />
          Deposit Disposition Summary
        </CardTitle>
        <CardDescription>
          Calculated per Minnesota Statute 504B.178
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Deposit Section */}
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>Original Security Deposit</span>
            <span className='font-medium'>${originalDeposit.toFixed(2)}</span>
          </div>
          <div className='flex items-center justify-between text-green-600'>
            <span className='flex items-center gap-1'>
              <LuPlus className='size-3' />
              Interest Accrued (1% annually)
            </span>
            <span className='font-medium'>+ ${interestAccrued.toFixed(2)}</span>
          </div>
          <Separator />
          <div className='flex items-center justify-between'>
            <span className='font-medium'>Subtotal</span>
            <span className='font-bold'>${subtotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Deductions Section */}
        {deductibleItems.length > 0 && (
          <div className='space-y-2'>
            <h4 className='text-sm font-medium text-muted-foreground'>Deductions</h4>
            {deductibleItems.map((item, index) => (
              <div key={index} className='flex items-center justify-between text-red-600'>
                <span className='flex items-center gap-1 text-sm'>
                  <LuMinus className='size-3' />
                  {item.description}
                </span>
                <span className='font-medium'>- ${item.amount.toFixed(2)}</span>
              </div>
            ))}
            <Separator />
            <div className='flex items-center justify-between text-red-600'>
              <span className='font-medium'>Total Deductions</span>
              <span className='font-bold'>- ${totalDeductions.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Non-deductible Items (for reference) */}
        {nonDeductibleItems.length > 0 && (
          <div className='space-y-2 rounded-lg bg-muted/50 p-3'>
            <h4 className='text-sm font-medium text-muted-foreground'>
              Not Deducted (Normal Wear / Pre-existing)
            </h4>
            {nonDeductibleItems.map((item, index) => (
              <div key={index} className='flex items-center justify-between text-muted-foreground'>
                <span className='text-sm line-through'>{item.description}</span>
                <span className='text-sm line-through'>${item.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Final Refund */}
        <div className='rounded-lg border-2 border-primary bg-primary/5 p-4'>
          <div className='flex items-center justify-between'>
            <span className='text-lg font-semibold'>Amount Due to Tenant</span>
            <span className='text-2xl font-bold text-primary'>${refundAmount.toFixed(2)}</span>
          </div>
          {refundAmount === 0 && totalDeductions > subtotal && (
            <p className='mt-2 text-sm text-muted-foreground'>
              Note: Deductions exceed deposit amount. Additional collection may be required.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface DispositionSummaryCardProps {
  originalDeposit: number
  interestAccrued: number
  totalDeductions: number
  refundAmount: number
  compact?: boolean
}

export function DispositionSummaryCard({
  originalDeposit,
  interestAccrued,
  totalDeductions,
  refundAmount,
  compact = false,
}: DispositionSummaryCardProps) {
  if (compact) {
    return (
      <div className='flex items-center gap-6 text-sm'>
        <div>
          <span className='text-muted-foreground'>Deposit:</span>
          <span className='ml-1 font-medium'>${originalDeposit.toFixed(2)}</span>
        </div>
        <div className='text-green-600'>
          <span>+ Interest:</span>
          <span className='ml-1 font-medium'>${interestAccrued.toFixed(2)}</span>
        </div>
        <div className='text-red-600'>
          <span>- Deductions:</span>
          <span className='ml-1 font-medium'>${totalDeductions.toFixed(2)}</span>
        </div>
        <div className='font-bold'>
          <span>=</span>
          <span className='ml-1 text-primary'>${refundAmount.toFixed(2)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className='grid grid-cols-4 gap-4'>
      <Card>
        <CardContent className='p-4'>
          <div className='text-sm text-muted-foreground'>Original Deposit</div>
          <div className='text-xl font-bold'>${originalDeposit.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card className='border-green-200 bg-green-50/50'>
        <CardContent className='p-4'>
          <div className='text-sm text-green-600'>+ Interest (1%)</div>
          <div className='text-xl font-bold text-green-700'>${interestAccrued.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card className='border-red-200 bg-red-50/50'>
        <CardContent className='p-4'>
          <div className='text-sm text-red-600'>- Deductions</div>
          <div className='text-xl font-bold text-red-700'>${totalDeductions.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card className='border-primary bg-primary/5'>
        <CardContent className='p-4'>
          <div className='text-sm text-primary'>Refund Due</div>
          <div className='text-xl font-bold text-primary'>${refundAmount.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  )
}
