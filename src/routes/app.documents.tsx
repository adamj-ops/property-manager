import { Suspense, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  LuDownload,
  LuFile,
  LuFileImage,
  LuFilePlus,
  LuFileSpreadsheet,
  LuFileText,
  LuFilter,
  LuFolder,
  LuFolderOpen,
  LuLoader2,
  LuSearch,
  LuTrash2,
} from 'react-icons/lu'
import { toast } from 'sonner'

import { DocumentUpload } from '~/components/documents/document-upload'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Skeleton } from '~/components/ui/skeleton'
import { Typography } from '~/components/ui/typography'
import {
  useDocumentsQuery,
  useDocumentCountsQuery,
  useDeleteDocument,
  useGetDocumentDownloadUrl,
} from '~/services/documents.query'
import type { DocumentType, DocumentFilters } from '~/services/documents.schema'

export const Route = createFileRoute('/app/documents')({
  component: DocumentsPage,
})

// Document type to folder mapping
const DOCUMENT_FOLDERS: { type: DocumentType; name: string }[] = [
  { type: 'LEASE', name: 'Leases' },
  { type: 'INSPECTION_REPORT', name: 'Inspections' },
  { type: 'ID_DOCUMENT', name: 'Tenant Documents' },
  { type: 'INVOICE', name: 'Invoices' },
  { type: 'INSURANCE', name: 'Insurance' },
  { type: 'LICENSE', name: 'Licenses' },
]

const templates = [
  { name: 'Standard Lease Agreement', type: 'Lease' },
  { name: 'Pet Addendum', type: 'Addendum' },
  { name: 'Lead Paint Disclosure', type: 'Compliance' },
  { name: 'Move-in Inspection Form', type: 'Inspection' },
  { name: 'Late Rent Notice', type: 'Notice' },
  { name: 'Lease Renewal Letter', type: 'Letter' },
]

function DocumentsPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<DocumentType | undefined>()

  return (
    <div className="w-full max-w-7xl space-y-6 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography.H2>Documents</Typography.H2>
          <Typography.Muted>Manage files and document templates</Typography.Muted>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <LuFilePlus className="mr-2 size-4" />
            New from Template
          </Button>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <LuFolderOpen className="mr-2 size-4" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Documents</DialogTitle>
                <DialogDescription>
                  Upload PDF, images, Word, or Excel files up to 25MB each
                </DialogDescription>
              </DialogHeader>
              <DocumentUpload
                onSuccess={() => {
                  toast.success('Document uploaded successfully')
                }}
                onError={(error) => {
                  toast.error(`Upload failed: ${error.message}`)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <LuSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents by name..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <LuFilter className="mr-2 size-4" />
          Filters
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Folders Sidebar */}
        <div className="space-y-6">
          {/* Folders */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Suspense fallback={<FoldersSkeleton />}>
                <FoldersWithCounts
                  selectedType={selectedType}
                  onSelectType={setSelectedType}
                />
              </Suspense>
            </CardContent>
          </Card>

          {/* Quick Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>Generate new documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {templates.map((template) => (
                <Button
                  key={template.name}
                  variant="ghost"
                  className="w-full justify-start text-left"
                  size="sm"
                >
                  <LuFileText className="mr-2 size-4" />
                  <span className="truncate">{template.name}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LuFolderOpen className="size-5" />
                <CardTitle>
                  {selectedType
                    ? DOCUMENT_FOLDERS.find((f) => f.type === selectedType)?.name || selectedType
                    : 'All Documents'}
                </CardTitle>
              </div>
              {selectedType && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedType(undefined)}>
                  Clear filter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Upload Zone */}
            <DocumentUpload
              className="mb-6"
              defaultType={selectedType || 'OTHER'}
              onSuccess={() => toast.success('Document uploaded successfully')}
              onError={(error) => toast.error(`Upload failed: ${error.message}`)}
            />

            {/* Documents List */}
            <Suspense fallback={<DocumentsListSkeleton />}>
              <DocumentsList
                filters={{
                  type: selectedType,
                  search: searchQuery || undefined,
                }}
              />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Storage Stats */}
      <Suspense fallback={<StorageStatsSkeleton />}>
        <StorageStats />
      </Suspense>
    </div>
  )
}

function FoldersWithCounts({
  selectedType,
  onSelectType,
}: {
  selectedType?: DocumentType
  onSelectType: (type: DocumentType | undefined) => void
}) {
  const { data: counts } = useDocumentCountsQuery()

  return (
    <>
      <Button
        variant={selectedType === undefined ? 'secondary' : 'ghost'}
        className="w-full justify-between"
        onClick={() => onSelectType(undefined)}
      >
        <span className="flex items-center gap-2">
          <LuFolder className="size-4" />
          All Documents
        </span>
        <Badge variant="secondary">
          {Object.values(counts || {}).reduce((a, b) => a + b, 0)}
        </Badge>
      </Button>
      {DOCUMENT_FOLDERS.map((folder) => (
        <Button
          key={folder.type}
          variant={selectedType === folder.type ? 'secondary' : 'ghost'}
          className="w-full justify-between"
          onClick={() => onSelectType(folder.type)}
        >
          <span className="flex items-center gap-2">
            <LuFolder className="size-4" />
            {folder.name}
          </span>
          <Badge variant="secondary">{counts?.[folder.type] || 0}</Badge>
        </Button>
      ))}
    </>
  )
}

function FoldersSkeleton() {
  return (
    <div className="space-y-2">
      {/* biome-ignore lint: skeleton items don't reorder */}
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={`folder-skeleton-${String(i)}`} className="h-10 w-full" />
      ))}
    </div>
  )
}

function DocumentsList({ filters }: { filters: Partial<DocumentFilters> }) {
  const { data } = useDocumentsQuery(filters)
  const deleteDocument = useDeleteDocument()
  const getDownloadUrl = useGetDocumentDownloadUrl()

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleDownload = async (docId: string) => {
    try {
      const { downloadUrl, fileName } = await getDownloadUrl.mutateAsync(docId)
      // Open in new tab or trigger download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {
      toast.error('Failed to download document')
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    try {
      await deleteDocument.mutateAsync(docId)
      toast.success('Document deleted')
    } catch {
      toast.error('Failed to delete document')
    }
  }

  if (data.documents.length === 0) {
    return (
      <div className="py-12 text-center">
        <LuFile className="mx-auto size-12 text-muted-foreground/50" />
        <p className="mt-4 text-sm text-muted-foreground">No documents found</p>
        <p className="text-xs text-muted-foreground">Upload your first document above</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {data.documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
        >
          <div className="flex items-center gap-4">
            {getFileIcon(doc.mime_type)}
            <div>
              <p className="font-medium">{doc.title || doc.file_name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{doc.type}</span>
                <span>•</span>
                <span>{formatFileSize(doc.file_size)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right text-sm">
              <p className="text-muted-foreground">
                {new Date(doc.created_at).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDownload(doc.id)}
              disabled={getDownloadUrl.isPending}
            >
              {getDownloadUrl.isPending ? (
                <LuLoader2 className="size-4 animate-spin" />
              ) : (
                <LuDownload className="size-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(doc.id)}
              disabled={deleteDocument.isPending}
            >
              {deleteDocument.isPending ? (
                <LuLoader2 className="size-4 animate-spin" />
              ) : (
                <LuTrash2 className="size-4 text-destructive" />
              )}
            </Button>
          </div>
        </div>
      ))}
      {data.total > data.documents.length && (
        <p className="pt-4 text-center text-sm text-muted-foreground">
          Showing {data.documents.length} of {data.total} documents
        </p>
      )}
    </div>
  )
}

function DocumentsListSkeleton() {
  return (
    <div className="space-y-2">
      {/* biome-ignore lint: skeleton items don't reorder */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={`doc-skeleton-${String(i)}`} className="h-20 w-full" />
      ))}
    </div>
  )
}

function StorageStats() {
  const { data } = useDocumentsQuery({})
  const totalSize = data.documents.reduce((sum, doc) => sum + doc.file_size, 0)
  const totalFiles = data.total

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  const storageLimit = 10 * 1024 * 1024 * 1024 // 10GB
  const available = storageLimit - totalSize

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Files</p>
            <p className="text-2xl font-bold">{totalFiles}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Storage Used</p>
            <p className="text-2xl font-bold">{formatSize(totalSize)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Storage Limit</p>
            <p className="text-2xl font-bold">{formatSize(storageLimit)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-2xl font-bold text-green-600">{formatSize(available)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StorageStatsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          {/* biome-ignore lint: skeleton items don't reorder */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`stats-skeleton-${String(i)}`}>
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
