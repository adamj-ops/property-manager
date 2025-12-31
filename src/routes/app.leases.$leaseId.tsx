import { createFileRoute } from '@tanstack/react-router'
import { LuArrowLeft, LuCalendar, LuDollarSign, LuDownload, LuPencil, LuFileText, LuRefreshCw, LuUser } from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Link } from '~/components/ui/link'
import { Separator } from '~/components/ui/separator'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/app/leases/$leaseId')({
  component: LeaseDetailPage,
})

// Mock data
const lease = {
  id: '1',
  tenant: {
    primary: 'Sarah Johnson',
    coTenants: ['Mike Chen'],
  },
  unit: '101',
  property: 'Humboldt Court Community',
  propertyId: '1',
  rent: 1250,
  petRent: 50,
  deposit: 1250,
  depositInterest: 12.5,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  signedDate: '2023-12-15',
  status: 'active',
  daysUntilExpiration: 31,
  terms: {
    leaseDuration: '12 months',
    lateFeeGracePeriod: '5 days',
    lateFee: 50,
    autoRenewal: false,
  },
  addenda: [
    { name: 'Pet Addendum', signedDate: '2024-01-01' },
    { name: 'Lead Paint Disclosure', signedDate: '2024-01-01' },
    { name: 'Crime-Free Housing Addendum', signedDate: '2024-01-01' },
  ],
}

function LeaseDetailPage() {
  const { leaseId } = Route.useParams()
  const totalMonthly = lease.rent + lease.petRent
  const isExpiringSoon = lease.daysUntilExpiration <= 30

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
            <Typography.H2>Lease Agreement</Typography.H2>
            {isExpiringSoon ? (
              <Badge variant='destructive'>Expiring in {lease.daysUntilExpiration} days</Badge>
            ) : (
              <Badge variant='outline' className='border-green-500 text-green-700'>
                Active
              </Badge>
            )}
          </div>
          <Typography.Muted>
            Unit {lease.unit} • {lease.property}
          </Typography.Muted>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <LuDownload className='mr-2 size-4' />
            Download PDF
          </Button>
          {isExpiringSoon && (
            <Button asChild>
              <Link to='/app/leases/new'>
                <LuRefreshCw className='mr-2 size-4' />
                Renew Lease
              </Link>
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
              <h4 className='text-sm font-medium flex items-center gap-2'>
                <LuUser className='size-4' />
                Tenants
              </h4>
              <div className='rounded-lg bg-muted p-4'>
                <p className='font-medium'>{lease.tenant.primary}</p>
                {lease.tenant.coTenants.length > 0 && (
                  <p className='text-sm text-muted-foreground'>Co-tenants: {lease.tenant.coTenants.join(', ')}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Dates */}
            <div className='grid gap-4 md:grid-cols-3'>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground flex items-center gap-1'>
                  <LuCalendar className='size-3' />
                  Lease Start
                </p>
                <p className='font-medium'>{new Date(lease.startDate).toLocaleDateString()}</p>
              </div>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground flex items-center gap-1'>
                  <LuCalendar className='size-3' />
                  Lease End
                </p>
                <p className='font-medium'>{new Date(lease.endDate).toLocaleDateString()}</p>
              </div>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>Duration</p>
                <p className='font-medium'>{lease.terms.leaseDuration}</p>
              </div>
            </div>

            <Separator />

            {/* Financial Terms */}
            <div className='space-y-3'>
              <h4 className='text-sm font-medium flex items-center gap-2'>
                <LuDollarSign className='size-4' />
                Financial Terms
              </h4>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='rounded-lg border p-4 space-y-2'>
                  <p className='text-sm text-muted-foreground'>Monthly Rent Breakdown</p>
                  <div className='space-y-1'>
                    <div className='flex justify-between text-sm'>
                      <span>Base Rent</span>
                      <span>${lease.rent}</span>
                    </div>
                    {lease.petRent > 0 && (
                      <div className='flex justify-between text-sm'>
                        <span>Pet Rent</span>
                        <span>${lease.petRent}</span>
                      </div>
                    )}
                    <Separator />
                    <div className='flex justify-between font-medium'>
                      <span>Total Monthly</span>
                      <span>${totalMonthly}</span>
                    </div>
                  </div>
                </div>
                <div className='rounded-lg border p-4 space-y-2'>
                  <p className='text-sm text-muted-foreground'>Security Deposit</p>
                  <div className='space-y-1'>
                    <div className='flex justify-between text-sm'>
                      <span>Deposit Amount</span>
                      <span>${lease.deposit}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span>Interest Accrued (1%)</span>
                      <span>${lease.depositInterest.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Late Fee Terms */}
            <div className='space-y-3'>
              <h4 className='text-sm font-medium'>Late Payment Terms</h4>
              <div className='grid gap-4 md:grid-cols-3 text-sm'>
                <div>
                  <p className='text-muted-foreground'>Grace Period</p>
                  <p className='font-medium'>{lease.terms.lateFeeGracePeriod}</p>
                </div>
                <div>
                  <p className='text-muted-foreground'>Late Fee</p>
                  <p className='font-medium'>${lease.terms.lateFee}</p>
                </div>
                <div>
                  <p className='text-muted-foreground'>Auto-Renewal</p>
                  <p className='font-medium'>{lease.terms.autoRenewal ? 'Enabled' : 'Disabled'}</p>
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
              {lease.addenda.map((addendum, i) => (
                <div key={i} className='flex items-center justify-between rounded-lg border p-3'>
                  <div className='flex items-center gap-3'>
                    <LuFileText className='size-4 text-muted-foreground' />
                    <div>
                      <p className='text-sm font-medium'>{addendum.name}</p>
                      <p className='text-xs text-muted-foreground'>
                        Signed: {new Date(addendum.signedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button variant='ghost' size='sm'>
                    View
                  </Button>
                </div>
              ))}
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
              <Button variant='outline' className='justify-start' asChild>
                <Link to='/app/tenants/$tenantId' params={{ tenantId: '1' }}>
                  <LuUser className='mr-2 size-4' />
                  View Tenant
                </Link>
              </Button>
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
        </div>
      </div>
    </div>
  )
}
