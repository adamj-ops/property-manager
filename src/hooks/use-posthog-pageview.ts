import { useEffect } from 'react'
import { useLocation } from '@tanstack/react-router'

import { posthog } from '~/libs/posthog'

export function usePostHogPageview() {
  const location = useLocation()

  useEffect(() => {
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
      })
    }
  }, [location.pathname])
}
