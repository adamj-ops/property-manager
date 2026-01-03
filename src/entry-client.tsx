/// <reference types="vinxi/types/client" />

import { StartClient } from '@tanstack/start'
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'

import { createRouter } from '~/router'
import { initSentryClient } from '~/libs/sentry'
import { initPostHog } from '~/libs/posthog'

initSentryClient()
initPostHog()

const router = createRouter()

hydrateRoot(document, (
  <StrictMode>
    <StartClient router={router} />
  </StrictMode>
))

// Export default to satisfy Vinxi virtual client handler expectations
export default function clientEntry() {
  return router
}
