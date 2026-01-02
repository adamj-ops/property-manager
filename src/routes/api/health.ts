import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'

import { getHealth } from '~/services/health.api'

export const APIRoute = createAPIFileRoute('/api/health')({
  GET: async () => {
    const health = await getHealth()
    const status = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503
    return json(health, { status })
  },
})
