/**
 * Template Duplicate Component
 * EPM-83: Lease Template Import & Management
 */

import { useSuspenseQuery } from '@tanstack/react-query'
import { Suspense, useState } from 'react'
import { LuCopy, LuLoader, LuFileText } from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Skeleton } from '~/components/ui/skeleton'
import { Textarea } from '~/components/ui/textarea'
import {
  TEMPLATE_TYPE_LABELS,
  type LeaseTemplateType,
} from '~/services/lease-templates.schema'
import {
  templateQueryOptions,
  useDuplicateTemplate,
} from '~/services/lease-templates.query'

interface TemplateDuplicateDialogProps {
  templateId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function TemplateDuplicateDialog({
  templateId,
  open,
  onOpenChange,
  onSuccess,
}: TemplateDuplicateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <Suspense fallback={<DuplicateSkeleton />}>
          <DuplicateContent
            templateId={templateId}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        </Suspense>
      </DialogContent>
    </Dialog>
  )
}

function DuplicateSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-48" />
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

interface DuplicateContentProps {
  templateId: string
  onClose: () => void
  onSuccess?: () => void
}

function DuplicateContent({
  templateId,
  onClose,
  onSuccess,
}: DuplicateContentProps) {
  const { data: template } = useSuspenseQuery(templateQueryOptions(templateId))
  const duplicateTemplate = useDuplicateTemplate()

  const [name, setName] = useState(`${template.name} (Copy)`)
  const [createNewVersion, setCreateNewVersion] = useState(false)
  const [changeNotes, setChangeNotes] = useState('')

  const handleDuplicate = async () => {
    try {
      await duplicateTemplate.mutateAsync({
        sourceId: templateId,
        name: createNewVersion ? template.name : name,
        createNewVersion,
        changeNotes: changeNotes || undefined,
      })

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to duplicate template:', error)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <LuCopy className="size-5" />
          Duplicate Template
        </DialogTitle>
        <DialogDescription>
          Create a copy or new version of this template
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Source Template Info */}
        <div className="rounded-lg border bg-muted/50 p-3">
          <div className="flex items-center gap-3">
            <LuFileText className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">{template.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {TEMPLATE_TYPE_LABELS[template.type as LeaseTemplateType]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  v{template.version}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Version Option */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="create-version"
            checked={createNewVersion}
            onCheckedChange={(checked) => setCreateNewVersion(checked === true)}
          />
          <div className="space-y-1">
            <Label
              htmlFor="create-version"
              className="text-sm font-medium cursor-pointer"
            >
              Create as new version
            </Label>
            <p className="text-xs text-muted-foreground">
              {createNewVersion
                ? `Will create ${template.name} v${template.version + 1}`
                : 'Create an independent copy with a new name'}
            </p>
          </div>
        </div>

        {/* New Name (only if not creating version) */}
        {!createNewVersion && (
          <div className="space-y-2">
            <Label htmlFor="duplicate-name">New Template Name</Label>
            <Input
              id="duplicate-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for the copy"
            />
          </div>
        )}

        {/* Change Notes (for versions) */}
        {createNewVersion && (
          <div className="space-y-2">
            <Label htmlFor="change-notes">Change Notes</Label>
            <Textarea
              id="change-notes"
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              rows={2}
              placeholder="What changed in this version?"
            />
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleDuplicate}
          disabled={(!createNewVersion && !name) || duplicateTemplate.isPending}
        >
          {duplicateTemplate.isPending ? (
            <>
              <LuLoader className="mr-2 size-4 animate-spin" />
              Duplicating...
            </>
          ) : (
            <>
              <LuCopy className="mr-2 size-4" />
              {createNewVersion ? 'Create Version' : 'Create Copy'}
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  )
}

