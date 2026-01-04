/**
 * Lease Templates Page
 * EPM-83: Lease Template Import & Management
 */

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LuArchive,
  LuCopy,
  LuDownload,
  LuEye,
  LuFileText,
  LuFilter,
  LuEllipsis,
  LuPencil,
  LuPlus,
  LuSearch,
  LuStar,
  LuTrash2,
} from 'react-icons/lu'

import { TemplateImportDialog } from '~/components/leases/template-import'
import { TemplatePreviewDialog } from '~/components/leases/template-preview'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Typography } from '~/components/ui/typography'
import {
  TEMPLATE_TYPE_LABELS,
  type LeaseTemplateType,
} from '~/services/lease-templates.schema'
import {
  templatesQueryOptions,
  useArchiveTemplate,
  useDeleteTemplate,
  useSetDefaultTemplate,
  useGetTemplateDownloadUrl,
} from '~/services/lease-templates.query'

export const Route = createFileRoute('/app/leases/templates')({
  component: LeaseTemplatesPage,
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(
      templatesQueryOptions({ isArchived: false, limit: 50, offset: 0 })
    )
  },
})

function LeaseTemplatesPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<LeaseTemplateType | 'all'>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null)

  const { data } = useSuspenseQuery(
    templatesQueryOptions({
      search: search || undefined,
      type: typeFilter === 'all' ? undefined : typeFilter,
      isArchived: showArchived,
      limit: 50,
      offset: 0,
    })
  )

  const archiveTemplate = useArchiveTemplate()
  const deleteTemplate = useDeleteTemplate()
  const setDefaultTemplate = useSetDefaultTemplate()
  const getDownloadUrl = useGetTemplateDownloadUrl()

  const handleDownload = async (id: string) => {
    try {
      const result = await getDownloadUrl.mutateAsync(id)
      window.open(result.downloadUrl, '_blank')
    } catch (error) {
      console.error('Failed to download template:', error)
    }
  }

  const handleSetDefault = async (id: string, type: LeaseTemplateType) => {
    try {
      await setDefaultTemplate.mutateAsync({ id, type })
    } catch (error) {
      console.error('Failed to set default template:', error)
    }
  }

  const handleArchive = async (id: string, archive: boolean) => {
    try {
      await archiveTemplate.mutateAsync({ id, archive })
    } catch (error) {
      console.error('Failed to archive template:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id)
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="w-full space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography.H2>Lease Templates</Typography.H2>
          <Typography.Muted>
            Manage lease document templates and addenda
          </Typography.Muted>
        </div>
        <Button onClick={() => setImportDialogOpen(true)}>
          <LuPlus className="mr-2 size-4" />
          Import Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <LuSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as LeaseTemplateType | 'all')}
            >
              <SelectTrigger className="w-[200px]">
                <LuFilter className="mr-2 size-4" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(TEMPLATE_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showArchived ? 'secondary' : 'outline'}
              onClick={() => setShowArchived(!showArchived)}
            >
              <LuArchive className="mr-2 size-4" />
              {showArchived ? 'Showing Archived' : 'Show Archived'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Templates ({data.total})</CardTitle>
          <CardDescription>
            {showArchived
              ? 'Showing archived templates'
              : 'Active templates available for lease generation'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <LuFileText className="size-12 text-muted-foreground/50" />
              <Typography.H4 className="mt-4">No templates found</Typography.H4>
              <Typography.Muted className="mt-2">
                {search || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Import your first lease template to get started'}
              </Typography.Muted>
              {!search && typeFilter === 'all' && (
                <Button
                  className="mt-4"
                  onClick={() => setImportDialogOpen(true)}
                >
                  <LuPlus className="mr-2 size-4" />
                  Import Template
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Variables</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <LuFileText className="size-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{template.name}</div>
                          {template.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {template.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TEMPLATE_TYPE_LABELS[template.type as LeaseTemplateType]}
                      </Badge>
                    </TableCell>
                    <TableCell>v{template.version}</TableCell>
                    <TableCell>
                      {template.variables?.length || 0} variables
                    </TableCell>
                    <TableCell>{formatDate(template.updated_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {template.is_default && (
                          <Badge variant="default" className="gap-1">
                            <LuStar className="size-3" />
                            Default
                          </Badge>
                        )}
                        {template.is_archived && (
                          <Badge variant="secondary">Archived</Badge>
                        )}
                        {template.minnesota_compliant && (
                          <Badge variant="outline" className="text-green-600">
                            MN Compliant
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <LuEllipsis className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setPreviewTemplateId(template.id)}
                          >
                            <LuEye className="mr-2 size-4" />
                            Preview
                          </DropdownMenuItem>
                          {template.template_file_path && (
                            <DropdownMenuItem
                              onClick={() => handleDownload(template.id)}
                            >
                              <LuDownload className="mr-2 size-4" />
                              Download
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <LuPencil className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <LuCopy className="mr-2 size-4" />
                            Duplicate
                          </DropdownMenuItem>
                          {!template.is_default && !template.is_archived && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleSetDefault(
                                  template.id,
                                  template.type as LeaseTemplateType
                                )
                              }
                            >
                              <LuStar className="mr-2 size-4" />
                              Set as Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleArchive(template.id, !template.is_archived)
                            }
                          >
                            <LuArchive className="mr-2 size-4" />
                            {template.is_archived ? 'Restore' : 'Archive'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(template.id)}
                          >
                            <LuTrash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <TemplateImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      {/* Preview Dialog */}
      {previewTemplateId && (
        <TemplatePreviewDialog
          templateId={previewTemplateId}
          open={!!previewTemplateId}
          onOpenChange={(open) => !open && setPreviewTemplateId(null)}
        />
      )}
    </div>
  )
}

