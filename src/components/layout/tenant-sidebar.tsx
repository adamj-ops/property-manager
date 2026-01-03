import { LuChevronsUpDown, LuCommand, LuLanguages, LuLogOut, LuPalette, LuUser } from 'react-icons/lu'
import { useTranslations } from 'use-intl'
import type { ComponentProps } from 'react'

import { useTheme } from '~/components/theme'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'
import { Link } from '~/components/ui/link'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '~/components/ui/sidebar'
import { SidebarNavBuilder } from '~/components/ui/sidebar-nav-builder'
import { TwemojiFlag } from '~/components/ui/twemoji'
import { languageOptions, tenantNavigation, themeOptions } from '~/config/tenant-sidebar'
import { authClient } from '~/libs/auth-client'
import { useAuthQuery } from '~/services/auth.query'
import { usePreferenceQuery, useUpdatePreferenceMutation } from '~/services/preference.query'

export function TenantSidebar(props: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant='inset' {...props}>
      <SidebarHeader>
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea>
          <SidebarNavBuilder {...{ navigation: tenantNavigation }} />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <SidebarAppearance />
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  )
}

function SidebarLogo() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size='lg' asChild>
          <Link to='/tenant/dashboard'>
            <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
              <LuCommand />
            </div>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-semibold'>{import.meta.env.VITE_APP_NAME}</span>
              <span className='truncate text-xs'>Tenant Portal</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function SidebarAppearance() {
  const t = useTranslations()

  const sidebar = useSidebar()

  const preferenceQuery = usePreferenceQuery()
  const updatePreferenceMutation = useUpdatePreferenceMutation()

  const { theme, setTheme } = useTheme()

  const locale = preferenceQuery.data?.data?.locale ?? 'en'
  const currentLanguage = languageOptions.find((option) => option.locale === locale) ?? languageOptions[0]

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('sidebar.appearance')}</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              >
                <TwemojiFlag emoji={currentLanguage.countryCode} className='size-4' />
                <span>{currentLanguage.label}</span>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              side={sidebar.isMobile ? 'bottom' : 'right'}
              sideOffset={4}
              className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
            >
              {languageOptions.map((option) => (
                <DropdownMenuItem
                  key={option.locale}
                  onSelect={() => {
                    updatePreferenceMutation.mutate({
                      data: {
                        locale: option.locale,
                      },
                    })
                  }}
                >
                  <TwemojiFlag emoji={option.countryCode} className='size-4' />
                  <span>{option.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              >
                {themeOptions.find((option) => option.value === theme)?.Icon && (
                  <themeOptions.find((option) => option.value === theme)!.Icon />
                )}
                <span>{t(`sidebar.${theme}`)}</span>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              side={sidebar.isMobile ? 'bottom' : 'right'}
              sideOffset={4}
              className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
            >
              {themeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={() => {
                    setTheme(option.value)
                  }}
                >
                  <option.Icon />
                  <span>{t(`sidebar.${option.value}`)}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

function SidebarUser() {
  const t = useTranslations()

  const sidebar = useSidebar()

  const authQuery = useAuthQuery()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {authQuery.data.isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              >
                <Avatar className='size-8 rounded-lg'>
                  <AvatarImage src={authQuery.data.user.image || undefined} alt={authQuery.data.user.name} />
                  <AvatarFallback className='rounded-lg'>{authQuery.data.user.name[0]}</AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold'>{authQuery.data.user.name}</span>
                  <span className='truncate text-xs'>{authQuery.data.user.email}</span>
                </div>
                <LuChevronsUpDown className='ml-auto size-4' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              side={sidebar.isMobile ? 'bottom' : 'right'}
              sideOffset={4}
              className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
            >
              <DropdownMenuItem onSelect={() => authClient.signOut()}>
                <LuLogOut />
                {t('auth.sign-out')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <SidebarMenuButton size='lg' asChild>
            <Link to='/auth/sign-in'>
              <LuUser />
              <span>{t('sidebar.sign-in-to-your-account')}</span>
            </Link>
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

