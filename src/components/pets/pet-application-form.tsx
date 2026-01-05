import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import {
  LuDog,
  LuCat,
  LuLoaderCircle,
  LuSave,
} from 'react-icons/lu'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
import { createPetSchema, type PetType } from '~/services/pets.schema'
import { useCreatePet } from '~/services/pets.query'

interface PetApplicationFormProps {
  tenantId: string
  tenantName?: string
  onSuccess?: () => void
  onCancel?: () => void
}

const PET_TYPES: { value: PetType; label: string; icon?: any }[] = [
  { value: 'DOG', label: 'Dog', icon: LuDog },
  { value: 'CAT', label: 'Cat', icon: LuCat },
  { value: 'BIRD', label: 'Bird' },
  { value: 'FISH', label: 'Fish' },
  { value: 'REPTILE', label: 'Reptile' },
  { value: 'SMALL_MAMMAL', label: 'Small Mammal (rabbit, hamster, etc.)' },
  { value: 'OTHER', label: 'Other' },
]

export function PetApplicationForm({
  tenantId,
  tenantName,
  onSuccess,
  onCancel,
}: PetApplicationFormProps) {
  const navigate = useNavigate()
  const createPet = useCreatePet()

  const form = useForm({
    defaultValues: {
      tenantId,
      type: 'DOG' as PetType,
      name: '',
      breed: '',
      color: '',
      weight: undefined as number | undefined,
      age: undefined as number | undefined,
      vaccinated: false,
      vaccinationExpiry: undefined as string | undefined,
      rabiesTagNumber: '',
      licensedWithCity: false,
      notes: '',
    },
    validatorAdapter: zodValidator(),
    validators: {
      onSubmit: createPetSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const pet = await createPet.mutateAsync({
          ...value,
          vaccinationExpiry: value.vaccinationExpiry ? new Date(value.vaccinationExpiry) : undefined,
        })
        toast.success('Pet application submitted', {
          description: `${pet.name} has been added and is pending approval`,
        })
        onSuccess?.()
      } catch (error) {
        toast.error('Failed to submit pet application', {
          description: error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <LuDog className='size-5' />
          Pet Application
        </CardTitle>
        <CardDescription>
          {tenantName
            ? `Submit a pet application for ${tenantName}`
            : 'Submit a new pet application'}
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
          {/* Pet Type */}
          <form.Field name='type'>
            {(field) => (
              <div className='space-y-2'>
                <Label htmlFor={field.name}>Pet Type *</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as PetType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select pet type' />
                  </SelectTrigger>
                  <SelectContent>
                    {PET_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors?.length > 0 && (
                  <p className='text-sm text-destructive'>{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Pet Name */}
          <form.Field name='name'>
            {(field) => (
              <div className='space-y-2'>
                <Label htmlFor={field.name}>Pet Name *</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder='e.g., Max, Bella'
                />
                {field.state.meta.errors?.length > 0 && (
                  <p className='text-sm text-destructive'>{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Breed & Color */}
          <div className='grid gap-4 md:grid-cols-2'>
            <form.Field name='breed'>
              {(field) => (
                <div className='space-y-2'>
                  <Label htmlFor={field.name}>Breed</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder='e.g., Golden Retriever'
                  />
                </div>
              )}
            </form.Field>

            <form.Field name='color'>
              {(field) => (
                <div className='space-y-2'>
                  <Label htmlFor={field.name}>Color</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder='e.g., Golden, Black & White'
                  />
                </div>
              )}
            </form.Field>
          </div>

          {/* Weight & Age */}
          <div className='grid gap-4 md:grid-cols-2'>
            <form.Field name='weight'>
              {(field) => (
                <div className='space-y-2'>
                  <Label htmlFor={field.name}>Weight (lbs)</Label>
                  <Input
                    id={field.name}
                    type='number'
                    value={field.state.value ?? ''}
                    onChange={(e) =>
                      field.handleChange(e.target.value ? Number(e.target.value) : undefined)
                    }
                    placeholder='e.g., 50'
                    min={0}
                    max={500}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name='age'>
              {(field) => (
                <div className='space-y-2'>
                  <Label htmlFor={field.name}>Age (years)</Label>
                  <Input
                    id={field.name}
                    type='number'
                    value={field.state.value ?? ''}
                    onChange={(e) =>
                      field.handleChange(e.target.value ? Number(e.target.value) : undefined)
                    }
                    placeholder='e.g., 3'
                    min={0}
                    max={50}
                  />
                </div>
              )}
            </form.Field>
          </div>

          {/* Vaccination */}
          <div className='space-y-4 rounded-lg border p-4'>
            <h4 className='font-medium'>Vaccination & Registration</h4>

            <div className='grid gap-4 md:grid-cols-2'>
              <form.Field name='vaccinated'>
                {(field) => (
                  <div className='flex items-center justify-between'>
                    <Label htmlFor={field.name}>Vaccinations Current</Label>
                    <Switch
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name='licensedWithCity'>
                {(field) => (
                  <div className='flex items-center justify-between'>
                    <Label htmlFor={field.name}>Licensed with City</Label>
                    <Switch
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <form.Field name='vaccinationExpiry'>
                {(field) => (
                  <div className='space-y-2'>
                    <Label htmlFor={field.name}>Vaccination Expiry Date</Label>
                    <Input
                      id={field.name}
                      type='date'
                      value={field.state.value ?? ''}
                      onChange={(e) => field.handleChange(e.target.value || undefined)}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name='rabiesTagNumber'>
                {(field) => (
                  <div className='space-y-2'>
                    <Label htmlFor={field.name}>Rabies Tag Number</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder='e.g., MN-2024-12345'
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </div>

          {/* Notes */}
          <form.Field name='notes'>
            {(field) => (
              <div className='space-y-2'>
                <Label htmlFor={field.name}>Additional Notes</Label>
                <Textarea
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder='Any additional information about the pet...'
                  rows={3}
                />
              </div>
            )}
          </form.Field>

          {/* Actions */}
          <div className='flex justify-end gap-3'>
            {onCancel && (
              <Button type='button' variant='outline' onClick={onCancel}>
                Cancel
              </Button>
            )}
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type='submit' disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <LuLoaderCircle className='mr-2 size-4 animate-spin' />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <LuSave className='mr-2 size-4' />
                      Submit Application
                    </>
                  )}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
