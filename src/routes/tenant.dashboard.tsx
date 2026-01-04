'use client'

import { createFileRoute } from '@tanstack/react-router'
import { LuCircleAlert, LuCalendar, LuCreditCard, LuFileText, LuHouse, LuWrench } from 'react-icons/lu'
import { format } from 'date-fns'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { Typography } from '~/components/ui/typography'
import { Link } from '~/components/ui/link'
import { useTenantDashboardQuery } from '~/services/tenant-portal.query'

// Type for payment from API
interface Payment {
  id: string
  amount: number | { toString(): string }
  paymentDate: Date | string
  paymentMethod: string | null
  status: string
  referenceNumber: string | null
}

// Type for maintenance request from API
interface MaintenanceRequest {
  id: string
  title: string
  status: string
  priority: string
  createdAt: Date | string
}

export const Route = createFileRoute('/tenant/dashboard')({
  component: TenantDashboardPage,
})

function TenantDashboardPage() {
  const { data } = useTenantDashboardQuery()

  const { tenant, lease, balance, recentPayments, recentMaintenanceRequests, alerts } = data as {
    tenant: { firstName: string; lastName: string; email: string }
    lease: {
      leaseDocumentUrl?: string
      status: string
      startDate: Date | string
      endDate?: Date | string | null
      securityDeposit: number
      unit: {
        unitNumber: string
        property: {
          name: string
          address: string
          city: string
          state: string
          zipCode: string
        }
      }
    } | null
    balance: { current: number; nextPaymentDueDate: Date | string | null; monthlyRent: number }
    recentPayments: Payment[]
    recentMaintenanceRequests: MaintenanceRequest[]
    alerts: { hasOutstandingBalance: boolean; leaseExpiringSoon: boolean }
  }

  return (
    <div className='w-full max-w-7xl space-y-6'>
      {/* Page Header */}
      <div>
        <Typography.H1>Welcome back, {tenant.firstName}!</Typography.H1>
        <Typography.Muted>Here's an overview of your account</Typography.Muted>
      </div>

      {/* Account Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Summary</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Balance and Next Payment */}
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Typography.Muted>Current Balance</Typography.Muted>
              <Typography.H2 className='text-destructive'>
                ${balance.current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography.H2>
            </div>
            <div className='space-y-2'>
              <Typography.Muted>Next Payment Due</Typography.Muted>
              {balance.nextPaymentDueDate ? (
                <>
                  <Typography.H2>
                    {format(new Date(balance.nextPaymentDueDate), 'MMM d, yyyy')}
                  </Typography.H2>
                  <Typography.Muted>Amount: ${balance.monthlyRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography.Muted>
                </>
              ) : (
                <Typography.Muted>No payment due</Typography.Muted>
              )}
            </div>
          </div>

          {/* Unit Information */}
          {lease && (
            <>
              <Separator />
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Typography.Muted>Unit</Typography.Muted>
                  <Typography.H3>
                    {lease.unit.unitNumber} - {lease.unit.property.name}
                  </Typography.H3>
                  <Typography.Muted>
                    {lease.unit.property.address}, {lease.unit.property.city}, {lease.unit.property.state} {lease.unit.property.zipCode}
                  </Typography.Muted>
                </div>
                <div className='space-y-2'>
                  <Typography.Muted>Lease Status</Typography.Muted>
                  <div className='flex items-center gap-2'>
                    <Badge variant={lease.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {lease.status.replace('_', ' ')}
                    </Badge>
                    {lease.endDate && (
                      <Typography.Muted>
                        Expires {format(new Date(lease.endDate), 'MMM d, yyyy')}
                      </Typography.Muted>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Quick Actions */}
          <Separator />
          <div className='flex flex-wrap gap-2'>
            <Button asChild size='lg'>
              <Link to='/tenant/payments'>
                <LuCreditCard className='mr-2 size-4' />
                Pay Rent
              </Link>
            </Button>
            <Button asChild variant='outline' size='lg'>
              <Link to={'/tenant/maintenance' as '/app/maintenance'}>
                <LuWrench className='mr-2 size-4' />
                Submit Maintenance Request
              </Link>
            </Button>
            {lease?.leaseDocumentUrl && (
              <Button asChild variant='outline' size='lg'>
                <a href={lease.leaseDocumentUrl} target='_blank' rel='noopener noreferrer'>
                  <LuFileText className='mr-2 size-4' />
                  View Lease Document
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {(alerts.hasOutstandingBalance || alerts.leaseExpiringSoon) && (
        <Card className='border-yellow-500/20 bg-yellow-500/5'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <LuCircleAlert className='size-5 text-yellow-600' />
              Important Notices
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            {alerts.hasOutstandingBalance && (
              <div className='flex items-center justify-between'>
                <Typography.Muted>You have an outstanding balance</Typography.Muted>
                <Button asChild size='sm' variant='outline'>
                  <Link to='/tenant/payments'>Pay Now</Link>
                </Button>
              </div>
            )}
            {alerts.leaseExpiringSoon && lease && lease.endDate && (
              <Typography.Muted>
                Your lease expires on {format(new Date(lease.endDate), 'MMM d, yyyy')}. Please contact your property manager about renewal.
              </Typography.Muted>
            )}
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Payment History */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>Recent Payments</CardTitle>
              <Button asChild variant='ghost' size='sm'>
                <Link to={'/tenant/payments/history' as '/tenant/payments'}>View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentPayments.length > 0 ? (
              <div className='space-y-4'>
                {recentPayments.map((payment) => (
                  <div key={payment.id} className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <Typography.Small className='font-medium'>
                        {format(new Date(payment.paymentDate), 'MMM d, yyyy')}
                      </Typography.Small>
                      <Typography.Muted className='text-xs'>
                        {payment.paymentMethod || 'N/A'} • {payment.referenceNumber || 'No reference'}
                      </Typography.Muted>
                    </div>
                    <div className='text-right'>
                      <Typography.Small className='font-semibold'>
                        ${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography.Small>
                      <Badge variant={payment.status === 'COMPLETED' ? 'default' : 'secondary'} className='ml-2'>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Typography.Muted>No payment history</Typography.Muted>
            )}
          </CardContent>
        </Card>

        {/* Lease Information */}
        {lease && (
          <Card>
            <CardHeader>
              <CardTitle>Lease Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <Typography.Muted>Monthly Rent</Typography.Muted>
                  <Typography.Small className='font-semibold'>
                    ${balance.monthlyRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography.Small>
                </div>
                <div className='flex items-center justify-between'>
                  <Typography.Muted>Lease Start</Typography.Muted>
                  <Typography.Small>
                    {format(new Date(lease.startDate), 'MMM d, yyyy')}
                  </Typography.Small>
                </div>
                {lease.endDate && (
                  <div className='flex items-center justify-between'>
                    <Typography.Muted>Lease End</Typography.Muted>
                    <Typography.Small>
                      {format(new Date(lease.endDate), 'MMM d, yyyy')}
                    </Typography.Small>
                  </div>
                )}
                <div className='flex items-center justify-between'>
                  <Typography.Muted>Security Deposit</Typography.Muted>
                  <Typography.Small>
                    ${lease.securityDeposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography.Small>
                </div>
              </div>
              {lease.leaseDocumentUrl && (
                <>
                  <Separator />
                  <Button asChild variant='outline' className='w-full'>
                    <a href={lease.leaseDocumentUrl} target='_blank' rel='noopener noreferrer'>
                      <LuFileText className='mr-2 size-4' />
                      View Lease Document
                    </a>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Maintenance Requests */}
        <Card className={lease ? 'lg:col-span-2' : ''}>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>Recent Maintenance Requests</CardTitle>
              <Button asChild variant='ghost' size='sm'>
                <Link to={'/tenant/maintenance' as '/app/maintenance'}>View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentMaintenanceRequests.length > 0 ? (
              <div className='space-y-4'>
                {recentMaintenanceRequests.map((request) => (
                  <div key={request.id} className='flex items-start justify-between'>
                    <div className='space-y-1 flex-1'>
                      <Typography.Small className='font-medium'>{request.title}</Typography.Small>
                      <Typography.Muted className='text-xs'>
                        {format(new Date(request.createdAt), 'MMM d, yyyy')}
                      </Typography.Muted>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge variant={request.priority === 'HIGH' ? 'destructive' : request.priority === 'MEDIUM' ? 'default' : 'secondary'}>
                        {request.priority}
                      </Badge>
                      <Badge variant={request.status === 'COMPLETED' ? 'default' : 'outline'}>
                        {request.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Typography.Muted>No maintenance requests</Typography.Muted>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

