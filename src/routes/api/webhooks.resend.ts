import { createAPIFileRoute } from '@tanstack/start/api'

import { logger } from '~/libs/logger'
import { prisma } from '~/server/db'

type ResendEventType = 'email.sent' | 'email.delivered' | 'email.opened' | 'email.bounced'

const statusMap: Record<ResendEventType, 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'> = {
  'email.sent': 'SENT',
  'email.delivered': 'DELIVERED',
  'email.opened': 'READ',
  'email.bounced': 'FAILED',
}

export const APIRoute = createAPIFileRoute('/api/webhooks/resend')({
  POST: async ({ request }) => {
    let payload: { type?: ResendEventType; data?: { id?: string } }

    try {
      payload = await request.json()
    } catch (error) {
      logger.error('Resend webhook: invalid JSON', { error })
      return new Response('invalid payload', { status: 400 })
    }

    const { type, data } = payload
    const externalId = data?.id

    if (!type || !externalId) {
      return new Response('missing fields', { status: 400 })
    }

    const status = statusMap[type]

    if (status) {
      await prisma.message.updateMany({
        where: { externalId },
        data: { status },
      })
    }

    logger.info('Resend webhook received', { type, externalId })

    return new Response('ok', { status: 200 })
  },
})
