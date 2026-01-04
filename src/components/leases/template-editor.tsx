/**
 * Template Editor Component
 * EPM-83: Lease Template Import & Management
 */

import { useSuspenseQuery } from '@tanstack/react-query'
import { Suspense, useState } from 'react'
import {
  LuCheck,
  LuFileText,
  LuLoader,
  LuSave,
  LuStar,
  LuVariable,
} from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
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
import { ScrollArea } from '~/components/ui/scroll-area'
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
import { Typography } from '~/components/ui/typography'
import {
  TEMPLATE_TYPE_LABELS,
  type LeaseTemplateType,
} from '~/services/lease-templates.schema'
import {
  templateQueryOptions,
  useUpdateTemplate,
  useSetDefaultTemplate,
} from '~/services/lease-templates.query'

interface TemplateEditorDialogProps {
  templateId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function TemplateEditorDialog({
  templateId,
  open,
  onOpenChange,
  onSuccess,
}: TemplateEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <Suspense fallback={<EditorSkeleton />}>
          <EditorContent
            templateId={templateId}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        </Suspense>
      </DialogContent>
    </Dialog>
  )
}

function EditorSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-48" />
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

interface EditorContentProps {
  templateId: string
  onClose: () => void
  onSuccess?: () => void
}

function EditorContent({ templateId, onClose, onSuccess }: EditorContentProps) {
  const { data: template } = useSuspenseQuery(templateQueryOptions(templateId))
  const updateTemplate = useUpdateTemplate()
  const setDefaultTemplate = useSetDefaultTemplate()

  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description || '')
  const [complianceNotes, setComplianceNotes] = useState(template.compliance_notes || '')
  const [minnesotaCompliant, setMinnesotaCompliant] = useState(template.minnesota_compliant)
  const [isDefault, setIsDefault] = useState(template.is_default)
  const [hasChanges, setHasChanges] = useState(false)

  const handleChange = (setter: (value: string) => void) => (value: string) => {
    setter(value)
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      await updateTemplate.mutateAsync({
        id: templateId,
        name: name !== template.name ? name : undefined,
        description: description !== template.description ? description : undefined,
        complianceNotes: complianceNotes !== template.compliance_notes ? complianceNotes : undefined,
        minnesotaCompliant: minnesotaCompliant !== template.minnesota_compliant ? minnesotaCompliant : undefined,
      })

      // Handle setting as default separately
      if (isDefault && !template.is_default) {
        await setDefaultTemplate.mutateAsync({
          id: templateId,
          type: template.type as LeaseTemplateType,
        })
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to save template:', error)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <LuFileText className="size-5" />
          Edit Template
        </DialogTitle>
        <DialogDescription>
          Update template metadata and settings
        </DialogDescription>
      </DialogHeader>

      <ScrollArea className="max-h-[50vh]">
        <div className="space-y-4 pr-4">
          {/* Template Type (read-only) */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Template Type</span>
              <Badge variant="outline">
                {TEMPLATE_TYPE_LABELS[template.type as LeaseTemplateType]}
              </Badge>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">Version</span>
              <span className="text-sm">v{template.version}</span>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">Template Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => handleChange(setName)(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => handleChange(setDescription)(e.target.value)}
              rows={3}
              placeholder="Brief description of this template..."
            />
          </div>

          <Separator />

          {/* Variables (read-only) */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <LuVariable className="size-4" />
              <Typography.Small className="font-medium">
                Variables ({template.variables?.length || 0})
              </Typography.Small>
            </div>
            <div className="flex flex-wrap gap-1">
              {template.variables?.slice(0, 15).map((variable: string) => (
                <Badge key={variable} variant="secondary" className="text-xs">
                  {`{{${variable}}}`}
                </Badge>
              ))}
              {template.variables && template.variables.length > 15 && (
                <Badge variant="secondary" className="text-xs">
                  +{template.variables.length - 15} more
                </Badge>
              )}
              {(!template.variables || template.variables.length === 0) && (
                <Typography.Muted className="text-xs">
                  No variables found
                </Typography.Muted>
              )}
            </div>
          </div>

          <Separator />

          {/* Settings */}
          <div className="space-y-4">
            <Typography.Small className="font-medium">Settings</Typography.Small>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="default-toggle" className="text-sm">
                  Default Template
                </Label>
                <p className="text-xs text-muted-foreground">
                  Use this template by default for {TEMPLATE_TYPE_LABELS[template.type as LeaseTemplateType]}
                </p>
              </div>
              <Switch
                id="default-toggle"
                checked={isDefault}
                onCheckedChange={(checked) => {
                  setIsDefault(checked)
                  setHasChanges(true)
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="compliant-toggle" className="text-sm">
                  Minnesota Compliant
                </Label>
                <p className="text-xs text-muted-foreground">
                  Template follows MN statutes 504B
                </p>
              </div>
              <Switch
                id="compliant-toggle"
                checked={minnesotaCompliant}
                onCheckedChange={(checked) => {
                  setMinnesotaCompliant(checked)
                  setHasChanges(true)
                }}
              />
            </div>
          </div>

          {/* Compliance Notes */}
          <div className="space-y-2">
            <Label htmlFor="edit-compliance-notes">Compliance Notes</Label>
            <Textarea
              id="edit-compliance-notes"
              value={complianceNotes}
              onChange={(e) => handleChange(setComplianceNotes)(e.target.value)}
              rows={2}
              placeholder="Any compliance-related notes..."
            />
          </div>
        </div>
      </ScrollArea>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateTemplate.isPending}
        >
          {updateTemplate.isPending ? (
            <>
              <LuLoader className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <LuSave className="mr-2 size-4" />
              Save Changes
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  )
}

