import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  LuArrowLeft,
  LuBriefcase,
  LuCar,
  LuChevronDown,
  LuChevronUp,
  LuLoaderCircle,
  LuPhone,
  LuUser,
} from 'react-icons/lu'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '~/components/ui/collapsible'
import { useForm } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Textarea } from '~/components/ui/textarea'
import { Typography } from '~/components/ui/typography'
import { propertiesQueryOptions } from '~/services/properties.query'
import { unitsQueryOptions } from '~/services/units.query'
import { useCreateTenant } from '~/services/tenants.query'
import { createTenantSchema } from '~/services/tenants.schema'

export const Route = createFileRoute('/app/tenants/new')({
  component: NewTenantPage,
})

const contactMethods = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'sms', label: 'SMS' },
]

const relationships = [
  { value: 'parent', label: 'Parent' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'child', label: 'Child' },
  { value: 'friend', label: 'Friend' },
  { value: 'other', label: 'Other' },
]

function NewTenantPage() {
  const navigate = useNavigate()
  const createTenant = useCreateTenant()

  // Collapsible section states
  const [showEmployment, setShowEmployment] = useState(false)
  const [showVehicle, setShowVehicle] = useState(false)
  const [showPreviousRental, setShowPreviousRental] = useState(false)

  // Selected property for filtering units
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)

  // Fetch properties for dropdown
  const { data: propertiesData, isLoading: isLoadingProperties } = useQuery(
    propertiesQueryOptions({ limit: 100 })
  )
  const properties = propertiesData?.properties ?? []

  // Fetch units for selected property
  const { data: unitsData, isLoading: isLoadingUnits } = useQuery({
    ...unitsQueryOptions({ propertyId: selectedPropertyId ?? undefined, status: 'VACANT', limit: 100 }),
    enabled: !!selectedPropertyId,
  })
  const units = unitsData?.units ?? []

  const form = useForm(createTenantSchema, {
    defaultValues: {
      status: 'APPLICANT',
      firstName: '',
      lastName: '',
      email: '',
      phone: undefined,
      altPhone: undefined,
      dateOfBirth: undefined,
      ssn: undefined,
      driversLicense: undefined,
      emergencyContactName: undefined,
      emergencyContactPhone: undefined,
      emergencyContactRelation: undefined,
      employer: undefined,
      employerPhone: undefined,
      jobTitle: undefined,
      monthlyIncome: undefined,
      previousAddress: undefined,
      previousLandlord: undefined,
      previousLandlordPhone: undefined,
      reasonForLeaving: undefined,
      vehicleMake: undefined,
      vehicleModel: undefined,
      vehicleYear: undefined,
      vehicleColor: undefined,
      licensePlate: undefined,
      preferredContactMethod: 'email',
      notes: undefined,
      imageUrl: undefined,
    },
    onSubmit: async ({ value }) => {
      try {
        const tenant = await createTenant.mutateAsync(value) as { id: string }
        toast.success('Tenant created successfully')
        navigate({
          to: '/app/tenants/$tenantId',
          params: { tenantId: tenant.id },
        })
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to create tenant'
        )
      }
    },
  })

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

      <form.Root className='max-w-none space-y-6'>
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
              <form.Field
                name='firstName'
                render={(field) => (
                  <field.Container label='First Name'>
                    <Input placeholder='e.g., Sarah' />
                  </field.Container>
                )}
              />
              <form.Field
                name='lastName'
                render={(field) => (
                  <field.Container label='Last Name'>
                    <Input placeholder='e.g., Johnson' />
                  </field.Container>
                )}
              />
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <form.Field
                name='email'
                render={(field) => (
                  <field.Container label='Email Address'>
                    <Input type='email' placeholder='e.g., sarah.j@email.com' />
                  </field.Container>
                )}
              />
              <form.Field
                name='phone'
                render={(field) => (
                  <field.Container label='Phone Number'>
                    <Input type='tel' placeholder='e.g., (612) 555-0123' />
                  </field.Container>
                )}
              />
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <form.Field
                name='altPhone'
                render={(field) => (
                  <field.Container label='Alternate Phone (optional)'>
                    <Input type='tel' placeholder='e.g., (612) 555-0124' />
                  </field.Container>
                )}
              />
              <form.Field
                name='preferredContactMethod'
                render={(field) => (
                  <field.Container label='Preferred Contact' disableController>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v as typeof field.state.value)}
                    >
                      <SelectTrigger id={field.name} name={field.name} onBlur={field.handleBlur}>
                        <SelectValue placeholder='Select method' />
                      </SelectTrigger>
                      <SelectContent>
                        {contactMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </field.Container>
                )}
              />
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <form.Field
                name='dateOfBirth'
                render={(field) => (
                  <field.Container label='Date of Birth (optional)'>
                    <Input type='date' />
                  </field.Container>
                )}
              />
              <form.Field
                name='ssn'
                render={(field) => (
                  <field.Container label='SSN Last 4 (optional)' detail='For verification purposes only'>
                    <Input
                      type='text'
                      placeholder='e.g., 1234'
                      maxLength={4}
                      pattern='[0-9]*'
                    />
                  </field.Container>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Unit Assignment - For reference only, actual lease assignment is separate */}
        <Card>
          <CardHeader>
            <CardTitle>Unit Assignment (Optional)</CardTitle>
            <CardDescription>
              Select a property and unit for reference. A formal lease will be created separately.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-4'>
                <label className='text-sm font-semibold'>Property</label>
                <Select
                  value={selectedPropertyId ?? ''}
                  onValueChange={setSelectedPropertyId}
                  disabled={isLoadingProperties}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingProperties ? 'Loading...' : 'Select property'} />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-4'>
                <label className='text-sm font-semibold'>Unit (Vacant Only)</label>
                <Select disabled={!selectedPropertyId || isLoadingUnits}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !selectedPropertyId
                          ? 'Select property first'
                          : isLoadingUnits
                            ? 'Loading...'
                            : units.length === 0
                              ? 'No vacant units'
                              : 'Select unit'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        Unit {unit.unitNumber} - {unit.bedrooms}BR/{unit.bathrooms}BA
                        {unit.sqFt && ` (${unit.sqFt} sq ft)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPropertyId && units.length === 0 && !isLoadingUnits && (
                  <p className='text-xs text-muted-foreground'>
                    No vacant units available at this property
                  </p>
                )}
              </div>
            </div>
            <p className='text-xs text-muted-foreground'>
              Note: To assign a tenant to a unit, create a lease after setting up the tenant profile.
            </p>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10'>
                <LuPhone className='size-5 text-primary' />
              </div>
              <div>
                <CardTitle>Emergency Contact</CardTitle>
                <CardDescription>Someone we can contact in case of emergency</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <form.Field
                name='emergencyContactName'
                render={(field) => (
                  <field.Container label='Contact Name'>
                    <Input placeholder='e.g., John Johnson' />
                  </field.Container>
                )}
              />
              <form.Field
                name='emergencyContactRelation'
                render={(field) => (
                  <field.Container label='Relationship' disableController>
                    <Select
                      value={field.state.value ?? ''}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger id={field.name} name={field.name} onBlur={field.handleBlur}>
                        <SelectValue placeholder='Select relationship' />
                      </SelectTrigger>
                      <SelectContent>
                        {relationships.map((rel) => (
                          <SelectItem key={rel.value} value={rel.value}>
                            {rel.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </field.Container>
                )}
              />
            </div>
            <form.Field
              name='emergencyContactPhone'
              render={(field) => (
                <field.Container label='Phone Number'>
                  <Input type='tel' placeholder='e.g., (612) 555-0999' />
                </field.Container>
              )}
            />
          </CardContent>
        </Card>

        {/* Employment Information - Collapsible */}
        <Collapsible open={showEmployment} onOpenChange={setShowEmployment}>
          <Card>
            <CardHeader>
              <CollapsibleTrigger asChild>
                <button
                  type='button'
                  className='flex w-full items-center justify-between text-left'
                >
                  <div className='flex items-center gap-3'>
                    <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10'>
                      <LuBriefcase className='size-5 text-primary' />
                    </div>
                    <div>
                      <CardTitle>Employment Information</CardTitle>
                      <CardDescription>Income verification details (optional)</CardDescription>
                    </div>
                  </div>
                  {showEmployment ? (
                    <LuChevronUp className='size-5 text-muted-foreground' />
                  ) : (
                    <LuChevronDown className='size-5 text-muted-foreground' />
                  )}
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-2'>
                  <form.Field
                    name='employer'
                    render={(field) => (
                      <field.Container label='Employer'>
                        <Input placeholder='e.g., ABC Corporation' />
                      </field.Container>
                    )}
                  />
                  <form.Field
                    name='jobTitle'
                    render={(field) => (
                      <field.Container label='Job Title'>
                        <Input placeholder='e.g., Software Engineer' />
                      </field.Container>
                    )}
                  />
                </div>
                <div className='grid gap-4 md:grid-cols-2'>
                  <form.Field
                    name='employerPhone'
                    render={(field) => (
                      <field.Container label='Employer Phone'>
                        <Input type='tel' placeholder='e.g., (612) 555-0000' />
                      </field.Container>
                    )}
                  />
                  <form.Field
                    name='monthlyIncome'
                    render={(field) => (
                      <field.Container label='Monthly Income'>
                        <Input type='number' min={0} placeholder='e.g., 5000' />
                      </field.Container>
                    )}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Vehicle Information - Collapsible */}
        <Collapsible open={showVehicle} onOpenChange={setShowVehicle}>
          <Card>
            <CardHeader>
              <CollapsibleTrigger asChild>
                <button
                  type='button'
                  className='flex w-full items-center justify-between text-left'
                >
                  <div className='flex items-center gap-3'>
                    <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10'>
                      <LuCar className='size-5 text-primary' />
                    </div>
                    <div>
                      <CardTitle>Vehicle Information</CardTitle>
                      <CardDescription>Parking registration details (optional)</CardDescription>
                    </div>
                  </div>
                  {showVehicle ? (
                    <LuChevronUp className='size-5 text-muted-foreground' />
                  ) : (
                    <LuChevronDown className='size-5 text-muted-foreground' />
                  )}
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-3'>
                  <form.Field
                    name='vehicleMake'
                    render={(field) => (
                      <field.Container label='Make'>
                        <Input placeholder='e.g., Toyota' />
                      </field.Container>
                    )}
                  />
                  <form.Field
                    name='vehicleModel'
                    render={(field) => (
                      <field.Container label='Model'>
                        <Input placeholder='e.g., Camry' />
                      </field.Container>
                    )}
                  />
                  <form.Field
                    name='vehicleYear'
                    render={(field) => (
                      <field.Container label='Year'>
                        <Input type='number' min={1900} max={2100} placeholder='e.g., 2020' />
                      </field.Container>
                    )}
                  />
                </div>
                <div className='grid gap-4 md:grid-cols-2'>
                  <form.Field
                    name='vehicleColor'
                    render={(field) => (
                      <field.Container label='Color'>
                        <Input placeholder='e.g., Silver' />
                      </field.Container>
                    )}
                  />
                  <form.Field
                    name='licensePlate'
                    render={(field) => (
                      <field.Container label='License Plate'>
                        <Input placeholder='e.g., ABC-123' />
                      </field.Container>
                    )}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Previous Rental - Collapsible */}
        <Collapsible open={showPreviousRental} onOpenChange={setShowPreviousRental}>
          <Card>
            <CardHeader>
              <CollapsibleTrigger asChild>
                <button
                  type='button'
                  className='flex w-full items-center justify-between text-left'
                >
                  <div>
                    <CardTitle>Previous Rental History</CardTitle>
                    <CardDescription>Reference information (optional)</CardDescription>
                  </div>
                  {showPreviousRental ? (
                    <LuChevronUp className='size-5 text-muted-foreground' />
                  ) : (
                    <LuChevronDown className='size-5 text-muted-foreground' />
                  )}
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className='space-y-4'>
                <form.Field
                  name='previousAddress'
                  render={(field) => (
                    <field.Container label='Previous Address'>
                      <Input placeholder='e.g., 123 Main St, Minneapolis, MN 55401' />
                    </field.Container>
                  )}
                />
                <div className='grid gap-4 md:grid-cols-2'>
                  <form.Field
                    name='previousLandlord'
                    render={(field) => (
                      <field.Container label='Previous Landlord'>
                        <Input placeholder='e.g., Jane Smith' />
                      </field.Container>
                    )}
                  />
                  <form.Field
                    name='previousLandlordPhone'
                    render={(field) => (
                      <field.Container label='Landlord Phone'>
                        <Input type='tel' placeholder='e.g., (612) 555-0001' />
                      </field.Container>
                    )}
                  />
                </div>
                <form.Field
                  name='reasonForLeaving'
                  render={(field) => (
                    <field.Container label='Reason for Leaving' disableController>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        placeholder='e.g., Relocating for work'
                        className='min-h-20'
                        value={field.state.value ?? ''}
                        onChange={(e) => field.handleChange(e.target.value || undefined)}
                        onBlur={field.handleBlur}
                      />
                    </field.Container>
                  )}
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>Any other relevant information</CardDescription>
          </CardHeader>
          <CardContent>
            <form.Field
              name='notes'
              render={(field) => (
                <field.Container disableController>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    placeholder='Enter any additional notes about the tenant...'
                    className='min-h-24'
                    value={field.state.value ?? ''}
                    onChange={(e) => field.handleChange(e.target.value || undefined)}
                    onBlur={field.handleBlur}
                  />
                </field.Container>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <Separator />
        <div className='flex justify-end gap-4'>
          <Button variant='outline' type='button' asChild>
            <Link to='/app/tenants'>Cancel</Link>
          </Button>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button type='submit' disabled={!canSubmit || isSubmitting}>
                {isSubmitting && <LuLoaderCircle className='mr-2 size-4 animate-spin' />}
                {isSubmitting ? 'Creating...' : 'Create Tenant'}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form.Root>
    </div>
  )
}
