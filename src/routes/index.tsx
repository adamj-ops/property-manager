import { createFileRoute } from '@tanstack/react-router'

import { Button } from '~/components/ui/button'
import { Link } from '~/components/ui/link'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/')({
  component: HomeRoute,
})

function HomeRoute() {
  return (
    <div className='flex size-full flex-col items-center justify-center space-y-6 pb-16'>
      <Typography.H1>
        {import.meta.env.VITE_APP_NAME}
      </Typography.H1>
      <Typography.P>
        Modern property management made simple. Track properties, tenants, and finances in one place.
      </Typography.P>
      <Button asChild>
        <Link to='/user/account-settings'>
          Get Started
        </Link>
      </Button>
    </div>
  )
}
