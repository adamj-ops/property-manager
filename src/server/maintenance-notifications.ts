import { logger } from '~/libs/logger'
import { tryCatchAsync } from '~/libs/utils'
import { sendEmail } from '~/server/email'
import { MaintenanceStatusEmail } from '~/emails/maintenance-status-email'

interface MaintenanceRequestInfo {
  id: string
  requestNumber: string
  title: string
  unit: {
    unitNumber: string
    property: {
      name: string
    }
  }
  tenant?: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
}

interface StatusChangeNotificationOptions {
  request: MaintenanceRequestInfo
  previousStatus: string | null
  newStatus: string
  statusNote?: string
}

/**
 * Send email notification to tenant when maintenance request status changes
 */
export async function sendMaintenanceStatusNotification(
  options: StatusChangeNotificationOptions
): Promise<void> {
  const { request, previousStatus, newStatus, statusNote } = options

  // Only send if there's a tenant with an email
  if (!request.tenant?.email) {
    logger.info(
      `Skipping maintenance status email for ${request.requestNumber} - no tenant email`
    )
    return
  }

  const recipientName = `${request.tenant.firstName} ${request.tenant.lastName}`
  const viewUrl = `${import.meta.env.VITE_APP_URL}/app/maintenance/${request.id}`

  const [error] = await tryCatchAsync(
    sendEmail({
      to: request.tenant.email,
      subject: `Work Order ${request.requestNumber} - Status Update`,
      react: MaintenanceStatusEmail({
        recipientName,
        requestNumber: request.requestNumber,
        title: request.title,
        propertyName: request.unit.property.name,
        unitNumber: request.unit.unitNumber,
        previousStatus,
        newStatus,
        statusNote,
        viewUrl,
      }),
      tags: [
        { name: 'type', value: 'maintenance-status' },
        { name: 'request_id', value: request.id },
        { name: 'status', value: newStatus },
      ],
    })
  )

  if (error) {
    // Log error but don't throw - email failure shouldn't break the status update
    logger.error(
      `Failed to send maintenance status email for ${request.requestNumber}: ${error.message}`
    )
    return
  }

  logger.info(
    `Maintenance status email sent for ${request.requestNumber} to ${request.tenant.email}`
  )
}

/**
 * Status changes that should trigger tenant notifications
 */
export const notifiableStatusChanges = [
  'ACKNOWLEDGED',
  'SCHEDULED',
  'IN_PROGRESS',
  'PENDING_PARTS',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
] as const

/**
 * Check if a status change should trigger a notification
 */
export function shouldNotifyOnStatusChange(
  previousStatus: string | null,
  newStatus: string
): boolean {
  // Don't notify for the same status
  if (previousStatus === newStatus) {
    return false
  }

  // Notify for all meaningful status changes
  return notifiableStatusChanges.includes(newStatus as typeof notifiableStatusChanges[number])
}
