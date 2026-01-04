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
} from '~/services/maintenance.api'
import type {
  CreateMaintenanceInput,
  UpdateMaintenanceInput,
  MaintenanceFilters,
  PhotoUploadRequest,
} from '~/services/maintenance.schema'

// Query keys
export const maintenanceKeys = {
  all: ['maintenance'] as const,
  lists: () => [...maintenanceKeys.all, 'list'] as const,
  list: (filters: MaintenanceFilters) => [...maintenanceKeys.lists(), filters] as const,
  details: () => [...maintenanceKeys.all, 'detail'] as const,
  detail: (id: string) => [...maintenanceKeys.details(), id] as const,
  stats: () => [...maintenanceKeys.all, 'stats'] as const,
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
