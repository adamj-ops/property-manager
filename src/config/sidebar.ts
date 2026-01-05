import {
  LuBuilding2,
  LuClipboardCheck,
  LuDollarSign,
  LuFileText,
  LuHouse,
  LuKeyRound,
  LuLaptop,
  LuLayoutDashboard,
  LuMessageSquare,
  LuMoon,
  LuPawPrint,
  LuShapes,
  LuShieldCheck,
  LuSun,
  LuUser,
  LuUsers,
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

export const navigation: readonly NavItem[] = [
  {
    type: 'group',
    name: 'navigation.property-management',
    items: [
      {
        type: 'link',
        name: 'navigation.dashboard',
        icon: LuLayoutDashboard,
        link: '/app/dashboard',
      },
      {
        type: 'link',
        name: 'navigation.properties',
        icon: LuBuilding2,
        link: '/app/properties',
      },
      {
        type: 'link',
        name: 'navigation.tenants',
        icon: LuUsers,
        link: '/app/tenants',
      },
      {
        type: 'link',
        name: 'navigation.leases',
        icon: LuHouse,
        link: '/app/leases',
      },
      {
        type: 'link',
        name: 'navigation.maintenance',
        icon: LuWrench,
        link: '/app/maintenance',
      },
      {
        type: 'link',
        name: 'navigation.financials',
        icon: LuDollarSign,
        link: '/app/financials',
      },
      {
        type: 'link',
        name: 'navigation.communications',
        icon: LuMessageSquare,
        link: '/app/communications',
      },
      {
        type: 'link',
        name: 'navigation.documents',
        icon: LuFileText,
        link: '/app/documents',
      },
      {
        type: 'link',
        name: 'navigation.pets',
        icon: LuPawPrint,
        link: '/app/pets',
      },
      {
        type: 'link',
        name: 'navigation.inspections',
        icon: LuClipboardCheck,
        link: '/app/inspections',
      },
    ],
  },
  {
    type: 'group',
    name: 'navigation.account',
    items: [
      {
        type: 'menu',
        name: 'navigation.auth',
        icon: LuKeyRound,
        items: [
          {
            type: 'link',
            name: 'navigation.sign-in',
            link: '/auth/sign-in',
          },
          {
            type: 'link',
            name: 'navigation.sign-up',
            link: '/auth/sign-up',
          },
        ],
      },
      {
        type: 'menu',
        name: 'navigation.user',
        icon: LuUser,
        items: [
          {
            type: 'link',
            name: 'navigation.account-settings',
            link: '/user/account-settings',
          },
          {
            type: 'link',
            name: 'navigation.change-password',
            link: '/user/change-password',
          },
          {
            type: 'link',
            name: 'navigation.change-email',
            link: '/user/change-email',
          },
          {
            type: 'link',
            name: 'navigation.email-verification',
            link: '/user/email-verification',
          },
        ],
      },
      {
        type: 'menu',
        name: 'navigation.admin',
        icon: LuShieldCheck,
        items: [
          {
            type: 'link',
            name: 'navigation.admin-dashboard',
            link: '/admin/dashboard',
          },
          {
            type: 'link',
            name: 'navigation.user-management',
            link: '/admin/user-management',
          },
        ],
      },
    ],
  },
  {
    type: 'group',
    name: 'navigation.others',
    items: [
      {
        type: 'menu',
        name: 'navigation.examples',
        icon: LuShapes,
        items: [
          {
            type: 'link',
            name: 'navigation.example-form',
            link: '/example-form',
          },
        ],
      },
    ],
  },
]
