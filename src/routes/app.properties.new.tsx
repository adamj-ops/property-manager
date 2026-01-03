import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { LuArrowLeft, LuBuilding2 } from 'react-icons/lu'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { Typography } from '~/components/ui/typography'
import { fetchPlaceDetails, fetchPlacePredictions } from '~/services/places.api'

export const Route = createFileRoute('/app/properties/new')({
  component: NewPropertyPage,
})

function NewPropertyPage() {
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [stateValue, setStateValue] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [predictions, setPredictions] = useState<
    Awaited<ReturnType<typeof fetchPlacePredictions>>
  >([])
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false)
  const [showPredictions, setShowPredictions] = useState(false)
  const sessionToken = useMemo(() => crypto.randomUUID(), [])

  useEffect(() => {
    if (!address || address.length < 3) {
      setPredictions([])
      return
    }

    const handle = setTimeout(async () => {
      setIsLoadingPredictions(true)
      try {
        const results = await fetchPlacePredictions(address, sessionToken)
        setPredictions(results)
        setShowPredictions(true)
      } catch (error) {
        setPredictions([])
      } finally {
        setIsLoadingPredictions(false)
      }
    }, 250)

    return () => clearTimeout(handle)
  }, [address, sessionToken])

  const handleSelectPrediction = async (placeId: string, description: string) => {
    setAddress(description)
    setShowPredictions(false)

    try {
      const details = await fetchPlaceDetails(placeId)
      setCity(extractAddressComponent(details.addressComponents, 'locality') || '')
      setStateValue(
        extractAddressComponent(details.addressComponents, 'administrative_area_level_1') || '',
      )
      setZipCode(extractAddressComponent(details.addressComponents, 'postal_code') || '')
    } catch (error) {
      // Swallow errors for now; user can still edit manually
    }
  }

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
              <div className='relative'>
                <Input
                  id='address'
                  placeholder='e.g., 1234 Humboldt Ave N'
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
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
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSelectPrediction(prediction.placeId, prediction.description)}
                        >
                          <div className='font-medium'>{prediction.mainText}</div>
                          <div className='text-xs text-muted-foreground'>{prediction.secondaryText}</div>
                        </button>
                      ))}
                    </div>
                    {isLoadingPredictions && (
                      <div className='px-3 py-2 text-xs text-muted-foreground'>Loading...</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className='grid gap-4 md:grid-cols-3'>
              <div className='space-y-2'>
                <Label htmlFor='city'>City</Label>
                <Input
                  id='city'
                  placeholder='e.g., Brooklyn Center'
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='state'>State</Label>
                <Select value={stateValue} onValueChange={setStateValue}>
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
                <Input
                  id='zipCode'
                  placeholder='e.g., 55430'
                  value={zipCode}
                  onChange={(event) => setZipCode(event.target.value)}
                />
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

function extractAddressComponent(
  components: { longText: string; shortText: string; types: string[] }[],
  targetType: string,
) {
  const component = components.find((item) => item.types.includes(targetType))
  return component?.shortText || component?.longText
}
