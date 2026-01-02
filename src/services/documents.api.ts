import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'

import { createSupabaseAdmin } from '~/libs/supabase'
import { authedMiddleware } from '~/middlewares/auth'
import {
  createUploadUrl,
  createDownloadUrl,
  deleteFile,
  validateFile,
  ALLOWED_DOCUMENT_TYPES,
} from '~/server/storage'
import { getSupabaseUserId } from '~/server/user-lookup'
import {
  createDocumentUploadSchema,
  confirmDocumentUploadSchema,
  documentFiltersSchema,
  documentIdSchema,
  updateDocumentSchema,
} from '~/services/documents.schema'

// Get all documents for the authenticated user
export const getDocuments = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(documentFiltersSchema))
  .handler(async ({ context, data }) => {
    const supabase = createSupabaseAdmin()
    const supabaseUserId = await getSupabaseUserId(context.auth.user.email)

    const { type, status, propertyId, tenantId, search, limit, offset } = data

    let query = supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('uploaded_by_id', supabaseUserId)
      .neq('status', 'DELETED')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type) {
      query = query.eq('type', type)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }
    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }
    if (search) {
      query = query.or(`file_name.ilike.%${search}%,title.ilike.%${search}%`)
    }

    const { data: documents, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`)
    }

    return {
      documents: documents || [],
      total: count || 0,
      limit,
      offset,
    }
  })

// Get a single document by ID
export const getDocument = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(documentIdSchema))
  .handler(async ({ context, data }) => {
    const supabase = createSupabaseAdmin()
    const supabaseUserId = await getSupabaseUserId(context.auth.user.email)

    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', data.id)
      .eq('uploaded_by_id', supabaseUserId)
      .single()

    if (error || !document) {
      throw new Error('Document not found')
    }

    return document
  })

// Create document record and get upload URL
export const createDocumentUpload = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createDocumentUploadSchema))
  .handler(async ({ context, data }) => {
    const supabase = createSupabaseAdmin()
    const supabaseUserId = await getSupabaseUserId(context.auth.user.email)

    // Validate file
    const validation = validateFile(
      {
        size: data.fileSize,
        type: data.mimeType,
        name: data.fileName,
      },
      ALLOWED_DOCUMENT_TYPES
    )

    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Generate signed upload URL
    const uploadResult = await createUploadUrl(supabaseUserId, data.fileName, data.mimeType, {
      propertyId: data.propertyId,
      documentType: data.type.toLowerCase(),
    })

    // Create document record with PENDING status
    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        type: data.type,
        status: 'PENDING',
        file_name: data.fileName,
        file_size: data.fileSize,
        mime_type: data.mimeType,
        file_url: '', // Will be set after upload confirmation
        storage_path: uploadResult.path,
        title: data.title || data.fileName,
        description: data.description,
        tags: data.tags,
        expires_at: data.expiresAt,
        uploaded_by_id: supabaseUserId,
        property_id: data.propertyId,
        tenant_id: data.tenantId,
      })
      .select()
      .single()

    if (error || !document) {
      throw new Error(`Failed to create document record: ${error?.message || 'Unknown error'}`)
    }

    return {
      document,
      uploadUrl: uploadResult.signedUrl,
      uploadToken: uploadResult.token,
    }
  })

// Confirm upload completed and activate document
export const confirmDocumentUpload = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(confirmDocumentUploadSchema))
  .handler(async ({ context, data }) => {
    const supabase = createSupabaseAdmin()
    const supabaseUserId = await getSupabaseUserId(context.auth.user.email)

    // Get the document
    const { data: existingDoc, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', data.documentId)
      .eq('uploaded_by_id', supabaseUserId)
      .eq('status', 'PENDING')
      .single()

    if (fetchError || !existingDoc) {
      throw new Error('Document not found or already confirmed')
    }

    // Generate the public URL for the file
    const fileUrl = await createDownloadUrl(existingDoc.storage_path)

    // Update document status to ACTIVE
    const { data: document, error } = await supabase
      .from('documents')
      .update({
        status: 'ACTIVE',
        file_url: fileUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.documentId)
      .select()
      .single()

    if (error || !document) {
      throw new Error(`Failed to confirm upload: ${error?.message || 'Unknown error'}`)
    }

    return document
  })

// Update document metadata
export const updateDocument = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(documentIdSchema.merge(updateDocumentSchema)))
  .handler(async ({ context, data }) => {
    const supabase = createSupabaseAdmin()
    const supabaseUserId = await getSupabaseUserId(context.auth.user.email)

    const { id, ...updateData } = data

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('documents')
      .select('id')
      .eq('id', id)
      .eq('uploaded_by_id', supabaseUserId)
      .single()

    if (fetchError || !existing) {
      throw new Error('Document not found')
    }

    // Update document
    const { data: document, error } = await supabase
      .from('documents')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !document) {
      throw new Error(`Failed to update document: ${error?.message || 'Unknown error'}`)
    }

    return document
  })

// Delete document (soft delete by changing status, then remove from storage)
export const deleteDocument = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(documentIdSchema))
  .handler(async ({ context, data }) => {
    const supabase = createSupabaseAdmin()
    const supabaseUserId = await getSupabaseUserId(context.auth.user.email)

    // Get the document to verify ownership and get storage path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', data.id)
      .eq('uploaded_by_id', supabaseUserId)
      .single()

    if (fetchError || !document) {
      throw new Error('Document not found')
    }

    // Delete from storage
    try {
      await deleteFile(document.storage_path)
    } catch (storageError) {
      console.error('Failed to delete file from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Soft delete in database
    const { error } = await supabase
      .from('documents')
      .update({
        status: 'DELETED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)

    if (error) {
      throw new Error(`Failed to delete document: ${error.message}`)
    }

    return { success: true }
  })

// Get download URL for a document
export const getDocumentDownloadUrl = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(documentIdSchema))
  .handler(async ({ context, data }) => {
    const supabase = createSupabaseAdmin()
    const supabaseUserId = await getSupabaseUserId(context.auth.user.email)

    // Verify ownership
    const { data: document, error } = await supabase
      .from('documents')
      .select('storage_path, file_name')
      .eq('id', data.id)
      .eq('uploaded_by_id', supabaseUserId)
      .single()

    if (error || !document) {
      throw new Error('Document not found')
    }

    // Generate fresh download URL
    const downloadUrl = await createDownloadUrl(document.storage_path)

    return {
      downloadUrl,
      fileName: document.file_name,
    }
  })

// Get document counts by type for the sidebar
export const getDocumentCounts = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .handler(async ({ context }) => {
    const supabase = createSupabaseAdmin()
    const supabaseUserId = await getSupabaseUserId(context.auth.user.email)

    const { data, error } = await supabase
      .from('documents')
      .select('type')
      .eq('uploaded_by_id', supabaseUserId)
      .eq('status', 'ACTIVE')

    if (error) {
      throw new Error(`Failed to get document counts: ${error.message}`)
    }

    // Count by type
    const counts: Record<string, number> = {}
    for (const doc of data || []) {
      counts[doc.type] = (counts[doc.type] || 0) + 1
    }

    return counts
  })
