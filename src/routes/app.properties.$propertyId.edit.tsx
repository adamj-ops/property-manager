import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { LuArrowLeft, LuBuilding2, LuLoaderCircle } from 'react-icons/lu'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { useForm } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { Textarea } from '~/components/ui/textarea'
import { Typography } from '~/components/ui/typography'
import { fetchPlaceDetails, fetchPlacePredictions } from '~/services/places.api'
import { usePropertyQuery, useUpdateProperty } from '~/services/properties.query'
import { updatePropertySchema } from '~/services/properties.schema'

export const Route = createFileRoute('/app/properties/$propertyId/edit')({
  component: EditPropertyPage,
})

const propertyTypes = [
  { value: 'MULTI_FAMILY', label: 'Multi-Family' },
  { value: 'SINGLE_FAMILY', label: 'Single Family' },
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'CONDO', label: 'Condo' },
  { value: 'TOWNHOUSE', label: 'Townhouse' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'MIXED_USE', label: 'Mixed Use' },
]

const propertyStatuses = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'UNDER_RENOVATION', label: 'Under Renovation' },
  { value: 'FOR_SALE', label: 'For Sale' },
]

const states = [
  { value: 'MN', label: 'Minnesota' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'IA', label: 'Iowa' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'SD', label: 'South Dakota' },
]

function EditPropertyPage() {
  const { propertyId } = Route.useParams()

  return (
    <Suspense fallback={<PageSkeleton />}>
      <EditPropertyForm propertyId={propertyId} />
    </Suspense>
  )
}

function EditPropertyForm({ propertyId }: { propertyId: string }) {
  const navigate = useNavigate()
  const { data: property } = usePropertyQuery(propertyId)
  const updateProperty = useUpdateProperty()

  // Address autocomplete state
  const [predictions, setPredictions] = useState<
    Awaited<ReturnType<typeof fetchPlacePredictions>>
  >([])
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false)
  const [showPredictions, setShowPredictions] = useState(false)
  const sessionToken = useMemo(() => crypto.randomUUID(), [])

  const form = useForm(updatePropertySchema, {
    defaultValues: {
      name: property.name,
      type: property.type,
      status: property.status,
      addressLine1: property.addressLine1,
      addressLine2: property.addressLine2 ?? undefined,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      country: property.country,
      totalUnits: property.totalUnits,
      yearBuilt: property.yearBuilt ?? undefined,
      totalSqFt: property.totalSqFt ?? undefined,
      lotSize: property.lotSize ? Number(property.lotSize) : undefined,
      parkingSpaces: property.parkingSpaces ?? undefined,
      amenities: property.amenities ?? [],
      notes: property.notes ?? undefined,
    },
    onSubmit: async ({ value }) => {
      try {
        await updateProperty.mutateAsync({ id: propertyId, ...value })
        toast.success('Property updated successfully')
        navigate({
          to: '/app/properties/$propertyId',
          params: { propertyId },
        })
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to update property'
        )
      }
    },
  })

  // Address autocomplete effect
  const addressValue = form.useStore((state) => state.values.addressLine1)

  useEffect(() => {
    if (!addressValue || addressValue.length < 3) {
      setPredictions([])
      return
    }

    const handle = setTimeout(async () => {
      setIsLoadingPredictions(true)
      try {
        const results = await fetchPlacePredictions(addressValue, sessionToken)
        setPredictions(results)
        setShowPredictions(true)
      } catch {
        setPredictions([])
      } finally {
        setIsLoadingPredictions(false)
      }
    }, 250)

    return () => clearTimeout(handle)
  }, [addressValue, sessionToken])

  const handleSelectPrediction = async (placeId: string, description: string) => {
    form.setFieldValue('addressLine1', description)
    setShowPredictions(false)

    try {
      const details = await fetchPlaceDetails(placeId)
      const city = extractAddressComponent(details.addressComponents, 'locality')
      const state = extractAddressComponent(details.addressComponents, 'administrative_area_level_1')
      const zipCode = extractAddressComponent(details.addressComponents, 'postal_code')

      if (city) form.setFieldValue('city', city)
      if (state) form.setFieldValue('state', state)
      if (zipCode) form.setFieldValue('zipCode', zipCode)
    } catch {
      // User can still edit manually
    }
  }

  return (
    <div className='w-full max-w-3xl space-y-6 py-6'>
      {/* Back Button & Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/app/properties/$propertyId' params={{ propertyId }}>
            <LuArrowLeft className='size-4' />
          </Link>
        </Button>
        <div>
          <Typography.H2>Edit Property</Typography.H2>
          <Typography.Muted>{property.name}</Typography.Muted>
        </div>
      </div>

      <form.Root className='max-w-none space-y-6'>
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10'>
                <LuBuilding2 className='size-5 text-primary' />
              </div>
              <div>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Property name and type</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <form.Field
              name='name'
              render={(field) => (
                <field.Container label='Property Name'>
                  <Input placeholder='e.g., Humboldt Court Community' />
                </field.Container>
              )}
            />
            <div className='grid gap-4 md:grid-cols-3'>
              <form.Field
                name='type'
                render={(field) => (
                  <field.Container label='Property Type' disableController>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                      >
                        <SelectValue placeholder='Select type' />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </field.Container>
                )}
              />
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
                        {propertyStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </field.Container>
                )}
              />
              <form.Field
                name='totalUnits'
                render={(field) => (
                  <field.Container label='Total Units'>
                    <Input type='number' min={1} placeholder='e.g., 45' />
                  </field.Container>
                )}
              />
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
            <form.Field
              name='addressLine1'
              render={(field) => (
                <field.Container label='Street Address' disableController>
                  <div className='relative'>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder='e.g., 1234 Humboldt Ave N'
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      onFocus={() => predictions.length && setShowPredictions(true)}
                      aria-autocomplete='list'
                      aria-expanded={showPredictions}
                    />
                    {showPredictions && predictions.length > 0 && (
                      <div className='absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md'>
                        <div className='max-h-64 divide-y divide-border overflow-y-auto'>
                          {predictions.map((prediction) => (
                            <button
                              key={prediction.placeId}
                              type='button'
                              className='block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-muted'
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() =>
                                handleSelectPrediction(
                                  prediction.placeId,
                                  prediction.description
                                )
                              }
                            >
                              <div className='font-medium'>{prediction.mainText}</div>
                              <div className='text-xs text-muted-foreground'>
                                {prediction.secondaryText}
                              </div>
                            </button>
                          ))}
                        </div>
                        {isLoadingPredictions && (
                          <div className='px-3 py-2 text-xs text-muted-foreground'>
                            Loading...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </field.Container>
              )}
            />
            <form.Field
              name='addressLine2'
              render={(field) => (
                <field.Container label='Address Line 2 (optional)'>
                  <Input placeholder='Suite, unit, building, floor, etc.' />
                </field.Container>
              )}
            />
            <div className='grid gap-4 md:grid-cols-3'>
              <form.Field
                name='city'
                render={(field) => (
                  <field.Container label='City'>
                    <Input placeholder='e.g., Brooklyn Center' />
                  </field.Container>
                )}
              />
              <form.Field
                name='state'
                render={(field) => (
                  <field.Container label='State' disableController>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                      >
                        <SelectValue placeholder='Select state' />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </field.Container>
                )}
              />
              <form.Field
                name='zipCode'
                render={(field) => (
                  <field.Container label='ZIP Code'>
                    <Input placeholder='e.g., 55430' />
                  </field.Container>
                )}
              />
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
              <form.Field
                name='yearBuilt'
                render={(field) => (
                  <field.Container label='Year Built'>
                    <Input type='number' min={1800} max={2100} placeholder='e.g., 1975' />
                  </field.Container>
                )}
              />
              <form.Field
                name='totalSqFt'
                render={(field) => (
                  <field.Container label='Total Square Footage'>
                    <Input type='number' min={1} placeholder='e.g., 45000' />
                  </field.Container>
                )}
              />
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <form.Field
                name='lotSize'
                render={(field) => (
                  <field.Container label='Lot Size (acres)'>
                    <Input type='number' min={0} step={0.1} placeholder='e.g., 2.5' />
                  </field.Container>
                )}
              />
              <form.Field
                name='parkingSpaces'
                render={(field) => (
                  <field.Container label='Parking Spaces'>
                    <Input type='number' min={0} placeholder='e.g., 90' />
                  </field.Container>
                )}
              />
            </div>
            <form.Field
              name='notes'
              render={(field) => (
                <field.Container label='Notes'>
                  <Textarea
                    placeholder='Enter any additional notes about the property...'
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
            <Link to='/app/properties/$propertyId' params={{ propertyId }}>
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
          <div className='grid gap-4 md:grid-cols-2'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-24' />
        </CardHeader>
        <CardContent className='space-y-4'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <div className='grid gap-4 md:grid-cols-3'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function extractAddressComponent(
  components: { longText: string; shortText: string; types: string[] }[],
  targetType: string
) {
  const component = components.find((item) => item.types.includes(targetType))
  return component?.shortText || component?.longText
}
