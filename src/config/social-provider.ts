import { FcGoogle } from 'react-icons/fc'
import type { IconBaseProps, IconType } from 'react-icons'

import type { auth } from '~/server/auth'

export interface SocialProvider {
  id: keyof typeof auth.options.socialProviders
  name: string
  icon: IconType
  size: IconBaseProps['size']
  logoColor: IconBaseProps['color']
  textColor: string
  backgroundColor: string
}

export const socialProviders: SocialProvider[] = [
  {
    id: 'google',
    name: 'Google',
    icon: FcGoogle,
    size: 20,
    logoColor: undefined,
    textColor: '#000',
    backgroundColor: '#fff',
  },
]
