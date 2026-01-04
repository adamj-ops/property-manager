import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import {
  LuArrowLeft,
  LuArrowRight,
  LuBuilding2,
  LuCalendar,
  LuCheck,
  LuCircleAlert,
  LuDollarSign,
  LuFileText,
  LuLoaderCircle,
  LuStar,
  LuUser,
} from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { useForm } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Typography } from '~/components/ui/typography'
import { cn } from '~/libs/utils'
import { propertiesQueryOptions } from '~/services/properties.query'
import { unitsQueryOptions } from '~/services/units.query'
import { tenantsQueryOptions } from '~/services/tenants.query'
import { templatesQueryOptions } from '~/services/lease-templates.query'
import { useCreateLease } from '~/services/leases.query'
import { createLeaseSchema } from '~/services/leases.schema'
import { TEMPLATE_TYPE_LABELS, type LeaseTemplateType } from '~/services/lease-templates.schema'

export const Route = createFileRoute('/app/leases/new')({
  component: NewLeasePage,
})

const STEPS = [
  { id: 1, label: 'Property', icon: LuBuilding2 },
  { id: 2, label: 'Tenant', icon: LuUser },
  { id: 3, label: 'Terms', icon: LuCalendar },
  { id: 4, label: 'Documents', icon: LuFileText },
  { id: 5, label: 'Review', icon: LuCheck },
]

const LEASE_DURATIONS = [
  { value: '12', label: '12 months' },
  { value: '24', label: '24 months' },
  { value: '6', label: '6 months' },
  { value: '3', label: '3 months' },
  { value: 'month', label: 'Month-to-month' },
]

const UTILITIES = [
  { value: 'electric', label: 'Electric' },
  { value: 'gas', label: 'Gas' },
  { value: 'water', label: 'Water/Sewer' },
  { value: 'trash', label: 'Trash' },
  { value: 'internet', label: 'Internet' },
  { value: 'cable', label: 'Cable' },
]

function NewLeasePage() {
  const navigate = useNavigate()
  const createLease = useCreateLease()

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1)

  // Selection state for dropdowns (not form-bound for dependent queries)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
  const [selectedMainTemplate, setSelectedMainTemplate] = useState<string | null>(null)
  const [selectedAddenda, setSelectedAddenda] = useState<string[]>([])
  const [leaseDuration, setLeaseDuration] = useState('12')
  const [utilitiesTenantPays, setUtilitiesTenantPays] = useState<string[]>([])

  // Fetch data
  const { data: propertiesData, isLoading: isLoadingProperties } = useQuery(
    propertiesQueryOptions({ limit: 100 })
  )
  const properties = propertiesData?.properties ?? []

  const { data: unitsData, isLoading: isLoadingUnits } = useQuery({
    ...unitsQueryOptions({ propertyId: selectedPropertyId ?? undefined, status: 'VACANT', limit: 100 }),
    enabled: !!selectedPropertyId,
  })
  const units = unitsData?.units ?? []

  const { data: tenantsData, isLoading: isLoadingTenants } = useQuery(
    tenantsQueryOptions({ limit: 100 })
  )
  const tenants = tenantsData?.tenants ?? []

  const { data: templatesData } = useQuery(
    templatesQueryOptions({ isActive: true, isArchived: false, limit: 100, offset: 0 })
  )
  const templates = templatesData?.templates || []
  const mainLeaseTemplates = templates.filter((t) => t.type === 'MAIN_LEASE')
  const addendaTemplates = templates.filter((t) => t.type !== 'MAIN_LEASE')

  // Get selected items for display
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId)
  const selectedUnit = units.find((u) => u.id === selectedUnitId)
  const selectedTenant = tenants.find((t: any) => t.id === selectedTenantId)
  const selectedTemplate = templates.find((t) => t.id === selectedMainTemplate)

  // Calculate end date based on start date and duration
  const calculateEndDate = (startDate: Date, duration: string): Date => {
    const end = new Date(startDate)
    if (duration === 'month') {
      end.setMonth(end.getMonth() + 1)
    } else {
      end.setMonth(end.getMonth() + parseInt(duration))
    }
    end.setDate(end.getDate() - 1)
    return end
  }

  // Form setup
  const form = useForm(createLeaseSchema, {
    defaultValues: {
      unitId: '',
      tenantId: '',
      status: 'DRAFT',
      type: 'FIXED_TERM',
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      monthlyRent: 0,
      rentDueDay: 1,
      lateFeeAmount: 50,
      lateFeeGraceDays: 5,
      securityDeposit: 0,
      depositInterestRate: 0.01,
      petsAllowed: false,
      petDeposit: undefined,
      petRent: undefined,
      utilitiesTenantPays: [],
      utilitiesOwnerPays: [],
      parkingIncluded: false,
      parkingFee: undefined,
      storageIncluded: false,
      storageFee: undefined,
      autoRenew: false,
      renewalNoticeDays: 60,
      notes: undefined,
    },
    onSubmit: async ({ value }) => {
      // Validate selections
      if (!selectedUnitId || !selectedTenantId) {
        toast.error('Please select a unit and tenant')
        return
      }

      try {
        const lease = await createLease.mutateAsync({
          ...value,
          unitId: selectedUnitId,
          tenantId: selectedTenantId,
          utilitiesTenantPays,
          endDate: calculateEndDate(value.startDate, leaseDuration),
          type: leaseDuration === 'month' ? 'MONTH_TO_MONTH' : 'FIXED_TERM',
        }) as { id: string }

        toast.success('Lease created successfully')
        navigate({
          to: '/app/leases/$leaseId',
          params: { leaseId: lease.id },
        })
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to create lease'
        )
      }
    },
  })

  // Step validation
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return !!selectedPropertyId && !!selectedUnitId
      case 2:
        return !!selectedTenantId && selectedTenantId !== '__new__'
      case 3:
        return form.state.values.monthlyRent > 0 && form.state.values.securityDeposit >= 0
      case 4:
        return true // Templates optional
      case 5:
        return true
      default:
        return false
    }
  }

  const toggleAddendum = (id: string) => {
    setSelectedAddenda((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const toggleUtility = (utility: string) => {
    setUtilitiesTenantPays((prev) =>
      prev.includes(utility) ? prev.filter((u) => u !== utility) : [...prev, utility]
    )
  }

  // Navigation
  const goToNextStep = () => {
    if (canProceedToNextStep() && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className='w-full max-w-3xl space-y-6 py-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/app/leases'>
            <LuArrowLeft className='size-4' />
          </Link>
        </Button>
        <div>
          <Typography.H2>Create New Lease</Typography.H2>
          <Typography.Muted>Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].label}</Typography.Muted>
        </div>
      </div>

      {/* Progress Steps */}
      <div className='flex items-center justify-between'>
        {STEPS.map((step, idx) => (
          <div key={step.id} className='flex items-center'>
            <div
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                currentStep === step.id && 'text-primary',
                currentStep > step.id && 'text-green-600'
              )}
              onClick={() => step.id < currentStep && setCurrentStep(step.id)}
            >
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full',
                  currentStep === step.id && 'bg-primary text-primary-foreground',
                  currentStep > step.id && 'bg-green-100 text-green-600',
                  currentStep < step.id && 'bg-muted text-muted-foreground'
                )}
              >
                {currentStep > step.id ? (
                  <LuCheck className='size-4' />
                ) : (
                  <step.icon className='size-4' />
                )}
              </div>
              <span className={cn(
                'text-sm hidden md:block',
                currentStep === step.id && 'font-medium',
                currentStep < step.id && 'text-muted-foreground'
              )}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <Separator className='flex-1 mx-2 md:mx-4 w-8 md:w-12' />
            )}
          </div>
        ))}
      </div>

      <form.Root className='max-w-none space-y-6'>
        {/* Step 1: Property & Unit */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <LuBuilding2 className='size-5' />
                Property & Unit Selection
              </CardTitle>
              <CardDescription>
                Select the property and an available unit for this lease
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-4'>
                <label className='text-sm font-semibold'>Property</label>
                <Select
                  value={selectedPropertyId ?? ''}
                  onValueChange={(value) => {
                    setSelectedPropertyId(value)
                    setSelectedUnitId(null) // Reset unit when property changes
                  }}
                  disabled={isLoadingProperties}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingProperties ? 'Loading...' : 'Select a property'} />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        <div className='flex items-center gap-2'>
                          <LuBuilding2 className='size-4 text-muted-foreground' />
                          {property.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProperty && (
                  <p className='text-xs text-muted-foreground'>
                    {selectedProperty.addressLine1}, {selectedProperty.city}, {selectedProperty.state}
                  </p>
                )}
              </div>

              <div className='space-y-4'>
                <label className='text-sm font-semibold'>Unit (Vacant Only)</label>
                <Select
                  value={selectedUnitId ?? ''}
                  onValueChange={setSelectedUnitId}
                  disabled={!selectedPropertyId || isLoadingUnits}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !selectedPropertyId
                          ? 'Select a property first'
                          : isLoadingUnits
                            ? 'Loading units...'
                            : units.length === 0
                              ? 'No vacant units available'
                              : 'Select a unit'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        Unit {unit.unitNumber} - {unit.bedrooms}BR/{unit.bathrooms}BA
                        {unit.sqFt && ` (${unit.sqFt} sq ft)`}
                        {unit.marketRent && ` - $${unit.marketRent}/mo`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPropertyId && units.length === 0 && !isLoadingUnits && (
                  <p className='text-xs text-destructive'>
                    No vacant units available at this property.
                  </p>
                )}
                {selectedUnit && (
                  <div className='rounded-lg bg-muted p-4 space-y-2'>
                    <p className='font-medium'>Unit {selectedUnit.unitNumber}</p>
                    <div className='grid grid-cols-2 gap-2 text-sm text-muted-foreground'>
                      <span>{selectedUnit.bedrooms} Bedroom(s)</span>
                      <span>{selectedUnit.bathrooms} Bathroom(s)</span>
                      {selectedUnit.sqFt && <span>{selectedUnit.sqFt} sq ft</span>}
                      {selectedUnit.marketRent && (
                        <span className='text-green-600 font-medium'>
                          Market rent: ${selectedUnit.marketRent}/mo
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Tenant Selection */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <LuUser className='size-5' />
                Tenant Selection
              </CardTitle>
              <CardDescription>
                Select an existing tenant or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-4'>
                <label className='text-sm font-semibold'>Primary Tenant</label>
                <Select
                  value={selectedTenantId ?? ''}
                  onValueChange={setSelectedTenantId}
                  disabled={isLoadingTenants}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingTenants ? 'Loading...' : 'Select a tenant'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='__new__'>
                      <span className='text-primary font-medium'>+ Create New Tenant</span>
                    </SelectItem>
                    {tenants.map((tenant: any) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        <div className='flex flex-col'>
                          <span>{tenant.firstName} {tenant.lastName}</span>
                          <span className='text-xs text-muted-foreground'>{tenant.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTenantId === '__new__' && (
                <div className='rounded-lg border border-dashed p-4 text-center'>
                  <p className='text-sm text-muted-foreground mb-4'>
                    You'll need to create a new tenant first
                  </p>
                  <Button asChild>
                    <Link to='/app/tenants/new'>Create New Tenant</Link>
                  </Button>
                </div>
              )}

              {selectedTenant && selectedTenantId !== '__new__' && (
                <div className='rounded-lg bg-muted p-4 space-y-2'>
                  <p className='font-medium'>{selectedTenant.firstName} {selectedTenant.lastName}</p>
                  <div className='text-sm text-muted-foreground space-y-1'>
                    <p>{selectedTenant.email}</p>
                    {selectedTenant.phone && <p>{selectedTenant.phone}</p>}
                    <Badge variant='secondary'>{selectedTenant.status}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Lease Terms */}
        {currentStep === 3 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <LuCalendar className='size-5' />
                  Lease Term
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-2'>
                  <form.Field
                    name='startDate'
                    render={(field) => (
                      <field.Container label='Start Date'>
                        <Input type='date' />
                      </field.Container>
                    )}
                  />
                  <div className='space-y-4'>
                    <label className='text-sm font-semibold'>Lease Duration</label>
                    <Select value={leaseDuration} onValueChange={setLeaseDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEASE_DURATIONS.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className='rounded-lg bg-muted p-4'>
                  <p className='text-sm'>
                    <span className='font-medium'>End Date:</span>{' '}
                    {calculateEndDate(form.state.values.startDate, leaseDuration).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <form.Field
                  name='autoRenew'
                  render={(field) => (
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='autoRenew'
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(!!checked)}
                      />
                      <label htmlFor='autoRenew' className='text-sm'>
                        Enable auto-renewal (60-day notice required to opt-out)
                      </label>
                    </div>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <LuDollarSign className='size-5' />
                  Financial Terms
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-2'>
                  <form.Field
                    name='monthlyRent'
                    render={(field) => (
                      <field.Container label='Monthly Rent'>
                        <div className='relative'>
                          <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>$</span>
                          <Input type='number' min={0} placeholder='1,250.00' className='pl-7' />
                        </div>
                      </field.Container>
                    )}
                  />
                  <form.Field
                    name='securityDeposit'
                    render={(field) => (
                      <field.Container label='Security Deposit'>
                        <div className='relative'>
                          <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>$</span>
                          <Input type='number' min={0} placeholder='1,250.00' className='pl-7' />
                        </div>
                      </field.Container>
                    )}
                  />
                </div>
                <div className='grid gap-4 md:grid-cols-2'>
                  <form.Field
                    name='lateFeeAmount'
                    render={(field) => (
                      <field.Container label='Late Fee (max $50 per MN law)'>
                        <div className='relative'>
                          <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>$</span>
                          <Input type='number' min={0} max={50} placeholder='50.00' className='pl-7' />
                        </div>
                      </field.Container>
                    )}
                  />
                  <form.Field
                    name='lateFeeGraceDays'
                    render={(field) => (
                      <field.Container label='Grace Period (days)'>
                        <Input type='number' min={0} placeholder='5' />
                      </field.Container>
                    )}
                  />
                </div>

                <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
                  <h4 className='font-medium text-green-800 flex items-center gap-2'>
                    <LuCheck className='size-4' />
                    MN Compliance
                  </h4>
                  <div className='mt-2 space-y-1 text-sm text-green-700'>
                    <p className='flex items-center gap-2'>
                      <LuCheck className='size-3' />
                      Late fee capped at $50 (MN Statute 504B.177)
                    </p>
                    <p className='flex items-center gap-2'>
                      <LuCheck className='size-3' />
                      1% annual interest on security deposit
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Utilities (Tenant Pays)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                  {UTILITIES.map((utility) => (
                    <div
                      key={utility.value}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors',
                        utilitiesTenantPays.includes(utility.value)
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-muted-foreground/50'
                      )}
                      onClick={() => toggleUtility(utility.value)}
                    >
                      <Checkbox
                        checked={utilitiesTenantPays.includes(utility.value)}
                        onCheckedChange={() => toggleUtility(utility.value)}
                      />
                      <span className='text-sm'>{utility.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pet Policy</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <form.Field
                  name='petsAllowed'
                  render={(field) => (
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='petsAllowed'
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(!!checked)}
                      />
                      <label htmlFor='petsAllowed' className='text-sm'>
                        Allow pets on this lease
                      </label>
                    </div>
                  )}
                />
                {form.state.values.petsAllowed && (
                  <div className='grid gap-4 md:grid-cols-2'>
                    <form.Field
                      name='petDeposit'
                      render={(field) => (
                        <field.Container label='Pet Deposit'>
                          <div className='relative'>
                            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>$</span>
                            <Input type='number' min={0} placeholder='250' className='pl-7' />
                          </div>
                        </field.Container>
                      )}
                    />
                    <form.Field
                      name='petRent'
                      render={(field) => (
                        <field.Container label='Monthly Pet Rent'>
                          <div className='relative'>
                            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>$</span>
                            <Input type='number' min={0} placeholder='50' className='pl-7' />
                          </div>
                        </field.Container>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 4: Documents/Templates */}
        {currentStep === 4 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <LuFileText className='size-5' />
                  Lease Template
                </CardTitle>
                <CardDescription>
                  Select a template for the lease document (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {mainLeaseTemplates.length > 0 ? (
                  <div className='grid gap-3'>
                    {mainLeaseTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={cn(
                          'flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors',
                          selectedMainTemplate === template.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-muted-foreground/50'
                        )}
                        onClick={() => setSelectedMainTemplate(template.id)}
                      >
                        <div className='flex items-center gap-3'>
                          <LuFileText className='size-5 text-muted-foreground' />
                          <div>
                            <p className='font-medium'>{template.name}</p>
                            <p className='text-xs text-muted-foreground'>
                              v{template.version} • {template.variables?.length || 0} variables
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          {template.is_default && (
                            <Badge variant='secondary' className='gap-1'>
                              <LuStar className='size-3' />
                              Default
                            </Badge>
                          )}
                          {selectedMainTemplate === template.id && (
                            <div className='size-5 rounded-full bg-primary flex items-center justify-center'>
                              <LuCheck className='size-3 text-primary-foreground' />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='rounded-lg border border-dashed p-6 text-center'>
                    <LuFileText className='mx-auto size-8 text-muted-foreground/50' />
                    <p className='mt-2 text-sm font-medium'>No templates available</p>
                    <p className='text-xs text-muted-foreground'>
                      You can create a lease without a template
                    </p>
                    <Button variant='outline' size='sm' className='mt-4' asChild>
                      <Link to='/app/leases/templates'>Manage Templates</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Addenda</CardTitle>
                <CardDescription>
                  Select addenda to include ({selectedAddenda.length} selected)
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                {addendaTemplates.length > 0 ? (
                  <div className='grid gap-2 md:grid-cols-2'>
                    {addendaTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                          selectedAddenda.includes(template.id)
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-muted-foreground/50'
                        )}
                        onClick={() => toggleAddendum(template.id)}
                      >
                        <Checkbox
                          checked={selectedAddenda.includes(template.id)}
                          onCheckedChange={() => toggleAddendum(template.id)}
                        />
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-medium truncate'>{template.name}</p>
                          <p className='text-xs text-muted-foreground'>
                            {TEMPLATE_TYPE_LABELS[template.type as LeaseTemplateType]}
                          </p>
                        </div>
                        {template.is_default && (
                          <Badge variant='outline' className='text-xs shrink-0'>
                            Recommended
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='rounded-lg border border-dashed p-4 text-center'>
                    <p className='text-sm text-muted-foreground'>
                      No addenda templates available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 5: Review */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <LuCheck className='size-5' />
                Review Lease Details
              </CardTitle>
              <CardDescription>
                Review all information before creating the lease
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-2'>
                <h4 className='font-medium'>Property & Unit</h4>
                <div className='rounded-lg bg-muted p-4'>
                  <p className='font-medium'>{selectedProperty?.name}</p>
                  <p className='text-sm text-muted-foreground'>
                    Unit {selectedUnit?.unitNumber} - {selectedUnit?.bedrooms}BR/{selectedUnit?.bathrooms}BA
                  </p>
                </div>
              </div>

              <div className='space-y-2'>
                <h4 className='font-medium'>Tenant</h4>
                <div className='rounded-lg bg-muted p-4'>
                  <p className='font-medium'>{selectedTenant?.firstName} {selectedTenant?.lastName}</p>
                  <p className='text-sm text-muted-foreground'>{selectedTenant?.email}</p>
                </div>
              </div>

              <div className='space-y-2'>
                <h4 className='font-medium'>Lease Terms</h4>
                <div className='rounded-lg bg-muted p-4 grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <p className='text-muted-foreground'>Start Date</p>
                    <p className='font-medium'>
                      {form.state.values.startDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className='text-muted-foreground'>End Date</p>
                    <p className='font-medium'>
                      {calculateEndDate(form.state.values.startDate, leaseDuration).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className='text-muted-foreground'>Monthly Rent</p>
                    <p className='font-medium'>${form.state.values.monthlyRent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className='text-muted-foreground'>Security Deposit</p>
                    <p className='font-medium'>${form.state.values.securityDeposit.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
                <h4 className='font-medium text-yellow-800 flex items-center gap-2'>
                  <LuCircleAlert className='size-4' />
                  Before You Submit
                </h4>
                <ul className='mt-2 space-y-1 text-sm text-yellow-700 list-disc list-inside'>
                  <li>This lease will be created in DRAFT status</li>
                  <li>You'll need to finalize and send for signatures</li>
                  <li>The tenant will receive email notification when ready</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className='flex justify-between'>
          {currentStep === 1 ? (
            <Button variant='outline' asChild>
              <Link to='/app/leases'>Cancel</Link>
            </Button>
          ) : (
            <Button variant='outline' type='button' onClick={goToPreviousStep}>
              <LuArrowLeft className='mr-2 size-4' />
              Previous
            </Button>
          )}
          <div className='flex gap-2'>
            {currentStep < STEPS.length ? (
              <Button
                type='button'
                onClick={goToNextStep}
                disabled={!canProceedToNextStep()}
              >
                Next
                <LuArrowRight className='ml-2 size-4' />
              </Button>
            ) : (
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Button type='submit' disabled={!canSubmit || isSubmitting}>
                    {isSubmitting && <LuLoaderCircle className='mr-2 size-4 animate-spin' />}
                    {isSubmitting ? 'Creating...' : 'Create Lease'}
                  </Button>
                )}
              </form.Subscribe>
            )}
          </div>
        </div>
      </form.Root>
    </div>
  )
}
