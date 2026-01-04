import { useCallback, useState } from 'react'
import {
  LuFile,
  LuFileImage,
  LuFileSpreadsheet,
  LuFileText,
  LuLoader,
  LuUpload,
  LuX,
} from 'react-icons/lu'

import { Button } from '~/components/ui/button'
import { cn } from '~/libs/utils'
import { useDocumentUpload } from '~/services/documents.query'
import type { DocumentType } from '~/services/documents.schema'

interface DocumentUploadProps {
  onSuccess?: (document: unknown) => void
  onError?: (error: Error) => void
  propertyId?: string
  tenantId?: string
  defaultType?: DocumentType
  className?: string
}

interface FilePreview {
  file: File
  preview?: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

function validateFileInput(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `File type "${file.type}" is not allowed`
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
  }
  return null
}

export function DocumentUpload({
  onSuccess,
  onError,
  propertyId,
  tenantId,
  defaultType = 'OTHER',
  className,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<FilePreview[]>([])
  const { uploadDocument, isLoading } = useDocumentUpload()

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') {
      return <LuFileText className="size-5 text-red-500" />
    }
    if (mimeType.startsWith('image/')) {
      return <LuFileImage className="size-5 text-blue-500" />
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <LuFileSpreadsheet className="size-5 text-green-500" />
    }
    return <LuFile className="size-5 text-muted-foreground" />
  }

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const previews: FilePreview[] = fileArray.map((file) => {
      const error = validateFileInput(file)
      return {
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        status: error ? 'error' : 'pending',
        error: error || undefined,
      } as FilePreview
    })
    setFiles((prev) => [...prev, ...previews])
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      const removed = newFiles.splice(index, 1)[0]
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      return newFiles
    })
  }, [])

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
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files)
      }
    },
    [addFiles]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files)
      }
      // Reset input so same file can be selected again
      e.target.value = ''
    },
    [addFiles]
  )

  const uploadFiles = async () => {
    for (let i = 0; i < files.length; i++) {
      const filePreview = files[i]
      if (filePreview.status !== 'pending') continue

      setFiles((prev) => {
        const updated = [...prev]
        updated[i] = { ...updated[i], status: 'uploading' }
        return updated
      })

      try {
        const document = await uploadDocument(filePreview.file, {
          type: defaultType,
          propertyId,
          tenantId,
          tags: [],
        })

        setFiles((prev) => {
          const updated = [...prev]
          updated[i] = { ...updated[i], status: 'success' }
          return updated
        })

        onSuccess?.(document)
      } catch (err) {
        setFiles((prev) => {
          const updated = [...prev]
          updated[i] = {
            ...updated[i],
            status: 'error',
            error: err instanceof Error ? err.message : 'Upload failed',
          }
          return updated
        })

        onError?.(err instanceof Error ? err : new Error('Upload failed'))
      }
    }
  }

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status !== 'success'))
  }

  const pendingCount = files.filter((f) => f.status === 'pending').length
  const successCount = files.filter((f) => f.status === 'success').length

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone - biome-ignore lint: drag-drop zone intentionally uses div for drop target */}
      <div
        role="presentation"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
      >
        <LuUpload className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">Drag and drop files here</p>
        <p className="text-xs text-muted-foreground">
          PDF, images, Word, Excel up to 25MB
        </p>
        <label className="cursor-pointer">
          <input
            type="file"
            multiple
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button variant="outline" size="sm" className="mt-4 pointer-events-none">
            Select Files
          </Button>
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((filePreview, index) => (
            <div
              key={`${filePreview.file.name}-${filePreview.file.size}-${index}`}
              className={cn(
                'flex items-center justify-between rounded-lg border p-3',
                filePreview.status === 'error' && 'border-destructive bg-destructive/5',
                filePreview.status === 'success' && 'border-green-500 bg-green-50 dark:bg-green-950/20'
              )}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {getFileIcon(filePreview.file.type)}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{filePreview.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(filePreview.file.size / 1024).toFixed(1)} KB
                    {filePreview.error && (
                      <span className="ml-2 text-destructive">{filePreview.error}</span>
                    )}
                    {filePreview.status === 'success' && (
                      <span className="ml-2 text-green-600">Uploaded</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {filePreview.status === 'uploading' && (
                  <LuLoader className="size-4 animate-spin text-primary" />
                )}
                {filePreview.status !== 'uploading' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => removeFile(index)}
                  >
                    <LuX className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {pendingCount > 0 && `${pendingCount} file${pendingCount > 1 ? 's' : ''} ready to upload`}
            {successCount > 0 && pendingCount === 0 && `${successCount} file${successCount > 1 ? 's' : ''} uploaded`}
          </div>
          <div className="flex gap-2">
            {successCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearCompleted}>
                Clear Completed
              </Button>
            )}
            {pendingCount > 0 && (
              <Button size="sm" onClick={uploadFiles} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LuLoader className="mr-2 size-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <LuUpload className="mr-2 size-4" />
                    Upload {pendingCount > 1 ? `${pendingCount} Files` : 'File'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
