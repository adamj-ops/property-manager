import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

import {
  getMaintenanceRequests,
  getMaintenanceRequest,
  getMaintenanceStats,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  addMaintenanceComment,
  createMaintenancePhotoUploadUrl,
  confirmMaintenancePhotoUpload,
  getMaintenancePhotoUrls,
  acknowledgeEmergencyEscalation,
  getUnacknowledgedEmergencies,
  getEmergencyDashboardStats,
  // Bulk actions
  bulkUpdateStatus,
  bulkAssignVendor,
  bulkDeleteWorkOrders,
  // Templates
  getMaintenanceTemplates,
  getMaintenanceTemplate,
  createMaintenanceTemplate,
  updateMaintenanceTemplate,
  deleteMaintenanceTemplate,
  incrementTemplateUsage,
  // Team/Staff
  getTeamMembers,
  // Export
  exportWorkOrders,
  // Comment attachments
  createCommentAttachmentUploadUrl,
  addMaintenanceCommentWithAttachments,
  getCommentAttachmentUrls,
} from '~/services/maintenance.api'
import type {
  CreateMaintenanceInput,
  UpdateMaintenanceInput,
  MaintenanceFilters,
  PhotoUploadRequest,
  BulkUpdateStatusInput,
  BulkAssignVendorInput,
  BulkDeleteInput,
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateFilters,
  ExportFilters,
  CommentAttachmentUpload,
} from '~/services/maintenance.schema'

// Query keys
export const maintenanceKeys = {
  all: ['maintenance'] as const,
  lists: () => [...maintenanceKeys.all, 'list'] as const,
  list: (filters: MaintenanceFilters) => [...maintenanceKeys.lists(), filters] as const,
  details: () => [...maintenanceKeys.all, 'detail'] as const,
  detail: (id: string) => [...maintenanceKeys.details(), id] as const,
  stats: () => [...maintenanceKeys.all, 'stats'] as const,
  emergencies: () => [...maintenanceKeys.all, 'emergencies'] as const,
  emergencyStats: () => [...maintenanceKeys.all, 'emergency-stats'] as const,
  // Templates
  templates: () => [...maintenanceKeys.all, 'templates'] as const,
  templateList: (filters: TemplateFilters) => [...maintenanceKeys.templates(), 'list', filters] as const,
  templateDetail: (id: string) => [...maintenanceKeys.templates(), 'detail', id] as const,
}

// Default filters
const defaultMaintenanceFilters: Pick<MaintenanceFilters, 'offset' | 'limit'> = { offset: 0, limit: 50 }

// Query options
export const maintenanceRequestsQueryOptions = (filters: Partial<MaintenanceFilters> = {}) => {
  const mergedFilters: MaintenanceFilters = { ...defaultMaintenanceFilters, ...filters }
  return queryOptions({
    queryKey: maintenanceKeys.list(mergedFilters),
    queryFn: () => getMaintenanceRequests({ data: mergedFilters }),
  })
}

export const maintenanceRequestQueryOptions = (id: string) =>
  queryOptions({
    queryKey: maintenanceKeys.detail(id),
    queryFn: () => getMaintenanceRequest({ data: { id } }),
  })

export const maintenanceStatsQueryOptions = () =>
  queryOptions({
    queryKey: maintenanceKeys.stats(),
    queryFn: () => getMaintenanceStats(),
  })

// Hooks
export const useMaintenanceRequestsQuery = (filters: Partial<MaintenanceFilters> = {}) => {
  return useSuspenseQuery(maintenanceRequestsQueryOptions(filters))
}

export const useMaintenanceRequestQuery = (id: string) => {
  return useSuspenseQuery(maintenanceRequestQueryOptions(id))
}

export const useMaintenanceStatsQuery = () => {
  return useSuspenseQuery(maintenanceStatsQueryOptions())
}

// Mutations
export const useCreateMaintenanceRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateMaintenanceInput) => createMaintenanceRequest({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
    },
  })
}

export const useUpdateMaintenanceRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateMaintenanceInput & { id: string }) =>
      updateMaintenanceRequest({ data: { id, ...data } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.stats() })
    },
  })
}

export const useAddMaintenanceComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { requestId: string; content: string; isInternal?: boolean }) =>
      addMaintenanceComment({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(variables.requestId) })
    },
  })
}

// Photo upload hooks
export const useCreateMaintenancePhotoUploadUrl = () => {
  return useMutation({
    mutationFn: (data: PhotoUploadRequest) => createMaintenancePhotoUploadUrl({ data }),
  })
}

export const useConfirmMaintenancePhotoUpload = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { requestId: string; storagePath: string; photoType?: 'initial' | 'completion' }) =>
      confirmMaintenancePhotoUpload({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(variables.requestId) })
    },
  })
}

export const useGetMaintenancePhotoUrls = () => {
  return useMutation({
    mutationFn: (id: string) => getMaintenancePhotoUrls({ data: { id } }),
  })
}

// Combined photo upload hook that handles the full flow
export const useMaintenancePhotoUpload = () => {
  const createUploadUrl = useCreateMaintenancePhotoUploadUrl()
  const confirmUpload = useConfirmMaintenancePhotoUpload()

  const uploadPhoto = async (
    file: File,
    requestId: string,
    photoType: 'initial' | 'completion' = 'initial'
  ) => {
    // Step 1: Get signed upload URL
    const { signedUrl, path } = await createUploadUrl.mutateAsync({
      requestId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      photoType,
    })

    // Step 2: Upload file directly to Supabase Storage
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload photo to storage')
    }

    // Step 3: Confirm upload and update maintenance request
    const result = await confirmUpload.mutateAsync({
      requestId,
      storagePath: path,
      photoType,
    })

    return result
  }

  return {
    uploadPhoto,
    isLoading: createUploadUrl.isPending || confirmUpload.isPending,
    error: createUploadUrl.error || confirmUpload.error,
  }
}

// =============================================================================
// EMERGENCY ESCALATION
// =============================================================================

// Query options for unacknowledged emergencies
export const unacknowledgedEmergenciesQueryOptions = () =>
  queryOptions({
    queryKey: maintenanceKeys.emergencies(),
    queryFn: () => getUnacknowledgedEmergencies(),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

// Query options for emergency stats
export const emergencyStatsQueryOptions = () =>
  queryOptions({
    queryKey: maintenanceKeys.emergencyStats(),
    queryFn: () => getEmergencyDashboardStats(),
  })

// Hook to get unacknowledged emergencies
export const useUnacknowledgedEmergenciesQuery = () =>
  useSuspenseQuery(unacknowledgedEmergenciesQueryOptions())

// Hook to get emergency stats
export const useEmergencyStatsQuery = () =>
  useSuspenseQuery(emergencyStatsQueryOptions())

// Hook to acknowledge an escalation
export const useAcknowledgeEscalation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => acknowledgeEmergencyEscalation({ data: { id } }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.emergencies() })
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.emergencyStats() })
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() })
    },
  })
}

// =============================================================================
// BULK ACTIONS
// =============================================================================

export const useBulkUpdateStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BulkUpdateStatusInput) => bulkUpdateStatus({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
    },
  })
}

export const useBulkAssignVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BulkAssignVendorInput) => bulkAssignVendor({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
    },
  })
}

export const useBulkDeleteWorkOrders = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BulkDeleteInput) => bulkDeleteWorkOrders({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
    },
  })
}

// =============================================================================
// WORK ORDER TEMPLATES
// =============================================================================

const defaultTemplateFilters: Pick<TemplateFilters, 'offset' | 'limit'> = { offset: 0, limit: 50 }

export const maintenanceTemplatesQueryOptions = (filters: Partial<TemplateFilters> = {}) => {
  const mergedFilters: TemplateFilters = { ...defaultTemplateFilters, ...filters }
  return queryOptions({
    queryKey: maintenanceKeys.templateList(mergedFilters),
    queryFn: () => getMaintenanceTemplates({ data: mergedFilters }),
  })
}

export const maintenanceTemplateQueryOptions = (id: string) =>
  queryOptions({
    queryKey: maintenanceKeys.templateDetail(id),
    queryFn: () => getMaintenanceTemplate({ data: { id } }),
  })

export const useMaintenanceTemplatesQuery = (filters: Partial<TemplateFilters> = {}) => {
  return useSuspenseQuery(maintenanceTemplatesQueryOptions(filters))
}

export const useMaintenanceTemplateQuery = (id: string) => {
  return useSuspenseQuery(maintenanceTemplateQueryOptions(id))
}

export const useCreateMaintenanceTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTemplateInput) => createMaintenanceTemplate({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.templates() })
    },
  })
}

export const useUpdateMaintenanceTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTemplateInput & { id: string }) =>
      updateMaintenanceTemplate({ data: { id, ...data } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.templateDetail(variables.id) })
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.templates() })
    },
  })
}

export const useDeleteMaintenanceTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteMaintenanceTemplate({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.templates() })
    },
  })
}

export const useIncrementTemplateUsage = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => incrementTemplateUsage({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.templates() })
    },
  })
}

// =============================================================================
// TEAM/STAFF MEMBERS
// =============================================================================

export const teamMembersKeys = {
  all: ['team-members'] as const,
  list: () => [...teamMembersKeys.all, 'list'] as const,
}

export const teamMembersQueryOptions = () =>
  queryOptions({
    queryKey: teamMembersKeys.list(),
    queryFn: () => getTeamMembers(),
  })

export const useTeamMembersQuery = () => {
  return useSuspenseQuery(teamMembersQueryOptions())
}

// =============================================================================
// EXPORT
// =============================================================================

export const useExportWorkOrders = () => {
  return useMutation({
    mutationFn: (filters: ExportFilters) => exportWorkOrders({ data: filters }),
  })
}

// =============================================================================
// COMMENT ATTACHMENTS
// =============================================================================

export const useCreateCommentAttachmentUploadUrl = () => {
  return useMutation({
    mutationFn: (data: CommentAttachmentUpload) => createCommentAttachmentUploadUrl({ data }),
  })
}

export const useAddMaintenanceCommentWithAttachments = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { requestId: string; content: string; isInternal?: boolean; attachments?: string[] }) =>
      addMaintenanceCommentWithAttachments({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(variables.requestId) })
    },
  })
}

export const useGetCommentAttachmentUrls = () => {
  return useMutation({
    mutationFn: (commentId: string) => getCommentAttachmentUrls({ data: { commentId } }),
  })
}

// Combined hook for uploading comment attachments
export const useCommentAttachmentUpload = () => {
  const createUploadUrl = useCreateCommentAttachmentUploadUrl()

  const uploadAttachment = async (
    file: File,
    requestId: string
  ): Promise<string> => {
    // Step 1: Get signed upload URL
    const { signedUrl, path } = await createUploadUrl.mutateAsync({
      requestId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    })

    // Step 2: Upload file directly to Supabase Storage
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload attachment to storage')
    }

    // Return the storage path
    return path
  }

  return {
    uploadAttachment,
    isLoading: createUploadUrl.isPending,
    error: createUploadUrl.error,
  }
}
