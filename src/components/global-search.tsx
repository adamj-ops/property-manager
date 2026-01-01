'use client'

import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import {
  LuBuilding2,
  LuCalculator,
  LuCalendar,
  LuFileText,
  LuHouse,
  LuMail,
  LuPlus,
  LuSearch,
  LuSettings,
  LuUser,
  LuWrench,
} from 'react-icons/lu'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '~/components/ui/command'

interface SearchResult {
  id: string
  title: string
  subtitle?: string
  icon: React.ReactNode
  href: string
  keywords?: string[]
}

// Navigation items
const navigationItems: SearchResult[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    subtitle: 'Overview and analytics',
    icon: <LuHouse className='h-4 w-4' />,
    href: '/app/dashboard',
    keywords: ['home', 'overview', 'stats'],
  },
  {
    id: 'properties',
    title: 'Properties',
    subtitle: 'Manage your properties',
    icon: <LuBuilding2 className='h-4 w-4' />,
    href: '/app/properties',
    keywords: ['buildings', 'units', 'real estate'],
  },
  {
    id: 'tenants',
    title: 'Tenants',
    subtitle: 'Manage tenants',
    icon: <LuUser className='h-4 w-4' />,
    href: '/app/tenants',
    keywords: ['renters', 'residents', 'occupants'],
  },
  {
    id: 'leases',
    title: 'Leases',
    subtitle: 'Lease agreements',
    icon: <LuFileText className='h-4 w-4' />,
    href: '/app/leases',
    keywords: ['contracts', 'agreements', 'rentals'],
  },
  {
    id: 'maintenance',
    title: 'Maintenance',
    subtitle: 'Work orders and requests',
    icon: <LuWrench className='h-4 w-4' />,
    href: '/app/maintenance',
    keywords: ['repairs', 'work orders', 'service'],
  },
  {
    id: 'financials',
    title: 'Financials',
    subtitle: 'Income and expenses',
    icon: <LuCalculator className='h-4 w-4' />,
    href: '/app/financials',
    keywords: ['money', 'payments', 'accounting', 'revenue'],
  },
  {
    id: 'documents',
    title: 'Documents',
    subtitle: 'Files and attachments',
    icon: <LuFileText className='h-4 w-4' />,
    href: '/app/documents',
    keywords: ['files', 'attachments', 'uploads'],
  },
  {
    id: 'communications',
    title: 'Communications',
    subtitle: 'Messages and notifications',
    icon: <LuMail className='h-4 w-4' />,
    href: '/app/communications',
    keywords: ['messages', 'email', 'notifications'],
  },
]

// Quick actions
const quickActions: SearchResult[] = [
  {
    id: 'new-tenant',
    title: 'Add New Tenant',
    icon: <LuPlus className='h-4 w-4' />,
    href: '/app/tenants/new',
    keywords: ['create tenant', 'add renter'],
  },
  {
    id: 'new-property',
    title: 'Add New Property',
    icon: <LuPlus className='h-4 w-4' />,
    href: '/app/properties/new',
    keywords: ['create property', 'add building'],
  },
  {
    id: 'new-lease',
    title: 'Create New Lease',
    icon: <LuPlus className='h-4 w-4' />,
    href: '/app/leases/new',
    keywords: ['create lease', 'new contract'],
  },
  {
    id: 'new-maintenance',
    title: 'Create Work Order',
    icon: <LuPlus className='h-4 w-4' />,
    href: '/app/maintenance/new',
    keywords: ['create maintenance', 'new repair'],
  },
]

// Settings
const settingsItems: SearchResult[] = [
  {
    id: 'account-settings',
    title: 'Account Settings',
    icon: <LuSettings className='h-4 w-4' />,
    href: '/user/account-settings',
    keywords: ['profile', 'preferences'],
  },
]

interface GlobalSearchProps {
  // Optional: pass data for entity search
  tenants?: Array<{ id: string; firstName: string; lastName: string; email: string }>
  properties?: Array<{ id: string; name: string; address: string }>
}

export function GlobalSearch({ tenants = [], properties = [] }: GlobalSearchProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  // Handle Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false)
      command()
    },
    []
  )

  // Build dynamic entity results
  const tenantResults: SearchResult[] = tenants.slice(0, 5).map((t) => ({
    id: `tenant-${t.id}`,
    title: `${t.firstName} ${t.lastName}`,
    subtitle: t.email,
    icon: <LuUser className='h-4 w-4' />,
    href: `/app/tenants/${t.id}`,
  }))

  const propertyResults: SearchResult[] = properties.slice(0, 5).map((p) => ({
    id: `property-${p.id}`,
    title: p.name,
    subtitle: p.address,
    icon: <LuBuilding2 className='h-4 w-4' />,
    href: `/app/properties/${p.id}`,
  }))

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className='inline-flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors'
      >
        <LuSearch className='h-4 w-4' />
        <span className='hidden sm:inline'>Search...</span>
        <kbd className='pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium sm:flex'>
          <span className='text-xs'>⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder='Type to search...' />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Quick Actions */}
          <CommandGroup heading='Quick Actions'>
            {quickActions.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.title} ${item.keywords?.join(' ') || ''}`}
                onSelect={() => runCommand(() => navigate({ to: item.href }))}
              >
                {item.icon}
                <span className='ml-2'>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Navigation */}
          <CommandGroup heading='Navigation'>
            {navigationItems.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.title} ${item.subtitle || ''} ${item.keywords?.join(' ') || ''}`}
                onSelect={() => runCommand(() => navigate({ to: item.href }))}
              >
                {item.icon}
                <div className='ml-2 flex flex-col'>
                  <span>{item.title}</span>
                  {item.subtitle && (
                    <span className='text-xs text-muted-foreground'>{item.subtitle}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          {/* Dynamic Tenants (if provided) */}
          {tenantResults.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading='Tenants'>
                {tenantResults.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.subtitle || ''}`}
                    onSelect={() => runCommand(() => navigate({ to: item.href }))}
                  >
                    {item.icon}
                    <div className='ml-2 flex flex-col'>
                      <span>{item.title}</span>
                      {item.subtitle && (
                        <span className='text-xs text-muted-foreground'>{item.subtitle}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Dynamic Properties (if provided) */}
          {propertyResults.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading='Properties'>
                {propertyResults.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.subtitle || ''}`}
                    onSelect={() => runCommand(() => navigate({ to: item.href }))}
                  >
                    {item.icon}
                    <div className='ml-2 flex flex-col'>
                      <span>{item.title}</span>
                      {item.subtitle && (
                        <span className='text-xs text-muted-foreground'>{item.subtitle}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          <CommandSeparator />

          {/* Settings */}
          <CommandGroup heading='Settings'>
            {settingsItems.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.title} ${item.keywords?.join(' ') || ''}`}
                onSelect={() => runCommand(() => navigate({ to: item.href }))}
              >
                {item.icon}
                <span className='ml-2'>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
