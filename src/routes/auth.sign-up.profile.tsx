import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useTranslations } from 'use-intl'
import { z } from 'zod'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { useForm } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { InputPhone } from '~/components/ui/input-phone'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { tKey } from '~/libs/i18n'
import { completeBusinessProfile } from '~/server/onboarding'

export const Route = createFileRoute('/auth/sign-up/profile')({
  beforeLoad: ({ context }) => {
    // Must be authenticated to access this page
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/auth/sign-up' })
    }
    // Note: Full onboarding check is done in /app route guard
  },
  component: BusinessProfileRoute,
})

const roleOptions = [
  { value: 'property_manager', label: 'Property Manager' },
  { value: 'owner', label: 'Property Owner' },
  { value: 'leasing_agent', label: 'Leasing Agent' },
  { value: 'portfolio_manager', label: 'Portfolio Manager' },
  { value: 'other', label: 'Other' },
]

const unitsOptions = [
  { value: '1-10', label: '1-10 units' },
  { value: '11-50', label: '11-50 units' },
  { value: '51-200', label: '51-200 units' },
  { value: '200+', label: '200+ units' },
]

const reasonOptions = [
  { value: 'switching', label: 'Switching from another platform' },
  { value: 'new_business', label: 'Starting a new property management business' },
  { value: 'spreadsheets', label: 'Currently using spreadsheets/manual systems' },
  { value: 'scaling', label: 'Scaling up my current operation' },
  { value: 'new_properties', label: 'Just acquired new properties' },
  { value: 'compliance', label: 'Looking for better compliance tools' },
  { value: 'other', label: 'Other' },
]

const platformOptions = [
  { value: 'buildium', label: 'Buildium' },
  { value: 'appfolio', label: 'AppFolio' },
  { value: 'rent_manager', label: 'Rent Manager' },
  { value: 'tenantcloud', label: 'TenantCloud' },
  { value: 'propertyware', label: 'Propertyware' },
  { value: 'other', label: 'Other' },
]

const businessProfileSchema = (t = tKey) => z.object({
  companyName: z.string().min(2, t('onboarding.company-name-required')),
  fullName: z.string().min(2, t('onboarding.full-name-required')),
  phone: z.string().min(10, t('onboarding.phone-required')),
  userRole: z.string().optional(),
  unitsManaged: z.string().min(1, t('onboarding.units-required')),
  signupReason: z.string().min(1, t('onboarding.reason-required')),
  previousPlatform: z.string().optional(),
})

function BusinessProfileRoute() {
  const t = useTranslations()
  const navigate = useNavigate()

  const form = useForm(businessProfileSchema(t), {
    defaultValues: {
      companyName: '',
      fullName: '',
      phone: '',
      userRole: '',
      unitsManaged: '',
      signupReason: '',
      previousPlatform: '',
    },
    onSubmit: async ({ value }) => {
      const result = await completeBusinessProfile({ data: value })

      if (result.success) {
        toast.success(t('onboarding.profile-saved'))
        navigate({ to: '/auth/sign-up/verify' })
      }
      else {
        toast.error(t('onboarding.profile-save-error'), {
          description: result.error,
        })
      }
    },
  })

  const signupReason = form.useStore((state) => state.values.signupReason)
  const showPlatformSelect = signupReason === 'switching'

  return (
    <Card className='w-full lg:max-w-lg'>
      <CardHeader>
        <div className='mb-2 flex items-center gap-2'>
          <ProgressIndicator step={1} totalSteps={2} />
        </div>
        <CardTitle>{t('onboarding.tell-us-about-your-business')}</CardTitle>
        <CardDescription>{t('onboarding.business-profile-description')}</CardDescription>
      </CardHeader>

      <CardContent className='space-y-6'>
        <form.Root>
          <form.Field
            name='companyName'
            render={(field) => (
              <field.Container label={t('onboarding.company-name')}>
                <Input placeholder={t('onboarding.company-name-placeholder')} />
              </field.Container>
            )}
          />

          <form.Field
            name='fullName'
            render={(field) => (
              <field.Container label={t('onboarding.your-full-name')}>
                <Input autoComplete='name' />
              </field.Container>
            )}
          />

          <form.Field
            name='phone'
            render={(field) => (
              <field.Container label={t('onboarding.phone-number')}>
                <InputPhone
                  defaultCountry='US'
                  value={field.state.value}
                  onChange={(value) => field.handleChange(value || '')}
                />
              </field.Container>
            )}
          />

          <form.Field
            name='userRole'
            render={(field) => (
              <field.Container label={t('onboarding.your-role')} detail={t('onboarding.role-optional')}>
                <Select
                  value={field.state.value}
                  onValueChange={field.handleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('onboarding.select-role')} />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </field.Container>
            )}
          />

          <form.Field
            name='unitsManaged'
            render={(field) => (
              <field.Container label={t('onboarding.units-managed')}>
                <div className='grid grid-cols-2 gap-2'>
                  {unitsOptions.map((option) => (
                    <RadioCard
                      key={option.value}
                      selected={field.state.value === option.value}
                      onClick={() => field.handleChange(option.value)}
                    >
                      {option.label}
                    </RadioCard>
                  ))}
                </div>
              </field.Container>
            )}
          />

          <form.Field
            name='signupReason'
            render={(field) => (
              <field.Container label={t('onboarding.what-brings-you-here')}>
                <Select
                  value={field.state.value}
                  onValueChange={field.handleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('onboarding.select-reason')} />
                  </SelectTrigger>
                  <SelectContent>
                    {reasonOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </field.Container>
            )}
          />

          {showPlatformSelect && (
            <form.Field
              name='previousPlatform'
              render={(field) => (
                <field.Container label={t('onboarding.which-platform')}>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('onboarding.select-platform')} />
                    </SelectTrigger>
                    <SelectContent>
                      {platformOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </field.Container>
              )}
            />
          )}

          <div className='flex gap-3 pt-4'>
            <Button
              type='button'
              variant='outline'
              className='flex-1'
              onClick={() => navigate({ to: '/auth/sign-up' })}
            >
              {t('common.back')}
            </Button>
            <form.Subscribe
              selector={(state) => state.isSubmitting}
              children={(isSubmitting) => (
                <form.Submit className='flex-1'>
                  {isSubmitting ? t('onboarding.saving-profile') : t('common.continue')}
                </form.Submit>
              )}
            />
          </div>
        </form.Root>
      </CardContent>
    </Card>
  )
}

// Progress indicator component
function ProgressIndicator({ step, totalSteps }: { step: number; totalSteps: number }) {
  return (
    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
      <span>Step {step} of {totalSteps}</span>
      <div className='flex gap-1'>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={`step-${i + 1}`}
            className={`h-1.5 w-8 rounded-full ${
              i < step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// Radio card component for unit selection
function RadioCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
        selected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-input bg-background hover:border-muted-foreground/50'
      }`}
    >
      {children}
    </button>
  )
}
