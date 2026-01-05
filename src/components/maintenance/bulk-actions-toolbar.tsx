'use client'

import { useState } from 'react'
import type { Table } from '@tanstack/react-table'
import { LuCheck, LuLoaderCircle, LuTruck, LuX } from 'react-icons/lu'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  useBulkUpdateStatus,
  useBulkAssignVendor,
  useBulkDeleteWorkOrders,
} from '~/services/maintenance.query'
import { useVendorsQuery } from '~/services/vendors.query'
import type { MaintenanceStatus } from '~/services/maintenance.schema'

interface BulkActionsToolbarProps<TData> {
  table: Table<TData>
  getRowId: (row: TData) => string
}

const statusOptions: { value: MaintenanceStatus; label: string }[] = [
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'PENDING_PARTS', label: 'Pending Parts' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
]

export function BulkActionsToolbar<TData>({
  table,
  getRowId,
}: BulkActionsToolbarProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length
  const selectedIds = selectedRows.map((row) => getRowId(row.original))

  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<MaintenanceStatus | ''>('')
  const [selectedVendor, setSelectedVendor] = useState<string>('')

  const bulkUpdateStatus = useBulkUpdateStatus()
  const bulkAssignVendor = useBulkAssignVendor()
  const bulkDelete = useBulkDeleteWorkOrders()

  // Fetch vendors for assignment
  const { data: vendorsData } = useVendorsQuery({ isActive: true })

  const handleStatusChange = async (status: MaintenanceStatus) => {
    if (selectedIds.length === 0) return

    try {
      await bulkUpdateStatus.mutateAsync({ ids: selectedIds, status })
      toast.success('Status Updated', {
        description: `${selectedIds.length} work order(s) updated to ${status.replace('_', ' ').toLowerCase()}`,
      })
      table.resetRowSelection()
      setSelectedStatus('')
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to update status. Please try again.',
      })
    }
  }

  const handleVendorAssign = async (vendorId: string) => {
    if (selectedIds.length === 0) return

    try {
      await bulkAssignVendor.mutateAsync({ ids: selectedIds, vendorId })
      const vendor = vendorsData?.vendors.find((v) => v.id === vendorId)
      toast.success('Vendor Assigned', {
        description: `${selectedIds.length} work order(s) assigned to ${vendor?.companyName || 'vendor'}`,
      })
      table.resetRowSelection()
      setSelectedVendor('')
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to assign vendor. Please try again.',
      })
    }
  }

  const handleBulkCancel = async () => {
    if (selectedIds.length === 0) return

    try {
      await bulkDelete.mutateAsync({ ids: selectedIds })
      toast.success('Work Orders Cancelled', {
        description: `${selectedIds.length} work order(s) have been cancelled`,
      })
      table.resetRowSelection()
      setShowCancelDialog(false)
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to cancel work orders. Please try again.',
      })
    }
  }

  const isLoading =
    bulkUpdateStatus.isPending || bulkAssignVendor.isPending || bulkDelete.isPending

  if (selectedCount === 0) {
    return null
  }

  return (
    <>
      <div className='flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2'>
        <div className='flex items-center gap-2'>
          <LuCheck className='size-4 text-primary' />
          <span className='text-sm font-medium'>
            {selectedCount} selected
          </span>
        </div>

        <div className='border-l h-6' />

        {/* Status Change */}
        <Select
          value={selectedStatus}
          onValueChange={(value) => {
            setSelectedStatus(value as MaintenanceStatus)
            handleStatusChange(value as MaintenanceStatus)
          }}
          disabled={isLoading}
        >
          <SelectTrigger className='w-[160px] h-8'>
            <SelectValue placeholder='Change status...' />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Vendor Assignment */}
        <Select
          value={selectedVendor}
          onValueChange={(value) => {
            setSelectedVendor(value)
            handleVendorAssign(value)
          }}
          disabled={isLoading}
        >
          <SelectTrigger className='w-[180px] h-8'>
            <LuTruck className='mr-2 size-4' />
            <SelectValue placeholder='Assign vendor...' />
          </SelectTrigger>
          <SelectContent>
            {vendorsData?.vendors.map((vendor) => (
              <SelectItem key={vendor.id} value={vendor.id}>
                {vendor.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className='border-l h-6' />

        {/* Cancel Button */}
        <Button
          variant='ghost'
          size='sm'
          className='text-destructive hover:text-destructive hover:bg-destructive/10'
          onClick={() => setShowCancelDialog(true)}
          disabled={isLoading}
        >
          {isLoading ? (
            <LuLoaderCircle className='mr-2 size-4 animate-spin' />
          ) : (
            <LuX className='mr-2 size-4' />
          )}
          Cancel Selected
        </Button>

        {/* Clear Selection */}
        <Button
          variant='ghost'
          size='sm'
          onClick={() => table.resetRowSelection()}
          disabled={isLoading}
        >
          Clear
        </Button>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Work Orders</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel {selectedCount} work order(s)? This will
              set their status to CANCELLED. This action can be undone by changing the
              status back.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowCancelDialog(false)}>
              No, keep them
            </Button>
            <Button
              variant='destructive'
              onClick={handleBulkCancel}
              disabled={bulkDelete.isPending}
            >
              {bulkDelete.isPending && <LuLoaderCircle className='mr-2 size-4 animate-spin' />}
              Yes, cancel them
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
