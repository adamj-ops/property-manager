import { createFileRoute } from '@tanstack/react-router'
import { LuArrowRight, LuBuilding2, LuDollarSign, LuShield, LuUsers, LuWrench } from 'react-icons/lu'

import { Button } from '~/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Link } from '~/components/ui/link'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/')({
  component: HomeRoute,
})

const features = [
  {
    icon: LuBuilding2,
    title: 'Property Management',
    description: 'Manage multiple properties and units from a single dashboard',
  },
  {
    icon: LuUsers,
    title: 'Tenant Management',
    description: 'Track tenant information, leases, and communication history',
  },
  {
    icon: LuDollarSign,
    title: 'Financial Tracking',
    description: 'Monitor rent collection, expenses, and generate financial reports',
  },
  {
    icon: LuWrench,
    title: 'Maintenance Requests',
    description: 'Handle work orders and track maintenance across all properties',
  },
  {
    icon: LuShield,
    title: 'Compliance',
    description: 'Stay on top of regulatory requirements and deadlines',
  },
]

function HomeRoute() {
  return (
    <div className='flex size-full flex-col items-center justify-center space-y-8 py-12'>
      {/* Hero Section */}
      <div className='text-center space-y-4 max-w-2xl'>
        <Typography.H1>{import.meta.env.VITE_APP_NAME}</Typography.H1>
        <Typography.Lead>
          Modern property management made simple. Track properties, tenants, and finances in one place.
        </Typography.Lead>
        <div className='flex gap-4 justify-center pt-4'>
          <Button size='lg' asChild>
            <Link to='/app/dashboard'>
              Go to Dashboard
              <LuArrowRight className='ml-2 size-4' />
            </Link>
          </Button>
          <Button variant='outline' size='lg' asChild>
            <Link to='/auth/sign-up'>Create Account</Link>
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-5xl w-full pt-8'>
        {features.map(feature => (
          <Card key={feature.title} className='hover:shadow-md transition-shadow'>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10'>
                  <feature.icon className='size-5 text-primary' />
                </div>
                <div>
                  <CardTitle className='text-base'>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
