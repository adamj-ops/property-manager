import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useId } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'use-intl'
import { z } from 'zod'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { useForm } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { InputPassword } from '~/components/ui/input-password'
import { Label } from '~/components/ui/label'
import { Link } from '~/components/ui/link'
import { Separator } from '~/components/ui/separator'
import { socialProviders } from '~/config/social-provider'
import { authClient } from '~/libs/auth-client'
import { tKey } from '~/libs/i18n'
import { cx } from '~/libs/utils'
import { emailSchema, nameSchema, passwordSchema, PASSWORD_MIN } from '~/services/auth.schema'

export const Route = createFileRoute('/auth/sign-up')({
  component: SignUpRoute,
})

const signUpSchema = (t = tKey) => z
  .object({
    name: nameSchema(t),
    email: emailSchema(t),
    password: passwordSchema(t),
    passwordConfirm: passwordSchema(t),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: t('auth.terms-required'),
    }),
  })
  .refine((values) => values.password === values.passwordConfirm, {
    path: ['passwordConfirm'],
    message: t('auth.password-must-match'),
  })

function SignUpRoute() {
  const t = useTranslations()
  const navigate = useNavigate()
  const termsCheckboxId = useId()

  const form = useForm(signUpSchema(t), {
    defaultValues: {
      name: '',
      password: '',
      passwordConfirm: '',
      email: '',
      termsAccepted: false,
      ...(import.meta.env.DEV && {
        name: 'Test User',
        password: '!Ab12345',
        passwordConfirm: '!Ab12345',
        email: import.meta.env.VITE_APP_EMAIL || 'test@example.com',
        termsAccepted: true,
      }),
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          name: value.name,
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            toast.success(t('auth.sign-up-success'))
            // Navigate to business profile page
            navigate({ to: '/auth/sign-up/profile' })
          },
          onError: ({ error }) => {
            toast.error(t('auth.sign-up-error'), {
              description: error.message,
            })
          },
        },
      )
    },
  })

  return (
    <Card className='w-full lg:max-w-md'>
      <CardHeader>
        <CardTitle>{t('auth.sign-up')}</CardTitle>
        <CardDescription>{t('auth.sign-up-description')}</CardDescription>
      </CardHeader>

      <CardContent className='space-y-6'>
        <form.Root>
          <form.Field
            name='email'
            render={(field) => (
              <field.Container label={t('auth.email')}>
                <Input type='email' autoComplete='email' />
              </field.Container>
            )}
          />

          <form.Field
            name='password'
            render={(field) => (
              <field.Container label={t('auth.password')}>
                <div className='space-y-2'>
                  <InputPassword autoComplete='new-password' />
                  <PasswordRequirements password={field.state.value} />
                </div>
              </field.Container>
            )}
          />

          <form.Field
            name='passwordConfirm'
            render={(field) => (
              <field.Container label={t('auth.password-confirm')}>
                <InputPassword autoComplete='new-password' />
              </field.Container>
            )}
          />

          <form.Field
            name='name'
            render={(field) => (
              <field.Container label={t('auth.name')}>
                <Input autoComplete='name' />
              </field.Container>
            )}
          />

          <form.Field
            name='termsAccepted'
            render={(field) => (
              <div className='flex items-start gap-3 py-2'>
                <Checkbox
                  id={termsCheckboxId}
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked === true)}
                />
                <Label htmlFor={termsCheckboxId} className='text-sm leading-relaxed'>
                  {t('auth.terms-agreement-prefix')}{' '}
                  <Link to='/' className='text-primary underline hover:no-underline'>
                    {t('auth.terms-of-service')}
                  </Link>{' '}
                  {t('auth.and')}{' '}
                  <Link to='/' className='text-primary underline hover:no-underline'>
                    {t('auth.privacy-policy')}
                  </Link>
                </Label>
              </div>
            )}
          />

          <form.Subscribe
            selector={(state) => state.isSubmitting}
            children={(isSubmitting) => (
              <form.Submit className='w-full'>
                {isSubmitting ? t('auth.signing-up') : t('auth.create-account')}
              </form.Submit>
            )}
          />
        </form.Root>

        <div className='flex items-center justify-between'>
          <Separator className='flex-1' />
          <span className='px-4 text-muted-foreground'>{t('auth.or-continue-with')}</span>
          <Separator className='flex-1' />
        </div>

        <div className='w-full space-y-3'>
          {socialProviders.map((socialProvider) => (
            <Button
              key={socialProvider.id}
              onClick={() => authClient.signIn.social({
                provider: socialProvider.id,
                callbackURL: '/auth/sign-up/profile',
              })}
              style={{ '--social-bg': socialProvider.backgroundColor }}
              className={cx(
                'w-full items-center justify-center gap-2 border',
                'bg-[var(--social-bg)] hover:bg-[var(--social-bg)] focus-visible:ring-[var(--social-bg)]',
                'brightness-100 hover:brightness-90',
                socialProvider.id === 'google' && 'focus-visible:ring-ring',
              )}
            >
              <socialProvider.icon
                size={socialProvider.size}
                color={socialProvider.logoColor}
              />
              <span style={{ color: socialProvider.textColor }}>
                {t('auth.continue-with', { name: socialProvider.name })}
              </span>
            </Button>
          ))}
        </div>

        <div className='flex items-center justify-center gap-2'>
          <p>{t('auth.already-have-an-account')}</p>
          <Button asChild variant='link' className='h-auto p-0 text-base'>
            <Link to='/auth/sign-in'>{t('auth.sign-in')}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Password requirements indicator component
function PasswordRequirements({ password }: { password: string }) {
  const requirements = [
    { label: `${PASSWORD_MIN}+ characters`, met: password.length >= PASSWORD_MIN },
    { label: '1 uppercase', met: /[A-Z]/.test(password) },
    { label: '1 number', met: /\d/.test(password) },
    { label: '1 special character', met: /[!"#$%&'()*+,./:;<=>?@[\\\]^_{|}~-]/.test(password) },
  ]

  if (!password) {
    return (
      <span className='text-sm text-muted-foreground'>
        {requirements.map((r) => r.label).join(' • ')}
      </span>
    )
  }

  return (
    <div className='flex flex-wrap gap-2'>
      {requirements.map((req) => (
        <span
          key={req.label}
          className={cx(
            'text-xs',
            req.met ? 'text-green-600' : 'text-muted-foreground',
          )}
        >
          {req.met ? '✓' : '○'} {req.label}
        </span>
      ))}
    </div>
  )
}
