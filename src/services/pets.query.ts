import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

import {
  getPets,
  getPet,
  createPet,
  updatePet,
  approvePet,
  denyPet,
  removePet,
  deletePet,
} from '~/services/pets.api'
import type {
  PetFilters,
  CreatePetInput,
  UpdatePetInput,
  ApprovePetInput,
  DenyPetInput,
  RemovePetInput,
} from '~/services/pets.schema'

// Query keys
export const petKeys = {
  all: ['pets'] as const,
  lists: () => [...petKeys.all, 'list'] as const,
  list: (filters: Partial<PetFilters>) => [...petKeys.lists(), filters] as const,
  details: () => [...petKeys.all, 'detail'] as const,
  detail: (id: string) => [...petKeys.details(), id] as const,
}

// Default filters
const defaultPetFilters: Pick<PetFilters, 'offset' | 'limit'> = { offset: 0, limit: 50 }

// Query options
export const petsQueryOptions = (filters: Partial<PetFilters> = {}) => {
  const mergedFilters = { ...defaultPetFilters, ...filters }
  return queryOptions({
    queryKey: petKeys.list(mergedFilters),
    queryFn: () => getPets({ data: mergedFilters }),
  })
}

export const petQueryOptions = (id: string) =>
  queryOptions({
    queryKey: petKeys.detail(id),
    queryFn: () => getPet({ data: { id } }),
    enabled: !!id,
  })

// Hooks
export const usePetsQuery = (filters: Partial<PetFilters> = {}) => {
  return useSuspenseQuery(petsQueryOptions(filters))
}

export const usePetQuery = (id: string) => {
  return useSuspenseQuery(petQueryOptions(id))
}

// Mutations
export const useCreatePet = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePetInput) => createPet({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: petKeys.all })
      // Also invalidate tenant query if we have the tenant ID
      if (variables.tenantId) {
        queryClient.invalidateQueries({
          queryKey: ['tenants', 'detail', variables.tenantId],
        })
      }
    },
  })
}

export const useUpdatePet = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdatePetInput) => updatePet({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: petKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: petKeys.lists() })
    },
  })
}

export const useApprovePet = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ApprovePetInput) => approvePet({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: petKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: petKeys.lists() })
    },
  })
}

export const useDenyPet = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DenyPetInput) => denyPet({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: petKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: petKeys.lists() })
    },
  })
}

export const useRemovePet = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RemovePetInput) => removePet({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: petKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: petKeys.lists() })
    },
  })
}

export const useDeletePet = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deletePet({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: petKeys.all })
    },
  })
}
