'use client'

import { useState } from 'react'
import { LuDownload, LuLoaderCircle } from 'react-icons/lu'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { useExportWorkOrders } from '~/services/maintenance.query'
import { usePropertiesQuery } from '~/services/properties.query'
import type { MaintenanceStatus, MaintenancePriority, MaintenanceCategory } from '~/services/maintenance.schema'

const statusOptions: { value: MaintenanceStatus; label: string }[] = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'PENDING_PARTS', label: 'Pending Parts' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const priorityOptions: { value: MaintenancePriority; label: string }[] = [
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
]

const categoryOptions: { value: MaintenanceCategory; label: string }[] = [
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'HVAC', label: 'HVAC' },
  { value: 'APPLIANCE', label: 'Appliance' },
  { value: 'STRUCTURAL', label: 'Structural' },
  { value: 'PEST_CONTROL', label: 'Pest Control' },
  { value: 'LANDSCAPING', label: 'Landscaping' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'PAINTING', label: 'Painting' },
  { value: 'FLOORING', label: 'Flooring' },
  { value: 'WINDOWS_DOORS', label: 'Windows/Doors' },
  { value: 'ROOF', label: 'Roof' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'OTHER', label: 'Other' },
]

interface ExportDialogProps {
  className?: string
}

export function ExportDialog({ className }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [propertyId, setPropertyId] = useState<string>('')
  const [status, setStatus] = useState<MaintenanceStatus | ''>('')
  const [priority, setPriority] = useState<MaintenancePriority | ''>('')
  const [category, setCategory] = useState<MaintenanceCategory | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [format, setFormat] = useState<'csv' | 'json'>('csv')

  const exportMutation = useExportWorkOrders()
  const { data: propertiesData } = usePropertiesQuery()

  const handleExport = async () => {
    try {
      const result = await exportMutation.mutateAsync({
        propertyId: propertyId || undefined,
        status: status || undefined,
        priority: priority || undefined,
        category: category || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        format,
      })

      if (!result.data || (typeof result.data === 'string' && result.data.length === 0)) {
        toast.info('No Data', {
          description: 'No work orders match the selected filters.',
        })
        return
      }

      // Create and download the file
      const blob = new Blob(
        [typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)],
        { type: format === 'csv' ? 'text/csv' : 'application/json' }
      )
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `work-orders-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Export Complete', {
        description: `Work orders exported as ${format.toUpperCase()}`,
      })
      setOpen(false)
    } catch (error) {
      toast.error('Export Failed', {
        description: 'Failed to export work orders. Please try again.',
      })
    }
  }

  const resetFilters = () => {
    setPropertyId('')
    setStatus('')
    setPriority('')
    setCategory('')
    setDateFrom('')
    setDateTo('')
    setFormat('csv')
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetFilters()
    }}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm' className={className}>
          <LuDownload className='mr-2 size-4' />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Export Work Orders</DialogTitle>
          <DialogDescription>
            Select filters to export work orders to CSV or JSON format.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Property Filter */}
          <div className='space-y-2'>
            <Label>Property</Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger>
                <SelectValue placeholder='All properties' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=''>All Properties</SelectItem>
                {propertiesData?.properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className='space-y-2'>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as MaintenanceStatus | '')}>
              <SelectTrigger>
                <SelectValue placeholder='All statuses' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=''>All Statuses</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div className='space-y-2'>
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as MaintenancePriority | '')}>
              <SelectTrigger>
                <SelectValue placeholder='All priorities' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=''>All Priorities</SelectItem>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className='space-y-2'>
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as MaintenanceCategory | '')}>
              <SelectTrigger>
                <SelectValue placeholder='All categories' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=''>All Categories</SelectItem>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>From Date</Label>
              <Input
                type='date'
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label>To Date</Label>
              <Input
                type='date'
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Format */}
          <div className='space-y-2'>
            <Label>Export Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as 'csv' | 'json')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='csv'>CSV (Excel compatible)</SelectItem>
                <SelectItem value='json'>JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exportMutation.isPending}>
            {exportMutation.isPending ? (
              <LuLoaderCircle className='mr-2 size-4 animate-spin' />
            ) : (
              <LuDownload className='mr-2 size-4' />
            )}
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
