import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { toast } from 'sonner'
import { z } from 'zod'

import { Typography } from '~/components/ui/typography'
import { logger } from '~/libs/logger'

export const Route = createFileRoute('/auth')({
  validateSearch: zodValidator(
    z.object({
      callbackURL: z.string().default('/app/dashboard'),
      redirect: z.string().optional(),
    }),
  ),
  beforeLoad: ({ context, search, location, preload }) => {
    // Determine the actual redirect target (support both callbackURL and redirect params)
    const redirectTo = search.redirect || search.callbackURL

    if (context.auth.isAuthenticated) {
      if (!preload) {
        logger.info('Already authenticated, redirecting to callback URL')
        toast.info(context.translator('auth.already-authenticated-redirecting'))
      }

      throw redirect({
        to: redirectTo,
      })
    }

    if (['/auth', '/auth/'].includes(location.pathname)) {
      throw redirect({
        to: '/auth/sign-in',
        search,
      })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className='flex w-full max-w-lg flex-col items-center gap-8 p-4'>
      {/* Logo/Branding */}
      <div className='text-center'>
        <Typography.H2 className='text-primary'>
          {import.meta.env.VITE_APP_NAME}
        </Typography.H2>
        <Typography.P className='text-muted-foreground'>
          Property Management Made Simple
        </Typography.P>
      </div>

      {/* Auth Form */}
      <Outlet />
    </div>
  )
}
