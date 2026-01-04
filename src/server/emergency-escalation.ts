import { differenceInMinutes, formatDistanceToNow } from 'date-fns'

import { logger } from '~/libs/logger'
import { tryCatchAsync } from '~/libs/utils'
import { prisma } from '~/server/db'
import { sendEmail } from '~/server/email'
import { EmergencyEscalationEmail } from '~/emails/emergency-escalation-email'

// Escalation thresholds in minutes
const ESCALATION_THRESHOLDS = {
  LEVEL_1: 0,    // Immediate - when emergency is created
  LEVEL_2: 30,   // 30 minutes unacknowledged
  LEVEL_3: 60,   // 1 hour unacknowledged
} as const

// Category labels for email
const categoryLabels: Record<string, string> = {
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  HVAC: 'HVAC',
  APPLIANCE: 'Appliance',
  STRUCTURAL: 'Structural',
  PEST_CONTROL: 'Pest Control',
  LANDSCAPING: 'Landscaping',
  CLEANING: 'Cleaning',
  PAINTING: 'Painting',
  FLOORING: 'Flooring',
  WINDOWS_DOORS: 'Windows/Doors',
  ROOF: 'Roof',
  SAFETY: 'Safety',
  OTHER: 'Other',
}

interface EmergencyRequest {
  id: string
  requestNumber: string
  title: string
  description: string
  category: string
  escalationLevel: number
  createdAt: Date
  unit: {
    unitNumber: string
    property: {
      id: string
      name: string
      manager: {
        id: string
        email: string | null
        firstName: string
        lastName: string
      }
    }
  }
  tenant?: {
    firstName: string
    lastName: string
    phone: string | null
  } | null
}

/**
 * Get property manager email recipients for an emergency
 */
async function getEscalationRecipients(propertyId: string): Promise<Array<{ email: string; name: string }>> {
  // Get property manager
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      manager: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  const recipients: Array<{ email: string; name: string }> = []

  if (property?.manager?.email) {
    recipients.push({
      email: property.manager.email,
      name: `${property.manager.firstName} ${property.manager.lastName}`,
    })
  }

  return recipients
}

/**
 * Send escalation email notification
 */
async function sendEscalationEmail(
  request: EmergencyRequest,
  escalationLevel: number
): Promise<void> {
  const recipients = await getEscalationRecipients(request.unit.property.id)

  if (recipients.length === 0) {
    logger.warn(`No escalation recipients found for property ${request.unit.property.id}`)
    return
  }

  const viewUrl = `${import.meta.env.VITE_APP_URL}/app/maintenance/${request.id}`
  const timeSinceCreated = formatDistanceToNow(request.createdAt, { addSuffix: false })

  for (const recipient of recipients) {
    const [error] = await tryCatchAsync(
      sendEmail({
        to: recipient.email,
        subject: `EMERGENCY: ${request.requestNumber} - ${categoryLabels[request.category] || request.category} Issue`,
        react: EmergencyEscalationEmail({
          recipientName: recipient.name,
          requestNumber: request.requestNumber,
          title: request.title,
          description: request.description,
          propertyName: request.unit.property.name,
          unitNumber: request.unit.unitNumber,
          category: categoryLabels[request.category] || request.category,
          escalationLevel,
          timeSinceCreated,
          tenantName: request.tenant
            ? `${request.tenant.firstName} ${request.tenant.lastName}`
            : undefined,
          tenantPhone: request.tenant?.phone || undefined,
          viewUrl,
        }),
        tags: [
          { name: 'type', value: 'emergency-escalation' },
          { name: 'request_id', value: request.id },
          { name: 'level', value: String(escalationLevel) },
        ],
      })
    )

    if (error) {
      logger.error(
        `Failed to send escalation email for ${request.requestNumber} to ${recipient.email}: ${error.message}`
      )
    } else {
      logger.info(
        `Escalation email sent for ${request.requestNumber} (level ${escalationLevel}) to ${recipient.email}`
      )
    }
  }
}

/**
 * Send initial emergency alert when a new emergency work order is created
 */
export async function sendInitialEmergencyAlert(requestId: string): Promise<void> {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      requestNumber: true,
      title: true,
      description: true,
      category: true,
      priority: true,
      escalationLevel: true,
      createdAt: true,
      unit: {
        select: {
          unitNumber: true,
          property: {
            select: {
              id: true,
              name: true,
              manager: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
      tenant: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
  })

  if (!request || request.priority !== 'EMERGENCY') {
    return
  }

  // Update escalation level to 1
  await prisma.maintenanceRequest.update({
    where: { id: requestId },
    data: {
      escalationLevel: 1,
      lastEscalatedAt: new Date(),
    },
  })

  // Send initial alert
  await sendEscalationEmail(request as EmergencyRequest, 1)

  logger.info(`Initial emergency alert sent for ${request.requestNumber}`)
}

/**
 * Acknowledge an escalation (stops further escalation)
 */
export async function acknowledgeEscalation(
  requestId: string,
  userId: string
): Promise<void> {
  await prisma.maintenanceRequest.update({
    where: { id: requestId },
    data: {
      escalationAcknowledgedAt: new Date(),
      escalationAcknowledgedById: userId,
    },
  })

  logger.info(`Escalation acknowledged for request ${requestId} by user ${userId}`)
}

/**
 * Check and process escalations for all unacknowledged emergency work orders
 * This should be called by a cron job or scheduled task
 */
export async function processEmergencyEscalations(): Promise<{
  processed: number
  escalated: number
}> {
  const now = new Date()
  let processed = 0
  let escalated = 0

  // Find all unacknowledged emergency work orders
  const emergencyRequests = await prisma.maintenanceRequest.findMany({
    where: {
      priority: 'EMERGENCY',
      status: {
        in: ['SUBMITTED', 'ACKNOWLEDGED'],
      },
      escalationAcknowledgedAt: null,
    },
    select: {
      id: true,
      requestNumber: true,
      title: true,
      description: true,
      category: true,
      escalationLevel: true,
      lastEscalatedAt: true,
      createdAt: true,
      unit: {
        select: {
          unitNumber: true,
          property: {
            select: {
              id: true,
              name: true,
              manager: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
      tenant: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
  })

  for (const request of emergencyRequests) {
    processed++
    const minutesSinceCreated = differenceInMinutes(now, request.createdAt)
    const currentLevel = request.escalationLevel

    let newLevel = currentLevel

    // Determine if we need to escalate
    if (minutesSinceCreated >= ESCALATION_THRESHOLDS.LEVEL_3 && currentLevel < 3) {
      newLevel = 3
    } else if (minutesSinceCreated >= ESCALATION_THRESHOLDS.LEVEL_2 && currentLevel < 2) {
      newLevel = 2
    } else if (currentLevel === 0) {
      // Should have been set to 1 on creation, but catch any that slipped through
      newLevel = 1
    }

    if (newLevel > currentLevel) {
      // Update escalation level
      await prisma.maintenanceRequest.update({
        where: { id: request.id },
        data: {
          escalationLevel: newLevel,
          lastEscalatedAt: now,
        },
      })

      // Send escalation email
      await sendEscalationEmail(request as EmergencyRequest, newLevel)
      escalated++

      logger.info(
        `Emergency ${request.requestNumber} escalated from level ${currentLevel} to ${newLevel}`
      )
    }
  }

  logger.info(
    `Emergency escalation check complete: ${processed} processed, ${escalated} escalated`
  )

  return { processed, escalated }
}

/**
 * Get emergency statistics for dashboard
 */
export async function getEmergencyStats(managerId: string) {
  const [activeEmergencies, unacknowledgedCount, avgResponseTime] = await Promise.all([
    // Count active emergencies
    prisma.maintenanceRequest.count({
      where: {
        priority: 'EMERGENCY',
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
        unit: {
          property: {
            managerId,
          },
        },
      },
    }),

    // Count unacknowledged escalations
    prisma.maintenanceRequest.count({
      where: {
        priority: 'EMERGENCY',
        escalationLevel: { gt: 0 },
        escalationAcknowledgedAt: null,
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
        unit: {
          property: {
            managerId,
          },
        },
      },
    }),

    // Calculate average time to acknowledge (in minutes)
    prisma.maintenanceRequest.aggregate({
      where: {
        priority: 'EMERGENCY',
        escalationAcknowledgedAt: { not: null },
        unit: {
          property: {
            managerId,
          },
        },
      },
      _avg: {
        // This is a simplified version - in production you'd use raw SQL for date diff
        escalationLevel: true,
      },
    }),
  ])

  return {
    activeEmergencies,
    unacknowledgedCount,
    avgResponseTimeMinutes: null, // Would need raw SQL to calculate properly
  }
}
