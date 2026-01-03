import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { TenantSidebar } from '~/components/layout/tenant-sidebar'
import { prisma } from '~/server/db'
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar'

export const Route = createFileRoute('/tenant')({
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

    // Check if user has a tenant profile
    const userId = context.auth.user.id
    const tenant = await prisma.tenant.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!tenant) {
      throw redirect({
        to: '/auth/sign-in',
        search: {
          error: 'No tenant profile found',
        },
      })
    }
  },
  component: TenantLayout,
})

function TenantLayout() {
  return (
    <SidebarProvider>
      <TenantSidebar />
      <SidebarInset>
        <div className='flex h-full flex-col'>
          <div className='flex h-full flex-1 flex-col items-center px-4 py-6'>
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

