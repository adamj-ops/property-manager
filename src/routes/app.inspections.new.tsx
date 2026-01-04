import { createFileRoute } from '@tanstack/react-router'
import { LuLoaderCircle } from 'react-icons/lu'
import { z } from 'zod'

import { InspectionForm } from '~/components/inspections/inspection-form'
import { Typography } from '~/components/ui/typography'
import { propertiesQueryOptions } from '~/services/properties.query'
import type { InspectionType } from '~/services/inspections.schema'

const searchSchema = z.object({
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  type: z.enum(['MOVE_IN', 'MOVE_OUT', 'ROUTINE', 'MAINTENANCE', 'ANNUAL']).optional(),
})

export const Route = createFileRoute('/app/inspections/new')({
  validateSearch: searchSchema,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(propertiesQueryOptions({}))
  },
  pendingComponent: NewInspectionLoading,
  component: NewInspectionPage,
})

function NewInspectionLoading() {
  return (
    <div className='flex h-96 w-full items-center justify-center'>
      <LuLoaderCircle className='size-8 animate-spin text-muted-foreground' />
    </div>
  )
}

function NewInspectionPage() {
  const { propertyId, unitId, type } = Route.useSearch()

  return (
    <div className='w-full max-w-2xl space-y-6 py-6'>
      <div>
        <Typography.H2>Schedule Inspection</Typography.H2>
        <Typography.Muted>Create a new property inspection</Typography.Muted>
      </div>

      <InspectionForm
        defaultPropertyId={propertyId}
        defaultUnitId={unitId}
        defaultType={type as InspectionType | undefined}
      />
    </div>
  )
}
