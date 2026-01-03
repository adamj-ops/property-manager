/* eslint-disable @typescript-eslint/no-namespace */

import { z } from 'zod'

import { logger } from '~/libs/logger'
import { handleZodErrors } from '~/libs/zod'

const PUBLIC_ENV_PREFIX = 'VITE_' as const

// https://docs.solidjs.com/configuration/environment-variables

const publicSchema = createEnvSchema('Public', {
  VITE_APP_NAME: z.string(),
  VITE_APP_EMAIL: z.string().email(),
  VITE_APP_BASE_URL: z.string(),
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string(),
  VITE_SENTRY_DSN: z.string().url().optional(),
  VITE_POSTHOG_KEY: z.string().optional(),
  VITE_POSTHOG_HOST: z.string().url().optional(),
  // Stripe publishable key (safe to expose in client)
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),
})

const privateSchema = createEnvSchema('Private', {
  AUTH_SECRET: z.string(),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().startsWith('redis://').or(z.string().startsWith('rediss://')),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().startsWith('re_'),
  GOOGLE_PLACES_API_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  // Stripe secret key - MUST be test key (sk_test_*) unless explicitly enabled for live mode
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith('sk_')
    .refine(
      (key) => {
        // Enforce test mode unless STRIPE_LIVE_MODE is explicitly set to 'true'
        const isLiveMode = process.env.STRIPE_LIVE_MODE === 'true'
        const isTestKey = key.startsWith('sk_test_')
        const isLiveKey = key.startsWith('sk_live_')

        // Only allow live keys if STRIPE_LIVE_MODE is explicitly enabled
        if (isLiveKey && !isLiveMode) {
          throw new Error(
            'STRIPE_SECRET_KEY is a live key but STRIPE_LIVE_MODE is not set to "true". ' +
              'This is a safety measure to prevent accidental live charges. ' +
              'Set STRIPE_LIVE_MODE=true only when ready for production.',
          )
        }

        return true
      },
      {
        message: 'Stripe key validation failed',
      },
    )
    .optional(),
  // Stripe webhook secret for signature verification
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  // Explicit flag to enable live mode (safety measure)
  STRIPE_LIVE_MODE: z.enum(['true', 'false']).optional(),
})

function parseEnv() {
  const result = z.object({
    ...publicSchema.shape,
    ...privateSchema.shape,
  }).safeParse({
    ...import.meta.env,
    ...process.env,
  })

  if (result.error) {
    handleZodErrors(result.error)

    throw new Error('Invalid environment variables')
  }

  const total = Object.keys(result.data).length

  logger.info(`Environment variables parsed successfully (${total} variables)`)
}

function createEnvSchema<Shpae extends z.ZodRawShape>(type: 'Public' | 'Private', shape: Shpae) {
  for (const key in shape) {
    if (type === 'Public' && !key.startsWith(PUBLIC_ENV_PREFIX)) {
      throw new Error(`Public environment variables must start with "${PUBLIC_ENV_PREFIX}", got "${key}"`)
    }

    if (type === 'Private' && key.startsWith(PUBLIC_ENV_PREFIX)) {
      throw new Error(`Private environment variables must not start with "${PUBLIC_ENV_PREFIX}", got "${key}"`)
    }
  }

  return z.object(shape)
}

interface ViteBuiltInEnv {
  MODE: 'development' | 'production' | 'test'
  DEV: boolean
  SSR: boolean
  PROD: boolean
  BASE_URL: string
}

declare global {
  interface ImportMetaEnv extends z.infer<typeof publicSchema>, ViteBuiltInEnv {}

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }

  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof privateSchema> {}
  }
}

export { parseEnv }
