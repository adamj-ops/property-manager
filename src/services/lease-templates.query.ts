/**
 * Lease Templates React Query Hooks
 * EPM-83: Lease Template Import & Management
 */

import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import {
  getTemplates,
  getTemplate,
  getTemplatesByType,
  getDefaultTemplate,
  getTemplateDownloadUrl,
  getVariableSchema,
  createTemplateUpload,
  confirmTemplateUpload,
  updateTemplate,
  setDefaultTemplate,
  archiveTemplate,
  duplicateTemplate,
  deleteTemplate,
  previewTemplate,
  getTemplateForLease,
} from '~/services/lease-templates.api'
import type {
  TemplateFilters,
  CreateTemplate,
  UpdateTemplate,
  DuplicateTemplate,
  PreviewTemplate,
  SetDefaultTemplate,
  ArchiveTemplate,
  ConfirmTemplateUpload,
  LeaseTemplateType,
} from '~/services/lease-templates.schema'

// =============================================================================
// Query Keys
// =============================================================================

export const leaseTemplateKeys = {
  all: ['lease-templates'] as const,
  lists: () => [...leaseTemplateKeys.all, 'list'] as const,
  list: (filters: TemplateFilters) => [...leaseTemplateKeys.lists(), filters] as const,
  details: () => [...leaseTemplateKeys.all, 'detail'] as const,
  detail: (id: string) => [...leaseTemplateKeys.details(), id] as const,
  byType: (type: LeaseTemplateType) => [...leaseTemplateKeys.all, 'type', type] as const,
  default: (type: LeaseTemplateType) => [...leaseTemplateKeys.all, 'default', type] as const,
  variableSchema: () => [...leaseTemplateKeys.all, 'variable-schema'] as const,
  preview: (id: string) => [...leaseTemplateKeys.all, 'preview', id] as const,
}

// =============================================================================
// Query Options
// =============================================================================

/**
 * Query options for fetching templates with filters
 */
export function templatesQueryOptions(filters: TemplateFilters = {}) {
  return queryOptions({
    queryKey: leaseTemplateKeys.list(filters),
    queryFn: () =>
      getTemplates({
        data: {
          ...filters,
          limit: filters.limit ?? 50,
          offset: filters.offset ?? 0,
        },
      }),
  })
}

/**
 * Query options for fetching a single template
 */
export function templateQueryOptions(id: string) {
  return queryOptions({
    queryKey: leaseTemplateKeys.detail(id),
    queryFn: () => getTemplate({ data: { id } }),
    enabled: !!id,
  })
}

/**
 * Query options for fetching templates by type
 */
export function templatesByTypeQueryOptions(type: LeaseTemplateType) {
  return queryOptions({
    queryKey: leaseTemplateKeys.byType(type),
    queryFn: () => getTemplatesByType({ data: { type } }),
  })
}

/**
 * Query options for fetching the default template for a type
 */
export function defaultTemplateQueryOptions(type: LeaseTemplateType) {
  return queryOptions({
    queryKey: leaseTemplateKeys.default(type),
    queryFn: () => getDefaultTemplate({ data: { type } }),
  })
}

/**
 * Query options for fetching the variable schema
 */
export function variableSchemaQueryOptions() {
  return queryOptions({
    queryKey: leaseTemplateKeys.variableSchema(),
    queryFn: () => getVariableSchema(),
    staleTime: Infinity, // Variable schema rarely changes
  })
}

/**
 * Query options for fetching template for lease generation
 */
export function templateForLeaseQueryOptions(type: LeaseTemplateType) {
  return queryOptions({
    queryKey: leaseTemplateKeys.byType(type),
    queryFn: () => getTemplateForLease({ data: { type } }),
  })
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook for creating a new template (with optional file upload)
 */
export function useCreateTemplateUpload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTemplate) => createTemplateUpload({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaseTemplateKeys.lists() })
    },
  })
}

/**
 * Hook for confirming template upload after file is uploaded
 */
export function useConfirmTemplateUpload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ConfirmTemplateUpload) => confirmTemplateUpload({ data }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: leaseTemplateKeys.lists() })
      if (result.template?.id) {
        queryClient.invalidateQueries({
          queryKey: leaseTemplateKeys.detail(result.template.id),
        })
      }
    },
  })
}

/**
 * Hook for updating template metadata
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateTemplate) => updateTemplate({ data }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: leaseTemplateKeys.lists() })
      if (result?.id) {
        queryClient.invalidateQueries({
          queryKey: leaseTemplateKeys.detail(result.id),
        })
      }
    },
  })
}

/**
 * Hook for setting a template as default
 */
export function useSetDefaultTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SetDefaultTemplate) => setDefaultTemplate({ data }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: leaseTemplateKeys.lists() })
      if (result?.type) {
        queryClient.invalidateQueries({
          queryKey: leaseTemplateKeys.default(result.type),
        })
        queryClient.invalidateQueries({
          queryKey: leaseTemplateKeys.byType(result.type),
        })
      }
    },
  })
}

/**
 * Hook for archiving/restoring a template
 */
export function useArchiveTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ArchiveTemplate) => archiveTemplate({ data }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: leaseTemplateKeys.lists() })
      if (result?.id) {
        queryClient.invalidateQueries({
          queryKey: leaseTemplateKeys.detail(result.id),
        })
      }
    },
  })
}

/**
 * Hook for duplicating a template
 */
export function useDuplicateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DuplicateTemplate) => duplicateTemplate({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaseTemplateKeys.lists() })
    },
  })
}

/**
 * Hook for deleting a template (soft delete)
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTemplate({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaseTemplateKeys.lists() })
    },
  })
}

/**
 * Hook for previewing a template
 */
export function usePreviewTemplate() {
  return useMutation({
    mutationFn: (data: PreviewTemplate) => previewTemplate({ data }),
  })
}

/**
 * Hook for getting template download URL
 */
export function useGetTemplateDownloadUrl() {
  return useMutation({
    mutationFn: (id: string) => getTemplateDownloadUrl({ data: { id } }),
  })
}

// =============================================================================
// Combined Upload Hook
// =============================================================================

/**
 * Combined hook for the full template upload flow
 */
export function useTemplateUpload() {
  const createUpload = useCreateTemplateUpload()
  const confirmUpload = useConfirmTemplateUpload()

  const uploadTemplate = async (
    file: File,
    metadata: Omit<CreateTemplate, 'fileName' | 'fileSize' | 'mimeType'>
  ) => {
    // Step 1: Create template record and get upload URL
    const { template, uploadUrl } = await createUpload.mutateAsync({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      ...metadata,
    })

    if (!uploadUrl) {
      throw new Error('No upload URL returned')
    }

    // Step 2: Upload file directly to Supabase Storage
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload template file to storage')
    }

    // Step 3: Confirm upload completion and process the template
    const result = await confirmUpload.mutateAsync({ id: template.id })

    return result
  }

  return {
    uploadTemplate,
    isLoading: createUpload.isPending || confirmUpload.isPending,
    error: createUpload.error || confirmUpload.error,
  }
}

