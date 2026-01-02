import { createServerFn } from '@tanstack/start'

import { createSupabaseAdmin } from '~/libs/supabase'
import { prisma } from '~/server/db'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    database: { status: 'up' | 'down'; latencyMs?: number }
    storage: { status: 'up' | 'down'; latencyMs?: number }
  }
  version?: string
}

export const getHealth = createServerFn({ method: 'GET' })
  .handler(async (): Promise<HealthStatus> => {
    const checks: HealthStatus['checks'] = {
      database: { status: 'down' },
      storage: { status: 'down' },
    }

    const dbStart = Date.now()
    try {
      await prisma.$queryRaw`SELECT 1`
      checks.database = { status: 'up', latencyMs: Date.now() - dbStart }
    } catch {
      checks.database = { status: 'down' }
    }

    const storageStart = Date.now()
    try {
      const supabase = createSupabaseAdmin()
      const { error } = await supabase.storage.getBucket('documents')
      checks.storage = error
        ? { status: 'down' }
        : { status: 'up', latencyMs: Date.now() - storageStart }
    } catch {
      checks.storage = { status: 'down' }
    }

    const allUp = Object.values(checks).every((c) => c.status === 'up')
    const anyUp = Object.values(checks).some((c) => c.status === 'up')

    return {
      status: allUp ? 'healthy' : anyUp ? 'degraded' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
      version: process.env.npm_package_version,
    }
  })
