import { Section, Text } from '@react-email/components'

import { EmailHeading, EmailLayout } from '~/emails/base'

interface VerificationCodeEmailProps {
  code: string
  type?: 'email-verification' | 'sign-in' | 'forget-password'
}

export function VerificationCodeEmail({ code, type = 'email-verification' }: VerificationCodeEmailProps) {
  const headingText = {
    'email-verification': 'Verify your email',
    'sign-in': 'Sign in to your account',
    'forget-password': 'Reset your password',
  }

  const descriptionText = {
    'email-verification': 'Use the code below to verify your email address and complete your registration.',
    'sign-in': 'Use the code below to sign in to your account.',
    'forget-password': 'Use the code below to reset your password.',
  }

  return (
    <EmailLayout preview={`Your verification code is ${code}`}>
      <Section className='text-center'>
        <EmailHeading>
          {headingText[type]}
        </EmailHeading>

        <Text className='mx-0 my-4 text-center text-base text-zinc-600'>
          {descriptionText[type]}
        </Text>

        {/* Code display - large, easy to read */}
        <Section className='my-8'>
          <Text className='mx-auto my-0 inline-block rounded-lg bg-zinc-100 px-6 py-4 font-mono text-[32px] font-bold tracking-[0.5em] text-zinc-900'>
            {code}
          </Text>
        </Section>

        <Text className='mx-0 my-4 text-center text-sm text-zinc-500'>
          This code will expire in 10 minutes.
        </Text>

        <Text className='mx-0 my-4 text-center text-sm text-zinc-500'>
          If you didn&apos;t request this code, you can safely ignore this email.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default VerificationCodeEmail
