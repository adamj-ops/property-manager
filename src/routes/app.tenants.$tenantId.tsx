import { createFileRoute } from '@tanstack/react-router'
import {
  LuArrowLeft,
  LuCalendar,
  LuDog,
  LuDollarSign,
  LuPencil,
  LuFileText,
  LuMail,
  LuMessageSquare,
  LuPhone,
  LuUser,
  LuWrench,
} from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Link } from '~/components/ui/link'
import { Separator } from '~/components/ui/separator'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/app/tenants/$tenantId')({
  component: TenantDetailPage,
})

// Mock data for a tenant
const tenant = {
  id: '1',
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: 'sarah.j@email.com',
  phone: '(612) 555-0123',
  emergencyContact: {
    name: 'John Johnson',
    phone: '(612) 555-0999',
    relationship: 'Father',
  },
  unit: '101',
  property: 'Humboldt Court Community',
  propertyId: '1',
  rent: 1250,
  petRent: 50,
  securityDeposit: 1250,
  leaseStart: '2024-01-01',
  leaseEnd: '2024-12-31',
  moveInDate: '2024-01-01',
  status: 'current',
  paymentStatus: 'current',
  paymentsOnTime: 12,
  totalPayments: 12,
  pets: [
    {
      name: 'Max',
      type: 'Dog',
      breed: 'Golden Retriever',
      weight: 72,
      approvedDate: '2024-01-01',
      licenseNumber: 'MN-BC-2024-0123',
    },
  ],
}

const paymentHistory = [
  { date: '2024-12-01', amount: 1300, type: 'Rent + Pet', status: 'paid' },
  { date: '2024-11-01', amount: 1300, type: 'Rent + Pet', status: 'paid' },
  { date: '2024-10-01', amount: 1300, type: 'Rent + Pet', status: 'paid' },
  { date: '2024-09-01', amount: 1300, type: 'Rent + Pet', status: 'paid' },
]

const maintenanceRequests = [
  { id: '2847', description: 'Kitchen faucet dripping', date: '2024-12-28', status: 'scheduled' },
  { id: '2756', description: 'Thermostat not working', date: '2024-11-15', status: 'completed' },
]

const documents = [
  { name: 'Lease Agreement', date: '2024-01-01', type: 'lease' },
  { name: 'Pet Addendum - Max', date: '2024-01-01', type: 'addendum' },
  { name: 'Move-in Inspection Report', date: '2024-01-01', type: 'inspection' },
]

function TenantDetailPage() {
  const { tenantId } = Route.useParams()
  const totalMonthly = tenant.rent + tenant.petRent
  const isExpiringSoon = new Date(tenant.leaseEnd) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

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
            Unit {tenant.unit} • {tenant.property}
          </Typography.Muted>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' asChild>
            <Link to='/app/communications'>
              <LuMessageSquare className='mr-2 size-4' />
              Message
            </Link>
          </Button>
          <Button asChild>
            <Link to='/app/leases/$leaseId' params={{ leaseId: '1' }}>
              <LuFileText className='mr-2 size-4' />
              View Lease
            </Link>
          </Button>
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
              <Badge variant='outline' className='border-green-500 bg-green-50 text-green-700'>
                Current
              </Badge>
              <span className='text-sm text-muted-foreground'>All payments on time</span>
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
              {isExpiringSoon ? (
                <Badge variant='secondary' className='bg-orange-100 text-orange-700'>
                  Expiring in 31 days
                </Badge>
              ) : (
                <Badge variant='outline'>Active</Badge>
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
                    {tenant.email}
                  </p>
                  <p className='flex items-center gap-2 text-sm'>
                    <LuPhone className='size-4 text-muted-foreground' />
                    {tenant.phone}
                  </p>
                </div>
              </div>
              <div className='space-y-3'>
                <h4 className='text-sm font-medium'>Emergency Contact</h4>
                <div className='space-y-1 text-sm'>
                  <p className='font-medium'>{tenant.emergencyContact.name}</p>
                  <p className='text-muted-foreground'>{tenant.emergencyContact.relationship}</p>
                  <p>{tenant.emergencyContact.phone}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Lease Details */}
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-3'>
                <h4 className='text-sm font-medium'>Lease Details</h4>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Lease Start</span>
                    <span>{new Date(tenant.leaseStart).toLocaleDateString()}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Lease End</span>
                    <span>{new Date(tenant.leaseEnd).toLocaleDateString()}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Move-in Date</span>
                    <span>{new Date(tenant.moveInDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className='space-y-3'>
                <h4 className='text-sm font-medium'>Financial Summary</h4>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Monthly Rent</span>
                    <span>${tenant.rent}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Pet Rent</span>
                    <span>${tenant.petRent}</span>
                  </div>
                  <div className='flex justify-between font-medium'>
                    <span>Total Monthly</span>
                    <span>${totalMonthly}</span>
                  </div>
                  <Separator />
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Security Deposit</span>
                    <span>${tenant.securityDeposit}</span>
                  </div>
                </div>
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
              <Link to='/app/maintenance'>
                <LuWrench className='mr-2 size-4' />
                Create Work Order
              </Link>
            </Button>
            <Button variant='outline' className='justify-start' asChild>
              <Link to='/app/leases/new'>
                <LuCalendar className='mr-2 size-4' />
                Renew Lease
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pet Information */}
      {tenant.pets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <LuDog className='size-5' />
              Pet Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-2'>
              {tenant.pets.map(pet => (
                <div key={pet.name} className='rounded-lg border p-4'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <h4 className='font-medium'>{pet.name}</h4>
                      <p className='text-sm text-muted-foreground'>
                        {pet.breed} • {pet.weight} lbs
                      </p>
                    </div>
                    <Badge variant='outline' className='border-green-500 text-green-700'>
                      Approved
                    </Badge>
                  </div>
                  <div className='mt-3 space-y-1 text-sm'>
                    <p>
                      <span className='text-muted-foreground'>License:</span> {pet.licenseNumber}
                    </p>
                    <p>
                      <span className='text-muted-foreground'>Approved:</span>{' '}
                      {new Date(pet.approvedDate).toLocaleDateString()}
                    </p>
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
                  {tenant.paymentsOnTime}/{tenant.totalPayments} payments on time
                </CardDescription>
              </div>
              <Button variant='ghost' size='sm' asChild>
                <Link to='/app/financials'>View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {paymentHistory.map((payment, i) => (
                <div key={i} className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium'>${payment.amount}</p>
                    <p className='text-xs text-muted-foreground'>
                      {payment.type} • {new Date(payment.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant='outline' className='border-green-500 text-green-700'>
                    Paid
                  </Badge>
                </div>
              ))}
            </div>
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
            <div className='space-y-3'>
              {maintenanceRequests.map(request => (
                <div key={request.id} className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium'>#{request.id}</p>
                    <p className='text-xs text-muted-foreground'>{request.description}</p>
                  </div>
                  <Badge variant={request.status === 'completed' ? 'outline' : 'secondary'}>
                    {request.status === 'completed' ? 'Completed' : 'Scheduled'}
                  </Badge>
                </div>
              ))}
            </div>
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
          <div className='grid gap-3 md:grid-cols-3'>
            {documents.map((doc, i) => (
              <div key={i} className='flex items-center gap-3 rounded-lg border p-3'>
                <LuFileText className='size-8 text-muted-foreground' />
                <div>
                  <p className='text-sm font-medium'>{doc.name}</p>
                  <p className='text-xs text-muted-foreground'>{new Date(doc.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
