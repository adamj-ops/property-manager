import { createSupabaseAdmin } from '~/libs/supabase'

const BUCKET_NAME = 'documents'
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

export interface UploadUrlResult {
  signedUrl: string
  token: string
  path: string
}

/**
 * Generate a signed URL for uploading a file to Supabase Storage.
 * The file path is structured as: {userId}/{propertyId|general}/{type}/{uuid}-{fileName}
 */
export async function createUploadUrl(
  userId: string,
  fileName: string,
  _contentType: string,
  options?: {
    propertyId?: string
    documentType?: string
  }
): Promise<UploadUrlResult> {
  const supabase = createSupabaseAdmin()

  // Generate unique path
  const uuid = crypto.randomUUID()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const folder = options?.propertyId || 'general'
  const type = options?.documentType || 'other'
  const path = `${userId}/${folder}/${type}/${uuid}-${sanitizedFileName}`

  // Create signed upload URL (valid for 1 hour)
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(path)

  if (error || !data) {
    throw new Error(`Failed to create upload URL: ${error?.message || 'Unknown error'}`)
  }

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    path,
  }
}

/**
 * Generate a signed URL for downloading a file from Supabase Storage.
 * Valid for 1 hour by default.
 */
export async function createDownloadUrl(
  storagePath: string,
  expiresIn = 3600
): Promise<string> {
  const supabase = createSupabaseAdmin()

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, expiresIn)

  if (error || !data) {
    throw new Error(`Failed to create download URL: ${error?.message || 'Unknown error'}`)
  }

  return data.signedUrl
}

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteFile(storagePath: string): Promise<void> {
  const supabase = createSupabaseAdmin()

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath])

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

/**
 * Get file metadata from storage
 */
export async function getFileInfo(storagePath: string) {
  const supabase = createSupabaseAdmin()

  // List files in the path's directory to find the file
  const parts = storagePath.split('/')
  const fileName = parts.pop()
  const folder = parts.join('/')

  const { data, error } = await supabase.storage.from(BUCKET_NAME).list(folder, {
    search: fileName,
  })

  if (error) {
    throw new Error(`Failed to get file info: ${error.message}`)
  }

  const file = data?.find((f) => f.name === fileName)
  return file || null
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: { size: number; type: string; name: string },
  allowedTypes?: string[]
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  // Check file type if allowed types specified
  if (allowedTypes && allowedTypes.length > 0) {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      }
    }
  }

  return { valid: true }
}

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

export const ALLOWED_TEMPLATE_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]

const TEMPLATES_BUCKET_NAME = 'documents' // Using same bucket with different path prefix

/**
 * Generate a signed URL for uploading a template file to Supabase Storage.
 * Path structure: templates/{userId}/{type}/{uuid}-{fileName}.docx
 */
export async function createTemplateUploadUrl(
  userId: string,
  fileName: string,
  templateType: string
): Promise<UploadUrlResult> {
  const supabase = createSupabaseAdmin()

  // Generate unique path for templates
  const uuid = crypto.randomUUID()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = `templates/${userId}/${templateType.toLowerCase()}/${uuid}-${sanitizedFileName}`

  // Create signed upload URL (valid for 1 hour)
  const { data, error } = await supabase.storage
    .from(TEMPLATES_BUCKET_NAME)
    .createSignedUploadUrl(path)

  if (error || !data) {
    throw new Error(`Failed to create template upload URL: ${error?.message || 'Unknown error'}`)
  }

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    path,
  }
}

/**
 * Generate a signed URL for downloading a template file from Supabase Storage.
 * Valid for 1 hour by default.
 */
export async function createTemplateDownloadUrl(
  storagePath: string,
  expiresIn = 3600
): Promise<string> {
  const supabase = createSupabaseAdmin()

  const { data, error } = await supabase.storage
    .from(TEMPLATES_BUCKET_NAME)
    .createSignedUrl(storagePath, expiresIn)

  if (error || !data) {
    throw new Error(`Failed to create template download URL: ${error?.message || 'Unknown error'}`)
  }

  return data.signedUrl
}

/**
 * Download a template file from Supabase Storage as a Buffer.
 * Used for server-side template processing.
 */
export async function downloadTemplateFile(storagePath: string): Promise<ArrayBuffer> {
  const supabase = createSupabaseAdmin()

  const { data, error } = await supabase.storage
    .from(TEMPLATES_BUCKET_NAME)
    .download(storagePath)

  if (error || !data) {
    throw new Error(`Failed to download template file: ${error?.message || 'Unknown error'}`)
  }

  return data.arrayBuffer()
}

/**
 * Delete a template file from Supabase Storage.
 */
export async function deleteTemplateFile(storagePath: string): Promise<void> {
  const supabase = createSupabaseAdmin()

  const { error } = await supabase.storage.from(TEMPLATES_BUCKET_NAME).remove([storagePath])

  if (error) {
    throw new Error(`Failed to delete template file: ${error.message}`)
  }
}

/**
 * Validate template file before upload
 */
export function validateTemplateFile(
  file: { size: number; type: string; name: string }
): { valid: boolean; error?: string } {
  // Check file size (10MB max for templates)
  const MAX_TEMPLATE_SIZE = 10 * 1024 * 1024
  if (file.size > MAX_TEMPLATE_SIZE) {
    return {
      valid: false,
      error: `Template file size exceeds maximum of ${MAX_TEMPLATE_SIZE / 1024 / 1024}MB`,
    }
  }

  // Check file type
  if (!ALLOWED_TEMPLATE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Template file type ${file.type} is not allowed. Only DOCX files are supported.`,
    }
  }

  // Check file extension
  if (!file.name.toLowerCase().endsWith('.docx')) {
    return {
      valid: false,
      error: 'Template file must have a .docx extension',
    }
  }

  return { valid: true }
}
