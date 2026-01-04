import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Suspense } from 'react'
import { toast } from 'sonner'
import { LuArrowLeft, LuHouse, LuLoaderCircle } from 'react-icons/lu'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { useForm } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { Textarea } from '~/components/ui/textarea'
import { Typography } from '~/components/ui/typography'
import { usePropertyQuery } from '~/services/properties.query'
import { useUnitQuery, useUpdateUnit } from '~/services/units.query'
import { updateUnitSchema } from '~/services/units.schema'

export const Route = createFileRoute('/app/properties/$propertyId/units/$unitId/edit')({
  component: EditUnitPage,
})

function EditUnitPage() {
  const { propertyId, unitId } = Route.useParams()

  return (
    <Suspense fallback={<PageSkeleton />}>
      <EditUnitForm propertyId={propertyId} unitId={unitId} />
    </Suspense>
  )
}

function EditUnitForm({ propertyId, unitId }: { propertyId: string; unitId: string }) {
  const navigate = useNavigate()
  const { data: property } = usePropertyQuery(propertyId)
  const { data: unit } = useUnitQuery(unitId)
  const updateUnit = useUpdateUnit()

  const form = useForm(updateUnitSchema, {
    defaultValues: {
      unitNumber: unit.unitNumber,
      status: unit.status,
      bedrooms: unit.bedrooms,
      bathrooms: Number(unit.bathrooms),
      sqFt: unit.sqFt ?? undefined,
      floor: unit.floor ?? undefined,
      floorPlan: unit.floorPlan ?? undefined,
      marketRent: Number(unit.marketRent),
      currentRent: unit.currentRent ? Number(unit.currentRent) : undefined,
      depositAmount: unit.depositAmount ? Number(unit.depositAmount) : undefined,
      features: unit.features ?? [],
      petFriendly: unit.petFriendly,
      petDeposit: unit.petDeposit ? Number(unit.petDeposit) : undefined,
      petRent: unit.petRent ? Number(unit.petRent) : undefined,
      appliances: unit.appliances ?? [],
      utilitiesIncluded: unit.utilitiesIncluded ?? [],
      notes: unit.notes ?? undefined,
      imageUrls: unit.imageUrls ?? [],
    },
    onSubmit: async ({ value }) => {
      try {
        await updateUnit.mutateAsync({ id: unitId, ...value })
        toast.success('Unit updated successfully')
        navigate({
          to: '/app/properties/$propertyId/units',
          params: { propertyId },
        })
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to update unit'
        )
      }
    },
  })

  return (
    <div className='w-full max-w-3xl space-y-6 py-6'>
      {/* Back Button & Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/app/properties/$propertyId/units' params={{ propertyId }}>
            <LuArrowLeft className='size-4' />
          </Link>
        </Button>
        <div>
          <Typography.H2>Edit Unit {unit.unitNumber}</Typography.H2>
          <Typography.Muted>{property.name}</Typography.Muted>
        </div>
      </div>

      <form.Root className='max-w-none space-y-6'>
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10'>
                <LuHouse className='size-5 text-primary' />
              </div>
              <div>
                <CardTitle>Unit Information</CardTitle>
                <CardDescription>Basic details about the unit</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <form.Field
                name='unitNumber'
                render={(field) => (
                  <field.Container label='Unit Number'>
                    <Input placeholder='e.g., 101, A-1, Ground Floor' />
                  </field.Container>
                )}
              />
              <form.Field
                name='floorPlan'
                render={(field) => (
                  <field.Container label='Floor Plan (optional)'>
                    <Input placeholder='e.g., 2BR/1BA, Studio' />
                  </field.Container>
                )}
              />
            </div>
            <div className='grid gap-4 md:grid-cols-3'>
              <form.Field
                name='bedrooms'
                render={(field) => (
                  <field.Container label='Bedrooms'>
                    <Input type='number' min={0} placeholder='1' />
                  </field.Container>
                )}
              />
              <form.Field
                name='bathrooms'
                render={(field) => (
                  <field.Container label='Bathrooms'>
                    <Input type='number' min={0} step={0.5} placeholder='1' />
                  </field.Container>
                )}
              />
              <form.Field
                name='sqFt'
                render={(field) => (
                  <field.Container label='Square Feet'>
                    <Input type='number' min={1} placeholder='e.g., 850' />
                  </field.Container>
                )}
              />
            </div>
            <form.Field
              name='floor'
              render={(field) => (
                <field.Container label='Floor (optional)'>
                  <Input type='number' placeholder='e.g., 1, 2, 3' />
                </field.Container>
              )}
            />
          </CardContent>
        </Card>

        {/* Rent Information */}
        <Card>
          <CardHeader>
            <CardTitle>Rent Information</CardTitle>
            <CardDescription>Pricing and deposit details</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-3'>
              <form.Field
                name='marketRent'
                render={(field) => (
                  <field.Container label='Market Rent ($/month)'>
                    <Input type='number' min={0} placeholder='e.g., 1250' />
                  </field.Container>
                )}
              />
              <form.Field
                name='currentRent'
                render={(field) => (
                  <field.Container label='Current Rent (optional)'>
                    <Input type='number' min={0} placeholder='e.g., 1200' />
                  </field.Container>
                )}
              />
              <form.Field
                name='depositAmount'
                render={(field) => (
                  <field.Container label='Security Deposit'>
                    <Input type='number' min={0} placeholder='e.g., 1250' />
                  </field.Container>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pet Policy */}
        <Card>
          <CardHeader>
            <CardTitle>Pet Policy</CardTitle>
            <CardDescription>Pet-related settings for this unit</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <form.Field
              name='petFriendly'
              render={(field) => (
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === 'indeterminate' ? false : checked)
                    }
                  />
                  <label
                    htmlFor={field.name}
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                  >
                    Pet Friendly
                  </label>
                </div>
              )}
            />
            <form.Subscribe selector={(state) => state.values.petFriendly}>
              {(petFriendly) =>
                petFriendly && (
                  <div className='grid gap-4 md:grid-cols-2'>
                    <form.Field
                      name='petDeposit'
                      render={(field) => (
                        <field.Container label='Pet Deposit'>
                          <Input type='number' min={0} placeholder='e.g., 300' />
                        </field.Container>
                      )}
                    />
                    <form.Field
                      name='petRent'
                      render={(field) => (
                        <field.Container label='Pet Rent ($/month)'>
                          <Input type='number' min={0} placeholder='e.g., 25' />
                        </field.Container>
                      )}
                    />
                  </div>
                )
              }
            </form.Subscribe>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Unit Status</CardTitle>
            <CardDescription>Current availability status</CardDescription>
          </CardHeader>
          <CardContent>
            <form.Field
              name='status'
              render={(field) => (
                <field.Container label='Status' disableController>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                    >
                      <SelectValue placeholder='Select status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='VACANT'>Vacant</SelectItem>
                      <SelectItem value='OCCUPIED'>Occupied</SelectItem>
                      <SelectItem value='NOTICE_GIVEN'>Notice Given</SelectItem>
                      <SelectItem value='UNDER_RENOVATION'>Under Renovation</SelectItem>
                      <SelectItem value='OFF_MARKET'>Off Market</SelectItem>
                    </SelectContent>
                  </Select>
                </field.Container>
              )}
            />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Any notes about this unit</CardDescription>
          </CardHeader>
          <CardContent>
            <form.Field
              name='notes'
              render={(field) => (
                <field.Container label='Notes (optional)'>
                  <Textarea
                    placeholder='Enter any additional notes about the unit...'
                    className='min-h-24'
                    value={field.state.value ?? ''}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </field.Container>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className='flex justify-end gap-4'>
          <Button variant='outline' type='button' asChild>
            <Link to='/app/properties/$propertyId/units' params={{ propertyId }}>
              Cancel
            </Link>
          </Button>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button type='submit' disabled={!canSubmit || isSubmitting}>
                {isSubmitting && <LuLoaderCircle className='mr-2 size-4 animate-spin' />}
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form.Root>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className='w-full max-w-3xl space-y-6 py-6'>
      <div className='flex items-center gap-4'>
        <Skeleton className='size-10' />
        <div className='space-y-2'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-4 w-32' />
        </div>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-32' />
        </CardHeader>
        <CardContent className='space-y-4'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </CardContent>
      </Card>
    </div>
  )
}
