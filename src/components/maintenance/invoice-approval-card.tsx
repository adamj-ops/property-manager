'use client'

import { Suspense, useState } from 'react'
import {
  LuBanknote,
  LuCheck,
  LuClock,
  LuExternalLink,
  LuFileText,
  LuLoaderCircle,
  LuX,
} from 'react-icons/lu'
import { toast } from 'sonner'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { Textarea } from '~/components/ui/textarea'
import {
  useInvoicesByRequestQuery,
  useStartReviewMutation,
  useApproveInvoiceMutation,
  useRejectInvoiceMutation,
  useMarkInvoicePaidMutation,
} from '~/services/invoices.query'
import {
  invoiceStatusLabels,
  invoiceStatusColors,
  paymentMethodOptions,
  type InvoiceWithDetails,
  type InvoiceStatus,
} from '~/services/invoices.schema'
import { costLineItemTypeLabels } from '~/services/cost-line-items.schema'

interface InvoiceApprovalCardProps {
  requestId: string
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString()
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function InvoiceApprovalContent({ requestId }: InvoiceApprovalCardProps) {
  const { data: invoices } = useInvoicesByRequestQuery(requestId)
  const startReviewMutation = useStartReviewMutation()
  const approveMutation = useApproveInvoiceMutation()
  const rejectMutation = useRejectInvoiceMutation()
  const markPaidMutation = useMarkInvoicePaidMutation()

  // Review form state
  const [reviewNotes, setReviewNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [createCostLineItems, setCreateCostLineItems] = useState(false)
  const [costLineItemType, setCostLineItemType] = useState<string>('')
  const [costLineItemDescription, setCostLineItemDescription] = useState('')

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentReference, setPaymentReference] = useState('')

  // Filter for invoices pending action
  const pendingInvoices = invoices?.filter(
    (inv) =>
      inv.status === 'SUBMITTED' ||
      inv.status === 'UNDER_REVIEW' ||
      inv.status === 'APPROVED'
  )

  if (!pendingInvoices || pendingInvoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <LuFileText className='size-5' />
            Invoice Approvals
          </CardTitle>
          <CardDescription>No invoices pending approval or payment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8 text-center text-muted-foreground'>
            <div>
              <LuCheck className='mx-auto size-8 opacity-50' />
              <p className='mt-2 text-sm'>All invoices processed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleStartReview = async (invoice: InvoiceWithDetails) => {
    try {
      await startReviewMutation.mutateAsync({ id: invoice.id })
      toast.success('Review started', {
        description: 'You are now reviewing this invoice.',
      })
    } catch (error) {
      toast.error('Failed to start review', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    }
  }

  const handleApprove = async (invoice: InvoiceWithDetails) => {
    try {
      await approveMutation.mutateAsync({
        id: invoice.id,
        reviewNotes: reviewNotes || undefined,
        createCostLineItems,
        costLineItemType: createCostLineItems
          ? (costLineItemType as any)
          : undefined,
        costLineItemDescription: createCostLineItems
          ? costLineItemDescription || undefined
          : undefined,
      })
      toast.success('Invoice approved', {
        description: createCostLineItems
          ? 'Invoice approved and cost line item created.'
          : 'Invoice approved and ready for payment.',
      })
      setReviewNotes('')
      setCreateCostLineItems(false)
      setCostLineItemType('')
      setCostLineItemDescription('')
    } catch (error) {
      toast.error('Failed to approve invoice', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    }
  }

  const handleReject = async (invoice: InvoiceWithDetails) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      await rejectMutation.mutateAsync({
        id: invoice.id,
        rejectionReason,
      })
      toast.success('Invoice rejected')
      setRejectionReason('')
    } catch (error) {
      toast.error('Failed to reject invoice', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    }
  }

  const handleMarkPaid = async (invoice: InvoiceWithDetails) => {
    if (!paymentMethod) {
      toast.error('Please select a payment method')
      return
    }

    try {
      await markPaidMutation.mutateAsync({
        id: invoice.id,
        paymentMethod: paymentMethod as any,
        paymentReference: paymentReference || undefined,
      })
      toast.success('Invoice marked as paid')
      setPaymentMethod('')
      setPaymentReference('')
    } catch (error) {
      toast.error('Failed to mark as paid', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <LuFileText className='size-5' />
          Invoice Approvals
        </CardTitle>
        <CardDescription>
          {pendingInvoices.length} invoice{pendingInvoices.length !== 1 ? 's' : ''}{' '}
          pending action
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {pendingInvoices.map((invoice) => (
          <div
            key={invoice.id}
            className='rounded-lg border p-4 space-y-4'
          >
            {/* Invoice Header */}
            <div className='flex items-start justify-between'>
              <div>
                <div className='flex items-center gap-2'>
                  <span className='font-medium'>{invoice.invoiceNumber}</span>
                  <Badge
                    className={
                      invoiceStatusColors[invoice.status as InvoiceStatus]
                    }
                  >
                    {invoiceStatusLabels[invoice.status as InvoiceStatus]}
                  </Badge>
                </div>
                {invoice.vendor && (
                  <p className='text-sm text-muted-foreground'>
                    {invoice.vendor.companyName}
                  </p>
                )}
              </div>
              <div className='text-right'>
                <p className='text-lg font-semibold'>
                  {formatCurrency(invoice.totalAmount)}
                </p>
                <p className='text-xs text-muted-foreground'>
                  Due: {formatDate(invoice.dueDate)}
                </p>
              </div>
            </div>

            {/* Invoice Details */}
            <div className='grid grid-cols-2 gap-2 text-sm'>
              <div>
                <span className='text-muted-foreground'>Invoice Date:</span>{' '}
                {formatDate(invoice.invoiceDate)}
              </div>
              {invoice.vendorInvoiceNumber && (
                <div>
                  <span className='text-muted-foreground'>Vendor Invoice:</span>{' '}
                  {invoice.vendorInvoiceNumber}
                </div>
              )}
            </div>

            {invoice.description && (
              <p className='text-sm text-muted-foreground'>{invoice.description}</p>
            )}

            {/* View File Link */}
            <Button
              variant='outline'
              size='sm'
              onClick={() => window.open(invoice.fileUrl, '_blank')}
            >
              <LuExternalLink className='mr-2 size-4' />
              View Invoice File
            </Button>

            {/* Action Forms */}
            {invoice.status === 'SUBMITTED' && (
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => handleStartReview(invoice)}
                  disabled={startReviewMutation.isPending}
                >
                  {startReviewMutation.isPending ? (
                    <LuLoaderCircle className='mr-2 size-4 animate-spin' />
                  ) : (
                    <LuClock className='mr-2 size-4' />
                  )}
                  Start Review
                </Button>
              </div>
            )}

            {invoice.status === 'UNDER_REVIEW' && (
              <div className='space-y-4 rounded-lg bg-muted/50 p-3'>
                <div className='space-y-2'>
                  <Label className='text-sm'>Review Notes (optional)</Label>
                  <Textarea
                    placeholder='Add notes about this invoice...'
                    className='min-h-16'
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                  />
                </div>

                {/* Option to create cost line item */}
                <div className='flex items-center gap-2'>
                  <Checkbox
                    id={`create-cost-${invoice.id}`}
                    checked={createCostLineItems}
                    onCheckedChange={(checked) =>
                      setCreateCostLineItems(checked === true)
                    }
                  />
                  <Label
                    htmlFor={`create-cost-${invoice.id}`}
                    className='text-sm font-normal'
                  >
                    Create cost line item from this invoice
                  </Label>
                </div>

                {createCostLineItems && (
                  <div className='grid gap-3 pl-6'>
                    <div className='space-y-1'>
                      <Label className='text-xs'>Cost Type</Label>
                      <Select
                        value={costLineItemType}
                        onValueChange={setCostLineItemType}
                      >
                        <SelectTrigger className='h-8'>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(costLineItemTypeLabels).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-1'>
                      <Label className='text-xs'>Description (optional)</Label>
                      <Input
                        placeholder='Description for cost line item'
                        className='h-8'
                        value={costLineItemDescription}
                        onChange={(e) =>
                          setCostLineItemDescription(e.target.value)
                        }
                      />
                    </div>
                  </div>
                )}

                <div className='space-y-2'>
                  <Label className='text-sm'>Rejection Reason</Label>
                  <Textarea
                    placeholder='Required if rejecting...'
                    className='min-h-16'
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>

                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    onClick={() => handleApprove(invoice)}
                    disabled={
                      approveMutation.isPending ||
                      (createCostLineItems && !costLineItemType)
                    }
                  >
                    {approveMutation.isPending ? (
                      <LuLoaderCircle className='mr-2 size-4 animate-spin' />
                    ) : (
                      <LuCheck className='mr-2 size-4' />
                    )}
                    Approve
                  </Button>
                  <Button
                    size='sm'
                    variant='destructive'
                    onClick={() => handleReject(invoice)}
                    disabled={rejectMutation.isPending || !rejectionReason.trim()}
                  >
                    {rejectMutation.isPending ? (
                      <LuLoaderCircle className='mr-2 size-4 animate-spin' />
                    ) : (
                      <LuX className='mr-2 size-4' />
                    )}
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {invoice.status === 'APPROVED' && (
              <div className='space-y-4 rounded-lg bg-green-50 p-3 dark:bg-green-950/30'>
                <div className='flex items-center gap-2 text-green-700 dark:text-green-400'>
                  <LuCheck className='size-4' />
                  <span className='text-sm font-medium'>
                    Approved - Ready for Payment
                  </span>
                </div>

                <div className='grid gap-3'>
                  <div className='space-y-1'>
                    <Label className='text-xs'>Payment Method</Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                    >
                      <SelectTrigger className='h-8'>
                        <SelectValue placeholder='Select method' />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethodOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-1'>
                    <Label className='text-xs'>
                      Reference # (check/transaction)
                    </Label>
                    <Input
                      placeholder='Optional reference number'
                      className='h-8'
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  size='sm'
                  onClick={() => handleMarkPaid(invoice)}
                  disabled={markPaidMutation.isPending || !paymentMethod}
                >
                  {markPaidMutation.isPending ? (
                    <LuLoaderCircle className='mr-2 size-4 animate-spin' />
                  ) : (
                    <LuBanknote className='mr-2 size-4' />
                  )}
                  Mark as Paid
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function InvoiceApprovalSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className='h-6 w-40' />
        <Skeleton className='h-4 w-32' />
      </CardHeader>
      <CardContent className='space-y-4'>
        {[1, 2].map((i) => (
          <div key={i} className='rounded-lg border p-4 space-y-3'>
            <div className='flex justify-between'>
              <Skeleton className='h-5 w-32' />
              <Skeleton className='h-6 w-20' />
            </div>
            <Skeleton className='h-4 w-48' />
            <Skeleton className='h-8 w-32' />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function InvoiceApprovalCard({ requestId }: InvoiceApprovalCardProps) {
  return (
    <Suspense fallback={<InvoiceApprovalSkeleton />}>
      <InvoiceApprovalContent requestId={requestId} />
    </Suspense>
  )
}
