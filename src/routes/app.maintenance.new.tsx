import { createFileRoute } from '@tanstack/react-router'
import { LuArrowLeft, LuUpload, LuWrench } from 'react-icons/lu'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/app/maintenance/new')({
  component: NewWorkOrderPage,
})

function NewWorkOrderPage() {
  return (
    <div className='w-full max-w-3xl space-y-6 py-6'>
      {/* Back Button & Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/app/maintenance'>
            <LuArrowLeft className='size-4' />
          </Link>
        </Button>
        <div>
          <Typography.H2>New Work Order</Typography.H2>
          <Typography.Muted>Create a maintenance request</Typography.Muted>
        </div>
      </div>

      <form className='space-y-6'>
        {/* Location */}
        <Card>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10'>
                <LuWrench className='size-5 text-primary' />
              </div>
              <div>
                <CardTitle>Location</CardTitle>
                <CardDescription>Where is the issue located?</CardDescription>
              </div>
            </div>
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
                    <SelectItem value='common'>Common Area</SelectItem>
                    <SelectItem value='101'>Unit 101 - Sarah Johnson</SelectItem>
                    <SelectItem value='102'>Unit 102 - Mike Chen</SelectItem>
                    <SelectItem value='204'>Unit 204 - Emily Rodriguez</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issue Details */}
        <Card>
          <CardHeader>
            <CardTitle>Issue Details</CardTitle>
            <CardDescription>Describe the maintenance issue</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='title'>Title</Label>
              <Input id='title' placeholder='Brief description of the issue' />
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='category'>Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder='Select category' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='plumbing'>Plumbing</SelectItem>
                    <SelectItem value='electrical'>Electrical</SelectItem>
                    <SelectItem value='hvac'>HVAC</SelectItem>
                    <SelectItem value='appliance'>Appliance</SelectItem>
                    <SelectItem value='structural'>Structural</SelectItem>
                    <SelectItem value='pest'>Pest Control</SelectItem>
                    <SelectItem value='other'>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='priority'>Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder='Select priority' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='emergency'>Emergency (Safety/Health Risk)</SelectItem>
                    <SelectItem value='high'>High (Affects Habitability)</SelectItem>
                    <SelectItem value='medium'>Medium (Inconvenient)</SelectItem>
                    <SelectItem value='low'>Low (Minor Issue)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                placeholder='Provide detailed description of the issue...'
                className='min-h-24'
              />
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>Upload photos of the issue (optional)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='rounded-lg border-2 border-dashed p-8 text-center'>
              <LuUpload className='mx-auto size-8 text-muted-foreground' />
              <p className='mt-2 text-sm text-muted-foreground'>Drag and drop or click to upload</p>
              <p className='text-xs text-muted-foreground'>Up to 5 images, max 5MB each</p>
              <Button variant='outline' size='sm' className='mt-4'>
                Upload Photos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
            <CardDescription>Assign to a vendor or staff member</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='vendor'>Assign To</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder='Select vendor or staff' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='internal'>Internal Maintenance</SelectItem>
                    <SelectItem value='plumbing'>City Plumbing Co.</SelectItem>
                    <SelectItem value='hvac'>Mike's HVAC Service</SelectItem>
                    <SelectItem value='electrical'>Sparky Electric</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='estimatedCost'>Estimated Cost</Label>
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>$</span>
                  <Input id='estimatedCost' type='number' placeholder='0.00' className='pl-7' />
                </div>
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='scheduledDate'>Schedule Date (Optional)</Label>
              <Input id='scheduledDate' type='datetime-local' />
            </div>
          </CardContent>
        </Card>

        {/* Access */}
        <Card>
          <CardHeader>
            <CardTitle>Access Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center space-x-2'>
              <Checkbox id='accessPermission' defaultChecked />
              <Label htmlFor='accessPermission' className='text-sm'>
                Tenant grants entry permission
              </Label>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='preferredTimes'>Preferred Access Times</Label>
              <Input id='preferredTimes' placeholder='e.g., Weekdays 9am-5pm' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='accessNotes'>Special Instructions</Label>
              <Textarea id='accessNotes' placeholder='Any special access instructions...' />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className='flex justify-end gap-4'>
          <Button variant='outline' asChild>
            <Link to='/app/maintenance'>Cancel</Link>
          </Button>
          <Button type='submit'>Create Work Order</Button>
        </div>
      </form>
    </div>
  )
}
