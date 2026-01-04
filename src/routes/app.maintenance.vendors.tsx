'use client'

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import {
  LuBuilding2,
  LuCalendar,
  LuCheck,
  LuEye,
  LuLoader2,
  LuMail,
  LuPencil,
  LuPhone,
  LuPlus,
  LuSearch,
  LuShield,
  LuStar,
  LuTrash2,
  LuWrench,
} from 'react-icons/lu'
import type { ColumnDef } from '@tanstack/react-table'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { Textarea } from '~/components/ui/textarea'
import { Typography } from '~/components/ui/typography'
import {
  DataTable,
  DataTableColumnHeader,
  DataTableRowActions,
  DataTableToolbar,
} from '~/components/ui/data-table'
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '~/components/ui/dropdown-menu'
import { useToast } from '~/components/ui/use-toast'

import {
  useVendorsQuery,
  useVendorStatsQuery,
  useCreateVendor,
  useDeleteVendor,
  vendorsQueryOptions,
  vendorStatsQueryOptions,
} from '~/services/vendors.query'
import type { VendorFilters, CreateVendorInput, VendorStatus } from '~/services/vendors.schema'
import type { MaintenanceCategory } from '~/services/maintenance.schema'

export const Route = createFileRoute('/app/maintenance/vendors')({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(vendorsQueryOptions({})),
      context.queryClient.ensureQueryData(vendorStatsQueryOptions()),
    ])
  },
  component: VendorsListPage,
})

// Vendor type
interface Vendor {
  id: string
  status: string
  companyName: string
  contactName: string
  email: string
  phone: string
  categories: string[]
  rating: number | null
  totalJobs: number
  insuranceExpiry: string | null
  licenseExpiry: string | null
  createdAt: string
  _count: {
    maintenanceRequests: number
    expenses: number
  }
}

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  INACTIVE: { label: 'Inactive', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
  PENDING_APPROVAL: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  SUSPENDED: { label: 'Suspended', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
}

const categoryLabels: Record<string, string> = {
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  HVAC: 'HVAC',
  APPLIANCE: 'Appliance',
  STRUCTURAL: 'Structural',
  PEST_CONTROL: 'Pest Control',
  LANDSCAPING: 'Landscaping',
  CLEANING: 'Cleaning',
  PAINTING: 'Painting',
  FLOORING: 'Flooring',
  WINDOWS_DOORS: 'Windows/Doors',
  ROOF: 'Roof',
  SAFETY: 'Safety',
  OTHER: 'Other',
}

// Column definitions
const columns: ColumnDef<Vendor>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'companyName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Vendor' />
    ),
    cell: ({ row }) => {
      const status = statusConfig[row.original.status] || statusConfig.ACTIVE
      return (
        <div className='flex items-center gap-3'>
          <div className='flex size-10 items-center justify-center rounded-lg bg-muted'>
            <LuBuilding2 className='size-5 text-muted-foreground' />
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <Link
                to='/app/maintenance/vendors/$vendorId'
                params={{ vendorId: row.original.id }}
                className='font-medium hover:underline'
              >
                {row.original.companyName}
              </Link>
              <Badge className={`text-xs ${status.className}`}>{status.label}</Badge>
            </div>
            <p className='text-xs text-muted-foreground'>{row.original.contactName}</p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'categories',
    header: 'Services',
    cell: ({ row }) => (
      <div className='flex flex-wrap gap-1'>
        {row.original.categories.slice(0, 2).map((cat) => (
          <Badge key={cat} variant='outline' className='text-xs'>
            {categoryLabels[cat] || cat}
          </Badge>
        ))}
        {row.original.categories.length > 2 && (
          <Badge variant='outline' className='text-xs'>
            +{row.original.categories.length - 2}
          </Badge>
        )}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'phone',
    header: 'Contact',
    cell: ({ row }) => (
      <div className='space-y-1'>
        <div className='flex items-center gap-1 text-sm'>
          <LuPhone className='size-3 text-muted-foreground' />
          {row.original.phone}
        </div>
        <div className='flex items-center gap-1 text-xs text-muted-foreground'>
          <LuMail className='size-3' />
          {row.original.email}
        </div>
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'rating',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Rating' />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-1'>
        <LuStar className='size-4 text-yellow-500 fill-yellow-500' />
        <span className='font-medium'>
          {row.original.rating ? row.original.rating.toFixed(1) : 'N/A'}
        </span>
        <span className='text-xs text-muted-foreground'>
          ({row.original._count.maintenanceRequests} jobs)
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'insuranceExpiry',
    header: 'Insurance',
    cell: ({ row }) => {
      if (!row.original.insuranceExpiry) {
        return <span className='text-xs text-muted-foreground'>Not set</span>
      }
      const expiry = new Date(row.original.insuranceExpiry)
      const now = new Date()
      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const isExpiring = daysUntilExpiry <= 30 && daysUntilExpiry > 0
      const isExpired = daysUntilExpiry <= 0

      return (
        <div className='flex items-center gap-1'>
          <LuShield className={`size-4 ${isExpired ? 'text-red-500' : isExpiring ? 'text-yellow-500' : 'text-green-500'}`} />
          <span className={`text-xs ${isExpired ? 'text-red-600' : isExpiring ? 'text-yellow-600' : ''}`}>
            {isExpired ? 'Expired' : isExpiring ? `${daysUntilExpiry}d left` : expiry.toLocaleDateString()}
          </span>
        </div>
      )
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions row={row}>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to='/app/maintenance/vendors/$vendorId' params={{ vendorId: row.original.id }}>
            <LuEye className='mr-2 size-4' />
            View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to='/app/maintenance/vendors/$vendorId' params={{ vendorId: row.original.id }}>
            <LuPencil className='mr-2 size-4' />
            Edit vendor
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className='text-destructive'>
          <LuTrash2 className='mr-2 size-4' />
          Deactivate
        </DropdownMenuItem>
      </DataTableRowActions>
    ),
  },
]

// Stats skeleton
function StatsSkeleton() {
  return (
    <div className='grid gap-4 md:grid-cols-4'>
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className='pb-2'>
            <Skeleton className='h-4 w-24' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-8 w-12' />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Stats component
function VendorStats() {
  const { data: stats } = useVendorStatsQuery()

  return (
    <div className='grid gap-4 md:grid-cols-4'>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center gap-2 text-sm font-medium'>
            <LuCheck className='size-4 text-green-600' />
            Active Vendors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-green-600'>{stats.active}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center gap-2 text-sm font-medium'>
            <LuWrench className='size-4 text-blue-600' />
            Total Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-blue-600'>{stats.totalJobs}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center gap-2 text-sm font-medium'>
            <LuCalendar className='size-4 text-yellow-600' />
            Pending Approval
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-yellow-600'>{stats.pendingApproval}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center gap-2 text-sm font-medium'>
            <LuShield className='size-4 text-orange-600' />
            Expiring Insurance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-orange-600'>{stats.expiringInsurance}</div>
        </CardContent>
      </Card>
    </div>
  )
}

// Table skeleton
function TableSkeleton() {
  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='space-y-4'>
          <Skeleton className='h-10 w-full' />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className='h-16 w-full' />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Data table component
function VendorsDataTable({
  filters,
  setFilters,
}: {
  filters: Partial<VendorFilters>
  setFilters: (f: Partial<VendorFilters>) => void
}) {
  const { data } = useVendorsQuery(filters)
  const vendors = data.vendors as unknown as Vendor[]

  return (
    <Card>
      <CardContent className='pt-6'>
        <DataTable
          columns={columns}
          data={vendors}
          toolbar={(table) => (
            <DataTableToolbar
              table={table}
              searchKey='companyName'
              searchPlaceholder='Search vendors...'
              actionComponent={
                <div className='flex gap-2'>
                  <Button
                    variant={!filters.status ? 'outline' : 'ghost'}
                    size='sm'
                    onClick={() => setFilters({ ...filters, status: undefined })}
                  >
                    All
                  </Button>
                  <Button
                    variant={filters.status === 'ACTIVE' ? 'outline' : 'ghost'}
                    size='sm'
                    onClick={() => setFilters({ ...filters, status: 'ACTIVE' })}
                  >
                    Active
                  </Button>
                  <Button
                    variant={filters.status === 'INACTIVE' ? 'outline' : 'ghost'}
                    size='sm'
                    onClick={() => setFilters({ ...filters, status: 'INACTIVE' })}
                  >
                    Inactive
                  </Button>
                </div>
              }
            />
          )}
        />
        {data.total > 0 && (
          <div className='mt-4 text-sm text-muted-foreground'>
            Showing {Math.min(data.limit, data.total)} of {data.total} vendors
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Create vendor dialog
function CreateVendorDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const createMutation = useCreateVendor()

  const [formData, setFormData] = useState<Partial<CreateVendorInput>>({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    categories: [],
    paymentTerms: 30,
  })

  const [selectedCategories, setSelectedCategories] = useState<MaintenanceCategory[]>([])

  const handleSubmit = async () => {
    if (!formData.companyName || !formData.contactName || !formData.email || !formData.phone || selectedCategories.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      const result = await createMutation.mutateAsync({
        ...formData,
        companyName: formData.companyName!,
        contactName: formData.contactName!,
        email: formData.email!,
        phone: formData.phone!,
        categories: selectedCategories,
        paymentTerms: formData.paymentTerms || 30,
      } as CreateVendorInput)

      toast({
        title: 'Vendor Created',
        description: `${result.companyName} has been added successfully.`,
      })

      onOpenChange(false)
      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        categories: [],
        paymentTerms: 30,
      })
      setSelectedCategories([])

      navigate({ to: '/app/maintenance/vendors/$vendorId', params: { vendorId: result.id } })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create vendor. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const toggleCategory = (category: MaintenanceCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>
            Add a new vendor to your network. Fill in the required details below.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='company-name'>Company Name *</Label>
            <Input
              id='company-name'
              placeholder='Enter company name'
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='contact-name'>Contact Name *</Label>
            <Input
              id='contact-name'
              placeholder='Primary contact person'
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email *</Label>
              <Input
                id='email'
                type='email'
                placeholder='vendor@company.com'
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='phone'>Phone *</Label>
              <Input
                id='phone'
                type='tel'
                placeholder='(555) 123-4567'
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label>Service Categories *</Label>
            <div className='grid grid-cols-3 gap-2'>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <label
                  key={value}
                  className={`flex items-center gap-2 rounded-lg border p-2 cursor-pointer text-xs ${
                    selectedCategories.includes(value as MaintenanceCategory)
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Checkbox
                    checked={selectedCategories.includes(value as MaintenanceCategory)}
                    onCheckedChange={() => toggleCategory(value as MaintenanceCategory)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='hourly-rate'>Hourly Rate</Label>
            <Input
              id='hourly-rate'
              type='number'
              placeholder='75.00'
              value={formData.hourlyRate?.toString() || ''}
              onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || undefined })}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='notes'>Notes</Label>
            <Textarea
              id='notes'
              placeholder='Additional notes about this vendor...'
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending && <LuLoader2 className='mr-2 size-4 animate-spin' />}
            Add Vendor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function VendorsListPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filters, setFilters] = useState<Partial<VendorFilters>>({})

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Typography.H2>Vendors</Typography.H2>
          <Typography.Muted>Manage your maintenance vendor network</Typography.Muted>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <LuPlus className='mr-2 size-4' />
          Add Vendor
        </Button>
      </div>

      {/* Create Vendor Dialog */}
      <CreateVendorDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {/* Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <VendorStats />
      </Suspense>

      {/* Data Table */}
      <Suspense fallback={<TableSkeleton />}>
        <VendorsDataTable filters={filters} setFilters={setFilters} />
      </Suspense>
    </div>
  )
}
