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
  LuSearch,
  LuUpload,
} from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/app/documents')({
  component: DocumentsPage,
})

// Mock data
const folders = [
  { id: '1', name: 'Leases', count: 45 },
  { id: '2', name: 'Inspections', count: 128 },
  { id: '3', name: 'Tenant Documents', count: 89 },
  { id: '4', name: 'Vendor Contracts', count: 12 },
  { id: '5', name: 'Compliance', count: 34 },
  { id: '6', name: 'Financial Reports', count: 24 },
]

const recentDocuments = [
  {
    id: '1',
    name: 'Lease_Unit101_SarahJohnson_2024.pdf',
    type: 'pdf',
    folder: 'Leases',
    property: 'Humboldt Court',
    uploadedBy: 'Adam',
    date: '2024-12-28',
    size: '2.4 MB',
  },
  {
    id: '2',
    name: 'Inspection_Unit305_Q4_2024.pdf',
    type: 'pdf',
    folder: 'Inspections',
    property: 'Humboldt Court',
    uploadedBy: 'Adam',
    date: '2024-12-27',
    size: '5.1 MB',
  },
  {
    id: '3',
    name: 'Pet_Addendum_Unit101_Max.pdf',
    type: 'pdf',
    folder: 'Leases',
    property: 'Humboldt Court',
    uploadedBy: 'Adam',
    date: '2024-12-25',
    size: '156 KB',
  },
  {
    id: '4',
    name: 'Income_Statement_Dec_2024.xlsx',
    type: 'spreadsheet',
    folder: 'Financial Reports',
    property: 'All Properties',
    uploadedBy: 'Adam',
    date: '2024-12-24',
    size: '89 KB',
  },
  {
    id: '5',
    name: 'Water_Damage_Unit204_Photo.jpg',
    type: 'image',
    folder: 'Inspections',
    property: 'Humboldt Court',
    uploadedBy: 'Emily Rodriguez',
    date: '2024-12-30',
    size: '3.2 MB',
  },
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
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <LuFileText className='size-5 text-red-500' />
      case 'spreadsheet':
        return <LuFileSpreadsheet className='size-5 text-green-500' />
      case 'image':
        return <LuFileImage className='size-5 text-blue-500' />
      default:
        return <LuFile className='size-5 text-muted-foreground' />
    }
  }

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Typography.H2>Documents</Typography.H2>
          <Typography.Muted>Manage files and document templates</Typography.Muted>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <LuFilePlus className='mr-2 size-4' />
            New from Template
          </Button>
          <Button>
            <LuUpload className='mr-2 size-4' />
            Upload
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className='flex items-center gap-4'>
        <div className='relative flex-1'>
          <LuSearch className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input placeholder='Search documents by name, tenant, or property...' className='pl-10' />
        </div>
        <Button variant='outline'>
          <LuFilter className='mr-2 size-4' />
          Filters
        </Button>
      </div>

      <div className='grid gap-6 lg:grid-cols-4'>
        {/* Folders Sidebar */}
        <div className='space-y-6'>
          {/* Folders */}
          <Card>
            <CardHeader>
              <CardTitle>Folders</CardTitle>
            </CardHeader>
            <CardContent className='space-y-1'>
              {folders.map(folder => (
                <Button key={folder.id} variant='ghost' className='w-full justify-between'>
                  <span className='flex items-center gap-2'>
                    <LuFolder className='size-4' />
                    {folder.name}
                  </span>
                  <Badge variant='secondary'>{folder.count}</Badge>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Quick Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>Generate new documents</CardDescription>
            </CardHeader>
            <CardContent className='space-y-1'>
              {templates.map((template, i) => (
                <Button key={i} variant='ghost' className='w-full justify-start text-left' size='sm'>
                  <LuFileText className='mr-2 size-4' />
                  <span className='truncate'>{template.name}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        <Card className='lg:col-span-3'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <LuFolderOpen className='size-5' />
                <CardTitle>All Documents</CardTitle>
              </div>
              <div className='flex gap-2'>
                <Button variant='outline' size='sm'>
                  Name
                </Button>
                <Button variant='ghost' size='sm'>
                  Date
                </Button>
                <Button variant='ghost' size='sm'>
                  Size
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Upload Zone */}
            <div className='mb-6 rounded-lg border-2 border-dashed p-8 text-center'>
              <LuUpload className='mx-auto size-8 text-muted-foreground' />
              <p className='mt-2 text-sm font-medium'>Drag and drop files here</p>
              <p className='text-xs text-muted-foreground'>or click to browse</p>
              <Button variant='outline' size='sm' className='mt-4'>
                Select Files
              </Button>
            </div>

            {/* Documents List */}
            <div className='space-y-2'>
              {recentDocuments.map(doc => (
                <div
                  key={doc.id}
                  className='flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50'
                >
                  <div className='flex items-center gap-4'>
                    {getFileIcon(doc.type)}
                    <div>
                      <p className='font-medium'>{doc.name}</p>
                      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                        <span>{doc.folder}</span>
                        <span>•</span>
                        <span>{doc.property}</span>
                        <span>•</span>
                        <span>{doc.uploadedBy}</span>
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-4'>
                    <div className='text-right text-sm'>
                      <p className='text-muted-foreground'>{new Date(doc.date).toLocaleDateString()}</p>
                      <p className='text-xs text-muted-foreground'>{doc.size}</p>
                    </div>
                    <Button variant='ghost' size='icon'>
                      <LuDownload className='size-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Total Files</p>
              <p className='text-2xl font-bold'>332</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Storage Used</p>
              <p className='text-2xl font-bold'>2.4 GB</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Storage Limit</p>
              <p className='text-2xl font-bold'>10 GB</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Available</p>
              <p className='text-2xl font-bold text-green-600'>7.6 GB</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
