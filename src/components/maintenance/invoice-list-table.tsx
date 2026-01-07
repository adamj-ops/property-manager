'use client'

import { Suspense, useState } from 'react'
import {
  LuCheck,
  LuClock,
  LuDownload,
  LuEllipsisVertical,
  LuEye,
  LuFileText,
  LuLoaderCircle,
  LuSend,
  LuTrash2,
  LuX,
} from 'react-icons/lu'
import { toast } from 'sonner'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Skeleton } from '~/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { InvoiceUploadDialog } from '~/components/maintenance/invoice-upload-dialog'
import {
  useInvoicesByRequestQuery,
  useSubmitInvoiceMutation,
  useDeleteInvoiceMutation,
  useCancelInvoiceMutation,
} from '~/services/invoices.query'
import {
  invoiceStatusLabels,
  invoiceStatusColors,
  type InvoiceWithDetails,
  type InvoiceStatus,
} from '~/services/invoices.schema'

interface InvoiceListTableProps {
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

function InvoiceListContent({ requestId }: InvoiceListTableProps) {
  const { data: invoices } = useInvoicesByRequestQuery(requestId)
  const submitMutation = useSubmitInvoiceMutation()
  const deleteMutation = useDeleteInvoiceMutation()
  const cancelMutation = useCancelInvoiceMutation()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<InvoiceWithDetails | null>(null)

  const handleSubmit = async (invoice: InvoiceWithDetails) => {
    try {
      await submitMutation.mutateAsync({ id: invoice.id })
      toast.success('Invoice submitted', {
        description: 'The invoice has been submitted for approval.',
      })
    } catch (error) {
      toast.error('Failed to submit invoice', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    }
  }

  const handleDelete = async () => {
    if (!invoiceToDelete) return

    try {
      await deleteMutation.mutateAsync({
        id: invoiceToDelete.id,
        requestId,
      })
      toast.success('Invoice deleted')
      setDeleteDialogOpen(false)
      setInvoiceToDelete(null)
    } catch (error) {
      toast.error('Failed to delete invoice', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    }
  }

  const handleCancel = async (invoice: InvoiceWithDetails) => {
    try {
      await cancelMutation.mutateAsync({ id: invoice.id })
      toast.success('Invoice cancelled')
    } catch (error) {
      toast.error('Failed to cancel invoice', {
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    }
  }

  const confirmDelete = (invoice: InvoiceWithDetails) => {
    setInvoiceToDelete(invoice)
    setDeleteDialogOpen(true)
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center'>
        <LuFileText className='size-12 text-muted-foreground/50' />
        <p className='mt-4 font-medium'>No invoices yet</p>
        <p className='text-sm text-muted-foreground'>
          Upload vendor invoices to track and approve expenses.
        </p>
        <div className='mt-4'>
          <InvoiceUploadDialog requestId={requestId} />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className='mb-4 flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>
          {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
        </p>
        <InvoiceUploadDialog requestId={requestId}>
          <Button size='sm'>
            <LuFileText className='mr-2 size-4' />
            Add Invoice
          </Button>
        </InvoiceUploadDialog>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className='text-right'>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='w-12' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <div>
                    <p className='font-medium'>{invoice.invoiceNumber}</p>
                    {invoice.vendorInvoiceNumber && (
                      <p className='text-xs text-muted-foreground'>
                        Vendor: {invoice.vendorInvoiceNumber}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {invoice.vendor?.companyName || (
                    <span className='text-muted-foreground'>-</span>
                  )}
                </TableCell>
                <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                <TableCell className='text-right font-medium'>
                  {formatCurrency(invoice.totalAmount)}
                </TableCell>
                <TableCell>
                  <Badge className={invoiceStatusColors[invoice.status as InvoiceStatus]}>
                    {invoiceStatusLabels[invoice.status as InvoiceStatus]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon'>
                        <LuEllipsisVertical className='size-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem
                        onClick={() => window.open(invoice.fileUrl, '_blank')}
                      >
                        <LuEye className='mr-2 size-4' />
                        View File
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = invoice.fileUrl
                          link.download = invoice.fileName
                          link.click()
                        }}
                      >
                        <LuDownload className='mr-2 size-4' />
                        Download
                      </DropdownMenuItem>

                      {invoice.status === 'DRAFT' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleSubmit(invoice)}
                            disabled={submitMutation.isPending}
                          >
                            <LuSend className='mr-2 size-4' />
                            Submit for Approval
                          </DropdownMenuItem>
                        </>
                      )}

                      {(invoice.status === 'SUBMITTED' ||
                        invoice.status === 'UNDER_REVIEW') && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className='text-muted-foreground' disabled>
                            <LuClock className='mr-2 size-4' />
                            Pending Approval
                          </DropdownMenuItem>
                        </>
                      )}

                      {invoice.status === 'APPROVED' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className='text-green-600' disabled>
                            <LuCheck className='mr-2 size-4' />
                            Ready for Payment
                          </DropdownMenuItem>
                        </>
                      )}

                      {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className='text-destructive'
                            onClick={() => handleCancel(invoice)}
                            disabled={cancelMutation.isPending}
                          >
                            <LuX className='mr-2 size-4' />
                            Cancel
                          </DropdownMenuItem>
                        </>
                      )}

                      {(invoice.status === 'DRAFT' || invoice.status === 'CANCELLED') && (
                        <DropdownMenuItem
                          className='text-destructive'
                          onClick={() => confirmDelete(invoice)}
                        >
                          <LuTrash2 className='mr-2 size-4' />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice {invoiceToDelete?.invoiceNumber}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <LuLoaderCircle className='mr-2 size-4 animate-spin' />
              ) : (
                <LuTrash2 className='mr-2 size-4' />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function InvoiceListSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-9 w-28' />
      </div>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className='text-right'>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='w-12' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className='h-4 w-24' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-32' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-20' />
                </TableCell>
                <TableCell className='text-right'>
                  <Skeleton className='ml-auto h-4 w-16' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-5 w-20' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-8 w-8' />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function InvoiceListTable({ requestId }: InvoiceListTableProps) {
  return (
    <Suspense fallback={<InvoiceListSkeleton />}>
      <InvoiceListContent requestId={requestId} />
    </Suspense>
  )
}
