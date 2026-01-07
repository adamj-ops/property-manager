'use client'

import { useState, useMemo, Suspense } from 'react'
import {
  LuTrash2,
  LuPencil,
  LuLoaderCircle,
  LuChevronDown,
  LuChevronUp,
  LuShieldCheck,
  LuUser,
} from 'react-icons/lu'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { AddCostLineItemDialog } from '~/components/maintenance/add-cost-line-item-dialog'
import {
  useCostLineItemsByRequestQuery,
  useDeleteCostLineItemMutation,
  useBulkDeleteCostLineItemsMutation,
} from '~/services/cost-line-items.query'
import {
  costLineItemTypeLabels,
  costLineItemTypeIcons,
  type CostLineItemWithDetails,
} from '~/services/cost-line-items.schema'

interface CostLineItemsTableProps {
  requestId: string
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

function CostLineItemsTableContent({ requestId }: CostLineItemsTableProps) {
  const { data: items } = useCostLineItemsByRequestQuery(requestId)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<'type' | 'totalCost' | 'createdAt'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  const deleteMutation = useDeleteCostLineItemMutation()
  const bulkDeleteMutation = useBulkDeleteCostLineItemsMutation()

  // Sort items
  const sortedItems = useMemo(() => {
    if (!items) return []
    return [...items].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'totalCost':
          comparison = a.totalCost - b.totalCost
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [items, sortField, sortOrder])

  // Calculate totals
  const totals = useMemo(() => {
    if (!items) return { total: 0, tenantCharge: 0 }
    return items.reduce(
      (acc, item) => ({
        total: acc.total + item.totalCost,
        tenantCharge: acc.tenantCharge + (item.tenantChargeAmount || 0),
      }),
      { total: 0, tenantCharge: 0 }
    )
  }, [items])

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(items?.map((i) => i.id) || []))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) {
      newSet.add(id)
    } else {
      newSet.delete(id)
    }
    setSelectedIds(newSet)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id, requestId })
      toast.success('Item deleted')
      setItemToDelete(null)
      setDeleteDialogOpen(false)
    } catch (error) {
      toast.error('Failed to delete item')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return

    try {
      await bulkDeleteMutation.mutateAsync({
        ids: Array.from(selectedIds),
        requestId,
      })
      toast.success(`${selectedIds.size} items deleted`)
      setSelectedIds(new Set())
    } catch (error) {
      toast.error('Failed to delete items')
    }
  }

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? (
      <LuChevronUp className='inline size-4' />
    ) : (
      <LuChevronDown className='inline size-4' />
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className='rounded-lg border border-dashed p-8 text-center'>
        <p className='text-muted-foreground mb-4'>No cost items added yet</p>
        <AddCostLineItemDialog requestId={requestId} />
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Actions bar */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {selectedIds.size > 0 && (
            <>
              <span className='text-sm text-muted-foreground'>
                {selectedIds.size} selected
              </span>
              <Button
                variant='destructive'
                size='sm'
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? (
                  <LuLoaderCircle className='mr-2 size-4 animate-spin' />
                ) : (
                  <LuTrash2 className='mr-2 size-4' />
                )}
                Delete Selected
              </Button>
            </>
          )}
        </div>
        <AddCostLineItemDialog requestId={requestId} />
      </div>

      {/* Table */}
      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[40px]'>
                <Checkbox
                  checked={selectedIds.size === items.length && items.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead
                className='cursor-pointer hover:bg-muted/50'
                onClick={() => handleSort('type')}
              >
                Type <SortIcon field='type' />
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead className='text-right'>Qty</TableHead>
              <TableHead className='text-right'>Unit $</TableHead>
              <TableHead
                className='text-right cursor-pointer hover:bg-muted/50'
                onClick={() => handleSort('totalCost')}
              >
                Total <SortIcon field='totalCost' />
              </TableHead>
              <TableHead className='text-center'>Tenant</TableHead>
              <TableHead className='w-[80px]'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={(checked) =>
                      handleSelectItem(item.id, checked === true)
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <span>{costLineItemTypeIcons[item.type]}</span>
                    <span className='font-medium'>
                      {costLineItemTypeLabels[item.type]}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='max-w-[200px]'>
                    <p className='truncate'>{item.description}</p>
                    {/* Show additional info badges */}
                    <div className='flex gap-1 mt-1'>
                      {item.warranty && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant='secondary' className='text-xs'>
                              <LuShieldCheck className='mr-1 size-3' />
                              Warranty
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {item.warrantyExpiry
                              ? `Expires: ${new Date(item.warrantyExpiry).toLocaleDateString()}`
                              : 'Has warranty'}
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {item.workerId && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant='outline' className='text-xs'>
                              <LuUser className='mr-1 size-3' />
                              {item.workerId}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>Worker/Technician</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className='text-right font-mono'>
                  {item.quantity}
                </TableCell>
                <TableCell className='text-right font-mono'>
                  {formatCurrency(item.unitCost)}
                </TableCell>
                <TableCell className='text-right font-mono font-medium'>
                  {formatCurrency(item.totalCost)}
                </TableCell>
                <TableCell className='text-center'>
                  {item.chargeToTenant ? (
                    <Badge variant='secondary'>
                      {item.tenantChargeAmount
                        ? formatCurrency(item.tenantChargeAmount)
                        : 'Yes'}
                    </Badge>
                  ) : (
                    <span className='text-muted-foreground'>-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-1'>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-8'
                          onClick={() => {
                            setItemToDelete(item.id)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <LuTrash2 className='size-4' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {/* Totals row */}
            <TableRow className='bg-muted/50 font-medium'>
              <TableCell colSpan={5} className='text-right'>
                Total
              </TableCell>
              <TableCell className='text-right font-mono'>
                {formatCurrency(totals.total)}
              </TableCell>
              <TableCell className='text-center'>
                {totals.tenantCharge > 0 && (
                  <Badge>{formatCurrency(totals.tenantCharge)}</Badge>
                )}
              </TableCell>
              <TableCell />
            </TableRow>

            {/* Net cost row */}
            {totals.tenantCharge > 0 && (
              <TableRow className='bg-muted/30 font-medium'>
                <TableCell colSpan={5} className='text-right'>
                  Net Cost (after tenant charges)
                </TableCell>
                <TableCell className='text-right font-mono text-green-600'>
                  {formatCurrency(totals.total - totals.tenantCharge)}
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Cost Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this cost item? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => itemToDelete && handleDelete(itemToDelete)}
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
    </div>
  )
}

function CostLineItemsTableSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <Skeleton className='h-9 w-24' />
      </div>
      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[40px]'>
                <Skeleton className='size-4' />
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit $</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead className='w-[80px]' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className='size-4' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-20' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-40' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-8' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-16' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-16' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-8' />
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

export function CostLineItemsTable({ requestId }: CostLineItemsTableProps) {
  return (
    <Suspense fallback={<CostLineItemsTableSkeleton />}>
      <CostLineItemsTableContent requestId={requestId} />
    </Suspense>
  )
}
