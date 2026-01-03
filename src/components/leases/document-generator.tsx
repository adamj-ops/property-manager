/**
 * Document Generator Component
 * UI for generating lease documents
 * EPM-43: Lease Document Generation
 */

import { useState } from 'react'
import { LuFileText, LuLoader2, LuDownload } from 'react-icons/lu'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { useGenerateLeasePdf } from '~/services/lease-documents.query'
import { useLeaseQuery } from '~/services/leases.query'
import { useQueryClient } from '@tanstack/react-query'
import { leaseKeys } from '~/services/leases.query'

interface DocumentGeneratorProps {
  leaseId: string
}

export function DocumentGenerator({ leaseId }: DocumentGeneratorProps) {
  const queryClient = useQueryClient()
  const { data: lease } = useLeaseQuery(leaseId)
  const generatePdf = useGenerateLeasePdf()

  const handleGenerate = async () => {
    try {
      const result = await generatePdf.mutateAsync({
        leaseId,
        addendumIds: [], // TODO: Allow user to select addenda
      })

      toast.success('Lease document generated successfully')
      
      // Invalidate lease query to refetch with updated document URL
      queryClient.invalidateQueries({ queryKey: leaseKeys.detail(leaseId) })

      // Optionally open the download URL
      if (result.documentUrl) {
        window.open(result.documentUrl, '_blank')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate lease document')
    }
  }

  const handleDownload = () => {
    if (lease?.leaseDocumentUrl) {
      window.open(lease.leaseDocumentUrl, '_blank')
    }
  }

  const hasDocument = !!lease?.leaseDocumentUrl

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <LuFileText className='size-4' />
          Lease Document
        </CardTitle>
        <CardDescription>Generate and download the lease agreement PDF</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {hasDocument ? (
          <>
            <div className='rounded-lg bg-muted p-4'>
              <p className='text-sm font-medium'>Document is ready</p>
              <p className='text-xs text-muted-foreground mt-1'>
                The lease document has been generated and is available for download.
              </p>
            </div>
            <div className='flex gap-2'>
              <Button onClick={handleDownload} className='flex-1'>
                <LuDownload className='mr-2 size-4' />
                Download PDF
              </Button>
              <Button
                variant='outline'
                onClick={handleGenerate}
                disabled={generatePdf.isPending}
              >
                {generatePdf.isPending ? (
                  <LuLoader2 className='mr-2 size-4 animate-spin' />
                ) : (
                  <LuFileText className='mr-2 size-4' />
                )}
                Regenerate
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className='rounded-lg border border-dashed p-6 text-center'>
              <LuFileText className='mx-auto mb-3 size-8 text-muted-foreground' />
              <p className='text-sm font-medium mb-1'>No document generated</p>
              <p className='text-xs text-muted-foreground'>
                Generate a PDF document from the lease template
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generatePdf.isPending}
              className='w-full'
            >
              {generatePdf.isPending ? (
                <>
                  <LuLoader2 className='mr-2 size-4 animate-spin' />
                  Generating...
                </>
              ) : (
                <>
                  <LuFileText className='mr-2 size-4' />
                  Generate Lease Document
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

