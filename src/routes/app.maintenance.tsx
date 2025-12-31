import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/app/maintenance')({
  component: MaintenanceLayout,
})

function MaintenanceLayout() {
  return <Outlet />
}
