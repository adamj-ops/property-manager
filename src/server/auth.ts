// FIXME: https://discord.com/channels/1288403910284935179/1288403910284935182/1311200136923185173

import { hash, verify } from '@node-rs/argon2'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { APIError } from 'better-auth/api'
import { admin, emailOTP } from 'better-auth/plugins'
import type { BetterAuthPlugin } from 'better-auth'

import { VerificationCodeEmail } from '~/emails/verification-code-email'
import { VerificationEmail } from '~/emails/verification-email'
import { prisma } from '~/server/db'
import { sendEmail } from '~/server/email'
import { nameSchema, PASSWORD_MAX, PASSWORD_MIN, passwordSchema } from '~/services/auth.schema'

export type Session = typeof auth.$Infer.Session

export const auth = betterAuth({
  baseURL: import.meta.env.VITE_APP_BASE_URL,
  secret: process.env.AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: PASSWORD_MIN,
    maxPasswordLength: PASSWORD_MAX,
    password: {
      hash: (password) => hash(password),
      verify: ({ hash, password }) => verify(hash, password),
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      sendEmail({
        to: user.email,
        // TODO: i18n
        subject: 'Verify your email address',
        react: VerificationEmail({ url }),
      })
    },
  },
  user: {
    modelName: 'User',
    additionalFields: {
      phone: {
        type: 'string',
        required: false,
        input: false,
      },
      userRole: {
        type: 'string',
        required: false,
        input: false,
      },
      onboardingCompletedAt: {
        type: 'date',
        required: false,
        input: false,
      },
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ newEmail, url }) => {
        sendEmail({
          to: newEmail,
          // TODO: i18n
          subject: 'Verify your new email address',
          react: VerificationEmail({ url }),
        })
      },
    },
  },
  session: {
    modelName: 'Session',
  },
  account: {
    modelName: 'Account',
    // TODO: Manually Linking Accounts: https://www.better-auth.com/docs/concepts/users-accounts#manually-linking-accounts
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'discord', 'github'],
    },
  },
  verification: {
    modelName: 'Verification',
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    admin(),
    emailOTP({
      otpLength: 6,
      expiresIn: 600, // 10 minutes
      sendVerificationOTP: async ({ email, otp, type }) => {
        const subjectMap = {
          'email-verification': 'Your verification code',
          'sign-in': 'Your sign-in code',
          'forget-password': 'Your password reset code',
        }
        await sendEmail({
          to: email,
          subject: subjectMap[type] || 'Your verification code',
          react: VerificationCodeEmail({ code: otp, type }),
        })
      },
    }),
    // https://discord.com/channels/1288403910284935179/1288403910284935182/1311052339225821225
    nameValidator(),
    passwordValidator(),
  ],
})

function nameValidator() {
  return {
    id: 'name-validator',
    hooks: {
      before: [
        {
          matcher: (ctx) => ctx.body?.name,
          handler: async (ctx) => {
            const nameParseResult = nameSchema().safeParse(ctx.body.name)
            if (nameParseResult.error) {
              throw new APIError('BAD_REQUEST', {
                message: 'Invalid name',
              })
            }
          },
        },
      ],
    },
  } as const satisfies BetterAuthPlugin
}

function passwordValidator() {
  return {
    id: 'password-validator',
    hooks: {
      before: [
        {
          matcher: (ctx) => ctx.body?.password,
          handler: async (ctx) => {
            const passwordParseResult = passwordSchema().safeParse(ctx.body.password)
            if (passwordParseResult.error) {
              throw new APIError('BAD_REQUEST', {
                message: 'Invalid password',
              })
            }
          },
        },
      ],
    },
  } as const satisfies BetterAuthPlugin
}
