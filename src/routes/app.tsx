import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { getOnboardingStatus } from '~/server/onboarding'

export const Route = createFileRoute('/app')({
  beforeLoad: async ({ context, location }) => {
    // Redirect to sign-in if not authenticated
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/auth/sign-in',
        search: {
          callbackURL: location.pathname,
        },
      })
    }

    // Check onboarding status
    const onboardingStatus = await getOnboardingStatus()

    // If no team has been created, redirect to profile step
    if (!onboardingStatus.hasTeam) {
      throw redirect({
        to: '/auth/sign-up/profile',
      })
    }

    // If email is not verified, redirect to verification step
    if (!onboardingStatus.emailVerified) {
      throw redirect({
        to: '/auth/sign-up/verify',
      })
    }

    // If onboarding is not complete, redirect to welcome page
    if (!onboardingStatus.onboardingComplete) {
      throw redirect({
        to: '/auth/sign-up/welcome',
      })
    }
  },
  component: AppLayout,
})

function AppLayout() {
  return <Outlet />
}
