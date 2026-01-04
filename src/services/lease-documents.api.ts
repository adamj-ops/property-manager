/**
 * Lease Documents API Functions
 * EPM-43: Lease Document Generation
 */

import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'
import { format } from 'date-fns'

import { createSupabaseAdmin } from '~/libs/supabase'
import { authedMiddleware } from '~/middlewares/auth'
import { prisma } from '~/server/db'
import { mergeDocxDocuments } from '~/server/docx-merger'
import { renderTemplate } from '~/server/docx-processor'
import { buildLeaseDocumentData, formatLeaseDocumentData } from '~/server/lease-document-builder'
import { convertDocxToPdf } from '~/server/pdf-converter'
import { createDownloadUrl } from '~/server/storage'
import { downloadTemplateFile } from '~/server/storage'
import { getSupabaseUserId } from '~/server/user-lookup'
import {
  generateLeasePdfSchema,
  regenerateLeasePdfSchema,
  getLeasePdfDownloadUrlSchema,
} from '~/services/lease-documents.schema'

// Response type for lease document generation
export interface LeaseDocumentResponse {
  documentId: string
  leaseId: string
  documentUrl: string
  storagePath: string
  fileName: string
  fileSize: number
  generatedAt: string
}

const BUCKET_NAME = 'documents'

/**
 * Core logic for generating a lease PDF document.
 * Extracted as a helper function so it can be reused by both generate and regenerate endpoints.
 */
async function generateLeasePdfCore(
  context: { auth: { user: { id: string; email: string } } },
  data: { leaseId: string; addendumIds?: string[] }
): Promise<LeaseDocumentResponse> {
    const supabase = createSupabaseAdmin()
    const supabaseUserId = await getSupabaseUserId(context.auth.user.email)

    // 1. Fetch lease with all related data
    const lease = await prisma.lease.findFirst({
      where: {
        id: data.leaseId,
        unit: { property: { managerId: context.auth.user.id } },
      },
      include: {
        unit: {
          include: { property: true },
        },
        tenant: true,
        coTenants: true,
      },
    })

    if (!lease) {
      throw new Error('Lease not found')
    }

    // 2. Get main lease template
    const { data: mainTemplate, error: templateError } = await supabase
      .from('lease_templates')
      .select('*')
      .eq('type', 'MAIN_LEASE')
      .eq('is_active', true)
      .eq('is_archived', false)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (templateError || !mainTemplate) {
      throw new Error('Main lease template not found. Please create a default lease template first.')
    }

    if (!mainTemplate.template_file_path) {
      throw new Error('Template file path is missing')
    }

    // 3. Download main template file
    const mainTemplateBuffer = await downloadTemplateFile(mainTemplate.template_file_path)

    // 4. Get addendum templates if any
    const addendumTemplates: Array<{ type: string; buffer: ArrayBuffer }> = []
    if (data.addendumIds && data.addendumIds.length > 0) {
      // For now, we'll get addendum templates by type based on lease data
      // In the future, this could be based on addendumIds if we store template IDs
      const addendumTypes: string[] = []
      if (lease.petsAllowed) addendumTypes.push('ADDENDUM_PET')
      // Add more addendum types based on lease data

      for (const addendumType of addendumTypes) {
        const { data: addendumTemplate } = await supabase
          .from('lease_templates')
          .select('*')
          .eq('type', addendumType)
          .eq('is_active', true)
          .eq('is_archived', false)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (addendumTemplate?.template_file_path) {
          const addendumBuffer = await downloadTemplateFile(addendumTemplate.template_file_path)
          addendumTemplates.push({ type: addendumType, buffer: addendumBuffer })
        }
      }
    }

    // 5. Build variable data
    const leaseWithRelations = lease as typeof lease & {
      tenant: NonNullable<typeof lease.tenant>
      unit: NonNullable<typeof lease.unit> & { property: NonNullable<(typeof lease.unit)['property']> }
    }
    // Map property to include 'zip' alias for compatibility with lease-document-builder
    const propertyWithZip = {
      ...leaseWithRelations.unit.property,
      zip: leaseWithRelations.unit.property.zipCode,
    }
    const variableData = buildLeaseDocumentData(leaseWithRelations, leaseWithRelations.tenant, leaseWithRelations.unit, propertyWithZip)
    const formattedData = formatLeaseDocumentData(variableData)

    // 6. Render main template
    const renderedMainDocx = await renderTemplate(mainTemplateBuffer, formattedData)

    // 7. Render addendum templates and merge
    const documentBuffers: ArrayBuffer[] = [renderedMainDocx]
    for (const addendum of addendumTemplates) {
      const renderedAddendum = await renderTemplate(addendum.buffer, formattedData)
      documentBuffers.push(renderedAddendum)
    }

    // 8. Merge all documents
    const mergedDocx = await mergeDocxDocuments(documentBuffers)

    // 9. Convert DOCX to PDF
    const pdfBuffer = await convertDocxToPdf(mergedDocx)

    // 10. Upload PDF to storage
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss')
    const fileName = `lease-${lease.leaseNumber}-${timestamp}.pdf`
    const storagePath = `${supabaseUserId}/leases/${data.leaseId}/${fileName}`

    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`)
    }

    // 11. Create document record
    const documentUrl = await createDownloadUrl(storagePath)
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        type: 'LEASE',
        status: 'ACTIVE',
        file_name: fileName,
        file_size: pdfBuffer.length,
        mime_type: 'application/pdf',
        file_url: documentUrl,
        storage_path: storagePath,
        title: `Lease Agreement - ${lease.leaseNumber}`,
        description: `Generated lease document for ${leaseWithRelations.tenant.firstName} ${leaseWithRelations.tenant.lastName}`,
        uploaded_by_id: supabaseUserId,
        property_id: leaseWithRelations.unit.propertyId,
        tenant_id: lease.tenantId,
      })
      .select()
      .single()

    if (docError || !document) {
      throw new Error(`Failed to create document record: ${docError?.message || 'Unknown error'}`)
    }

    // 12. Update lease document URL
    await prisma.lease.update({
      where: { id: data.leaseId },
      data: { leaseDocumentUrl: documentUrl },
    })

    return {
      documentId: document.id,
      leaseId: data.leaseId,
      documentUrl,
      storagePath,
      fileName,
      fileSize: pdfBuffer.length,
      generatedAt: new Date().toISOString(),
    }
}

/**
 * Generate a lease PDF document from templates.
 */
export const generateLeasePdf = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(generateLeasePdfSchema))
  .handler(async ({ context, data }): Promise<LeaseDocumentResponse> => {
    return generateLeasePdfCore(context, data)
  })

/**
 * Regenerate a lease PDF document (optionally with a different template).
 */
export const regenerateLeasePdf = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(regenerateLeasePdfSchema))
  .handler(async ({ context, data }): Promise<LeaseDocumentResponse> => {
    // For now, regeneration works the same as generation
    // In the future, we could support template overrides via templateId
    return generateLeasePdfCore(context, { leaseId: data.leaseId, addendumIds: data.addendumIds })
  })

/**
 * Get a signed download URL for a lease PDF document.
 */
export const getLeasePdfDownloadUrl = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(getLeasePdfDownloadUrlSchema))
  .handler(async ({ context, data }) => {
    // Verify lease access
    const lease = await prisma.lease.findFirst({
      where: {
        id: data.leaseId,
        unit: { property: { managerId: context.auth.user.id } },
      },
      select: { id: true, leaseNumber: true, leaseDocumentUrl: true },
    })

    if (!lease) {
      throw new Error('Lease not found')
    }

    // If lease has a document URL, use it directly
    if (lease.leaseDocumentUrl) {
      return { downloadUrl: lease.leaseDocumentUrl }
    }

    // Otherwise, try to find the document in the documents table
    const supabase = createSupabaseAdmin()
    const supabaseUserId = await getSupabaseUserId(context.auth.user.email)

    const { data: documents } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('type', 'LEASE')
      .ilike('file_name', `%lease-${lease.leaseNumber}%`)
      .eq('uploaded_by_id', supabaseUserId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (!documents || documents.length === 0 || !documents[0]?.storage_path) {
      throw new Error('Lease document not found. Please generate the document first.')
    }

    const downloadUrl = await createDownloadUrl(documents[0].storage_path)
    return { downloadUrl }
  })

