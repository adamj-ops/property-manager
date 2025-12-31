import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/app/properties/$propertyId')({
  component: PropertyDetailLayout,
})

function PropertyDetailLayout() {
  return <Outlet />
}
