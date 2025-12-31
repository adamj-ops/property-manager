import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/app/tenants')({
  component: TenantsLayout,
})

function TenantsLayout() {
  return <Outlet />
}
