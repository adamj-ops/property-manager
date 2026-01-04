import { createFileRoute, Link } from '@tanstack/react-router'
import { LuArrowLeft, LuLoaderCircle } from 'react-icons/lu'

import { MoveOutWizard } from '~/components/move-out/move-out-wizard'
import { Button } from '~/components/ui/button'
import { Typography } from '~/components/ui/typography'
import { moveOutStatusQueryOptions } from '~/services/move-out.query'

export const Route = createFileRoute('/app/move-out/$leaseId')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(moveOutStatusQueryOptions(params.leaseId))
  },
  pendingComponent: MoveOutLoading,
  component: MoveOutPage,
})

function MoveOutLoading() {
  return (
    <div className='flex h-96 w-full items-center justify-center'>
      <LuLoaderCircle className='size-8 animate-spin text-muted-foreground' />
    </div>
  )
}

function MoveOutPage() {
  const { leaseId } = Route.useParams()

  return (
    <div className='w-full max-w-5xl space-y-6 py-6'>
      {/* Back Link */}
      <Button variant='ghost' asChild className='-ml-4'>
        <Link to='/app/leases/$leaseId' params={{ leaseId }}>
          <LuArrowLeft className='mr-2 size-4' />
          Back to Lease
        </Link>
      </Button>

      {/* Header */}
      <div>
        <Typography.H2>Move-Out Process</Typography.H2>
        <Typography.Muted>
          Complete the deposit disposition in compliance with Minnesota Statute 504B.178
        </Typography.Muted>
      </div>

      {/* Wizard */}
      <MoveOutWizard leaseId={leaseId} />
    </div>
  )
}
