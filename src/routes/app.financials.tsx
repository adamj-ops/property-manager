import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/app/financials')({
  component: FinancialsLayout,
})

function FinancialsLayout() {
  return <Outlet />
}
