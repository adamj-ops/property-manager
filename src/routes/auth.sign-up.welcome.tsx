import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { LuBuilding2, LuCircleCheckBig, LuLayoutDashboard } from 'react-icons/lu'
import { useTranslations } from 'use-intl'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { completeOnboarding } from '~/server/onboarding'

export const Route = createFileRoute('/auth/sign-up/welcome')({
  beforeLoad: ({ context }) => {
    // Must be authenticated to access this page
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/auth/sign-up' })
    }
    // Must have verified email
    if (!context.auth.user?.emailVerified) {
      throw redirect({ to: '/auth/sign-up/verify' })
    }
  },
  component: WelcomeRoute,
})

function WelcomeRoute() {
  const t = useTranslations()
  const navigate = useNavigate()

  // Mark onboarding as complete on mount
  useEffect(() => {
    completeOnboarding()
  }, [])

  const handleAddProperty = () => {
    navigate({ to: '/app/properties/new' })
  }

  const handleExploreDashboard = () => {
    navigate({ to: '/app/dashboard' })
  }

  const handleSkip = () => {
    navigate({ to: '/app/dashboard' })
  }

  return (
    <Card className='w-full lg:max-w-lg'>
      <CardHeader className='text-center'>
        {/* Success icon */}
        <div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100'>
          <LuCircleCheckBig className='size-8 text-green-600' />
        </div>

        <CardTitle className='text-2xl'>
          {t('onboarding.welcome-to', { name: import.meta.env.VITE_APP_NAME })}
        </CardTitle>
        <CardDescription className='text-base'>
          {t('onboarding.account-verified-ready')}
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Quick Action Cards */}
        <ActionCard
          icon={LuBuilding2}
          title={t('onboarding.add-first-property')}
          description={t('onboarding.add-property-description')}
          onClick={handleAddProperty}
          primary
        />

        <ActionCard
          icon={LuLayoutDashboard}
          title={t('onboarding.explore-dashboard')}
          description={t('onboarding.explore-dashboard-description')}
          onClick={handleExploreDashboard}
        />

        {/* Skip link */}
        <div className='pt-4 text-center'>
          <Button
            variant='link'
            className='text-muted-foreground'
            onClick={handleSkip}
          >
            {t('onboarding.skip-for-now')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Action card component
function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  primary = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`w-full rounded-lg border-2 p-4 text-left transition-all hover:shadow-md ${
        primary
          ? 'border-primary bg-primary/5 hover:bg-primary/10'
          : 'border-input hover:border-muted-foreground/50'
      }`}
    >
      <div className='flex items-start gap-4'>
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
          primary ? 'bg-primary/10' : 'bg-muted'
        }`}>
          <Icon className={`size-5 ${primary ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div>
          <p className='font-medium'>
            {title}
          </p>
          <p className='text-sm text-muted-foreground'>
            {description}
          </p>
        </div>
      </div>
    </button>
  )
}
