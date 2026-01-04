/**
 * Template Import Component
 * EPM-83: Lease Template Import & Management
 */

import { useCallback, useState } from 'react'
import {
  LuFile,
  LuFileText,
  LuLoader,
  LuUpload,
  LuX,
  LuCheck,
  LuTriangleAlert,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/libs/utils'
import {
  TEMPLATE_TYPE_LABELS,
  type LeaseTemplateType,
} from '~/services/lease-templates.schema'
import { useTemplateUpload } from '~/services/lease-templates.query'

interface TemplateImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function TemplateImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: TemplateImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<LeaseTemplateType>('MAIN_LEASE')
  const [description, setDescription] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    success: boolean
    variables?: string[]
    warnings?: string[]
    error?: string
  } | null>(null)

  const { uploadTemplate, isLoading, error } = useTemplateUpload()

  const resetForm = () => {
    setFile(null)
    setName('')
    setType('MAIN_LEASE')
    setDescription('')
    setUploadResult(null)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleFileSelect = useCallback((selectedFile: File) => {
    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.docx')) {
      setUploadResult({
        success: false,
        error: 'Only DOCX files are supported',
      })
      return
    }

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setUploadResult({
        success: false,
        error: 'File size must be less than 10MB',
      })
      return
    }

    setFile(selectedFile)
    setUploadResult(null)

    // Auto-set name from filename if empty
    if (!name) {
      const fileName = selectedFile.name.replace(/\.docx$/i, '')
      setName(fileName.replace(/[_-]/g, ' '))
    }
  }, [name])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        handleFileSelect(droppedFile)
      }
    },
    [handleFileSelect]
  )

  const handleUpload = async () => {
    if (!file || !name || !type) return

    try {
      const result = await uploadTemplate(file, {
        name,
        type,
        description: description || undefined,
        minnesotaCompliant: true,
      })

      setUploadResult({
        success: true,
        variables: result.template?.variables || [],
        warnings: result.warnings,
      })

      // Wait a moment to show success, then close
      setTimeout(() => {
        onSuccess?.()
        handleClose()
      }, 1500)
    } catch (err) {
      setUploadResult({
        success: false,
        error: err instanceof Error ? err.message : 'Upload failed',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Lease Template</DialogTitle>
          <DialogDescription>
            Upload a DOCX template file with variable placeholders like{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              {'{{tenant_name}}'}
            </code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Zone */}
          {!file ? (
            <div
              role="presentation"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              )}
              onClick={() => document.getElementById('template-file')?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  document.getElementById('template-file')?.click()
                }
              }}
            >
              <input
                id="template-file"
                type="file"
                accept=".docx"
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0]
                  if (selectedFile) {
                    handleFileSelect(selectedFile)
                  }
                }}
              />
              <LuUpload className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">
                Drag and drop your DOCX file here
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse (max 10MB)
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <LuFileText className="size-8 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setFile(null)
                  setUploadResult(null)
                }}
              >
                <LuX className="size-4" />
              </Button>
            </div>
          )}

          {/* Template Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Humboldt Court Lease Agreement"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-type">Template Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as LeaseTemplateType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEMPLATE_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description (optional)</Label>
              <Textarea
                id="template-description"
                placeholder="Brief description of this template..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div
              className={cn(
                'rounded-lg border p-4',
                uploadResult.success
                  ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
                  : 'border-red-200 bg-red-50 dark:bg-red-950/20'
              )}
            >
              {uploadResult.success ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <LuCheck className="size-4" />
                    <span className="font-medium">Template imported successfully!</span>
                  </div>
                  {uploadResult.variables && uploadResult.variables.length > 0 && (
                    <div>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        Extracted {uploadResult.variables.length} variables:
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {uploadResult.variables.slice(0, 10).map((v) => (
                          <Badge key={v} variant="outline" className="text-xs">
                            {v}
                          </Badge>
                        ))}
                        {uploadResult.variables.length > 10 && (
                          <Badge variant="outline" className="text-xs">
                            +{uploadResult.variables.length - 10} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {uploadResult.warnings && uploadResult.warnings.length > 0 && (
                    <div className="flex items-start gap-2 text-yellow-700 dark:text-yellow-400">
                      <LuTriangleAlert className="size-4 mt-0.5" />
                      <div className="text-sm">
                        {uploadResult.warnings.map((w, i) => (
                          <p key={i}>{w}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <LuX className="size-4" />
                  <span>{uploadResult.error}</span>
                </div>
              )}
            </div>
          )}

          {/* Error from hook */}
          {error && !uploadResult && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:bg-red-950/20">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <LuX className="size-4" />
                <span>{error.message}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || !name || !type || isLoading || uploadResult?.success}
          >
            {isLoading ? (
              <>
                <LuLoader className="mr-2 size-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <LuUpload className="mr-2 size-4" />
                Import Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

