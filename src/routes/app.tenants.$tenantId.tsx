import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  LuArrowLeft,
  LuCalendar,
  LuDog,
  LuDollarSign,
  LuFileText,
  LuLoaderCircle,
  LuMail,
  LuMessageSquare,
  LuPhone,
  LuWrench,
} from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Link } from '~/components/ui/link'
import { Separator } from '~/components/ui/separator'
import { Typography } from '~/components/ui/typography'
import { tenantQueryOptions } from '~/services/tenants.query'

export const Route = createFileRoute('/app/tenants/$tenantId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(tenantQueryOptions(params.tenantId)),
  pendingComponent: TenantDetailLoading,
  errorComponent: TenantDetailError,
  component: TenantDetailPage,
})

function TenantDetailLoading() {
  return (
    <div className='flex h-96 w-full items-center justify-center'>
      <LuLoaderCircle className='size-8 animate-spin text-muted-foreground' />
    </div>
  )
}

function TenantDetailError() {
  return (
    <div className='w-full max-w-7xl py-6'>
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-12'>
          <Typography.H3>Tenant Not Found</Typography.H3>
          <Typography.Muted className='mt-2'>
            The tenant you're looking for doesn't exist or you don't have access.
          </Typography.Muted>
          <Button variant='outline' className='mt-4' asChild>
            <Link to='/app/tenants'>
              <LuArrowLeft className='mr-2 size-4' />
              Back to Tenants
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function TenantDetailPage() {
  const { tenantId } = Route.useParams()
  const { data: tenant } = useSuspenseQuery(tenantQueryOptions(tenantId))

  // Get active lease (first one, since they're ordered by startDate desc)
  const activeLease = tenant.leases?.find((l: any) => l.status === 'ACTIVE') || tenant.leases?.[0]
  const unit = activeLease?.unit
  const property = unit?.property

  // Calculate lease expiration status
  const leaseEndDate = activeLease?.endDate ? new Date(activeLease.endDate) : null
  const now = new Date()
  const daysUntilExpiration = leaseEndDate
    ? Math.ceil((leaseEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null
  const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 30 && daysUntilExpiration > 0

  // Calculate payment status from recent payments
  const recentPayments = tenant.payments || []
  const hasOverduePayment = recentPayments.some((p: any) => p.status === 'OVERDUE' || p.status === 'LATE')
  const paymentStatus = hasOverduePayment ? 'overdue' : 'current'

  // Financial calculations
  const monthlyRent = activeLease?.monthlyRent ? Number(activeLease.monthlyRent) : 0
  const petRent = activeLease?.petRent ? Number(activeLease.petRent) : 0
  const securityDeposit = activeLease?.securityDeposit ? Number(activeLease.securityDeposit) : 0
  const totalMonthly = monthlyRent + petRent

  // Count on-time payments
  const paidPayments = recentPayments.filter((p: any) => p.status === 'PAID' || p.status === 'COMPLETED')
  const latePayments = recentPayments.filter((p: any) => p.status === 'LATE')
  const onTimePayments = paidPayments.length - latePayments.length

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Back Button & Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/app/tenants'>
            <LuArrowLeft className='size-4' />
          </Link>
        </Button>
        <div className='flex-1'>
          <div className='flex items-center gap-3'>
            <Typography.H2>
              {tenant.firstName} {tenant.lastName}
            </Typography.H2>
            {isExpiringSoon && (
              <Badge variant='secondary' className='bg-orange-100 text-orange-700'>
                Lease Expiring Soon
              </Badge>
            )}
          </div>
          <Typography.Muted>
            {unit ? `Unit ${unit.unitNumber}` : 'No unit'} • {property?.name || 'No property'}
          </Typography.Muted>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' asChild>
            <Link to='/app/communications'>
              <LuMessageSquare className='mr-2 size-4' />
              Message
            </Link>
          </Button>
          {activeLease && (
            <Button asChild>
              <Link to='/app/leases/$leaseId' params={{ leaseId: activeLease.id }}>
                <LuFileText className='mr-2 size-4' />
                View Lease
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              {paymentStatus === 'current' ? (
                <>
                  <Badge variant='outline' className='border-green-500 bg-green-50 text-green-700'>
                    Current
                  </Badge>
                  <span className='text-sm text-muted-foreground'>All payments on time</span>
                </>
              ) : (
                <>
                  <Badge variant='destructive'>Overdue</Badge>
                  <span className='text-sm text-muted-foreground'>Has overdue payments</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='border-green-500 bg-green-50 text-green-700'>
                Good Standing
              </Badge>
              <span className='text-sm text-muted-foreground'>No violations</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Lease Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              {!activeLease ? (
                <Badge variant='secondary'>No Active Lease</Badge>
              ) : isExpiringSoon ? (
                <Badge variant='secondary' className='bg-orange-100 text-orange-700'>
                  Expiring in {daysUntilExpiration} days
                </Badge>
              ) : daysUntilExpiration !== null && daysUntilExpiration <= 0 ? (
                <Badge variant='destructive'>Expired</Badge>
              ) : (
                <Badge variant='outline' className='border-green-500 bg-green-50 text-green-700'>
                  Active
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Contact & Lease Info */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Tenant Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Contact Info */}
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-3'>
                <h4 className='text-sm font-medium'>Contact Information</h4>
                <div className='space-y-2'>
                  <p className='flex items-center gap-2 text-sm'>
                    <LuMail className='size-4 text-muted-foreground' />
                    {tenant.email || 'No email'}
                  </p>
                  <p className='flex items-center gap-2 text-sm'>
                    <LuPhone className='size-4 text-muted-foreground' />
                    {tenant.phone || 'No phone'}
                  </p>
                </div>
              </div>
              <div className='space-y-3'>
                <h4 className='text-sm font-medium'>Emergency Contact</h4>
                {tenant.emergencyContactName ? (
                  <div className='space-y-1 text-sm'>
                    <p className='font-medium'>{tenant.emergencyContactName}</p>
                    <p className='text-muted-foreground'>{tenant.emergencyContactRelation || 'Contact'}</p>
                    <p>{tenant.emergencyContactPhone || 'No phone'}</p>
                  </div>
                ) : (
                  <p className='text-sm text-muted-foreground'>No emergency contact on file</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Lease Details */}
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-3'>
                <h4 className='text-sm font-medium'>Lease Details</h4>
                {activeLease ? (
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Lease Start</span>
                      <span>{new Date(activeLease.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Lease End</span>
                      <span>{new Date(activeLease.endDate).toLocaleDateString()}</span>
                    </div>
                    {activeLease.moveInDate && (
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Move-in Date</span>
                        <span>{new Date(activeLease.moveInDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className='text-sm text-muted-foreground'>No active lease</p>
                )}
              </div>
              <div className='space-y-3'>
                <h4 className='text-sm font-medium'>Financial Summary</h4>
                {activeLease ? (
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Monthly Rent</span>
                      <span>${monthlyRent.toLocaleString()}</span>
                    </div>
                    {petRent > 0 && (
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Pet Rent</span>
                        <span>${petRent.toLocaleString()}</span>
                      </div>
                    )}
                    <div className='flex justify-between font-medium'>
                      <span>Total Monthly</span>
                      <span>${totalMonthly.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Security Deposit</span>
                      <span>${securityDeposit.toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <p className='text-sm text-muted-foreground'>No lease financial data</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-2'>
            <Button variant='outline' className='justify-start' asChild>
              <Link to='/app/communications'>
                <LuMessageSquare className='mr-2 size-4' />
                Send Message
              </Link>
            </Button>
            <Button variant='outline' className='justify-start' asChild>
              <Link to='/app/financials/payments'>
                <LuDollarSign className='mr-2 size-4' />
                Record Payment
              </Link>
            </Button>
            <Button variant='outline' className='justify-start' asChild>
              <Link to='/app/maintenance/new'>
                <LuWrench className='mr-2 size-4' />
                Create Work Order
              </Link>
            </Button>
            {activeLease && (
              <Button variant='outline' className='justify-start' asChild>
                <Link to='/app/leases/new'>
                  <LuCalendar className='mr-2 size-4' />
                  Renew Lease
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pet Information */}
      {tenant.pets && tenant.pets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <LuDog className='size-5' />
              Pet Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-2'>
              {tenant.pets.map((pet: any) => (
                <div key={pet.id} className='rounded-lg border p-4'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <h4 className='font-medium'>{pet.name}</h4>
                      <p className='text-sm text-muted-foreground'>
                        {pet.breed || pet.species} {pet.weight ? `• ${pet.weight} lbs` : ''}
                      </p>
                    </div>
                    <Badge
                      variant='outline'
                      className={
                        pet.status === 'APPROVED'
                          ? 'border-green-500 text-green-700'
                          : pet.status === 'PENDING'
                          ? 'border-yellow-500 text-yellow-700'
                          : 'border-gray-500 text-gray-700'
                      }
                    >
                      {pet.status}
                    </Badge>
                  </div>
                  <div className='mt-3 space-y-1 text-sm'>
                    {pet.licenseNumber && (
                      <p>
                        <span className='text-muted-foreground'>License:</span> {pet.licenseNumber}
                      </p>
                    )}
                    {pet.approvalDate && (
                      <p>
                        <span className='text-muted-foreground'>Approved:</span>{' '}
                        {new Date(pet.approvalDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History & Maintenance */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Payment History */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  {onTimePayments}/{paidPayments.length} payments on time
                </CardDescription>
              </div>
              <Button variant='ghost' size='sm' asChild>
                <Link to='/app/financials'>View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentPayments.length > 0 ? (
              <div className='space-y-3'>
                {recentPayments.slice(0, 5).map((payment: any) => (
                  <div key={payment.id} className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium'>
                        ${Number(payment.amount).toLocaleString()}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {payment.paymentType || 'Payment'} •{' '}
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant='outline'
                      className={
                        payment.status === 'PAID' || payment.status === 'COMPLETED'
                          ? 'border-green-500 text-green-700'
                          : payment.status === 'PENDING'
                          ? 'border-yellow-500 text-yellow-700'
                          : 'border-red-500 text-red-700'
                      }
                    >
                      {payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>No payment history</p>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Requests */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>Maintenance Requests</CardTitle>
              <Button variant='ghost' size='sm' asChild>
                <Link to='/app/maintenance'>View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tenant.maintenanceRequests && tenant.maintenanceRequests.length > 0 ? (
              <div className='space-y-3'>
                {tenant.maintenanceRequests.map((request: any) => (
                  <div key={request.id} className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium'>#{request.id.slice(0, 8)}</p>
                      <p className='text-xs text-muted-foreground'>
                        {request.title || request.description?.slice(0, 50)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        request.status === 'COMPLETED' || request.status === 'CLOSED'
                          ? 'outline'
                          : 'secondary'
                      }
                    >
                      {request.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>No maintenance requests</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Documents</CardTitle>
            <Button variant='ghost' size='sm' asChild>
              <Link to='/app/documents'>View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tenant.documents && tenant.documents.length > 0 ? (
            <div className='grid gap-3 md:grid-cols-3'>
              {tenant.documents.map((doc: any) => (
                <div key={doc.id} className='flex items-center gap-3 rounded-lg border p-3'>
                  <LuFileText className='size-8 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>{doc.name || doc.fileName}</p>
                    <p className='text-xs text-muted-foreground'>
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>No documents on file</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
