'use client'

import { createFileRoute, Link } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import { format } from 'date-fns'
import {
  LuAlertCircle,
  LuAlertTriangle,
  LuArrowLeft,
  LuCheckCircle,
  LuDollarSign,
  LuEdit,
  LuLoader2,
  LuRefreshCw,
  LuTrash2,
  LuXCircle,
} from 'react-icons/lu'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import { Typography } from '~/components/ui/typography'
import { Progress } from '~/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'

import {
  useBudgetQuery,
  useDeleteBudget,
  useRecalculateBudgetSpending,
  useAcknowledgeBudgetAlert,
  budgetQueryOptions,
} from '~/services/maintenance-budget.query'
import { BudgetForm } from '~/components/maintenance/BudgetForm'
import { useToast } from '~/hooks/use-toast'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/app/maintenance/budgets/$budgetId')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(budgetQueryOptions(params.budgetId))
  },
  component: BudgetDetailPage,
})

function BudgetDetailSkeleton() {
  return (
    <div className='w-full space-y-6 py-6'>
      <div className='flex items-center gap-4'>
        <Skeleton className='size-10' />
        <Skeleton className='h-8 w-64' />
      </div>
      <div className='grid gap-4 md:grid-cols-4'>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className='h-32' />
        ))}
      </div>
      <Skeleton className='h-64' />
      <Skeleton className='h-96' />
    </div>
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function getStatusColor(status: string) {
  switch (status) {
    case 'healthy':
      return 'text-green-600 bg-green-50'
    case 'warning':
      return 'text-yellow-600 bg-yellow-50'
    case 'critical':
      return 'text-orange-600 bg-orange-50'
    case 'exceeded':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

function getProgressColor(status: string) {
  switch (status) {
    case 'healthy':
      return 'bg-green-500'
    case 'warning':
      return 'bg-yellow-500'
    case 'critical':
      return 'bg-orange-500'
    case 'exceeded':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'healthy':
      return <LuCheckCircle className='size-5 text-green-600' />
    case 'warning':
      return <LuAlertTriangle className='size-5 text-yellow-600' />
    case 'critical':
      return <LuAlertCircle className='size-5 text-orange-600' />
    case 'exceeded':
      return <LuXCircle className='size-5 text-red-600' />
    default:
      return null
  }
}

function BudgetDetailContent() {
  const { budgetId } = Route.useParams()
  const { data: budget } = useBudgetQuery(budgetId)
  const deleteBudget = useDeleteBudget()
  const recalculate = useRecalculateBudgetSpending()
  const acknowledgeAlert = useAcknowledgeBudgetAlert()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [isEditOpen, setIsEditOpen] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteBudget.mutateAsync(budgetId)
      toast({
        title: 'Budget deactivated',
        description: 'The budget has been deactivated.',
      })
      navigate({ to: '/app/maintenance/budgets' })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to deactivate budget',
        variant: 'destructive',
      })
    }
  }

  const handleRecalculate = async () => {
    try {
      await recalculate.mutateAsync(budgetId)
      toast({
        title: 'Budget recalculated',
        description: 'Spending amounts have been updated.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to recalculate budget',
        variant: 'destructive',
      })
    }
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeAlert.mutateAsync(alertId)
      toast({ title: 'Alert acknowledged' })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to acknowledge alert',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className='w-full space-y-6 py-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-4'>
          <Link to='/app/maintenance/budgets'>
            <Button variant='ghost' size='icon'>
              <LuArrowLeft className='size-5' />
            </Button>
          </Link>
          <div>
            <div className='flex items-center gap-3'>
              <Typography.H2>{budget.property.name}</Typography.H2>
              <Badge className={getStatusColor(budget.status)}>
                <StatusIcon status={budget.status} />
                <span className='ml-1 capitalize'>{budget.status}</span>
              </Badge>
            </div>
            <Typography.Muted>
              {budget.categoryLabel} • {budget.period.charAt(0) + budget.period.slice(1).toLowerCase()} {budget.fiscalYear}
            </Typography.Muted>
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button variant='outline' onClick={handleRecalculate} disabled={recalculate.isPending}>
            {recalculate.isPending ? (
              <LuLoader2 className='mr-2 size-4 animate-spin' />
            ) : (
              <LuRefreshCw className='mr-2 size-4' />
            )}
            Recalculate
          </Button>
          <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
            <SheetTrigger asChild>
              <Button variant='outline'>
                <LuEdit className='mr-2 size-4' />
                Edit
              </Button>
            </SheetTrigger>
            <SheetContent className='sm:max-w-lg'>
              <SheetHeader>
                <SheetTitle>Edit Budget</SheetTitle>
                <SheetDescription>Update budget amount and alert thresholds.</SheetDescription>
              </SheetHeader>
              <div className='mt-6'>
                <BudgetForm
                  budget={{
                    id: budget.id,
                    propertyId: budget.propertyId,
                    category: budget.category as any,
                    budgetAmount: budget.budgetAmount,
                    period: budget.period as any,
                    fiscalYear: budget.fiscalYear,
                    warningThreshold: budget.warningThreshold,
                    criticalThreshold: budget.criticalThreshold,
                    notes: budget.notes,
                  }}
                  onSuccess={() => setIsEditOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant='destructive'>
                <LuTrash2 className='mr-2 size-4' />
                Deactivate
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate Budget?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will deactivate the budget. Historical data will be preserved. You can
                  reactivate it later if needed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Deactivate</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Budget Amount</CardTitle>
            <LuDollarSign className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatCurrency(budget.budgetAmount)}</div>
            <p className='text-xs text-muted-foreground'>
              {format(new Date(budget.startDate), 'MMM d')} - {format(new Date(budget.endDate), 'MMM d, yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatCurrency(budget.spentAmount)}</div>
            <div className='mt-2'>
              <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                <div
                  className={`h-full transition-all ${getProgressColor(budget.status)}`}
                  style={{ width: `${Math.min(budget.spentPercent, 100)}%` }}
                />
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>
                {budget.spentPercent.toFixed(1)}% of budget used
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Committed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-muted-foreground'>
              {formatCurrency(budget.committedAmount)}
            </div>
            <p className='text-xs text-muted-foreground'>In-progress work orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${budget.remainingAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {formatCurrency(budget.remainingAmount)}
            </div>
            <p className='text-xs text-muted-foreground'>
              {budget.remainingAmount >= 0 ? 'Available to spend' : 'Over budget'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Thresholds</CardTitle>
          <CardDescription>Notification triggers when spending reaches these levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-6'>
            <div className='flex items-center gap-3'>
              <div className='rounded-full bg-yellow-100 p-2'>
                <LuAlertTriangle className='size-4 text-yellow-600' />
              </div>
              <div>
                <p className='text-sm font-medium'>Warning</p>
                <p className='text-2xl font-bold text-yellow-600'>{budget.warningThreshold}%</p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <div className='rounded-full bg-orange-100 p-2'>
                <LuAlertCircle className='size-4 text-orange-600' />
              </div>
              <div>
                <p className='text-sm font-medium'>Critical</p>
                <p className='text-2xl font-bold text-orange-600'>{budget.criticalThreshold}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert History */}
      {budget.alerts && budget.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alert History</CardTitle>
            <CardDescription>Recent budget alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {budget.alerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className='flex items-center justify-between rounded-lg border p-3'
                >
                  <div className='flex items-center gap-3'>
                    {alert.alertType === 'WARNING' && (
                      <LuAlertTriangle className='size-5 text-yellow-600' />
                    )}
                    {alert.alertType === 'CRITICAL' && (
                      <LuAlertCircle className='size-5 text-orange-600' />
                    )}
                    {alert.alertType === 'EXCEEDED' && (
                      <LuXCircle className='size-5 text-red-600' />
                    )}
                    <div>
                      <p className='text-sm font-medium'>{alert.message}</p>
                      <p className='text-xs text-muted-foreground'>
                        {format(new Date(alert.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  {alert.acknowledgedAt ? (
                    <Badge variant='outline' className='text-green-600'>
                      Acknowledged
                    </Badge>
                  ) : (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Work Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Related Work Orders</CardTitle>
          <CardDescription>Work orders contributing to this budget</CardDescription>
        </CardHeader>
        <CardContent>
          {budget.workOrders && budget.workOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Estimated</TableHead>
                  <TableHead className='text-right'>Actual</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budget.workOrders.map((wo: any) => (
                  <TableRow key={wo.id}>
                    <TableCell>
                      <Link
                        to='/app/maintenance/$workOrderId'
                        params={{ workOrderId: wo.id }}
                        className='font-medium text-primary hover:underline'
                      >
                        {wo.requestNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{wo.title}</TableCell>
                    <TableCell>
                      <Badge variant='outline'>{wo.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      {wo.estimatedCost > 0 ? formatCurrency(wo.estimatedCost) : '-'}
                    </TableCell>
                    <TableCell className='text-right font-medium'>
                      {wo.actualCost > 0 ? formatCurrency(wo.actualCost) : '-'}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {format(new Date(wo.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <LuDollarSign className='mb-4 size-10 text-muted-foreground/50' />
              <Typography.Muted>No work orders yet for this budget period.</Typography.Muted>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {budget.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>{budget.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function BudgetDetailPage() {
  return (
    <Suspense fallback={<BudgetDetailSkeleton />}>
      <BudgetDetailContent />
    </Suspense>
  )
}
