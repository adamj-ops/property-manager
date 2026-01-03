import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { LuCircleAlert, LuArrowLeft, LuCheck, LuFileText, LuStar } from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Typography } from '~/components/ui/typography'
import { cn } from '~/libs/utils'
import { TEMPLATE_TYPE_LABELS, type LeaseTemplateType } from '~/services/lease-templates.schema'
import { templatesQueryOptions } from '~/services/lease-templates.query'

export const Route = createFileRoute('/app/leases/new')({
  component: NewLeasePage,
})

function NewLeasePage() {
  const [selectedMainTemplate, setSelectedMainTemplate] = useState<string | null>(null)
  const [selectedAddenda, setSelectedAddenda] = useState<string[]>([])

  // Fetch available templates
  const { data: templatesData } = useQuery(
    templatesQueryOptions({ isActive: true, isArchived: false, limit: 100, offset: 0 })
  )

  const templates = templatesData?.templates || []
  const mainLeaseTemplates = templates.filter((t) => t.type === 'MAIN_LEASE')
  const addendaTemplates = templates.filter((t) => t.type !== 'MAIN_LEASE')

  const toggleAddendum = (id: string) => {
    setSelectedAddenda((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  return (
    <div className='w-full max-w-3xl space-y-6 py-6'>
      {/* Back Button & Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/app/leases'>
            <LuArrowLeft className='size-4' />
          </Link>
        </Button>
        <div>
          <Typography.H2>Create New Lease</Typography.H2>
          <Typography.Muted>Step 1 of 4: Basic Information</Typography.Muted>
        </div>
      </div>

      {/* Progress Steps */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground'>
            1
          </div>
          <span className='text-sm font-medium'>Basic Info</span>
        </div>
        <Separator className='flex-1 mx-4' />
        <div className='flex items-center gap-2'>
          <div className='flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground'>2</div>
          <span className='text-sm text-muted-foreground'>Financial</span>
        </div>
        <Separator className='flex-1 mx-4' />
        <div className='flex items-center gap-2'>
          <div className='flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground'>3</div>
          <span className='text-sm text-muted-foreground'>Addenda</span>
        </div>
        <Separator className='flex-1 mx-4' />
        <div className='flex items-center gap-2'>
          <div className='flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground'>4</div>
          <span className='text-sm text-muted-foreground'>Review</span>
        </div>
      </div>

      <form className='space-y-6'>
        {/* Property & Unit */}
        <Card>
          <CardHeader>
            <CardTitle>Property Information</CardTitle>
            <CardDescription>Select the property and unit for this lease</CardDescription>
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
                    <SelectItem value='101'>Unit 101 - 2BR/1BA (850 sq ft)</SelectItem>
                    <SelectItem value='103'>Unit 103 - 2BR/1BA (Vacant)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tenant Information */}
        <Card>
          <CardHeader>
            <CardTitle>Tenant Information</CardTitle>
            <CardDescription>Select or add tenants for this lease</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='tenant'>Primary Tenant</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder='Select existing tenant or add new' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='new'>+ Add New Tenant</SelectItem>
                  <SelectItem value='1'>Sarah Johnson (sarah.j@email.com)</SelectItem>
                  <SelectItem value='2'>Mike Chen (mike.chen@email.com)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center space-x-2'>
              <Checkbox id='coTenant' />
              <Label htmlFor='coTenant' className='text-sm'>
                Add co-tenant to this lease
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Lease Term */}
        <Card>
          <CardHeader>
            <CardTitle>Lease Term</CardTitle>
            <CardDescription>Set the duration of the lease</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='startDate'>Start Date</Label>
                <Input id='startDate' type='date' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='duration'>Lease Duration</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder='Select duration' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='12'>12 months</SelectItem>
                    <SelectItem value='6'>6 months</SelectItem>
                    <SelectItem value='month'>Month-to-month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='rounded-lg bg-muted p-4'>
              <p className='text-sm text-muted-foreground'>
                <span className='font-medium'>End Date:</span> December 31, 2025 (auto-calculated)
              </p>
            </div>
            <div className='flex items-center space-x-2'>
              <Checkbox id='autoRenewal' />
              <Label htmlFor='autoRenewal' className='text-sm'>
                Enable auto-renewal (tenant must opt-out 60 days before expiration)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Financial Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Terms</CardTitle>
            <CardDescription>Set rent and deposit amounts</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='rent'>Monthly Rent</Label>
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>$</span>
                  <Input id='rent' type='number' placeholder='1,250.00' className='pl-7' />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='deposit'>Security Deposit</Label>
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>$</span>
                  <Input id='deposit' type='number' placeholder='1,250.00' className='pl-7' />
                </div>
                <p className='text-xs text-muted-foreground'>Recommended: Equal to 1x monthly rent</p>
              </div>
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='lateFee'>Late Fee</Label>
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>$</span>
                  <Input id='lateFee' type='number' placeholder='50.00' className='pl-7' />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='gracePeriod'>Grace Period (days)</Label>
                <Input id='gracePeriod' type='number' placeholder='5' />
              </div>
            </div>

            {/* Compliance Check */}
            <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
              <h4 className='font-medium text-green-800 flex items-center gap-2'>
                <LuCheck className='size-4' />
                Compliance Check
              </h4>
              <div className='mt-2 space-y-1 text-sm text-green-700'>
                <p className='flex items-center gap-2'>
                  <LuCheck className='size-3' />
                  Late fee complies with MN Statute 504B.177 (max $50)
                </p>
                <p className='flex items-center gap-2'>
                  <LuCheck className='size-3' />
                  Security deposit interest calculation enabled
                </p>
                <p className='flex items-center gap-2'>
                  <LuCheck className='size-3' />
                  Brooklyn Center rental license on file
                </p>
              </div>
            </div>

            {/* Lead Paint Warning */}
            <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
              <h4 className='font-medium text-yellow-800 flex items-center gap-2'>
                <LuCircleAlert className='size-4' />
                Lead Paint Disclosure Required
              </h4>
              <p className='mt-1 text-sm text-yellow-700'>
                This property was built in 1975 (pre-1978). Federal law requires a lead paint disclosure.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lease Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <LuFileText className='size-5' />
              Lease Template
            </CardTitle>
            <CardDescription>
              Select a template for the lease document
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedMainTemplate(template.id)
                      }
                    }}
                    role="button"
                    tabIndex={0}
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
                  Import a lease template to generate documents
                </p>
                <Button variant='outline' size='sm' className='mt-4' asChild>
                  <Link to='/app/leases/templates'>Manage Templates</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Addenda Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Addenda</CardTitle>
            <CardDescription>
              Select addenda to include with this lease ({selectedAddenda.length} selected)
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        toggleAddendum(template.id)
                      }
                    }}
                    role="button"
                    tabIndex={0}
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
                <Button variant='link' size='sm' asChild>
                  <Link to='/app/leases/templates'>Import addenda</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className='flex justify-between'>
          <Button variant='outline' asChild>
            <Link to='/app/leases'>Cancel</Link>
          </Button>
          <div className='flex gap-2'>
            <Button variant='outline'>Save Draft</Button>
            <Button type='submit'>Continue to Addenda</Button>
          </div>
        </div>
      </form>
    </div>
  )
}
