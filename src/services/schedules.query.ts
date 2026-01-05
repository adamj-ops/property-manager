import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

import {
  getSchedules,
  getSchedule,
  getScheduleStats,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  executeSchedule,
} from '~/services/schedules.api'
import type {
  CreateScheduleInput,
  UpdateScheduleInput,
  ScheduleFilters,
} from '~/services/schedules.schema'

// Query keys
export const scheduleKeys = {
  all: ['schedules'] as const,
  lists: () => [...scheduleKeys.all, 'list'] as const,
  list: (filters: ScheduleFilters) => [...scheduleKeys.lists(), filters] as const,
  details: () => [...scheduleKeys.all, 'detail'] as const,
  detail: (id: string) => [...scheduleKeys.details(), id] as const,
  stats: () => [...scheduleKeys.all, 'stats'] as const,
}

// Default filter values
const defaultFilters: Pick<ScheduleFilters, 'offset' | 'limit'> = { offset: 0, limit: 50 }

// Query options
export const schedulesQueryOptions = (filters: Partial<ScheduleFilters> = {}) => {
  const mergedFilters: ScheduleFilters = { ...defaultFilters, ...filters }
  return queryOptions({
    queryKey: scheduleKeys.list(mergedFilters),
    queryFn: () => getSchedules({ data: mergedFilters }),
  })
}

export const scheduleQueryOptions = (id: string) =>
  queryOptions({
    queryKey: scheduleKeys.detail(id),
    queryFn: () => getSchedule({ data: { id } }),
  })

export const scheduleStatsQueryOptions = () =>
  queryOptions({
    queryKey: scheduleKeys.stats(),
    queryFn: () => getScheduleStats(),
  })

// Suspense hooks
export const useSchedulesQuery = (filters: Partial<ScheduleFilters> = {}) =>
  useSuspenseQuery(schedulesQueryOptions(filters))

export const useScheduleQuery = (id: string) =>
  useSuspenseQuery(scheduleQueryOptions(id))

export const useScheduleStatsQuery = () =>
  useSuspenseQuery(scheduleStatsQueryOptions())

// Mutations
export const useCreateSchedule = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateScheduleInput) => createSchedule({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: scheduleKeys.stats() })
    },
  })
}

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateScheduleInput & { id: string }) => updateSchedule({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: scheduleKeys.stats() })
    },
  })
}

export const useDeleteSchedule = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteSchedule({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: scheduleKeys.stats() })
    },
  })
}

export const useExecuteSchedule = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => executeSchedule({ data: { id } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(variables) })
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() })
      // Also invalidate maintenance requests since a new one was created
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
  })
}
