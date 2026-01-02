import posthog from 'posthog-js'

const POSTHOG_INITIALIZED = { value: false }

export function initPostHog() {
  if (POSTHOG_INITIALIZED.value) return
  if (typeof window === 'undefined') return
  if (!import.meta.env.VITE_POSTHOG_KEY) return

  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
  })

  POSTHOG_INITIALIZED.value = true
}

export { posthog }
