import { createFileRoute } from '@tanstack/react-router'
import { LuArrowLeft, LuBuilding2 } from 'react-icons/lu'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/app/properties/new')({
  component: NewPropertyPage,
})

function NewPropertyPage() {
  return (
    <div className='w-full max-w-3xl space-y-6 py-6'>
      {/* Back Button & Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/app/properties'>
            <LuArrowLeft className='size-4' />
          </Link>
        </Button>
        <div>
          <Typography.H2>Add New Property</Typography.H2>
          <Typography.Muted>Enter the details for your new property</Typography.Muted>
        </div>
      </div>

      <form className='space-y-6'>
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10'>
                <LuBuilding2 className='size-5 text-primary' />
              </div>
              <div>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the property name and type</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Property Name</Label>
              <Input id='name' placeholder='e.g., Humboldt Court Community' />
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='type'>Property Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder='Select type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='multi-family'>Multi-Family</SelectItem>
                    <SelectItem value='single-family'>Single Family</SelectItem>
                    <SelectItem value='commercial'>Commercial</SelectItem>
                    <SelectItem value='mixed-use'>Mixed Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='units'>Total Units</Label>
                <Input id='units' type='number' placeholder='e.g., 45' />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
            <CardDescription>Property location details</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='address'>Street Address</Label>
              <Input id='address' placeholder='e.g., 1234 Humboldt Ave N' />
            </div>
            <div className='grid gap-4 md:grid-cols-3'>
              <div className='space-y-2'>
                <Label htmlFor='city'>City</Label>
                <Input id='city' placeholder='e.g., Brooklyn Center' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='state'>State</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder='Select state' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='MN'>Minnesota</SelectItem>
                    <SelectItem value='WI'>Wisconsin</SelectItem>
                    <SelectItem value='IA'>Iowa</SelectItem>
                    <SelectItem value='ND'>North Dakota</SelectItem>
                    <SelectItem value='SD'>South Dakota</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='zipCode'>ZIP Code</Label>
                <Input id='zipCode' placeholder='e.g., 55430' />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
            <CardDescription>Additional property information</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='yearBuilt'>Year Built</Label>
                <Input id='yearBuilt' type='number' placeholder='e.g., 1975' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='sqFt'>Total Square Footage</Label>
                <Input id='sqFt' type='number' placeholder='e.g., 45000' />
              </div>
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='lotSize'>Lot Size</Label>
                <Input id='lotSize' placeholder='e.g., 2.5 acres' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='parking'>Parking</Label>
                <Input id='parking' placeholder='e.g., 90 spaces' />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                placeholder='Enter a description of the property...'
                className='min-h-24'
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className='flex justify-end gap-4'>
          <Button variant='outline' asChild>
            <Link to='/app/properties'>Cancel</Link>
          </Button>
          <Button type='submit'>Create Property</Button>
        </div>
      </form>
    </div>
  )
}
