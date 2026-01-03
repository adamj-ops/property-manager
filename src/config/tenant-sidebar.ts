import {
  LuCreditCard,
  LuFileText,
  LuLaptop,
  LuLayoutDashboard,
  LuMoon,
  LuSun,
  LuWrench,
} from 'react-icons/lu'
import type { IconType } from 'react-icons'
import type { Country } from 'react-phone-number-input'

import type { Theme } from '~/components/theme'
import type { NavItem } from '~/components/ui/sidebar-nav-builder'
import type { Locale } from '~/libs/i18n'

export interface LanguageOption {
  locale: Locale
  countryCode: Country
  label: string
}

export const languageOptions: readonly LanguageOption[] = [
  { locale: 'en', countryCode: 'US', label: 'English' },
  { locale: 'zh-tw', countryCode: 'TW', label: '繁體中文' },
]

export interface ThemeOption {
  value: Theme
  Icon: IconType
}

export const themeOptions: readonly ThemeOption[] = [
  { value: 'system', Icon: LuLaptop },
  { value: 'light', Icon: LuSun },
  { value: 'dark', Icon: LuMoon },
]

export const tenantNavigation: readonly NavItem[] = [
  {
    type: 'group',
    name: 'navigation.tenant-portal',
    items: [
      {
        type: 'menu',
        name: 'navigation.dashboard',
        icon: LuLayoutDashboard,
        items: [
          {
            type: 'link',
            name: 'navigation.dashboard',
            link: '/tenant/dashboard',
          },
        ],
      },
      {
        type: 'menu',
        name: 'navigation.pay-rent',
        icon: LuCreditCard,
        items: [
          {
            type: 'link',
            name: 'navigation.pay-rent',
            link: '/tenant/payments',
          },
          {
            type: 'link',
            name: 'navigation.payment-history',
            link: '/tenant/payments/history',
          },
        ],
      },
    ],
  },
  {
    type: 'group',
    name: 'navigation.my-lease',
    items: [
      {
        type: 'menu',
        name: 'navigation.lease-details',
        icon: LuFileText,
        items: [
          {
            type: 'link',
            name: 'navigation.lease-details',
            link: '/tenant/lease',
          },
        ],
      },
      {
        type: 'menu',
        name: 'navigation.maintenance-requests',
        icon: LuWrench,
        items: [
          {
            type: 'link',
            name: 'navigation.maintenance-requests',
            link: '/tenant/maintenance',
          },
        ],
      },
    ],
  },
]

