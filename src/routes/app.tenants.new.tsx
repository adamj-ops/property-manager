import { createFileRoute } from '@tanstack/react-router'
import { LuArrowLeft, LuUser } from 'react-icons/lu'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/app/tenants/new')({
  component: NewTenantPage,
})

function NewTenantPage() {
  return (
    <div className='w-full max-w-3xl space-y-6 py-6'>
      {/* Back Button & Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/app/tenants'>
            <LuArrowLeft className='size-4' />
          </Link>
        </Button>
        <div>
          <Typography.H2>Add New Tenant</Typography.H2>
          <Typography.Muted>Create a tenant profile for lease management</Typography.Muted>
        </div>
      </div>

      <form className='space-y-6'>
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10'>
                <LuUser className='size-5 text-primary' />
              </div>
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Tenant's basic contact information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='firstName'>First Name</Label>
                <Input id='firstName' placeholder='e.g., Sarah' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='lastName'>Last Name</Label>
                <Input id='lastName' placeholder='e.g., Johnson' />
              </div>
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email Address</Label>
                <Input id='email' type='email' placeholder='e.g., sarah.j@email.com' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='phone'>Phone Number</Label>
                <Input id='phone' type='tel' placeholder='e.g., (612) 555-0123' />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unit Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Unit Assignment</CardTitle>
            <CardDescription>Assign tenant to a property and unit</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='property'>Property</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder='Select property' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='1'>Humboldt Court Community</SelectItem>
                    <SelectItem value='2'>Maple Grove Apartments</SelectItem>
                    <SelectItem value='3'>Downtown Lofts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='unit'>Unit</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder='Select unit' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='101'>Unit 101 - 2BR/1BA</SelectItem>
                    <SelectItem value='102'>Unit 102 - 1BR/1BA</SelectItem>
                    <SelectItem value='103'>Unit 103 - 2BR/1BA (Vacant)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
            <CardDescription>Someone we can contact in case of emergency</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='emergencyName'>Contact Name</Label>
                <Input id='emergencyName' placeholder='e.g., John Johnson' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='emergencyRelationship'>Relationship</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder='Select relationship' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='parent'>Parent</SelectItem>
                    <SelectItem value='spouse'>Spouse</SelectItem>
                    <SelectItem value='sibling'>Sibling</SelectItem>
                    <SelectItem value='friend'>Friend</SelectItem>
                    <SelectItem value='other'>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='emergencyPhone'>Phone Number</Label>
              <Input id='emergencyPhone' type='tel' placeholder='e.g., (612) 555-0999' />
            </div>
          </CardContent>
        </Card>

        {/* Co-Tenant */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>Co-Tenant (Optional)</CardTitle>
                <CardDescription>Add additional tenants on the lease</CardDescription>
              </div>
              <Button type='button' variant='outline' size='sm'>
                Add Co-Tenant
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>No co-tenants added yet</p>
          </CardContent>
        </Card>

        {/* Actions */}
        <Separator />
        <div className='flex justify-end gap-4'>
          <Button variant='outline' asChild>
            <Link to='/app/tenants'>Cancel</Link>
          </Button>
          <Button variant='outline'>Save as Draft</Button>
          <Button type='submit'>Create Tenant & Start Lease</Button>
        </div>
      </form>
    </div>
  )
}
