'use client'

import { createFileRoute } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import {
  LuArrowLeft,
  LuCalendar,
  LuCheck,
  LuClock,
  LuDollarSign,
  LuLoader2,
  LuMessageSquare,
  LuPhone,
  LuSend,
  LuUser,
  LuWrench,
} from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Textarea } from '~/components/ui/textarea'
import { Typography } from '~/components/ui/typography'
import { useToast } from '~/components/ui/use-toast'
import { MaintenancePhotoUpload } from '~/components/maintenance/photo-upload'

import {
  useMaintenanceRequestQuery,
  useUpdateMaintenanceRequest,
  useAddMaintenanceComment,
  maintenanceRequestQueryOptions,
} from '~/services/maintenance.query'
import { useVendorsQuery, vendorsQueryOptions } from '~/services/vendors.query'
import type { MaintenanceStatus } from '~/services/maintenance.schema'

export const Route = createFileRoute('/app/maintenance/$workOrderId')({
  loader: async ({ params, context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(maintenanceRequestQueryOptions(params.workOrderId)),
      context.queryClient.ensureQueryData(vendorsQueryOptions({ status: 'ACTIVE' })),
    ])
  },
  component: WorkOrderDetailPage,
})

// Config maps
const priorityConfig: Record<string, { label: string; variant: 'destructive' | 'secondary' | 'outline' | 'default' }> = {
  EMERGENCY: { label: 'Emergency', variant: 'destructive' },
  HIGH: { label: 'High', variant: 'destructive' },
  MEDIUM: { label: 'Medium', variant: 'secondary' },
  LOW: { label: 'Low', variant: 'outline' },
}

const statusConfig: Record<string, { label: string; className: string }> = {
  SUBMITTED: { label: 'Submitted', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
  ACKNOWLEDGED: { label: 'Acknowledged', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  SCHEDULED: { label: 'Scheduled', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  PENDING_PARTS: { label: 'Pending Parts', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  ON_HOLD: { label: 'On Hold', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
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

// Skeleton component
function WorkOrderSkeleton() {
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

// Work order detail component
function WorkOrderDetail() {
  const { workOrderId } = Route.useParams()
  const { toast } = useToast()

  const { data: workOrder } = useMaintenanceRequestQuery(workOrderId)
  const { data: vendorsData } = useVendorsQuery({ status: 'ACTIVE' })
  const updateMutation = useUpdateMaintenanceRequest()
  const commentMutation = useAddMaintenanceComment()

  const [newStatus, setNewStatus] = useState<MaintenanceStatus | ''>(workOrder.status as MaintenanceStatus)
  const [statusNote, setStatusNote] = useState('')
  const [newComment, setNewComment] = useState('')
  const [isInternalComment, setIsInternalComment] = useState(false)
  const [actualCost, setActualCost] = useState<string>(workOrder.actualCost?.toString() || '')
  const [selectedVendorId, setSelectedVendorId] = useState<string>(workOrder.vendorId || '')

  const priority = priorityConfig[workOrder.priority] || priorityConfig.MEDIUM
  const status = statusConfig[workOrder.status] || statusConfig.SUBMITTED

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === workOrder.status) {
      toast({
        title: 'No changes',
        description: 'Please select a different status',
      })
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: workOrderId,
        status: newStatus,
      })

      // Add a comment about the status change if there's a note
      if (statusNote.trim()) {
        await commentMutation.mutateAsync({
          requestId: workOrderId,
          content: `Status changed to ${statusConfig[newStatus]?.label || newStatus}: ${statusNote}`,
          isInternal: true,
        })
        setStatusNote('')
      }

      toast({
        title: 'Status Updated',
        description: `Work order status changed to ${statusConfig[newStatus]?.label || newStatus}`,
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      })
    }
  }

  const handleMarkComplete = async () => {
    try {
      const cost = actualCost ? parseFloat(actualCost) : undefined
      await updateMutation.mutateAsync({
        id: workOrderId,
        status: 'COMPLETED',
        actualCost: cost,
        completedAt: new Date(),
      })

      toast({
        title: 'Work Order Completed',
        description: 'The work order has been marked as complete',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to complete work order',
        variant: 'destructive',
      })
    }
  }

  const handleSaveCost = async () => {
    const cost = parseFloat(actualCost)
    if (isNaN(cost) || cost < 0) {
      toast({
        title: 'Invalid Cost',
        description: 'Please enter a valid cost amount',
        variant: 'destructive',
      })
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: workOrderId,
        actualCost: cost,
      })

      toast({
        title: 'Cost Saved',
        description: `Actual cost updated to $${cost.toFixed(2)}`,
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save cost',
        variant: 'destructive',
      })
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: 'Empty Comment',
        description: 'Please enter a comment',
        variant: 'destructive',
      })
      return
    }

    try {
      await commentMutation.mutateAsync({
        requestId: workOrderId,
        content: newComment,
        isInternal: isInternalComment,
      })

      setNewComment('')
      toast({
        title: 'Comment Added',
        description: 'Your comment has been added',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      })
    }
  }

  const handleAssignVendor = async () => {
    if (!selectedVendorId) {
      // Clear vendor assignment
      try {
        await updateMutation.mutateAsync({
          id: workOrderId,
          vendorId: undefined,
        })
        toast({
          title: 'Vendor Removed',
          description: 'Vendor assignment has been cleared',
        })
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to remove vendor',
          variant: 'destructive',
        })
      }
      return
    }

    if (selectedVendorId === workOrder.vendorId) {
      toast({
        title: 'No changes',
        description: 'This vendor is already assigned',
      })
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: workOrderId,
        vendorId: selectedVendorId,
      })

      const vendor = vendorsData?.vendors.find(v => v.id === selectedVendorId)
      toast({
        title: 'Vendor Assigned',
        description: `${vendor?.companyName || 'Vendor'} has been assigned to this work order`,
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to assign vendor',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Back Button & Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/app/maintenance'>
            <LuArrowLeft className='size-4' />
          </Link>
        </Button>
        <div className='flex-1'>
          <div className='flex items-center gap-3'>
            <Typography.H2>Work Order {workOrder.requestNumber}</Typography.H2>
            <Badge variant={priority.variant}>{priority.label}</Badge>
            <Badge className={status.className}>{status.label}</Badge>
          </div>
          <Typography.Muted>
            Unit {workOrder.unit.unitNumber} • {workOrder.unit.property.name}
          </Typography.Muted>
        </div>
        <div className='flex gap-2'>
          {workOrder.vendor?.phone && (
            <Button variant='outline' asChild>
              <a href={`tel:${workOrder.vendor.phone}`}>
                <LuPhone className='mr-2 size-4' />
                Call Vendor
              </a>
            </Button>
          )}
          {workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELLED' && (
            <Button onClick={handleMarkComplete} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <LuLoader2 className='mr-2 size-4 animate-spin' />
              ) : (
                <LuCheck className='mr-2 size-4' />
              )}
              Mark Complete
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Work Order Details */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>{workOrder.title}</CardTitle>
            <CardDescription>
              Submitted on {new Date(workOrder.createdAt).toLocaleDateString()} at{' '}
              {new Date(workOrder.createdAt).toLocaleTimeString()}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Description */}
            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>Description</h4>
              <p className='text-sm text-muted-foreground'>{workOrder.description}</p>
            </div>

            <Separator />

            {/* Details Grid */}
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>Category</p>
                <p className='font-medium'>{categoryLabels[workOrder.category] || workOrder.category}</p>
              </div>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>Priority</p>
                <Badge variant={priority.variant}>{priority.label}</Badge>
              </div>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>Estimated Cost</p>
                <p className='font-medium'>
                  {workOrder.estimatedCost ? `$${Number(workOrder.estimatedCost).toFixed(2)}` : 'Not set'}
                </p>
              </div>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>Access Permission</p>
                <p className='font-medium'>{workOrder.permissionToEnter ? 'Yes' : 'No'}</p>
              </div>
              {workOrder.scheduledDate && (
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground'>Scheduled Date</p>
                  <p className='font-medium flex items-center gap-2'>
                    <LuCalendar className='size-4' />
                    {new Date(workOrder.scheduledDate).toLocaleDateString()}
                    {workOrder.scheduledTime && ` at ${workOrder.scheduledTime}`}
                  </p>
                </div>
              )}
              {workOrder.completedAt && (
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground'>Completed</p>
                  <p className='font-medium text-green-600'>
                    {new Date(workOrder.completedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Tenant Info */}
            {workOrder.tenant && (
              <>
                <div className='space-y-3'>
                  <h4 className='text-sm font-medium flex items-center gap-2'>
                    <LuUser className='size-4' />
                    Tenant Information
                  </h4>
                  <div className='rounded-lg bg-muted p-4'>
                    <p className='font-medium'>
                      {workOrder.tenant.firstName} {workOrder.tenant.lastName}
                    </p>
                    <p className='text-sm text-muted-foreground'>Unit {workOrder.unit.unitNumber}</p>
                    <div className='mt-2 flex gap-4'>
                      {workOrder.tenant.phone && (
                        <Button variant='outline' size='sm' asChild>
                          <a href={`tel:${workOrder.tenant.phone}`}>
                            <LuPhone className='mr-2 size-4' />
                            {workOrder.tenant.phone}
                          </a>
                        </Button>
                      )}
                      <Button variant='outline' size='sm' asChild>
                        <Link to='/app/communications'>
                          <LuMessageSquare className='mr-2 size-4' />
                          Message
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* Vendor Info */}
            {workOrder.vendor && (
              <>
                <div className='space-y-3'>
                  <h4 className='text-sm font-medium flex items-center gap-2'>
                    <LuWrench className='size-4' />
                    Assigned Vendor
                  </h4>
                  <div className='rounded-lg bg-muted p-4'>
                    <p className='font-medium'>{workOrder.vendor.companyName}</p>
                    <p className='text-sm text-muted-foreground'>
                      Contact: {workOrder.vendor.phone}
                    </p>
                    <Button variant='outline' size='sm' className='mt-2' asChild>
                      <a href={`tel:${workOrder.vendor.phone}`}>
                        <LuPhone className='mr-2 size-4' />
                        {workOrder.vendor.phone}
                      </a>
                    </Button>
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* Comments Section */}
            <div className='space-y-4'>
              <h4 className='text-sm font-medium flex items-center gap-2'>
                <LuMessageSquare className='size-4' />
                Comments & Notes ({workOrder.comments?.length || 0})
              </h4>

              {/* Existing Comments */}
              {workOrder.comments && workOrder.comments.length > 0 && (
                <div className='space-y-3'>
                  {workOrder.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`rounded-lg p-3 ${
                        comment.isInternal ? 'bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800' : 'bg-muted'
                      }`}
                    >
                      <div className='flex items-center justify-between'>
                        <p className='text-sm font-medium'>
                          {comment.authorName}
                          {comment.isInternal && (
                            <span className='ml-2 text-xs text-amber-600'>(Internal)</span>
                          )}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <p className='mt-1 text-sm'>{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Form */}
              <div className='space-y-3'>
                <Textarea
                  placeholder='Add a comment...'
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className='min-h-20'
                />
                <div className='flex items-center justify-between'>
                  <label className='flex items-center gap-2 text-sm'>
                    <input
                      type='checkbox'
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className='rounded'
                    />
                    Internal note (not visible to tenant)
                  </label>
                  <Button
                    size='sm'
                    onClick={handleAddComment}
                    disabled={commentMutation.isPending || !newComment.trim()}
                  >
                    {commentMutation.isPending ? (
                      <LuLoader2 className='mr-2 size-4 animate-spin' />
                    ) : (
                      <LuSend className='mr-2 size-4' />
                    )}
                    Add Comment
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Update Status */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Status</Label>
                <Select
                  value={newStatus}
                  onValueChange={(value) => setNewStatus(value as MaintenanceStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='SUBMITTED'>Submitted</SelectItem>
                    <SelectItem value='ACKNOWLEDGED'>Acknowledged</SelectItem>
                    <SelectItem value='SCHEDULED'>Scheduled</SelectItem>
                    <SelectItem value='IN_PROGRESS'>In Progress</SelectItem>
                    <SelectItem value='PENDING_PARTS'>Pending Parts</SelectItem>
                    <SelectItem value='ON_HOLD'>On Hold</SelectItem>
                    <SelectItem value='COMPLETED'>Completed</SelectItem>
                    <SelectItem value='CANCELLED'>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Status Note (optional)</Label>
                <Textarea
                  placeholder='Add notes about this update...'
                  className='min-h-20'
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                />
              </div>
              <Button
                className='w-full'
                onClick={handleStatusUpdate}
                disabled={updateMutation.isPending || newStatus === workOrder.status}
              >
                {updateMutation.isPending && <LuLoader2 className='mr-2 size-4 animate-spin' />}
                Update Status
              </Button>
            </CardContent>
          </Card>

          {/* Assign Vendor */}
          <Card>
            <CardHeader>
              <CardTitle>Assign Vendor</CardTitle>
              <CardDescription>Assign a vendor to handle this work order</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Vendor</Label>
                <Select
                  value={selectedVendorId}
                  onValueChange={setSelectedVendorId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a vendor' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=''>No vendor assigned</SelectItem>
                    {vendorsData?.vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {workOrder.vendor && (
                <div className='rounded-lg bg-muted p-3 text-sm'>
                  <p className='font-medium'>{workOrder.vendor.companyName}</p>
                  <p className='text-muted-foreground'>{workOrder.vendor.phone}</p>
                </div>
              )}
              <Button
                className='w-full'
                variant='outline'
                onClick={handleAssignVendor}
                disabled={updateMutation.isPending || selectedVendorId === (workOrder.vendorId || '')}
              >
                {updateMutation.isPending && <LuLoader2 className='mr-2 size-4 animate-spin' />}
                <LuWrench className='mr-2 size-4' />
                {selectedVendorId ? 'Update Assignment' : 'Remove Vendor'}
              </Button>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>Attach photos of the issue or completed work</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue='issue' className='w-full'>
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='issue'>Issue Photos</TabsTrigger>
                  <TabsTrigger value='completion'>Completion</TabsTrigger>
                </TabsList>
                <TabsContent value='issue' className='mt-4'>
                  <MaintenancePhotoUpload
                    requestId={workOrderId}
                    photoType='initial'
                    existingPhotos={workOrder.photoUrls || []}
                    onSuccess={() => {
                      toast({
                        title: 'Photo Uploaded',
                        description: 'Issue photo has been added successfully',
                      })
                    }}
                    onError={(error) => {
                      toast({
                        title: 'Upload Failed',
                        description: error.message,
                        variant: 'destructive',
                      })
                    }}
                  />
                </TabsContent>
                <TabsContent value='completion' className='mt-4'>
                  <MaintenancePhotoUpload
                    requestId={workOrderId}
                    photoType='completion'
                    completionPhotos={workOrder.completionPhotos || []}
                    onSuccess={() => {
                      toast({
                        title: 'Photo Uploaded',
                        description: 'Completion photo has been added successfully',
                      })
                    }}
                    onError={(error) => {
                      toast({
                        title: 'Upload Failed',
                        description: error.message,
                        variant: 'destructive',
                      })
                    }}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Record Cost */}
          <Card>
            <CardHeader>
              <CardTitle>Record Cost</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Estimated</span>
                  <span>
                    {workOrder.estimatedCost ? `$${Number(workOrder.estimatedCost).toFixed(2)}` : '-'}
                  </span>
                </div>
                {workOrder.actualCost && (
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Current Actual</span>
                    <span className='font-medium'>${Number(workOrder.actualCost).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className='space-y-2'>
                  <Label>Actual Cost</Label>
                  <div className='flex items-center gap-2'>
                    <LuDollarSign className='size-4 text-muted-foreground' />
                    <Input
                      type='number'
                      placeholder='0.00'
                      value={actualCost}
                      onChange={(e) => setActualCost(e.target.value)}
                      step='0.01'
                      min='0'
                    />
                  </div>
                </div>
              </div>
              <Button
                variant='outline'
                className='w-full'
                onClick={handleSaveCost}
                disabled={updateMutation.isPending || !actualCost}
              >
                {updateMutation.isPending && <LuLoader2 className='mr-2 size-4 animate-spin' />}
                Save Cost
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status History */}
      {workOrder.statusHistory && workOrder.statusHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Status History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {workOrder.statusHistory.map((entry, i) => (
                <div key={entry.id || i} className='flex items-start gap-4'>
                  <div className='mt-1'>
                    <div className='size-2 rounded-full bg-primary' />
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium'>
                        {entry.fromStatus ? `${statusConfig[entry.fromStatus]?.label || entry.fromStatus} → ` : ''}
                        {statusConfig[entry.toStatus]?.label || entry.toStatus}
                      </span>
                      <span className='text-sm text-muted-foreground flex items-center gap-1'>
                        <LuClock className='size-3' />
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      By {entry.changedByName} ({entry.changedByType})
                    </p>
                    {entry.notes && (
                      <p className='text-sm text-muted-foreground mt-1'>{entry.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function WorkOrderDetailPage() {
  return (
    <Suspense fallback={<WorkOrderSkeleton />}>
      <WorkOrderDetail />
    </Suspense>
  )
}
