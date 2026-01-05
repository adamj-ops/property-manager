'use client'

import { Suspense, useState } from 'react'
import { LuFileText, LuPlus, LuSearch, LuX } from 'react-icons/lu'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import {
  useMaintenanceTemplatesQuery,
  useIncrementTemplateUsage,
} from '~/services/maintenance.query'
import type { MaintenanceCategory, MaintenancePriority } from '~/services/maintenance.schema'

interface Template {
  id: string
  name: string
  category: MaintenanceCategory
  priority: MaintenancePriority
  title: string
  description: string
  slaResponseHours: number | null
  slaResolutionHours: number | null
  estimatedCost: number | null
  estimatedDuration: number | null
  usageCount: number
}

interface TemplateSelectorProps {
  onSelect: (template: Template) => void
  className?: string
}

const categoryLabels: Record<string, string> = {
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  HVAC: 'HVAC',
  APPLIANCE: 'Appliance',
  STRUCTURAL: 'Structural',
  PEST_CONTROL: 'Pest Control',
  LANDSCAPING: 'Landscaping',
  CLEANING: 'Cleaning',
  PAINTING: 'Painting',
  FLOORING: 'Flooring',
  WINDOWS_DOORS: 'Windows/Doors',
  ROOF: 'Roof',
  SAFETY: 'Safety',
  OTHER: 'Other',
}

const priorityConfig: Record<string, { label: string; variant: 'destructive' | 'secondary' | 'outline' }> = {
  EMERGENCY: { label: 'Emergency', variant: 'destructive' },
  HIGH: { label: 'High', variant: 'destructive' },
  MEDIUM: { label: 'Medium', variant: 'secondary' },
  LOW: { label: 'Low', variant: 'outline' },
}

function TemplatesList({
  search,
  onSelect,
  onClose,
}: {
  search: string
  onSelect: (template: Template) => void
  onClose: () => void
}) {
  const { data } = useMaintenanceTemplatesQuery({
    search: search || undefined,
    isActive: true,
  })
  const incrementUsage = useIncrementTemplateUsage()

  const handleSelect = async (template: Template) => {
    // Increment usage count in background
    incrementUsage.mutate(template.id)
    onSelect(template)
    onClose()
  }

  if (data.templates.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-8 text-center'>
        <LuFileText className='size-12 text-muted-foreground/50' />
        <p className='mt-2 text-sm text-muted-foreground'>
          {search ? 'No templates match your search' : 'No templates created yet'}
        </p>
        <p className='text-xs text-muted-foreground'>
          Create templates from the maintenance settings
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-2'>
      {data.templates.map((template) => {
        const priority = priorityConfig[template.priority] || priorityConfig.MEDIUM
        return (
          <button
            key={template.id}
            onClick={() => handleSelect(template as Template)}
            className='w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50'
          >
            <div className='flex items-start justify-between gap-2'>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2'>
                  <span className='font-medium truncate'>{template.name}</span>
                  <Badge variant='outline' className='text-xs shrink-0'>
                    {categoryLabels[template.category]}
                  </Badge>
                  <Badge variant={priority.variant} className='text-xs shrink-0'>
                    {priority.label}
                  </Badge>
                </div>
                <p className='mt-1 text-sm text-muted-foreground truncate'>
                  {template.title}
                </p>
                <div className='mt-1 flex items-center gap-3 text-xs text-muted-foreground'>
                  {template.slaResponseHours && (
                    <span>Response: {template.slaResponseHours}h</span>
                  )}
                  {template.slaResolutionHours && (
                    <span>Resolution: {template.slaResolutionHours}h</span>
                  )}
                  {template.estimatedCost && (
                    <span>~${Number(template.estimatedCost).toFixed(0)}</span>
                  )}
                </div>
              </div>
              <div className='text-xs text-muted-foreground'>
                Used {template.usageCount}x
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function TemplatesListSkeleton() {
  return (
    <div className='space-y-2'>
      {[...Array(3)].map((_, i) => (
        <div key={i} className='rounded-lg border p-3'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-5 w-32' />
            <Skeleton className='h-5 w-16' />
          </div>
          <Skeleton className='mt-2 h-4 w-48' />
        </div>
      ))}
    </div>
  )
}

export function TemplateSelector({ onSelect, className }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm' className={className}>
          <LuFileText className='mr-2 size-4' />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Select Template</DialogTitle>
          <DialogDescription>
            Choose a template to pre-fill the work order form
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Search */}
          <div className='relative'>
            <LuSearch className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search templates...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9'
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
              >
                <LuX className='size-4' />
              </button>
            )}
          </div>

          {/* Templates List */}
          <div className='max-h-[400px] overflow-y-auto'>
            <Suspense fallback={<TemplatesListSkeleton />}>
              <TemplatesList
                search={search}
                onSelect={onSelect}
                onClose={() => setOpen(false)}
              />
            </Suspense>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Quick template picker for inline use
export function QuickTemplatePicker({
  onSelect,
  className,
}: TemplateSelectorProps) {
  return (
    <TemplateSelector onSelect={onSelect} className={className} />
  )
}
