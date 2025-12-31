'use client'

import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnSizingState,
  type Row,
  type SortingState,
  type Table,
  type VisibilityState,
} from '@tanstack/react-table'
import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'

import { cx } from '~/libs/utils'
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { DataTablePagination } from './data-table-pagination'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  toolbar?: ReactNode | ((table: Table<TData>) => ReactNode)
  showPagination?: boolean
  enableColumnResizing?: boolean
  enableRowSelection?: boolean
  onRowClick?: (row: Row<TData>) => void
  onDataChange?: (data: TData[]) => void
  getRowClassName?: (row: Row<TData>) => string
}

export function DataTable<TData, TValue>({
  columns,
  data: initialData,
  toolbar,
  showPagination = true,
  enableColumnResizing = true,
  enableRowSelection = true,
  onRowClick,
  onDataChange,
  getRowClassName,
}: DataTableProps<TData, TValue>) {
  const [data, setData] = useState(initialData)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})

  // Update data when prop changes
  if (initialData !== data && JSON.stringify(initialData) !== JSON.stringify(data)) {
    setData(initialData)
  }

  // Callback to update cell data (for editable cells)
  const updateData = useCallback(
    (rowIndex: number, columnId: string, value: unknown) => {
      setData((old) => {
        const newData = old.map((row, index) => {
          if (index === rowIndex) {
            return {
              ...row,
              [columnId]: value,
            }
          }
          return row
        })
        onDataChange?.(newData)
        return newData
      })
    },
    [onDataChange]
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: 'onChange',
    enableColumnResizing,
    enableRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnSizing,
    },
    meta: {
      updateData,
    },
  })

  const renderedToolbar = typeof toolbar === 'function' ? toolbar(table) : toolbar

  return (
    <div className='space-y-4'>
      {renderedToolbar}
      <div className='rounded-md border overflow-auto'>
        <TableComponent style={{ width: table.getCenterTotalSize() }}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        width: header.getSize(),
                        position: 'relative',
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {/* Resize handle */}
                      {enableColumnResizing && header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={cx(
                            'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none',
                            'hover:bg-primary/50',
                            header.column.getIsResizing() && 'bg-primary'
                          )}
                        />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => onRowClick?.(row)}
                  className={cx(
                    onRowClick && 'cursor-pointer',
                    getRowClassName?.(row)
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </TableComponent>
      </div>
      {showPagination && <DataTablePagination table={table} />}
    </div>
  )
}
