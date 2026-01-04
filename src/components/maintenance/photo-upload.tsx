import { useCallback, useState } from 'react'
import { LuImage, LuLoader, LuUpload, LuX, LuCheck } from 'react-icons/lu'

import { Button } from '~/components/ui/button'
import { cn } from '~/libs/utils'
import { useMaintenancePhotoUpload } from '~/services/maintenance.query'

interface PhotoUploadProps {
  requestId: string
  photoType?: 'initial' | 'completion'
  onSuccess?: () => void
  onError?: (error: Error) => void
  className?: string
  existingPhotos?: string[]
  completionPhotos?: string[]
}

interface PhotoPreview {
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function validatePhotoFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `File type "${file.type}" is not allowed. Use JPEG, PNG, GIF, or WebP.`
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
  }
  return null
}

export function MaintenancePhotoUpload({
  requestId,
  photoType = 'initial',
  onSuccess,
  onError,
  className,
  existingPhotos = [],
  completionPhotos = [],
}: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [photos, setPhotos] = useState<PhotoPreview[]>([])
  const { uploadPhoto, isLoading } = useMaintenancePhotoUpload()

  const addPhotos = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const previews: PhotoPreview[] = fileArray.map((file) => {
      const error = validatePhotoFile(file)
      return {
        file,
        preview: URL.createObjectURL(file),
        status: error ? 'error' : 'pending',
        error: error || undefined,
      } as PhotoPreview
    })
    setPhotos((prev) => [...prev, ...previews])
  }, [])

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => {
      const newPhotos = [...prev]
      const removed = newPhotos.splice(index, 1)[0]
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      return newPhotos
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
        addPhotos(e.dataTransfer.files)
      }
    },
    [addPhotos]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addPhotos(e.target.files)
      }
      e.target.value = ''
    },
    [addPhotos]
  )

  const uploadPhotos = async () => {
    for (let i = 0; i < photos.length; i++) {
      const photoPreview = photos[i]
      if (photoPreview.status !== 'pending') continue

      setPhotos((prev) => {
        const updated = [...prev]
        updated[i] = { ...updated[i], status: 'uploading' }
        return updated
      })

      try {
        await uploadPhoto(photoPreview.file, requestId, photoType)

        setPhotos((prev) => {
          const updated = [...prev]
          updated[i] = { ...updated[i], status: 'success' }
          return updated
        })

        onSuccess?.()
      } catch (err) {
        setPhotos((prev) => {
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
    setPhotos((prev) => {
      // Clean up object URLs for removed items
      const toRemove = prev.filter((p) => p.status === 'success')
      toRemove.forEach((p) => URL.revokeObjectURL(p.preview))
      return prev.filter((p) => p.status !== 'success')
    })
  }

  const pendingCount = photos.filter((p) => p.status === 'pending').length
  const successCount = photos.filter((p) => p.status === 'success').length

  const displayedPhotos = photoType === 'completion' ? completionPhotos : existingPhotos

  return (
    <div className={cn('space-y-4', className)}>
      {/* Existing Photos */}
      {displayedPhotos.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {displayedPhotos.map((url, idx) => (
            <div key={idx} className="relative group">
              <img
                src={url}
                alt={`${photoType === 'completion' ? 'Completion' : 'Work order'} photo ${idx + 1}`}
                className="rounded-lg object-cover aspect-square w-full"
              />
            </div>
          ))}
        </div>
      )}

      {/* New Photos Preview */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {photos.map((photo, index) => (
            <div
              key={`${photo.file.name}-${index}`}
              className={cn(
                'relative group rounded-lg overflow-hidden border-2',
                photo.status === 'error' && 'border-destructive',
                photo.status === 'success' && 'border-green-500',
                photo.status === 'pending' && 'border-muted',
                photo.status === 'uploading' && 'border-primary'
              )}
            >
              <img
                src={photo.preview}
                alt={`Preview ${index + 1}`}
                className="object-cover aspect-square w-full"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {photo.status === 'uploading' && (
                  <LuLoader className="size-6 text-white animate-spin" />
                )}
                {photo.status === 'success' && (
                  <LuCheck className="size-6 text-green-400" />
                )}
                {(photo.status === 'pending' || photo.status === 'error') && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-white hover:text-white hover:bg-white/20"
                    onClick={() => removePhoto(index)}
                  >
                    <LuX className="size-5" />
                  </Button>
                )}
              </div>
              {photo.error && (
                <div className="absolute bottom-0 left-0 right-0 bg-destructive/90 text-destructive-foreground text-xs p-1 truncate">
                  {photo.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop Zone - biome-ignore lint: intentional div for drag-drop target */}
      <div
        role="presentation"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
      >
        <label className="cursor-pointer block">
          <input
            type="file"
            multiple
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          <LuImage className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Drag and drop photos or click to select
          </p>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, GIF, WebP up to 10MB
          </p>
        </label>
      </div>

      {/* Actions */}
      {photos.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {pendingCount > 0 && `${pendingCount} photo${pendingCount > 1 ? 's' : ''} ready`}
            {successCount > 0 && pendingCount === 0 && `${successCount} uploaded`}
          </div>
          <div className="flex gap-2">
            {successCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearCompleted}>
                Clear
              </Button>
            )}
            {pendingCount > 0 && (
              <Button size="sm" onClick={uploadPhotos} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LuLoader className="mr-2 size-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <LuUpload className="mr-2 size-4" />
                    Upload {pendingCount > 1 ? `${pendingCount} Photos` : 'Photo'}
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
