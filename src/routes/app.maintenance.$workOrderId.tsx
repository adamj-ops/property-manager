'use client'

import { createFileRoute } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import {
  LuArrowLeft,
  LuCalendar,
  LuCheck,
  LuClock,
  LuDollarSign,
  LuLoaderCircle,
  LuMessageSquare,
  LuPaperclip,
  LuPhone,
  LuSend,
  LuTriangleAlert,
  LuUser,
  LuUserCog,
  LuWrench,
  LuX,
  LuFile,
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
import { toast } from 'sonner'
import { MaintenancePhotoUpload } from '~/components/maintenance/photo-upload'
import { CostBreakdownCard } from '~/components/maintenance/cost-breakdown-card'
import { CostLineItemsTable } from '~/components/maintenance/cost-line-items-table'

import {
  useMaintenanceRequestQuery,
  useUpdateMaintenanceRequest,
  useAddMaintenanceCommentWithAttachments,
  maintenanceRequestQueryOptions,
  useAcknowledgeEscalation,
  useTeamMembersQuery,
  teamMembersQueryOptions,
  useCommentAttachmentUpload,
} from '~/services/maintenance.query'
import { useVendorsQuery, vendorsQueryOptions } from '~/services/vendors.query'
import type { MaintenanceStatus } from '~/services/maintenance.schema'

export const Route = createFileRoute('/app/maintenance/$workOrderId')({
  loader: async ({ params, context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(maintenanceRequestQueryOptions(params.workOrderId)),
      context.queryClient.ensureQueryData(vendorsQueryOptions({ status: 'ACTIVE' })),
      context.queryClient.ensureQueryData(teamMembersQueryOptions()),
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

  const { data: workOrder } = useMaintenanceRequestQuery(workOrderId)
  const { data: vendorsData } = useVendorsQuery({ status: 'ACTIVE' })
  const { data: teamData } = useTeamMembersQuery()
  const updateMutation = useUpdateMaintenanceRequest()
  const commentMutation = useAddMaintenanceCommentWithAttachments()
  const acknowledgeMutation = useAcknowledgeEscalation()
  const attachmentUpload = useCommentAttachmentUpload()

  const [newStatus, setNewStatus] = useState<MaintenanceStatus | ''>(workOrder.status as MaintenanceStatus)
  const [statusNote, setStatusNote] = useState('')
  const [newComment, setNewComment] = useState('')
  const [isInternalComment, setIsInternalComment] = useState(false)
  const [selectedVendorId, setSelectedVendorId] = useState<string>(workOrder.vendorId || '')
  const [selectedStaffId, setSelectedStaffId] = useState<string>(workOrder.assignedToId || '')
  const [commentAttachments, setCommentAttachments] = useState<File[]>([])
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false)

  const priority = priorityConfig[workOrder.priority] || priorityConfig.MEDIUM
  const status = statusConfig[workOrder.status] || statusConfig.SUBMITTED

  // Check if this is an unacknowledged emergency
  const isUnacknowledgedEmergency =
    workOrder.priority === 'EMERGENCY' &&
    (workOrder as { escalationLevel?: number }).escalationLevel &&
    (workOrder as { escalationLevel?: number }).escalationLevel! > 0 &&
    !(workOrder as { escalationAcknowledgedAt?: Date | null }).escalationAcknowledgedAt

  const handleAcknowledgeEscalation = async () => {
    try {
      await acknowledgeMutation.mutateAsync(workOrderId)
      toast.success('Emergency Acknowledged', {
        description: 'The escalation has been acknowledged. Please take action.',
      })
    } catch {
      toast.error('Error', {
        description: 'Failed to acknowledge escalation',
      })
    }
  }

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === workOrder.status) {
      toast('No changes', {
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

      toast.success('Status Updated', {
        description: `Work order status changed to ${statusConfig[newStatus]?.label || newStatus}`,
      })
    } catch {
      toast.error('Error', {
        description: 'Failed to update status',
      })
    }
  }

  const handleMarkComplete = async () => {
    try {
      await updateMutation.mutateAsync({
        id: workOrderId,
        status: 'COMPLETED',
        completedAt: new Date(),
      })

      toast.success('Work Order Completed', {
        description: 'The work order has been marked as complete',
      })
    } catch {
      toast.error('Error', {
        description: 'Failed to complete work order',
      })
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() && commentAttachments.length === 0) {
      toast.error('Empty Comment', {
        description: 'Please enter a comment or attach files',
      })
      return
    }

    try {
      setIsUploadingAttachments(true)

      // Upload attachments first if any
      let attachmentPaths: string[] = []
      if (commentAttachments.length > 0) {
        attachmentPaths = await Promise.all(
          commentAttachments.map(file => attachmentUpload.uploadAttachment(file, workOrderId))
        )
      }

      await commentMutation.mutateAsync({
        requestId: workOrderId,
        content: newComment || 'Attached files',
        isInternal: isInternalComment,
        attachments: attachmentPaths.length > 0 ? attachmentPaths : undefined,
      })

      setNewComment('')
      setCommentAttachments([])
      toast.success('Comment Added', {
        description: attachmentPaths.length > 0
          ? `Your comment with ${attachmentPaths.length} attachment(s) has been added`
          : 'Your comment has been added',
      })
    } catch {
      toast.error('Error', {
        description: 'Failed to add comment',
      })
    } finally {
      setIsUploadingAttachments(false)
    }
  }

  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setCommentAttachments(prev => [...prev, ...files])
    e.target.value = '' // Reset input
  }

  const removeAttachment = (index: number) => {
    setCommentAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleAssignVendor = async () => {
    if (!selectedVendorId) {
      // Clear vendor assignment
      try {
        await updateMutation.mutateAsync({
          id: workOrderId,
          vendorId: undefined,
        })
        toast.success('Vendor Removed', {
          description: 'Vendor assignment has been cleared',
        })
      } catch {
        toast.error('Error', {
          description: 'Failed to remove vendor',
        })
      }
      return
    }

    if (selectedVendorId === workOrder.vendorId) {
      toast('No changes', {
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
      toast.success('Vendor Assigned', {
        description: `${vendor?.companyName || 'Vendor'} has been assigned to this work order`,
      })
    } catch {
      toast.error('Error', {
        description: 'Failed to assign vendor',
      })
    }
  }

  const handleAssignStaff = async () => {
    if (!selectedStaffId) {
      // Clear staff assignment
      try {
        await updateMutation.mutateAsync({
          id: workOrderId,
          assignedToId: undefined,
        })
        toast.success('Staff Removed', {
          description: 'Staff assignment has been cleared',
        })
      } catch {
        toast.error('Error', {
          description: 'Failed to remove staff assignment',
        })
      }
      return
    }

    if (selectedStaffId === workOrder.assignedToId) {
      toast('No changes', {
        description: 'This staff member is already assigned',
      })
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: workOrderId,
        assignedToId: selectedStaffId,
      })

      const staff = teamData?.staff.find(s => s.id === selectedStaffId)
      toast.success('Staff Assigned', {
        description: `${staff?.name || 'Staff member'} has been assigned to this work order`,
      })
    } catch {
      toast.error('Error', {
        description: 'Failed to assign staff',
      })
    }
  }

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Emergency Acknowledgement Banner */}
      {isUnacknowledgedEmergency && (
        <div className='relative overflow-hidden rounded-lg bg-red-500 px-4 py-3 text-white shadow-lg'>
          <div className='absolute inset-0 animate-pulse bg-red-400 opacity-30' />
          <div className='relative flex items-center justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <div className='flex size-10 items-center justify-center rounded-full bg-white/20'>
                <LuTriangleAlert className='size-5' />
              </div>
              <div>
                <p className='text-sm font-bold uppercase tracking-wide'>
                  Emergency - Requires Immediate Attention
                </p>
                <p className='text-sm opacity-90'>
                  This work order has been escalated and needs your acknowledgement.
                </p>
              </div>
            </div>
            <Button
              variant='secondary'
              size='sm'
              className='shrink-0 bg-white/20 text-white hover:bg-white/30'
              onClick={handleAcknowledgeEscalation}
              disabled={acknowledgeMutation.isPending}
            >
              {acknowledgeMutation.isPending ? (
                <LuLoaderCircle className='mr-1.5 size-4 animate-spin' />
              ) : (
                <LuCheck className='mr-1.5 size-4' />
              )}
              Acknowledge Emergency
            </Button>
          </div>
        </div>
      )}

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
                <LuLoaderCircle className='mr-2 size-4 animate-spin' />
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
                      {/* Display attachments */}
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className='mt-2 flex flex-wrap gap-2'>
                          {comment.attachments.map((attachment, idx) => {
                            const fileName = attachment.split('/').pop() || 'Attachment'
                            return (
                              <a
                                key={idx}
                                href='#'
                                className='flex items-center gap-1 rounded-md bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground border'
                                onClick={(e) => {
                                  e.preventDefault()
                                  // In a full implementation, this would fetch the signed URL
                                  toast.info('Opening attachment...', { description: fileName })
                                }}
                              >
                                <LuPaperclip className='size-3' />
                                <span className='max-w-24 truncate'>{fileName}</span>
                              </a>
                            )
                          })}
                        </div>
                      )}
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

                {/* Attachment Preview */}
                {commentAttachments.length > 0 && (
                  <div className='flex flex-wrap gap-2'>
                    {commentAttachments.map((file, index) => (
                      <div
                        key={index}
                        className='flex items-center gap-2 rounded-md bg-muted px-2 py-1 text-sm'
                      >
                        <LuFile className='size-4 text-muted-foreground' />
                        <span className='max-w-32 truncate'>{file.name}</span>
                        <button
                          type='button'
                          onClick={() => removeAttachment(index)}
                          className='text-muted-foreground hover:text-destructive'
                        >
                          <LuX className='size-4' />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <label className='flex items-center gap-2 text-sm'>
                      <input
                        type='checkbox'
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                        className='rounded'
                      />
                      Internal note (not visible to tenant)
                    </label>
                    <label className='flex cursor-pointer items-center gap-1 text-sm text-muted-foreground hover:text-foreground'>
                      <LuPaperclip className='size-4' />
                      <span>Attach</span>
                      <input
                        type='file'
                        multiple
                        accept='image/*,.pdf,.doc,.docx,.txt'
                        onChange={handleAttachmentSelect}
                        className='hidden'
                      />
                    </label>
                  </div>
                  <Button
                    size='sm'
                    onClick={handleAddComment}
                    disabled={commentMutation.isPending || isUploadingAttachments || (!newComment.trim() && commentAttachments.length === 0)}
                  >
                    {(commentMutation.isPending || isUploadingAttachments) ? (
                      <LuLoaderCircle className='mr-2 size-4 animate-spin' />
                    ) : (
                      <LuSend className='mr-2 size-4' />
                    )}
                    {isUploadingAttachments ? 'Uploading...' : 'Add Comment'}
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
                {updateMutation.isPending && <LuLoaderCircle className='mr-2 size-4 animate-spin' />}
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
                {updateMutation.isPending && <LuLoaderCircle className='mr-2 size-4 animate-spin' />}
                <LuWrench className='mr-2 size-4' />
                {selectedVendorId ? 'Update Assignment' : 'Remove Vendor'}
              </Button>
            </CardContent>
          </Card>

          {/* Assign Staff */}
          <Card>
            <CardHeader>
              <CardTitle>Assign Staff</CardTitle>
              <CardDescription>Assign a team member to manage this work order</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Staff Member</Label>
                <Select
                  value={selectedStaffId}
                  onValueChange={setSelectedStaffId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a staff member' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=''>Unassigned</SelectItem>
                    {teamData?.staff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        <div className='flex items-center gap-2'>
                          <span>{staff.name}</span>
                          <span className='text-xs text-muted-foreground'>({staff.role})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {workOrder.assignedTo && (
                <div className='rounded-lg bg-muted p-3 text-sm'>
                  <p className='font-medium'>{workOrder.assignedTo.name}</p>
                  <p className='text-muted-foreground'>Currently assigned</p>
                </div>
              )}
              <Button
                className='w-full'
                variant='outline'
                onClick={handleAssignStaff}
                disabled={updateMutation.isPending || selectedStaffId === (workOrder.assignedToId || '')}
              >
                {updateMutation.isPending && <LuLoaderCircle className='mr-2 size-4 animate-spin' />}
                <LuUserCog className='mr-2 size-4' />
                {selectedStaffId ? 'Update Assignment' : 'Remove Staff'}
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
                      toast.success('Photo Uploaded', {
                        description: 'Issue photo has been added successfully',
                      })
                    }}
                    onError={(error) => {
                      toast.error('Upload Failed', {
                        description: error.message,
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
                      toast.success('Photo Uploaded', {
                        description: 'Completion photo has been added successfully',
                      })
                    }}
                    onError={(error) => {
                      toast.error('Upload Failed', {
                        description: error.message,
                      })
                    }}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Cost Summary */}
          <CostBreakdownCard requestId={workOrderId} />
        </div>
      </div>

      {/* Cost Details */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <LuDollarSign className='size-5' />
            Cost Details
          </CardTitle>
          <CardDescription>
            Manage labor, parts, materials, and other costs for this work order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CostLineItemsTable requestId={workOrderId} />
        </CardContent>
      </Card>

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
