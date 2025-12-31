import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/app')({
  beforeLoad: async ({ context }) => {
    // Redirect to sign-in if not authenticated
    if (!context.auth.user) {
      throw redirect({
        to: '/auth/sign-in',
        search: {
          redirect: '/app/dashboard',
        },
      })
    }
  },
  component: AppLayout,
})

function AppLayout() {
  return <Outlet />
}
