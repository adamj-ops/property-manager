import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    // Redirect based on authentication status
    // Authenticated users go to the dashboard, others go to sign-in
    throw redirect({
      to: context.auth.isAuthenticated ? '/app/dashboard' : '/auth/sign-in',
    })
  },
  component: () => null, // Component won't render due to redirect
})
