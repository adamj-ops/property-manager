'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  LuBuilding2,
  LuCalendar,
  LuCircleCheck,
  LuCircleX,
  LuDog,
  LuLoaderCircle,
  LuMail,
  LuPencil,
  LuPhone,
  LuPlus,
  LuTrash2,
  LuUser,
} from 'react-icons/lu'
import type { ColumnDef, Row } from '@tanstack/react-table'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Link } from '~/components/ui/link'
import { Skeleton } from '~/components/ui/skeleton'
import { Typography } from '~/components/ui/typography'
import {
  DataTableVirtual,
  DataTableBulkActionsFloating,
  DataTableColumnHeader,
  DataTableFacetedFilter,
  DataTableRowActions,
  DataTableRowExpansion,
  DataTableToolbar,
  EditableBadgeCell,
  EditableCell,
  FieldDisplay,
  FieldGroup,
} from '~/components/ui/data-table'
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '~/components/ui/dropdown-menu'
import { tenantsQueryOptions, useUpdateTenant, useDeleteTenant, tenantKeys } from '~/services/tenants.query'
import { propertiesQueryOptions } from '~/services/properties.query'
import type { TenantStatus } from '~/services/tenants.schema'

export const Route = createFileRoute('/app/tenants/')({
  component: TenantsListPage,
})

// Tenant type for display (flattened from API response)
interface TenantDisplay {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  status: TenantStatus
  preferredContactMethod: string
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  emergencyContactRelation: string | null
  employer: string | null
  monthlyIncome: number | null
  createdAt: string
  updatedAt: string
}

// Status options for filter
const statusOptions = [
  { label: 'Active', value: 'ACTIVE', icon: LuCircleCheck },
  { label: 'Applicant', value: 'APPLICANT', icon: LuCalendar },
  { label: 'Approved', value: 'APPROVED', icon: LuCircleCheck },
  { label: 'Past', value: 'PAST', icon: LuCircleX },
  { label: 'Denied', value: 'DENIED', icon: LuCircleX },
]

const statusBadgeOptions = [
  { label: 'Active', value: 'ACTIVE', variant: 'default' as const },
  { label: 'Applicant', value: 'APPLICANT', variant: 'secondary' as const },
  { label: 'Approved', value: 'APPROVED', variant: 'outline' as const, className: 'border-green-500 text-green-700' },
  { label: 'Past', value: 'PAST', variant: 'secondary' as const },
  { label: 'Evicted', value: 'EVICTED', variant: 'destructive' as const },
  { label: 'Denied', value: 'DENIED', variant: 'destructive' as const },
]

function TenantsListPage() {
  const queryClient = useQueryClient()
  const updateTenant = useUpdateTenant()
  const deleteTenant = useDeleteTenant()

  // Fetch tenants from API
  const { data: tenantsData, isLoading, isError, error } = useQuery(
    tenantsQueryOptions({ limit: 100 })
  )

  // Fetch properties for filter dropdown
  const { data: propertiesData } = useQuery(propertiesQueryOptions({ limit: 100 }))
  const propertyOptions = useMemo(() =>
    (propertiesData?.properties ?? []).map((p) => ({
      label: p.name,
      value: p.id,
      icon: LuBuilding2,
    })),
    [propertiesData]
  )

  // Transform API data to display format
  const tenants: TenantDisplay[] = useMemo(() => {
    if (!tenantsData?.tenants) return []
    return tenantsData.tenants.map((t: any) => ({
      id: t.id,
      firstName: t.firstName,
      lastName: t.lastName,
      email: t.email,
      phone: t.phone,
      status: t.status as TenantStatus,
      preferredContactMethod: t.preferredContactMethod ?? 'email',
      emergencyContactName: t.emergencyContactName,
      emergencyContactPhone: t.emergencyContactPhone,
      emergencyContactRelation: t.emergencyContactRelation,
      employer: t.employer,
      monthlyIncome: t.monthlyIncome ? Number(t.monthlyIncome) : null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }))
  }, [tenantsData])

  // Row expansion state
  const [expandedRow, setExpandedRow] = useState<Row<TenantDisplay> | null>(null)
  const [expansionOpen, setExpansionOpen] = useState(false)

  // Table ref for bulk actions
  const [tableInstance, setTableInstance] = useState<any>(null)

  // Calculate stats
  const activeTenants = tenants.filter((t) => t.status === 'ACTIVE').length
  const applicants = tenants.filter((t) => t.status === 'APPLICANT').length
  const approvedTenants = tenants.filter((t) => t.status === 'APPROVED').length

  // Handle inline data changes
  const handleDataChange = useCallback((newData: TenantDisplay[]) => {
    // Find what changed and update via API
    const changedTenant = newData.find((newT) => {
      const oldT = tenants.find((t) => t.id === newT.id)
      if (!oldT) return false
      return JSON.stringify(oldT) !== JSON.stringify(newT)
    })

    if (changedTenant) {
      updateTenant.mutate({
        id: changedTenant.id,
        firstName: changedTenant.firstName,
        lastName: changedTenant.lastName,
        email: changedTenant.email,
        phone: changedTenant.phone ?? undefined,
        status: changedTenant.status,
      }, {
        onSuccess: () => {
          toast.success('Tenant updated')
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : 'Failed to update tenant')
          // Revert by refetching
          queryClient.invalidateQueries({ queryKey: tenantKeys.all })
        },
      })
    }
  }, [tenants, updateTenant, queryClient])

  // Row click handler for expansion
  const handleRowClick = useCallback((row: Row<TenantDisplay>) => {
    setExpandedRow(row)
    setExpansionOpen(true)
  }, [])

  // Navigate between rows in expansion panel
  const handlePreviousRow = useCallback(() => {
    if (!expandedRow || !tableInstance) return
    const rows = tableInstance.getRowModel().rows
    const currentIndex = rows.findIndex((r: Row<TenantDisplay>) => r.id === expandedRow.id)
    if (currentIndex > 0) {
      setExpandedRow(rows[currentIndex - 1])
    }
  }, [expandedRow, tableInstance])

  const handleNextRow = useCallback(() => {
    if (!expandedRow || !tableInstance) return
    const rows = tableInstance.getRowModel().rows
    const currentIndex = rows.findIndex((r: Row<TenantDisplay>) => r.id === expandedRow.id)
    if (currentIndex < rows.length - 1) {
      setExpandedRow(rows[currentIndex + 1])
    }
  }, [expandedRow, tableInstance])

  // Bulk action handlers
  const handleBulkDelete = useCallback(async (rows: TenantDisplay[]) => {
    const promises = rows.map((r) => deleteTenant.mutateAsync(r.id))
    try {
      await Promise.all(promises)
      toast.success(`Deleted ${rows.length} tenant(s)`)
      tableInstance?.resetRowSelection()
    } catch (err) {
      toast.error('Failed to delete some tenants')
    }
  }, [deleteTenant, tableInstance])

  const handleBulkExport = useCallback((rows: TenantDisplay[]) => {
    // Export as CSV
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Status']
    const csvContent = [
      headers.join(','),
      ...rows.map((t) =>
        [t.firstName, t.lastName, t.email, t.phone ?? '', t.status].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tenants-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  // Column definitions
  const columns: ColumnDef<TenantDisplay>[] = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
        />
      ),
      size: 40,
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
    },
    {
      accessorKey: 'name',
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title='Name' />,
      size: 250,
      cell: ({ row }) => {
        return (
          <div className='flex items-center gap-3'>
            <div className='flex size-8 items-center justify-center rounded-full bg-primary/10'>
              <LuUser className='size-4 text-primary' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <Link
                  to='/app/tenants/$tenantId'
                  params={{ tenantId: row.original.id }}
                  className='font-medium hover:underline'
                >
                  {row.original.firstName} {row.original.lastName}
                </Link>
                {row.original.status === 'APPLICANT' && (
                  <Badge variant='secondary'>Applicant</Badge>
                )}
              </div>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <LuMail className='size-3' />
                {row.original.email}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'phone',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Phone' />,
      size: 140,
      cell: (props) => (
        <div className='flex items-center gap-1'>
          <LuPhone className='size-3 text-muted-foreground' />
          <EditableCell {...props} type='phone' />
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
      size: 120,
      cell: (props) => (
        <EditableBadgeCell
          {...props}
          options={statusBadgeOptions}
        />
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: 'employer',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Employer' />,
      size: 150,
      cell: (props) => (
        <EditableCell {...props} type='text' />
      ),
    },
    {
      accessorKey: 'monthlyIncome',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Income' />,
      size: 120,
      cell: (props) => <EditableCell {...props} type='currency' />,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Added' />,
      size: 120,
      cell: ({ row }) => (
        <div className='flex items-center gap-1 text-sm text-muted-foreground'>
          <LuCalendar className='size-3' />
          {new Date(row.original.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      size: 50,
      cell: ({ row }) => (
        <DataTableRowActions row={row}>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to='/app/tenants/$tenantId' params={{ tenantId: row.original.id }}>
              <LuUser className='mr-2 size-4' />
              View details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to='/app/tenants/$tenantId' params={{ tenantId: row.original.id }}>
              <LuPencil className='mr-2 size-4' />
              Edit tenant
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to='/app/communications'>
              <LuMail className='mr-2 size-4' />
              Send message
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className='text-destructive'
            onClick={() => {
              if (confirm(`Delete ${row.original.firstName} ${row.original.lastName}?`)) {
                deleteTenant.mutate(row.original.id, {
                  onSuccess: () => toast.success('Tenant deleted'),
                  onError: () => toast.error('Failed to delete tenant'),
                })
              }
            }}
          >
            <LuTrash2 className='mr-2 size-4' />
            Delete tenant
          </DropdownMenuItem>
        </DataTableRowActions>
      ),
      enableResizing: false,
    },
  ], [deleteTenant])

  // Loading state
  if (isLoading) {
    return (
      <div className='w-full max-w-7xl space-y-6 py-6'>
        <div className='flex items-center justify-between'>
          <div>
            <Typography.H2>Tenants</Typography.H2>
            <Typography.Muted>Manage your tenant relationships</Typography.Muted>
          </div>
          <Button disabled>
            <LuPlus className='mr-2 size-4' />
            Add Tenant
          </Button>
        </div>
        <div className='grid gap-4 md:grid-cols-4'>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className='pb-2'>
                <Skeleton className='h-4 w-24' />
              </CardHeader>
              <CardContent>
                <Skeleton className='h-8 w-12' />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className='pt-6'>
            <div className='space-y-4'>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-64 w-full' />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className='w-full max-w-7xl space-y-6 py-6'>
        <div className='flex items-center justify-between'>
          <div>
            <Typography.H2>Tenants</Typography.H2>
            <Typography.Muted>Manage your tenant relationships</Typography.Muted>
          </div>
        </div>
        <Card>
          <CardContent className='py-12 text-center'>
            <Typography.Muted>
              Failed to load tenants: {error instanceof Error ? error.message : 'Unknown error'}
            </Typography.Muted>
            <Button
              variant='outline'
              className='mt-4'
              onClick={() => queryClient.invalidateQueries({ queryKey: tenantKeys.all })}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Empty state
  if (tenants.length === 0) {
    return (
      <div className='w-full max-w-7xl space-y-6 py-6'>
        <div className='flex items-center justify-between'>
          <div>
            <Typography.H2>Tenants</Typography.H2>
            <Typography.Muted>Manage your tenant relationships</Typography.Muted>
          </div>
          <Button asChild>
            <Link to='/app/tenants/new'>
              <LuPlus className='mr-2 size-4' />
              Add Tenant
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className='py-12 text-center'>
            <div className='mx-auto flex size-16 items-center justify-center rounded-full bg-muted'>
              <LuUser className='size-8 text-muted-foreground' />
            </div>
            <Typography.H3 className='mt-4'>No tenants yet</Typography.H3>
            <Typography.Muted className='mt-2'>
              Get started by adding your first tenant
            </Typography.Muted>
            <Button asChild className='mt-6'>
              <Link to='/app/tenants/new'>
                <LuPlus className='mr-2 size-4' />
                Add Your First Tenant
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Typography.H2>Tenants</Typography.H2>
          <Typography.Muted>Manage your tenant relationships</Typography.Muted>
        </div>
        <Button asChild>
          <Link to='/app/tenants/new'>
            <LuPlus className='mr-2 size-4' />
            Add Tenant
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{tenants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>{activeTenants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Applicants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>{applicants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{approvedTenants}</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className='pt-6'>
          <DataTableVirtual
            columns={columns}
            data={tenants}
            onDataChange={handleDataChange}
            onRowClick={handleRowClick}
            enableColumnResizing
            enableCellSelection
            enableColumnPinning
            enableClipboard
            enableUndoRedo
            enableKeyboardNavigation
            maxUndoHistory={50}
            initialColumnPinning={{ left: ['select', 'name'], right: ['actions'] }}
            toolbar={(table) => {
              // Store table instance for bulk actions
              if (!tableInstance) setTableInstance(table)
              return (
                <DataTableToolbar
                  table={table}
                  searchKey='name'
                  searchPlaceholder='Search tenants...'
                  filterComponent={
                    <div className='flex gap-2'>
                      {table.getColumn('status') && (
                        <DataTableFacetedFilter
                          column={table.getColumn('status')}
                          title='Status'
                          options={statusOptions}
                        />
                      )}
                    </div>
                  }
                />
              )
            }}
          />
        </CardContent>
      </Card>

      {/* Row Expansion Panel */}
      <DataTableRowExpansion
        open={expansionOpen}
        onOpenChange={setExpansionOpen}
        row={expandedRow}
        title={(row) => `${row.original.firstName} ${row.original.lastName}`}
        description={(row) => row.original.email}
        onPrevious={handlePreviousRow}
        onNext={handleNextRow}
        hasPrevious={expandedRow ? tableInstance?.getRowModel().rows.findIndex((r: Row<TenantDisplay>) => r.id === expandedRow.id) > 0 : false}
        hasNext={expandedRow ? tableInstance?.getRowModel().rows.findIndex((r: Row<TenantDisplay>) => r.id === expandedRow.id) < (tableInstance?.getRowModel().rows.length - 1) : false}
        footer={(row) => (
          <>
            <Button variant='outline' asChild>
              <Link to='/app/communications'>
                <LuMail className='mr-2 h-4 w-4' />
                Send Message
              </Link>
            </Button>
            <Button asChild>
              <Link to='/app/tenants/$tenantId' params={{ tenantId: row.original.id }}>
                View Full Profile
              </Link>
            </Button>
          </>
        )}
      >
        {(row) => (
          <>
            {/* Contact Information */}
            <FieldGroup title='Contact Information'>
              <FieldDisplay label='Email' value={row.original.email} />
              <FieldDisplay label='Phone' value={row.original.phone ?? 'Not provided'} />
              <FieldDisplay label='Preferred Contact' value={row.original.preferredContactMethod} />
            </FieldGroup>

            {/* Emergency Contact */}
            {row.original.emergencyContactName && (
              <FieldGroup title='Emergency Contact'>
                <FieldDisplay label='Name' value={row.original.emergencyContactName} />
                <FieldDisplay label='Phone' value={row.original.emergencyContactPhone ?? 'Not provided'} />
                <FieldDisplay label='Relationship' value={row.original.emergencyContactRelation ?? 'Not specified'} />
              </FieldGroup>
            )}

            {/* Employment */}
            {row.original.employer && (
              <FieldGroup title='Employment'>
                <FieldDisplay label='Employer' value={row.original.employer} />
                <FieldDisplay
                  label='Monthly Income'
                  value={row.original.monthlyIncome ? `$${row.original.monthlyIncome.toLocaleString()}` : 'Not provided'}
                />
              </FieldGroup>
            )}

            {/* Status */}
            <FieldGroup title='Status'>
              <FieldDisplay
                label='Current Status'
                value={
                  <Badge variant={row.original.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {row.original.status}
                  </Badge>
                }
              />
              <FieldDisplay label='Added' value={new Date(row.original.createdAt).toLocaleDateString()} />
              <FieldDisplay label='Last Updated' value={new Date(row.original.updatedAt).toLocaleDateString()} />
            </FieldGroup>
          </>
        )}
      </DataTableRowExpansion>

      {/* Bulk Actions Floating Bar */}
      {tableInstance && (
        <DataTableBulkActionsFloating
          table={tableInstance}
          onDelete={handleBulkDelete}
          onExport={handleBulkExport}
          actions={[
            {
              label: 'Send Message',
              icon: <LuMail className='h-4 w-4' />,
              onClick: () => {
                console.log('Send message to selected tenants')
              },
            },
          ]}
        />
      )}
    </div>
  )
}
