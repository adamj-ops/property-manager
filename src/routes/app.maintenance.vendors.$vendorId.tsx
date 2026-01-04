'use client'

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import {
  LuArrowLeft,
  LuBuilding2,
  LuCalendar,
  LuCheck,
  LuLoaderCircle,
  LuMail,
  LuMapPin,
  LuPencil,
  LuPhone,
  LuShield,
  LuStar,
  LuWrench,
  LuX,
} from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton'
import { Textarea } from '~/components/ui/textarea'
import { Typography } from '~/components/ui/typography'
import { toast } from 'sonner'

import {
  useVendorQuery,
  useUpdateVendor,
  useDeleteVendor,
  vendorQueryOptions,
} from '~/services/vendors.query'
import type { UpdateVendorInput, VendorStatus } from '~/services/vendors.schema'
import type { MaintenanceCategory } from '~/services/maintenance.schema'

export const Route = createFileRoute('/app/maintenance/vendors/$vendorId')({
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData(vendorQueryOptions(params.vendorId))
  },
  component: VendorDetailPage,
})

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

const maintenanceStatusConfig: Record<string, { label: string; className: string }> = {
  SUBMITTED: { label: 'Submitted', className: 'bg-gray-100 text-gray-800' },
  ACKNOWLEDGED: { label: 'Acknowledged', className: 'bg-purple-100 text-purple-800' },
  SCHEDULED: { label: 'Scheduled', className: 'bg-yellow-100 text-yellow-800' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
  COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
}

// Skeleton component
function VendorSkeleton() {
  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      <div className='flex items-center gap-4'>
        <Skeleton className='h-10 w-10' />
        <div className='space-y-2'>
          <Skeleton className='h-8 w-64' />
          <Skeleton className='h-4 w-48' />
        </div>
      </div>
      <div className='grid gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2 space-y-6'>
          <Skeleton className='h-96 w-full' />
        </div>
        <div className='space-y-6'>
          <Skeleton className='h-48 w-full' />
          <Skeleton className='h-48 w-full' />
        </div>
      </div>
    </div>
  )
}

// Vendor detail component
function VendorDetail() {
  const { vendorId } = Route.useParams()
  const navigate = useNavigate()

  const { data: vendor } = useVendorQuery(vendorId)
  const updateMutation = useUpdateVendor()
  const deleteMutation = useDeleteVendor()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<UpdateVendorInput>>({
    companyName: vendor.companyName,
    contactName: vendor.contactName,
    email: vendor.email,
    phone: vendor.phone,
    altPhone: vendor.altPhone || '',
    addressLine1: vendor.addressLine1 || '',
    city: vendor.city || '',
    state: vendor.state || '',
    zipCode: vendor.zipCode || '',
    hourlyRate: vendor.hourlyRate ? Number(vendor.hourlyRate) : undefined,
    paymentTerms: vendor.paymentTerms,
    notes: vendor.notes || '',
  })
  const [selectedCategories, setSelectedCategories] = useState<MaintenanceCategory[]>(
    vendor.categories as MaintenanceCategory[]
  )

  const status = statusConfig[vendor.status] || statusConfig.ACTIVE

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: vendorId,
        ...formData,
        categories: selectedCategories,
      })

      toast.success('Vendor Updated', {
        description: 'Vendor details have been saved successfully.',
      })
      setIsEditing(false)
    } catch {
      toast.error('Error', {
        description: 'Failed to update vendor. Please try again.',
      })
    }
  }

  const handleStatusChange = async (newStatus: VendorStatus) => {
    try {
      await updateMutation.mutateAsync({
        id: vendorId,
        status: newStatus,
      })

      toast.success('Status Updated', {
        description: `Vendor is now ${statusConfig[newStatus]?.label || newStatus}.`,
      })
    } catch {
      toast.error('Error', {
        description: 'Failed to update status.',
      })
    }
  }

  const handleDeactivate = async () => {
    try {
      await deleteMutation.mutateAsync(vendorId)
      toast.success('Vendor Deactivated', {
        description: 'Vendor has been deactivated.',
      })
      navigate({ to: '/app/maintenance/vendors' })
    } catch {
      toast.error('Error', {
        description: 'Failed to deactivate vendor.',
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
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Back Button & Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/app/maintenance/vendors'>
            <LuArrowLeft className='size-4' />
          </Link>
        </Button>
        <div className='flex-1'>
          <div className='flex items-center gap-3'>
            <div className='flex size-12 items-center justify-center rounded-lg bg-muted'>
              <LuBuilding2 className='size-6 text-muted-foreground' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <Typography.H2>{vendor.companyName}</Typography.H2>
                <Badge className={status.className}>{status.label}</Badge>
              </div>
              <Typography.Muted>{vendor.contactName} • {vendor._count.maintenanceRequests} jobs completed</Typography.Muted>
            </div>
          </div>
        </div>
        <div className='flex gap-2'>
          {!isEditing ? (
            <>
              <Button variant='outline' onClick={() => setIsEditing(true)}>
                <LuPencil className='mr-2 size-4' />
                Edit
              </Button>
              {vendor.status === 'ACTIVE' && (
                <Button variant='destructive' onClick={handleDeactivate}>
                  Deactivate
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant='outline' onClick={() => setIsEditing(false)}>
                <LuX className='mr-2 size-4' />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <LuLoaderCircle className='mr-2 size-4 animate-spin' />
                ) : (
                  <LuCheck className='mr-2 size-4' />
                )}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Vendor Details */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Vendor Information</CardTitle>
            <CardDescription>
              Member since {new Date(vendor.createdAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Contact Information */}
            <div className='space-y-4'>
              <h4 className='text-sm font-medium'>Contact Information</h4>
              {isEditing ? (
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label>Company Name</Label>
                    <Input
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Contact Name</Label>
                    <Input
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Email</Label>
                    <Input
                      type='email'
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Alt Phone</Label>
                    <Input
                      value={formData.altPhone}
                      onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='flex items-center gap-2'>
                    <LuPhone className='size-4 text-muted-foreground' />
                    <span>{vendor.phone}</span>
                    {vendor.altPhone && <span className='text-muted-foreground'>/ {vendor.altPhone}</span>}
                  </div>
                  <div className='flex items-center gap-2'>
                    <LuMail className='size-4 text-muted-foreground' />
                    <a href={`mailto:${vendor.email}`} className='text-primary hover:underline'>
                      {vendor.email}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Address */}
            <div className='space-y-4'>
              <h4 className='text-sm font-medium'>Address</h4>
              {isEditing ? (
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2 md:col-span-2'>
                    <Label>Street Address</Label>
                    <Input
                      value={formData.addressLine1}
                      onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                      placeholder='123 Main St'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label>State</Label>
                      <Input
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Zip</Label>
                      <Input
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className='flex items-start gap-2'>
                  <LuMapPin className='size-4 text-muted-foreground mt-1' />
                  <span>
                    {vendor.addressLine1 ? (
                      <>
                        {vendor.addressLine1}
                        <br />
                        {vendor.city}, {vendor.state} {vendor.zipCode}
                      </>
                    ) : (
                      <span className='text-muted-foreground'>No address on file</span>
                    )}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Service Categories */}
            <div className='space-y-4'>
              <h4 className='text-sm font-medium'>Service Categories</h4>
              {isEditing ? (
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
              ) : (
                <div className='flex flex-wrap gap-2'>
                  {vendor.categories.map((cat) => (
                    <Badge key={cat} variant='outline'>
                      {categoryLabels[cat] || cat}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Rates & Payment */}
            <div className='space-y-4'>
              <h4 className='text-sm font-medium'>Rates & Payment</h4>
              {isEditing ? (
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label>Hourly Rate ($)</Label>
                    <Input
                      type='number'
                      value={formData.hourlyRate?.toString() || ''}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || undefined })}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Payment Terms (Net Days)</Label>
                    <Input
                      type='number'
                      value={formData.paymentTerms?.toString() || '30'}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) || 30 })}
                    />
                  </div>
                </div>
              ) : (
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-1'>
                    <p className='text-sm text-muted-foreground'>Hourly Rate</p>
                    <p className='font-medium'>
                      {vendor.hourlyRate ? `$${Number(vendor.hourlyRate).toFixed(2)}/hr` : 'Not set'}
                    </p>
                  </div>
                  <div className='space-y-1'>
                    <p className='text-sm text-muted-foreground'>Payment Terms</p>
                    <p className='font-medium'>Net {vendor.paymentTerms} days</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Notes */}
            <div className='space-y-4'>
              <h4 className='text-sm font-medium'>Notes</h4>
              {isEditing ? (
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder='Additional notes about this vendor...'
                  className='min-h-24'
                />
              ) : (
                <p className='text-sm text-muted-foreground'>
                  {vendor.notes || 'No notes'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Rating & Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-center gap-2'>
                <LuStar className='size-8 text-yellow-500 fill-yellow-500' />
                <span className='text-4xl font-bold'>
                  {vendor.rating ? Number(vendor.rating).toFixed(1) : 'N/A'}
                </span>
              </div>
              <Separator />
              <div className='grid grid-cols-2 gap-4 text-center'>
                <div>
                  <p className='text-2xl font-bold'>{vendor._count.maintenanceRequests}</p>
                  <p className='text-xs text-muted-foreground'>Total Jobs</p>
                </div>
                <div>
                  <p className='text-2xl font-bold'>{vendor._count.expenses}</p>
                  <p className='text-xs text-muted-foreground'>Expenses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Select
                value={vendor.status}
                onValueChange={(value) => handleStatusChange(value as VendorStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ACTIVE'>Active</SelectItem>
                  <SelectItem value='INACTIVE'>Inactive</SelectItem>
                  <SelectItem value='PENDING_APPROVAL'>Pending Approval</SelectItem>
                  <SelectItem value='SUSPENDED'>Suspended</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Insurance & Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Insurance</span>
                  {vendor.insuranceExpiry ? (
                    <span className='text-sm'>
                      Expires: {new Date(vendor.insuranceExpiry).toLocaleDateString()}
                    </span>
                  ) : (
                    <Badge variant='destructive'>Not on file</Badge>
                  )}
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>License</span>
                  {vendor.licenseExpiry ? (
                    <span className='text-sm'>
                      Expires: {new Date(vendor.licenseExpiry).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className='text-sm text-muted-foreground'>Not required</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Work Orders */}
      {vendor.maintenanceRequests && vendor.maintenanceRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Work Orders</CardTitle>
            <CardDescription>Latest jobs assigned to this vendor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {vendor.maintenanceRequests.slice(0, 10).map((request) => {
                const reqStatus = maintenanceStatusConfig[request.status] || maintenanceStatusConfig.SUBMITTED
                return (
                  <div key={request.id} className='flex items-center justify-between border-b pb-4 last:border-0'>
                    <div className='flex items-center gap-4'>
                      <div className='flex size-10 items-center justify-center rounded-lg bg-muted'>
                        <LuWrench className='size-5 text-muted-foreground' />
                      </div>
                      <div>
                        <Link
                          to='/app/maintenance/$workOrderId'
                          params={{ workOrderId: request.id }}
                          className='font-medium hover:underline'
                        >
                          {request.title}
                        </Link>
                        <p className='text-xs text-muted-foreground'>
                          {request.requestNumber} • Unit {request.unit.unitNumber} @ {request.unit.property.name}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Badge className={`text-xs ${reqStatus.className}`}>{reqStatus.label}</Badge>
                      <span className='text-xs text-muted-foreground'>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function VendorDetailPage() {
  return (
    <Suspense fallback={<VendorSkeleton />}>
      <VendorDetail />
    </Suspense>
  )
}
