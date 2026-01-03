import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { LuMail } from 'react-icons/lu'
import { toast } from 'sonner'
import { useTranslations } from 'use-intl'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '~/components/ui/input-otp'
import { Link } from '~/components/ui/link'
import { authClient } from '~/libs/auth-client'

export const Route = createFileRoute('/auth/sign-up/verify')({
  beforeLoad: ({ context }) => {
    // Must be authenticated to access this page
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/auth/sign-up' })
    }
    // If email is already verified, go to welcome page
    if (context.auth.user?.emailVerified) {
      throw redirect({ to: '/auth/sign-up/welcome' })
    }
  },
  component: VerifyEmailRoute,
})

function VerifyEmailRoute() {
  const t = useTranslations()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Get current user email from auth context
  const context = Route.useRouteContext()
  const userEmail = context.auth.isAuthenticated ? context.auth.user.email : ''

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const sendVerificationCode = useCallback(async () => {
    if (!userEmail) return

    setIsResending(true)
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email: userEmail,
        type: 'email-verification',
      })
      setResendCooldown(60) // 60 second cooldown
    }
    catch (error) {
      console.error('Failed to send verification code:', error)
    }
    finally {
      setIsResending(false)
    }
  }, [userEmail])

  const handleVerify = useCallback(async () => {
    if (code.length !== 6) return

    setIsVerifying(true)
    try {
      const result = await authClient.emailOtp.verifyEmail({
        email: userEmail,
        otp: code,
      })

      if (result.error) {
        toast.error(t('onboarding.verification-failed'), {
          description: result.error.message,
        })
        setCode('') // Clear code on error
      }
      else {
        toast.success(t('onboarding.email-verified'))
        navigate({ to: '/auth/sign-up/welcome' })
      }
    }
    catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('onboarding.verification-failed'), {
        description: errorMessage,
      })
      setCode('')
    }
    finally {
      setIsVerifying(false)
    }
  }, [code, userEmail, t, navigate])

  // Auto-submit when code is complete
  useEffect(() => {
    if (code.length === 6) {
      handleVerify()
    }
  }, [code, handleVerify])

  // Send initial verification code on mount
  useEffect(() => {
    sendVerificationCode()
  }, [sendVerificationCode])

  const handleResend = async () => {
    if (resendCooldown > 0) return

    await sendVerificationCode()
    toast.success(t('onboarding.code-resent'))
  }

  return (
    <Card className='w-full lg:max-w-md'>
      <CardHeader className='text-center'>
        <div className='mb-2 flex items-center justify-center gap-2'>
          <ProgressIndicator step={2} totalSteps={2} />
        </div>

        {/* Email icon */}
        <div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10'>
          <LuMail className='size-8 text-primary' />
        </div>

        <CardTitle>{t('onboarding.check-your-email')}</CardTitle>
        <CardDescription>
          {t('onboarding.verification-code-sent')}
          <br />
          <span className='font-medium text-foreground'>{userEmail}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* OTP Input */}
        <div className='flex justify-center'>
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            disabled={isVerifying}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {/* Verify button */}
        <Button
          className='w-full'
          onClick={handleVerify}
          disabled={code.length !== 6 || isVerifying}
        >
          {isVerifying ? t('onboarding.verifying') : t('onboarding.verify-and-continue')}
        </Button>

        {/* Helper links */}
        <div className='flex flex-col items-center gap-3 text-sm'>
          <div className='flex items-center gap-1'>
            <span className='text-muted-foreground'>
              {t('onboarding.didnt-receive-code')}
            </span>
            <Button
              variant='link'
              className='h-auto p-0'
              onClick={handleResend}
              disabled={resendCooldown > 0 || isResending}
            >
              {resendCooldown > 0
                ? t('onboarding.resend-in-seconds', { seconds: resendCooldown })
                : t('onboarding.resend-code')}
            </Button>
          </div>

          <Button
            variant='link'
            className='h-auto p-0 text-muted-foreground'
            asChild
          >
            <Link to='/auth/sign-up'>
              {t('onboarding.change-email-address')}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Progress indicator component
function ProgressIndicator({ step, totalSteps }: { step: number; totalSteps: number }) {
  return (
    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
      <span>Step {step} of {totalSteps}</span>
      <div className='flex gap-1'>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={`step-${i + 1}`}
            className={`h-1.5 w-8 rounded-full ${
              i < step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
