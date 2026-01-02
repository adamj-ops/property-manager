/// <reference types="vinxi/types/server" />

import { getRouterManifest } from '@tanstack/start/router-manifest'
import { createStartHandler, defaultStreamHandler } from '@tanstack/start/server'
import * as Sentry from '@sentry/node'

import { createRouter } from '~/router'
import { parseEnv } from '~/server/env'

parseEnv()

const sentryDsn = process.env.SENTRY_DSN ?? process.env.VITE_SENTRY_DSN

let sentryInitialized = false

if (sentryDsn && !sentryInitialized) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  })
  sentryInitialized = true
}

export default createStartHandler({ createRouter, getRouterManifest })(defaultStreamHandler)
