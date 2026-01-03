/**
 * Lease Templates API Functions
 * EPM-83: Lease Template Import & Management
 */

import { createServerFn } from '@tanstack/start'
import { zodValidator } from '@tanstack/zod-adapter'

import { createSupabaseAdmin } from '~/libs/supabase'
import { authedMiddleware } from '~/middlewares/auth'
import { parseDocxTemplate, validateTemplateFormat, previewTemplateContent } from '~/server/docx-processor'
import {
  createTemplateUploadUrl,
  createTemplateDownloadUrl,
  downloadTemplateFile,
  deleteTemplateFile,
  validateTemplateFile,
} from '~/server/storage'
import { validateVariables, getSampleData, buildVariableSchema } from '~/server/template-variables'
import { getSupabaseUserId } from '~/server/user-lookup'
import {
  createTemplateSchema,
  updateTemplateSchema,
  duplicateTemplateSchema,
  previewTemplateSchema,
  templateFiltersSchema,
  templateIdSchema,
  setDefaultTemplateSchema,
  confirmTemplateUploadSchema,
  archiveTemplateSchema,
  type LeaseTemplateType,
} from '~/services/lease-templates.schema'

// =============================================================================
// GET Operations
// =============================================================================

/**
 * Get all templates for the authenticated user with optional filters
 */
export const getTemplates = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(templateFiltersSchema))
  .handler(async ({ data }) => {
    const supabase = createSupabaseAdmin()
    const { type, isActive, isArchived, isDefault, search, limit, offset } = data

    let query = supabase
      .from('lease_templates')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type) {
      query = query.eq('type', type)
    }
    if (isActive !== undefined) {
      query = query.eq('is_active', isActive)
    }
    if (isArchived !== undefined) {
      query = query.eq('is_archived', isArchived)
    }
    if (isDefault !== undefined) {
      query = query.eq('is_default', isDefault)
    }
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: templates, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch templates: ${error.message}`)
    }

    return {
      templates: templates || [],
      total: count || 0,
      limit,
      offset,
    }
  })

/**
 * Get a single template by ID
 */
export const getTemplate = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(templateIdSchema))
  .handler(async ({ data }) => {
    const supabase = createSupabaseAdmin()

    const { data: template, error } = await supabase
      .from('lease_templates')
      .select('*')
      .eq('id', data.id)
      .single()

    if (error || !template) {
      throw new Error(`Template not found: ${error?.message || 'Unknown error'}`)
    }

    return template
  })

/**
 * Get templates by type
 */
export const getTemplatesByType = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(templateFiltersSchema.pick({ type: true })))
  .handler(async ({ data }) => {
    const supabase = createSupabaseAdmin()

    const { data: templates, error } = await supabase
      .from('lease_templates')
      .select('*')
      .eq('type', data.type)
      .eq('is_active', true)
      .eq('is_archived', false)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch templates: ${error.message}`)
    }

    return templates || []
  })

/**
 * Get the default template for a given type
 */
export const getDefaultTemplate = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(templateFiltersSchema.pick({ type: true })))
  .handler(async ({ data }) => {
    const supabase = createSupabaseAdmin()

    const { data: template, error } = await supabase
      .from('lease_templates')
      .select('*')
      .eq('type', data.type)
      .eq('is_default', true)
      .eq('is_active', true)
      .single()

    if (error) {
      // No default template found is not an error
      return null
    }

    return template
  })

/**
 * Get template download URL
 */
export const getTemplateDownloadUrl = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(templateIdSchema))
  .handler(async ({ data }) => {
    const supabase = createSupabaseAdmin()

    const { data: template, error } = await supabase
      .from('lease_templates')
      .select('template_file_path')
      .eq('id', data.id)
      .single()

    if (error || !template?.template_file_path) {
      throw new Error('Template file not found')
    }

    const downloadUrl = await createTemplateDownloadUrl(template.template_file_path)
    return { downloadUrl }
  })

/**
 * Get variable schema for reference
 */
export const getVariableSchema = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .handler(async () => {
    return buildVariableSchema()
  })

// =============================================================================
// CREATE Operations
// =============================================================================

/**
 * Create a new template record and get upload URL for DOCX file
 */
export const createTemplateUpload = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(createTemplateSchema))
  .handler(async ({ context, data }) => {
    const supabase = createSupabaseAdmin()
    const supabaseUserId = await getSupabaseUserId(context.auth.user.email)

    // If uploading a file, validate it
    if (data.fileName && data.fileSize && data.mimeType) {
      const validation = validateTemplateFile({
        size: data.fileSize,
        type: data.mimeType,
        name: data.fileName,
      })

      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Generate signed upload URL
      const uploadResult = await createTemplateUploadUrl(
        supabaseUserId,
        data.fileName,
        data.type
      )

      // Create template record with PENDING status (no file URL yet)
      const { data: template, error } = await supabase
        .from('lease_templates')
        .insert({
          name: data.name,
          type: data.type,
          description: data.description,
          template_file_path: uploadResult.path,
          minnesota_compliant: data.minnesotaCompliant,
          compliance_notes: data.complianceNotes,
          created_by_id: supabaseUserId,
          is_active: false, // Activate after upload confirmation
        })
        .select()
        .single()

      if (error || !template) {
        throw new Error(`Failed to create template record: ${error?.message || 'Unknown error'}`)
      }

      return {
        template,
        uploadUrl: uploadResult.signedUrl,
        uploadToken: uploadResult.token,
      }
    }

    // For text-based templates (no file upload)
    const { data: template, error } = await supabase
      .from('lease_templates')
      .insert({
        name: data.name,
        type: data.type,
        description: data.description,
        template_content: data.templateContent,
        minnesota_compliant: data.minnesotaCompliant,
        compliance_notes: data.complianceNotes,
        created_by_id: supabaseUserId,
        is_active: true,
      })
      .select()
      .single()

    if (error || !template) {
      throw new Error(`Failed to create template: ${error?.message || 'Unknown error'}`)
    }

    return { template }
  })

/**
 * Confirm template upload and process the DOCX file
 */
export const confirmTemplateUpload = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(confirmTemplateUploadSchema))
  .handler(async ({ data }) => {
    const supabase = createSupabaseAdmin()

    // Get the template record
    const { data: template, error: fetchError } = await supabase
      .from('lease_templates')
      .select('*')
      .eq('id', data.id)
      .single()

    if (fetchError || !template) {
      throw new Error(`Template not found: ${fetchError?.message || 'Unknown error'}`)
    }

    if (!template.template_file_path) {
      throw new Error('No template file path found')
    }

    // Download and process the uploaded DOCX file
    const fileBuffer = await downloadTemplateFile(template.template_file_path)

    // Validate the template format
    const validationResult = await validateTemplateFormat(fileBuffer)
    if (!validationResult.valid) {
      // Delete the invalid file
      await deleteTemplateFile(template.template_file_path)
      // Delete the template record
      await supabase.from('lease_templates').delete().eq('id', data.id)
      throw new Error(validationResult.error || 'Invalid template format')
    }

    // Parse the template to extract variables
    const parsed = await parseDocxTemplate(fileBuffer)

    // Validate extracted variables
    const variableValidation = validateVariables(parsed.variables)

    // Generate the file URL
    const fileUrl = await createTemplateDownloadUrl(template.template_file_path)

    // Update the template record
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('lease_templates')
      .update({
        template_file_url: fileUrl,
        template_content: parsed.content,
        variables: parsed.variables,
        variable_schema: {
          extracted: parsed.variables,
          validation: variableValidation,
        },
        is_active: true,
      })
      .eq('id', data.id)
      .select()
      .single()

    if (updateError || !updatedTemplate) {
      throw new Error(`Failed to update template: ${updateError?.message || 'Unknown error'}`)
    }

    return {
      template: updatedTemplate,
      validation: variableValidation,
      warnings: validationResult.warnings,
    }
  })

// =============================================================================
// UPDATE Operations
// =============================================================================

/**
 * Update template metadata
 */
export const updateTemplate = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(updateTemplateSchema))
  .handler(async ({ data }) => {
    const supabase = createSupabaseAdmin()
    const { id, ...updates } = data

    const updateData: Record<string, unknown> = {}

    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive
    if (updates.isArchived !== undefined) updateData.is_archived = updates.isArchived
    if (updates.minnesotaCompliant !== undefined) updateData.minnesota_compliant = updates.minnesotaCompliant
    if (updates.complianceNotes !== undefined) updateData.compliance_notes = updates.complianceNotes
    if (updates.templateContent !== undefined) updateData.template_content = updates.templateContent

    const { data: template, error } = await supabase
      .from('lease_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !template) {
      throw new Error(`Failed to update template: ${error?.message || 'Unknown error'}`)
    }

    return template
  })

/**
 * Set a template as the default for its type
 */
export const setDefaultTemplate = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(setDefaultTemplateSchema))
  .handler(async ({ data }) => {
    const supabase = createSupabaseAdmin()

    // First, unset any existing default for this type
    await supabase
      .from('lease_templates')
      .update({ is_default: false })
      .eq('type', data.type)
      .eq('is_default', true)

    // Set the new default
    const { data: template, error } = await supabase
      .from('lease_templates')
      .update({ is_default: true })
      .eq('id', data.id)
      .select()
      .single()

    if (error || !template) {
      throw new Error(`Failed to set default template: ${error?.message || 'Unknown error'}`)
    }

    return template
  })

/**
 * Archive or restore a template
 */
export const archiveTemplate = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(archiveTemplateSchema))
  .handler(async ({ data }) => {
    const supabase = createSupabaseAdmin()

    const { data: template, error } = await supabase
      .from('lease_templates')
      .update({
        is_archived: data.archive,
        is_default: data.archive ? false : undefined, // Remove default if archiving
      })
      .eq('id', data.id)
      .select()
      .single()

    if (error || !template) {
      throw new Error(`Failed to archive template: ${error?.message || 'Unknown error'}`)
    }

    return template
  })

/**
 * Duplicate a template (create a copy or new version)
 */
export const duplicateTemplate = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(duplicateTemplateSchema))
  .handler(async ({ context, data }) => {
    const supabase = createSupabaseAdmin()
    const supabaseUserId = await getSupabaseUserId(context.auth.user.email)

    // Get the source template
    const { data: sourceTemplate, error: fetchError } = await supabase
      .from('lease_templates')
      .select('*')
      .eq('id', data.sourceId)
      .single()

    if (fetchError || !sourceTemplate) {
      throw new Error(`Source template not found: ${fetchError?.message || 'Unknown error'}`)
    }

    // Determine version number
    let version = 1
    let parentTemplateId: string | null = null

    if (data.createNewVersion) {
      // Get the highest version for this template name
      const { data: versions } = await supabase
        .from('lease_templates')
        .select('version')
        .eq('name', sourceTemplate.name)
        .order('version', { ascending: false })
        .limit(1)

      version = (versions?.[0]?.version || 0) + 1
      parentTemplateId = data.sourceId
    }

    // Create the duplicate
    const { data: newTemplate, error } = await supabase
      .from('lease_templates')
      .insert({
        name: data.name,
        type: sourceTemplate.type,
        version,
        template_file_url: sourceTemplate.template_file_url,
        template_file_path: sourceTemplate.template_file_path,
        template_content: sourceTemplate.template_content,
        variables: sourceTemplate.variables,
        variable_schema: sourceTemplate.variable_schema,
        description: sourceTemplate.description,
        is_default: false,
        is_active: true,
        is_archived: false,
        parent_template_id: parentTemplateId,
        change_notes: data.changeNotes,
        minnesota_compliant: sourceTemplate.minnesota_compliant,
        compliance_notes: sourceTemplate.compliance_notes,
        created_by_id: supabaseUserId,
      })
      .select()
      .single()

    if (error || !newTemplate) {
      throw new Error(`Failed to duplicate template: ${error?.message || 'Unknown error'}`)
    }

    return newTemplate
  })

// =============================================================================
// DELETE Operations
// =============================================================================

/**
 * Delete a template (soft delete by deactivating)
 */
export const deleteTemplate = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(templateIdSchema))
  .handler(async ({ data }) => {
    const supabase = createSupabaseAdmin()

    // Soft delete by setting is_active to false
    const { data: template, error } = await supabase
      .from('lease_templates')
      .update({ is_active: false, is_default: false })
      .eq('id', data.id)
      .select()
      .single()

    if (error || !template) {
      throw new Error(`Failed to delete template: ${error?.message || 'Unknown error'}`)
    }

    return { success: true, template }
  })

// =============================================================================
// PREVIEW Operations
// =============================================================================

/**
 * Preview a template with sample data
 */
export const previewTemplate = createServerFn({ method: 'POST' })
  .middleware([authedMiddleware])
  .validator(zodValidator(previewTemplateSchema))
  .handler(async ({ data }) => {
    const supabase = createSupabaseAdmin()

    // Get the template
    const { data: template, error } = await supabase
      .from('lease_templates')
      .select('*')
      .eq('id', data.id)
      .single()

    if (error || !template) {
      throw new Error(`Template not found: ${error?.message || 'Unknown error'}`)
    }

    // Get sample data (use provided or default)
    const sampleData = data.sampleData || getSampleData()

    // Generate preview
    const content = template.template_content || ''
    const preview = previewTemplateContent(content, sampleData as Record<string, string | number | boolean>)

    // Find which variables were used and which are missing
    const templateVars = template.variables || []
    const usedVariables = templateVars.filter((v: string) => sampleData[v] !== undefined)
    const missingVariables = templateVars.filter((v: string) => sampleData[v] === undefined)

    return {
      content: preview,
      usedVariables,
      missingVariables,
    }
  })

/**
 * Get template for lease generation (used by EPM-43)
 */
export const getTemplateForLease = createServerFn({ method: 'GET' })
  .middleware([authedMiddleware])
  .validator(zodValidator(templateFiltersSchema.pick({ type: true })))
  .handler(async ({ data }) => {
    const supabase = createSupabaseAdmin()

    // Try to get the default template first
    const { data: template, error } = await supabase
      .from('lease_templates')
      .select('*')
      .eq('type', data.type)
      .eq('is_active', true)
      .eq('is_archived', false)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      return null
    }

    return template
  })

