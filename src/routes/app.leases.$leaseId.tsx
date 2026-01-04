import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  LuArrowLeft,
  LuCalendar,
  LuDollarSign,
  LuDownload,
  LuFileText,
  LuLoaderCircle,
  LuPencil,
  LuRefreshCw,
  LuUser,
} from 'react-icons/lu'

import { DocumentGenerator } from '~/components/leases/document-generator'
import { RenewalWizard } from '~/components/leases/renewal-wizard'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Link } from '~/components/ui/link'
import { Separator } from '~/components/ui/separator'
import { Typography } from '~/components/ui/typography'
import { leaseQueryOptions } from '~/services/leases.query'

export const Route = createFileRoute('/app/leases/$leaseId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(leaseQueryOptions(params.leaseId)),
  pendingComponent: LeaseDetailLoading,
  errorComponent: LeaseDetailError,
  component: LeaseDetailPage,
})

function LeaseDetailLoading() {
  return (
    <div className='flex h-96 w-full items-center justify-center'>
      <LuLoaderCircle className='size-8 animate-spin text-muted-foreground' />
    </div>
  )
}

function LeaseDetailError() {
  return (
    <div className='w-full max-w-7xl py-6'>
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-12'>
          <Typography.H3>Lease Not Found</Typography.H3>
          <Typography.Muted className='mt-2'>
            The lease you're looking for doesn't exist or you don't have access.
          </Typography.Muted>
          <Button variant='outline' className='mt-4' asChild>
            <Link to='/app/leases'>
              <LuArrowLeft className='mr-2 size-4' />
              Back to Leases
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function LeaseDetailPage() {
  const { leaseId } = Route.useParams()
  const { data: lease } = useSuspenseQuery(leaseQueryOptions(leaseId))
  const [renewalOpen, setRenewalOpen] = useState(false)

  // Calculate values
  const monthlyRent = Number(lease.monthlyRent) || 0
  const petRent = Number(lease.petRent) || 0
  const securityDeposit = Number(lease.securityDeposit) || 0
  const totalMonthly = monthlyRent + petRent

  // Calculate deposit interest (assuming 1% annual, prorated)
  const depositPaidDate = lease.depositPaidDate ? new Date(lease.depositPaidDate) : new Date(lease.startDate)
  const monthsHeld = Math.max(0, (new Date().getTime() - depositPaidDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
  const depositInterestRate = Number(lease.depositInterestRate) || 0.01
  const depositInterest = securityDeposit * depositInterestRate * (monthsHeld / 12)

  // Calculate days until expiration
  const endDate = new Date(lease.endDate)
  const now = new Date()
  const daysUntilExpiration = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const isExpiringSoon = daysUntilExpiration <= 30 && daysUntilExpiration > 0
  const isExpired = daysUntilExpiration <= 0

  // Status badge
  const getStatusBadge = () => {
    if (lease.status === 'DRAFT') {
      return <Badge variant='secondary'>Draft</Badge>
    }
    if (lease.status === 'PENDING_SIGNATURE') {
      return <Badge variant='secondary' className='bg-blue-100 text-blue-700'>Pending Signature</Badge>
    }
    if (lease.status === 'EXPIRED' || isExpired) {
      return <Badge variant='destructive'>Expired</Badge>
    }
    if (lease.status === 'TERMINATED') {
      return <Badge variant='destructive'>Terminated</Badge>
    }
    if (lease.status === 'RENEWED') {
      return <Badge variant='outline'>Renewed</Badge>
    }
    if (isExpiringSoon) {
      return <Badge variant='destructive'>Expiring in {daysUntilExpiration} days</Badge>
    }
    return <Badge variant='outline' className='border-green-500 text-green-700'>Active</Badge>
  }

  // Lease for renewal wizard
  const leaseForRenewal = {
    id: lease.id,
    leaseNumber: lease.leaseNumber,
    tenant: {
      id: lease.tenant?.id || '',
      firstName: lease.tenant?.firstName || '',
      lastName: lease.tenant?.lastName || '',
    },
    unit: {
      id: lease.unit?.id || '',
      unitNumber: lease.unit?.unitNumber || '',
      property: {
        id: lease.unit?.property?.id || '',
        name: lease.unit?.property?.name || '',
      },
    },
    startDate: lease.startDate,
    endDate: lease.endDate,
    monthlyRent: monthlyRent,
    securityDeposit: securityDeposit,
    petRent: petRent,
    status: lease.status,
  }

  // Calculate lease duration
  const startDateObj = new Date(lease.startDate)
  const endDateObj = new Date(lease.endDate)
  const durationMonths = Math.round((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24 * 30))

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Back Button & Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/app/leases'>
            <LuArrowLeft className='size-4' />
          </Link>
        </Button>
        <div className='flex-1'>
          <div className='flex items-center gap-3'>
            <Typography.H2>Lease {lease.leaseNumber}</Typography.H2>
            {getStatusBadge()}
          </div>
          <Typography.Muted>
            Unit {lease.unit?.unitNumber || 'N/A'} • {lease.unit?.property?.name || 'Unknown Property'}
          </Typography.Muted>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <LuDownload className='mr-2 size-4' />
            Download PDF
          </Button>
          {lease.status === 'ACTIVE' && (
            <Button onClick={() => setRenewalOpen(true)}>
              <LuRefreshCw className='mr-2 size-4' />
              Renew Lease
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Lease Details */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Lease Details</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Tenants */}
            <div className='space-y-3'>
              <h4 className='flex items-center gap-2 text-sm font-medium'>
                <LuUser className='size-4' />
                Tenants
              </h4>
              <div className='rounded-lg bg-muted p-4'>
                {lease.tenant ? (
                  <>
                    <p className='font-medium'>
                      {lease.tenant.firstName} {lease.tenant.lastName}
                    </p>
                    {lease.coTenants && lease.coTenants.length > 0 && (
                      <p className='text-sm text-muted-foreground'>
                        Co-tenants: {lease.coTenants.map((ct: any) =>
                          `${ct.tenant?.firstName || ''} ${ct.tenant?.lastName || ''}`
                        ).join(', ')}
                      </p>
                    )}
                  </>
                ) : (
                  <p className='text-muted-foreground'>No tenant assigned</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Dates */}
            <div className='grid gap-4 md:grid-cols-3'>
              <div className='space-y-1'>
                <p className='flex items-center gap-1 text-sm text-muted-foreground'>
                  <LuCalendar className='size-3' />
                  Lease Start
                </p>
                <p className='font-medium'>{new Date(lease.startDate).toLocaleDateString()}</p>
              </div>
              <div className='space-y-1'>
                <p className='flex items-center gap-1 text-sm text-muted-foreground'>
                  <LuCalendar className='size-3' />
                  Lease End
                </p>
                <p className='font-medium'>{new Date(lease.endDate).toLocaleDateString()}</p>
              </div>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>Duration</p>
                <p className='font-medium'>{durationMonths} months</p>
              </div>
            </div>

            <Separator />

            {/* Financial Terms */}
            <div className='space-y-3'>
              <h4 className='flex items-center gap-2 text-sm font-medium'>
                <LuDollarSign className='size-4' />
                Financial Terms
              </h4>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2 rounded-lg border p-4'>
                  <p className='text-sm text-muted-foreground'>Monthly Rent Breakdown</p>
                  <div className='space-y-1'>
                    <div className='flex justify-between text-sm'>
                      <span>Base Rent</span>
                      <span>${monthlyRent.toLocaleString()}</span>
                    </div>
                    {petRent > 0 && (
                      <div className='flex justify-between text-sm'>
                        <span>Pet Rent</span>
                        <span>${petRent.toLocaleString()}</span>
                      </div>
                    )}
                    <Separator />
                    <div className='flex justify-between font-medium'>
                      <span>Total Monthly</span>
                      <span>${totalMonthly.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className='space-y-2 rounded-lg border p-4'>
                  <p className='text-sm text-muted-foreground'>Security Deposit</p>
                  <div className='space-y-1'>
                    <div className='flex justify-between text-sm'>
                      <span>Deposit Amount</span>
                      <span>${securityDeposit.toLocaleString()}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span>Interest Accrued ({(depositInterestRate * 100).toFixed(0)}%)</span>
                      <span>${depositInterest.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Late Fee Terms */}
            <div className='space-y-3'>
              <h4 className='text-sm font-medium'>Late Payment Terms</h4>
              <div className='grid gap-4 text-sm md:grid-cols-3'>
                <div>
                  <p className='text-muted-foreground'>Grace Period</p>
                  <p className='font-medium'>{lease.lateFeeGraceDays || 5} days</p>
                </div>
                <div>
                  <p className='text-muted-foreground'>Late Fee</p>
                  <p className='font-medium'>${Number(lease.lateFeeAmount) || 50}</p>
                </div>
                <div>
                  <p className='text-muted-foreground'>Auto-Renewal</p>
                  <p className='font-medium'>{lease.autoRenew ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Addenda & Documents */}
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Addenda</CardTitle>
              <CardDescription>Additional agreements attached to this lease</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              {lease.addenda && lease.addenda.length > 0 ? (
                lease.addenda.map((addendum: any) => (
                  <div key={addendum.id} className='flex items-center justify-between rounded-lg border p-3'>
                    <div className='flex items-center gap-3'>
                      <LuFileText className='size-4 text-muted-foreground' />
                      <div>
                        <p className='text-sm font-medium'>{addendum.title}</p>
                        <p className='text-xs text-muted-foreground'>
                          Effective: {new Date(addendum.effectiveDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant='ghost' size='sm'>
                      View
                    </Button>
                  </div>
                ))
              ) : (
                <p className='text-sm text-muted-foreground'>No addenda attached</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-2'>
              <Button variant='outline' className='justify-start'>
                <LuPencil className='mr-2 size-4' />
                Edit Lease Terms
              </Button>
              <Button variant='outline' className='justify-start'>
                <LuFileText className='mr-2 size-4' />
                Add Addendum
              </Button>
              {lease.tenant && (
                <Button variant='outline' className='justify-start' asChild>
                  <Link to='/app/tenants/$tenantId' params={{ tenantId: lease.tenant.id }}>
                    <LuUser className='mr-2 size-4' />
                    View Tenant
                  </Link>
                </Button>
              )}
              {lease.status === 'ACTIVE' && (
                <Button variant='outline' className='justify-start' onClick={() => setRenewalOpen(true)}>
                  <LuRefreshCw className='mr-2 size-4' />
                  Renew Lease
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Lead Paint Disclosure</span>
                <Badge variant='outline' className='border-green-500 text-green-700'>
                  Complete
                </Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Crime-Free Addendum</span>
                <Badge variant='outline' className='border-green-500 text-green-700'>
                  Complete
                </Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Deposit Interest</span>
                <Badge variant='outline' className='border-green-500 text-green-700'>
                  Current
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Document Generator */}
          <DocumentGenerator leaseId={leaseId} />
        </div>
      </div>

      {/* Renewal Wizard Dialog */}
      <RenewalWizard
        lease={leaseForRenewal}
        open={renewalOpen}
        onOpenChange={setRenewalOpen}
      />
    </div>
  )
}
