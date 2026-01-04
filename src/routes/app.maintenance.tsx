'use client'

import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { LuCalendarClock, LuDollarSign, LuWrench } from 'react-icons/lu'

import { Link } from '~/components/ui/link'
import { cx } from '~/libs/utils'

export const Route = createFileRoute('/app/maintenance')({
  component: MaintenanceLayout,
})

const navItems = [
  {
    label: 'Work Orders',
    href: '/app/maintenance',
    icon: LuWrench,
    exact: true,
  },
  {
    label: 'Schedules',
    href: '/app/maintenance/schedules',
    icon: LuCalendarClock,
  },
  {
    label: 'Cost Reports',
    href: '/app/maintenance/costs',
    icon: LuDollarSign,
  },
]

function MaintenanceLayout() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <div className='flex w-full flex-col'>
      {/* Sub-navigation */}
      <div className='border-b'>
        <nav className='flex gap-4 px-4'>
          {navItems.map((item) => {
            const isActive = item.exact
              ? currentPath === item.href || currentPath === item.href + '/'
              : currentPath.startsWith(item.href)

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cx(
                  'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                )}
              >
                <item.icon className='size-4' />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className='flex-1 px-4'>
        <Outlet />
      </div>
    </div>
  )
}
