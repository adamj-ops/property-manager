import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/app/properties')({
  component: PropertiesLayout,
})

function PropertiesLayout() {
  return <Outlet />
}
