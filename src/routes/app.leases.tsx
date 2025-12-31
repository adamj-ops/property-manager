import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/app/leases')({
  component: LeasesLayout,
})

function LeasesLayout() {
  return <Outlet />
}
