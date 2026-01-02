import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'

import {
  getDocuments,
  getDocument,
  createDocumentUpload,
  confirmDocumentUpload,
  updateDocument,
  deleteDocument,
  getDocumentDownloadUrl,
  getDocumentCounts,
} from '~/services/documents.api'
import type { DocumentFilters, CreateDocumentUpload, UpdateDocument } from '~/services/documents.schema'

// Query options for fetching documents list
export const documentsQueryOptions = (filters?: Partial<DocumentFilters>) =>
  queryOptions({
    queryKey: ['documents', filters],
    queryFn: () => getDocuments({ data: filters as DocumentFilters }),
  })

// Query options for fetching a single document
export const documentQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['document', id],
    queryFn: () => getDocument({ data: { id } }),
    enabled: !!id,
  })

// Query options for document counts
export const documentCountsQueryOptions = () =>
  queryOptions({
    queryKey: ['documentCounts'],
    queryFn: () => getDocumentCounts(),
  })

// Hook for documents list
export const useDocumentsQuery = (filters?: Partial<DocumentFilters>) => {
  return useSuspenseQuery(documentsQueryOptions(filters))
}

// Hook for single document
export const useDocumentQuery = (id: string) => {
  return useSuspenseQuery(documentQueryOptions(id))
}

// Hook for document counts
export const useDocumentCountsQuery = () => {
  return useSuspenseQuery(documentCountsQueryOptions())
}

// Hook for creating document upload
export const useCreateDocumentUpload = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDocumentUpload) => createDocumentUpload({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['documentCounts'] })
    },
  })
}

// Hook for confirming upload
export const useConfirmDocumentUpload = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (documentId: string) => confirmDocumentUpload({ data: { documentId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['documentCounts'] })
    },
  })
}

// Hook for updating document
export const useUpdateDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateDocument) =>
      updateDocument({ data: { id, ...data } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] })
    },
  })
}

// Hook for deleting document
export const useDeleteDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteDocument({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['documentCounts'] })
    },
  })
}

// Hook for getting download URL
export const useGetDocumentDownloadUrl = () => {
  return useMutation({
    mutationFn: (id: string) => getDocumentDownloadUrl({ data: { id } }),
  })
}

// Combined upload hook that handles the full flow
export const useDocumentUpload = () => {
  const createUpload = useCreateDocumentUpload()
  const confirmUpload = useConfirmDocumentUpload()

  const uploadDocument = async (
    file: File,
    metadata: Omit<CreateDocumentUpload, 'fileName' | 'fileSize' | 'mimeType'>
  ) => {
    // Step 1: Create document record and get upload URL
    const { document, uploadUrl } = await createUpload.mutateAsync({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      ...metadata,
    })

    // Step 2: Upload file directly to Supabase Storage
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to storage')
    }

    // Step 3: Confirm upload completion
    const confirmedDocument = await confirmUpload.mutateAsync(document.id)

    return confirmedDocument
  }

  return {
    uploadDocument,
    isLoading: createUpload.isPending || confirmUpload.isPending,
    error: createUpload.error || confirmUpload.error,
  }
}
