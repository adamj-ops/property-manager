import { createMiddleware } from '@tanstack/start'
import { status } from 'http-status'
import { setResponseStatus } from 'vinxi/http'

import { getAuth } from '~/services/auth.api'
import type { Authenticated } from '~/services/auth.api'

export const Role = {
  Admin: 'admin',
  User: 'user',
} as const

export type Role = (typeof Role)[keyof typeof Role]

export const authMiddleware = createMiddleware()
  .server(async ({ next }) => {
    const auth = await getAuth()

    return next({
      context: {
        auth,
      },
    })
  })

export const authedMiddleware = createMiddleware()
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    if (context.auth.isAuthenticated === false) {
      setResponseStatus(status.UNAUTHORIZED)
      throw new Error('Unauthorized')
    }

    return next({
      context: {
        auth: context.auth as Authenticated,
      },
    })
  })

export const adminMiddleware = createMiddleware()
  .middleware([authedMiddleware])
  .server(async ({ next, context }) => {
    if (context.auth.user.role !== Role.Admin) {
      setResponseStatus(status.UNAUTHORIZED)
      throw new Error('Unauthorized')
    }

    return next({
      context: {
        auth: context.auth,
      },
    })
  })
