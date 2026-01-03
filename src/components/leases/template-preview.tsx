/**
 * Template Preview Component
 * EPM-83: Lease Template Import & Management
 */

import { useSuspenseQuery } from '@tanstack/react-query'
import { Suspense, useState } from 'react'
import { LuFileText, LuLoader, LuVariable } from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton'
import { Typography } from '~/components/ui/typography'
import {
  templateQueryOptions,
  usePreviewTemplate,
} from '~/services/lease-templates.query'
import { getSampleData } from '~/server/template-variables'

interface TemplatePreviewDialogProps {
  templateId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TemplatePreviewDialog({
  templateId,
  open,
  onOpenChange,
}: TemplatePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <Suspense fallback={<PreviewSkeleton />}>
          <PreviewContent templateId={templateId} />
        </Suspense>
      </DialogContent>
    </Dialog>
  )
}

function PreviewSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

function PreviewContent({ templateId }: { templateId: string }) {
  const { data: template } = useSuspenseQuery(templateQueryOptions(templateId))
  const previewMutation = usePreviewTemplate()
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [usedVariables, setUsedVariables] = useState<string[]>([])
  const [missingVariables, setMissingVariables] = useState<string[]>([])

  const handleGeneratePreview = async () => {
    try {
      const result = await previewMutation.mutateAsync({
        id: templateId,
        sampleData: getSampleData(),
      })
      setPreviewContent(result.content)
      setUsedVariables(result.usedVariables)
      setMissingVariables(result.missingVariables)
    } catch (error) {
      console.error('Failed to generate preview:', error)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <LuFileText className="size-5" />
          {template.name}
        </DialogTitle>
        <DialogDescription>
          Version {template.version} • {template.variables?.length || 0} variables
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Template Info */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Type</span>
              <Badge variant="outline">{template.type}</Badge>
            </div>
            {template.description && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">Description</span>
                <span className="text-right">{template.description}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Default</span>
              <span>{template.is_default ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">MN Compliant</span>
              <span>{template.minnesota_compliant ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* Variables */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <LuVariable className="size-4" />
            <Typography.Small className="font-medium">
              Template Variables ({template.variables?.length || 0})
            </Typography.Small>
          </div>
          <div className="flex flex-wrap gap-1">
            {template.variables?.map((variable: string) => (
              <Badge key={variable} variant="secondary" className="text-xs">
                {`{{${variable}}}`}
              </Badge>
            ))}
            {(!template.variables || template.variables.length === 0) && (
              <Typography.Muted className="text-xs">
                No variables found in this template
              </Typography.Muted>
            )}
          </div>
        </div>

        <Separator />

        {/* Preview Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Typography.Small className="font-medium">
              Content Preview
            </Typography.Small>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGeneratePreview}
              disabled={previewMutation.isPending}
            >
              {previewMutation.isPending ? (
                <>
                  <LuLoader className="mr-2 size-3 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate with Sample Data'
              )}
            </Button>
          </div>

          <ScrollArea className="h-[300px] rounded-lg border bg-card p-4">
            {previewContent ? (
              <div className="space-y-4">
                {/* Variable usage summary */}
                {(usedVariables.length > 0 || missingVariables.length > 0) && (
                  <div className="rounded-lg bg-muted/50 p-3 text-xs">
                    {usedVariables.length > 0 && (
                      <p className="text-green-600">
                        {usedVariables.length} variables populated
                      </p>
                    )}
                    {missingVariables.length > 0 && (
                      <p className="text-yellow-600">
                        {missingVariables.length} variables missing sample data
                      </p>
                    )}
                  </div>
                )}
                {/* Preview content */}
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {previewContent}
                </pre>
              </div>
            ) : template.template_content ? (
              <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">
                {template.template_content}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <LuFileText className="size-8 text-muted-foreground/50" />
                <Typography.Muted className="mt-2">
                  No preview available
                </Typography.Muted>
                <Typography.Muted className="text-xs">
                  This template may be a DOCX file without extracted content
                </Typography.Muted>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Compliance Notes */}
        {template.compliance_notes && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:bg-yellow-950/20">
            <Typography.Small className="font-medium text-yellow-800 dark:text-yellow-400">
              Compliance Notes
            </Typography.Small>
            <Typography.Muted className="text-xs mt-1">
              {template.compliance_notes}
            </Typography.Muted>
          </div>
        )}
      </div>
    </>
  )
}

export { TemplatePreviewDialog }

