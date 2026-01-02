import { Resend } from 'resend'
import type { JSX } from 'react'

import { logger } from '~/libs/logger'
import { tryCatchAsync } from '~/libs/utils'
import { prisma } from '~/server/db'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailOptions {
  from?: string
  to: string | string[]
  subject: string
  react: JSX.Element
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  tags?: { name: string; value: string }[]
  /**
   * Optional Message.id to link delivery tracking.
   * When provided, Resend email id is stored on the Message.externalId field.
   */
  messageId?: string
}

async function sendEmail(options: SendEmailOptions) {
  const [error, result] = await tryCatchAsync(
    resend.emails.send({
      from: options.from ?? `${import.meta.env.VITE_APP_NAME} <${import.meta.env.VITE_APP_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      react: options.react,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      tags: options.tags,
    }),
  )

  if (error) {
    logger.error(error.message)
    throw error
  }

  const resendId = result?.data?.id

  if (options.messageId && resendId) {
    await prisma.message.updateMany({
      where: { id: options.messageId },
      data: { externalId: resendId },
    })
  }

  logger.info(`Email queued with Resend id=${resendId ?? 'unknown'}`)

  return result?.data
}

async function sendBatchEmails(emails: SendEmailOptions[]) {
  const [error, result] = await tryCatchAsync(
    resend.batch.send(
      emails.map((email) => ({
        from: email.from ?? `${import.meta.env.VITE_APP_NAME} <${import.meta.env.VITE_APP_EMAIL}>`,
        to: email.to,
        subject: email.subject,
        react: email.react,
        replyTo: email.replyTo,
        cc: email.cc,
        bcc: email.bcc,
        tags: email.tags,
      })),
    ),
  )

  if (error) {
    logger.error(error.message)
    throw error
  }

  logger.info(`Batch email queued with ${result?.data?.length ?? 0} messages`)

  return result?.data
}

export { sendBatchEmails, sendEmail, resend }
export type { SendEmailOptions }
