import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'
import { getEvent } from 'vinxi/http'
import { z } from 'zod'

import { prisma } from '~/server/db'

// Schema for business profile data
const businessProfileSchema = z.object({
  companyName: z.string().min(2),
  fullName: z.string().min(2),
  phone: z.string().min(10),
  userRole: z.string().optional(),
  unitsManaged: z.string().min(1),
  signupReason: z.string().min(1),
  previousPlatform: z.string().optional(),
})

/**
 * Complete the business profile step of onboarding.
 * Creates a Team for the user and updates their profile.
 */
export const completeBusinessProfile = createServerFn({ method: 'POST' })
  .validator(zodValidator(businessProfileSchema))
  .handler(async ({ data }) => {
    const event = getEvent()
    const auth = event.context.auth

    if (!auth?.isAuthenticated || !auth.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const userId = auth.user.id

    try {
      // Generate a URL-friendly slug from company name
      const slug = data.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now().toString(36)

      // Use a transaction to create team and update user
      const result = await prisma.$transaction(async (tx) => {
        // Create the team
        const team = await tx.team.create({
          data: {
            name: data.companyName,
            slug,
            ownerId: userId,
            unitsManaged: data.unitsManaged,
            signupReason: data.signupReason,
            previousPlatform: data.previousPlatform || null,
          },
        })

        // Add user as owner of the team
        await tx.teamMember.create({
          data: {
            teamId: team.id,
            userId,
            role: 'OWNER',
            acceptedAt: new Date(),
          },
        })

        // Update user with phone and role
        await tx.user.update({
          where: { id: userId },
          data: {
            name: data.fullName,
            phone: data.phone,
            userRole: data.userRole || null,
          },
        })

        return team
      })

      return { success: true, teamId: result.id }
    }
    catch (error: unknown) {
      console.error('Failed to complete business profile:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile'
      return { success: false, error: errorMessage }
    }
  })

/**
 * Mark onboarding as complete for the current user.
 */
export const completeOnboarding = createServerFn({ method: 'POST' })
  .handler(async () => {
    const event = getEvent()
    const auth = event.context.auth

    if (!auth?.isAuthenticated || !auth.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    try {
      await prisma.user.update({
        where: { id: auth.user.id },
        data: {
          onboardingCompletedAt: new Date(),
        },
      })

      return { success: true }
    }
    catch (error: unknown) {
      console.error('Failed to complete onboarding:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete onboarding'
      return { success: false, error: errorMessage }
    }
  })

/**
 * Get the current user's onboarding status.
 */
export const getOnboardingStatus = createServerFn({ method: 'GET' })
  .handler(async () => {
    const event = getEvent()
    const auth = event.context.auth

    if (!auth?.isAuthenticated || !auth.user?.id) {
      return {
        isAuthenticated: false,
        hasTeam: false,
        emailVerified: false,
        onboardingComplete: false,
      }
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: auth.user.id },
        include: {
          teamMemberships: {
            include: {
              team: true,
            },
          },
        },
      })

      return {
        isAuthenticated: true,
        hasTeam: (user?.teamMemberships?.length ?? 0) > 0,
        emailVerified: user?.emailVerified ?? false,
        onboardingComplete: user?.onboardingCompletedAt !== null,
      }
    }
    catch (error) {
      console.error('Failed to get onboarding status:', error)
      return {
        isAuthenticated: true,
        hasTeam: false,
        emailVerified: false,
        onboardingComplete: false,
      }
    }
  })
