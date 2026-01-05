import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-adapter'
import { useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { LuCalendar, LuClipboardCheck, LuLoaderCircle } from 'react-icons/lu'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { propertiesQueryOptions } from '~/services/properties.query'
import { useCreateInspection } from '~/services/inspections.query'
import { createInspectionSchema, INSPECTION_TYPES, type InspectionType } from '~/services/inspections.schema'

interface InspectionFormProps {
  defaultPropertyId?: string
  defaultUnitId?: string
  defaultType?: InspectionType
}

export function InspectionForm({
  defaultPropertyId,
  defaultUnitId,
  defaultType,
}: InspectionFormProps) {
  const navigate = useNavigate()
  const createInspection = useCreateInspection()

  const { data: propertiesData } = useSuspenseQuery(propertiesQueryOptions({}))
  const properties = propertiesData?.properties || []

  const form = useForm({
    defaultValues: {
      propertyId: defaultPropertyId || '',
      unitId: defaultUnitId || '',
      type: defaultType || ('' as InspectionType),
      scheduledDate: '',
      notes: '',
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      try {
        const result = await createInspection.mutateAsync({
          propertyId: value.propertyId,
          unitId: value.unitId || undefined,
          type: value.type,
          scheduledDate: value.scheduledDate ? new Date(value.scheduledDate) : undefined,
          notes: value.notes || undefined,
        })
        toast.success('Inspection created', {
          description: 'You can now start the inspection',
        })
        navigate({
          to: '/app/inspections/$inspectionId',
          params: { inspectionId: result.id },
        })
      } catch (error) {
        toast.error('Failed to create inspection', {
          description: error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
  })

  // Get selected property to show units
  const selectedPropertyId = form.useStore((state) => state.values.propertyId)
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId)
  const units = selectedProperty?.units || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <LuClipboardCheck className='size-5' />
          New Inspection
        </CardTitle>
        <CardDescription>
          Schedule a new property inspection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className='space-y-6'
        >
          {/* Property Selection */}
          <form.Field
            name='propertyId'
            validators={{
              onChange: createInspectionSchema.shape.propertyId,
            }}
          >
            {(field) => (
              <div className='space-y-2'>
                <Label htmlFor={field.name}>
                  Property <span className='text-destructive'>*</span>
                </Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => {
                    field.handleChange(value)
                    // Reset unit when property changes
                    form.setFieldValue('unitId', '')
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a property' />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors?.length > 0 && (
                  <p className='text-sm text-destructive'>
                    {field.state.meta.errors.join(', ')}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Unit Selection (optional) */}
          {units.length > 0 && (
            <form.Field name='unitId'>
              {(field) => (
                <div className='space-y-2'>
                  <Label htmlFor={field.name}>Unit (Optional)</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select a unit (or leave for whole property)' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=''>Whole Property</SelectItem>
                      {units.map((unit: any) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          Unit {unit.unitNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
          )}

          {/* Inspection Type */}
          <form.Field
            name='type'
            validators={{
              onChange: createInspectionSchema.shape.type,
            }}
          >
            {(field) => (
              <div className='space-y-2'>
                <Label htmlFor={field.name}>
                  Inspection Type <span className='text-destructive'>*</span>
                </Label>
                <Select
                  value={field.state.value}
                  onValueChange={field.handleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select inspection type' />
                  </SelectTrigger>
                  <SelectContent>
                    {INSPECTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors?.length > 0 && (
                  <p className='text-sm text-destructive'>
                    {field.state.meta.errors.join(', ')}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Scheduled Date */}
          <form.Field name='scheduledDate'>
            {(field) => (
              <div className='space-y-2'>
                <Label htmlFor={field.name} className='flex items-center gap-2'>
                  <LuCalendar className='size-4' />
                  Scheduled Date (Optional)
                </Label>
                <Input
                  type='datetime-local'
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          {/* Notes */}
          <form.Field name='notes'>
            {(field) => (
              <div className='space-y-2'>
                <Label htmlFor={field.name}>Notes (Optional)</Label>
                <Textarea
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder='Add any notes about this inspection...'
                  rows={3}
                />
              </div>
            )}
          </form.Field>

          {/* Submit */}
          <div className='flex justify-end gap-3'>
            <Button
              type='button'
              variant='outline'
              onClick={() => navigate({ to: '/app/inspections' })}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={createInspection.isPending}>
              {createInspection.isPending ? (
                <LuLoaderCircle className='mr-2 size-4 animate-spin' />
              ) : (
                <LuClipboardCheck className='mr-2 size-4' />
              )}
              Create Inspection
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
