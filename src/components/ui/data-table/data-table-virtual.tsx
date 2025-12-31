'use client'

import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnPinningState,
  type ColumnSizingState,
  type Row,
  type SortingState,
  type Table,
  type VisibilityState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

// Types for cell selection
interface CellPosition {
  rowIndex: number
  columnId: string
}

interface CellRange {
  start: CellPosition
  end: CellPosition
}

// History for undo/redo
interface HistoryEntry<TData> {
  data: TData[]
  timestamp: number
}

interface DataTableVirtualProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  toolbar?: ReactNode | ((table: Table<TData>) => ReactNode)
  estimateRowHeight?: number
  overscan?: number
  enableColumnResizing?: boolean
  enableRowSelection?: boolean
  enableCellSelection?: boolean
  enableColumnPinning?: boolean
  enableClipboard?: boolean
  enableUndoRedo?: boolean
  maxUndoHistory?: number
  onRowClick?: (row: Row<TData>) => void
  onDataChange?: (data: TData[]) => void
  getRowClassName?: (row: Row<TData>) => string
  initialColumnPinning?: ColumnPinningState
}

export function DataTableVirtual<TData, TValue>({
  columns,
  data: initialData,
  toolbar,
  estimateRowHeight = 52,
  overscan = 10,
  enableColumnResizing = true,
  enableRowSelection = true,
  enableCellSelection = true,
  enableColumnPinning = true,
  enableClipboard = true,
  enableUndoRedo = true,
  maxUndoHistory = 50,
  onRowClick,
  onDataChange,
  getRowClassName,
  initialColumnPinning = { left: [], right: [] },
}: DataTableVirtualProps<TData, TValue>) {
  // Core state
  const [data, setData] = useState(initialData)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(initialColumnPinning)

  // Cell selection state
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [selectionStart, setSelectionStart] = useState<CellPosition | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)

  // Undo/redo state
  const [history, setHistory] = useState<HistoryEntry<TData>[]>([{ data: initialData, timestamp: Date.now() }])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Refs
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Sync data with props
  useEffect(() => {
    if (JSON.stringify(initialData) !== JSON.stringify(data)) {
      setData(initialData)
      if (enableUndoRedo) {
        setHistory([{ data: initialData, timestamp: Date.now() }])
        setHistoryIndex(0)
      }
    }
  }, [initialData])

  // Update data with history tracking
  const updateData = useCallback(
    (rowIndex: number, columnId: string, value: unknown) => {
      setData((old) => {
        const newData = old.map((row, index) => {
          if (index === rowIndex) {
            return { ...row, [columnId]: value }
          }
          return row
        })

        // Add to history
        if (enableUndoRedo) {
          setHistory((prev) => {
            const newHistory = prev.slice(0, historyIndex + 1)
            newHistory.push({ data: newData, timestamp: Date.now() })
            // Limit history size
            if (newHistory.length > maxUndoHistory) {
              newHistory.shift()
            }
            return newHistory
          })
          setHistoryIndex((prev) => Math.min(prev + 1, maxUndoHistory - 1))
        }

        onDataChange?.(newData)
        return newData
      })
    },
    [enableUndoRedo, historyIndex, maxUndoHistory, onDataChange]
  )

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setData(history[newIndex].data)
      onDataChange?.(history[newIndex].data)
    }
  }, [history, historyIndex, onDataChange])

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setData(history[newIndex].data)
      onDataChange?.(history[newIndex].data)
    }
  }, [history, historyIndex, onDataChange])

  // Cell selection helpers
  const getCellKey = (rowIndex: number, columnId: string) => `${rowIndex}:${columnId}`

  const selectCellRange = useCallback((start: CellPosition, end: CellPosition, columnIds: string[]) => {
    const minRow = Math.min(start.rowIndex, end.rowIndex)
    const maxRow = Math.max(start.rowIndex, end.rowIndex)
    const startColIndex = columnIds.indexOf(start.columnId)
    const endColIndex = columnIds.indexOf(end.columnId)
    const minCol = Math.min(startColIndex, endColIndex)
    const maxCol = Math.max(startColIndex, endColIndex)

    const newSelection = new Set<string>()
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        newSelection.add(getCellKey(row, columnIds[col]))
      }
    }
    return newSelection
  }, [])

  // Copy selected cells to clipboard
  const copyToClipboard = useCallback(async () => {
    if (!enableClipboard || selectedCells.size === 0) return

    const rows: Map<number, Map<string, unknown>> = new Map()
    const columnIds: Set<string> = new Set()

    // Parse selected cells
    selectedCells.forEach((key) => {
      const [rowStr, columnId] = key.split(':')
      const rowIndex = parseInt(rowStr, 10)
      columnIds.add(columnId)
      if (!rows.has(rowIndex)) {
        rows.set(rowIndex, new Map())
      }
      const rowData = data[rowIndex] as Record<string, unknown>
      rows.get(rowIndex)?.set(columnId, rowData[columnId])
    })

    // Convert to TSV
    const sortedRows = Array.from(rows.keys()).sort((a, b) => a - b)
    const sortedCols = Array.from(columnIds)

    const tsv = sortedRows
      .map((rowIndex) => {
        const rowMap = rows.get(rowIndex)!
        return sortedCols.map((colId) => String(rowMap.get(colId) ?? '')).join('\t')
      })
      .join('\n')

    try {
      await navigator.clipboard.writeText(tsv)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [data, enableClipboard, selectedCells])

  // Paste from clipboard
  const pasteFromClipboard = useCallback(async () => {
    if (!enableClipboard || selectedCells.size === 0) return

    try {
      const text = await navigator.clipboard.readText()
      const rows = text.split('\n').map((row) => row.split('\t'))

      // Find the top-left cell of selection
      let minRow = Infinity
      let minColIndex = Infinity
      const columnIds = table.getAllLeafColumns().map((c) => c.id)

      selectedCells.forEach((key) => {
        const [rowStr, columnId] = key.split(':')
        const rowIndex = parseInt(rowStr, 10)
        const colIndex = columnIds.indexOf(columnId)
        if (rowIndex < minRow) minRow = rowIndex
        if (colIndex < minColIndex) minColIndex = colIndex
      })

      // Apply pasted data
      setData((old) => {
        const newData = [...old]
        rows.forEach((row, rowOffset) => {
          const targetRowIndex = minRow + rowOffset
          if (targetRowIndex >= newData.length) return

          row.forEach((value, colOffset) => {
            const targetColIndex = minColIndex + colOffset
            if (targetColIndex >= columnIds.length) return
            const columnId = columnIds[targetColIndex]

            newData[targetRowIndex] = {
              ...newData[targetRowIndex],
              [columnId]: value,
            }
          })
        })

        // Add to history
        if (enableUndoRedo) {
          setHistory((prev) => {
            const newHistory = prev.slice(0, historyIndex + 1)
            newHistory.push({ data: newData, timestamp: Date.now() })
            return newHistory.slice(-maxUndoHistory)
          })
          setHistoryIndex((prev) => prev + 1)
        }

        onDataChange?.(newData)
        return newData
      })
    } catch (err) {
      console.error('Failed to paste:', err)
    }
  }, [enableClipboard, enableUndoRedo, historyIndex, maxUndoHistory, onDataChange, selectedCells])

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && enableUndoRedo) {
        e.preventDefault()
        undo()
      }
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        if (enableUndoRedo) {
          e.preventDefault()
          redo()
        }
      }
      // Copy: Ctrl/Cmd + C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && enableClipboard) {
        copyToClipboard()
      }
      // Paste: Ctrl/Cmd + V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && enableClipboard) {
        pasteFromClipboard()
      }
      // Clear selection: Escape
      if (e.key === 'Escape') {
        setSelectedCells(new Set())
        setSelectionStart(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [copyToClipboard, enableClipboard, enableUndoRedo, pasteFromClipboard, redo, undo])

  // Table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    onColumnPinningChange: setColumnPinning,
    columnResizeMode: 'onChange',
    enableColumnResizing,
    enableRowSelection,
    enableColumnPinning,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnSizing,
      columnPinning,
    },
    meta: {
      updateData,
    },
  })

  const { rows } = table.getRowModel()

  // Virtual row handler
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimateRowHeight,
    overscan,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  // Get column groups for pinning
  const leftPinnedColumns = table.getLeftLeafColumns()
  const rightPinnedColumns = table.getRightLeafColumns()
  const centerColumns = table.getCenterLeafColumns()
  const allColumns = table.getAllLeafColumns()

  // Calculate pinned column widths
  const leftPinnedWidth = leftPinnedColumns.reduce((sum, col) => sum + col.getSize(), 0)
  const rightPinnedWidth = rightPinnedColumns.reduce((sum, col) => sum + col.getSize(), 0)

  // Cell click handler for selection
  const handleCellClick = useCallback(
    (e: React.MouseEvent, rowIndex: number, columnId: string) => {
      if (!enableCellSelection) return

      const position: CellPosition = { rowIndex, columnId }
      const columnIds = allColumns.map((c) => c.id)

      if (e.shiftKey && selectionStart) {
        // Range selection
        const newSelection = selectCellRange(selectionStart, position, columnIds)
        setSelectedCells(newSelection)
      } else if (e.ctrlKey || e.metaKey) {
        // Toggle selection
        const key = getCellKey(rowIndex, columnId)
        setSelectedCells((prev) => {
          const next = new Set(prev)
          if (next.has(key)) {
            next.delete(key)
          } else {
            next.add(key)
          }
          return next
        })
        setSelectionStart(position)
      } else {
        // Single selection
        setSelectedCells(new Set([getCellKey(rowIndex, columnId)]))
        setSelectionStart(position)
      }
    },
    [allColumns, enableCellSelection, selectCellRange, selectionStart]
  )

  // Mouse down for drag selection
  const handleCellMouseDown = useCallback(
    (e: React.MouseEvent, rowIndex: number, columnId: string) => {
      if (!enableCellSelection || e.button !== 0) return
      if (e.shiftKey || e.ctrlKey || e.metaKey) return // Let click handler deal with modifiers

      setIsSelecting(true)
      setSelectionStart({ rowIndex, columnId })
      setSelectedCells(new Set([getCellKey(rowIndex, columnId)]))
    },
    [enableCellSelection]
  )

  // Mouse enter during drag selection
  const handleCellMouseEnter = useCallback(
    (rowIndex: number, columnId: string) => {
      if (!isSelecting || !selectionStart) return

      const columnIds = allColumns.map((c) => c.id)
      const newSelection = selectCellRange(selectionStart, { rowIndex, columnId }, columnIds)
      setSelectedCells(newSelection)
    },
    [allColumns, isSelecting, selectCellRange, selectionStart]
  )

  // Mouse up to end drag selection
  useEffect(() => {
    const handleMouseUp = () => {
      setIsSelecting(false)
    }
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [])

  const renderedToolbar = typeof toolbar === 'function' ? toolbar(table) : toolbar

  // Render cell with selection styling
  const renderCell = (cell: ReturnType<typeof rows[0]['getVisibleCells']>[0], rowIndex: number, isPinned: 'left' | 'right' | false) => {
    const isSelected = selectedCells.has(getCellKey(rowIndex, cell.column.id))

    return (
      <TableCell
        key={cell.id}
        style={{
          width: cell.column.getSize(),
          minWidth: cell.column.getSize(),
          maxWidth: cell.column.getSize(),
          ...(isPinned && {
            position: 'sticky',
            left: isPinned === 'left' ? cell.column.getStart('left') : undefined,
            right: isPinned === 'right' ? cell.column.getAfter('right') : undefined,
            zIndex: 1,
          }),
        }}
        className={cx(
          isPinned && 'bg-background',
          isSelected && 'bg-primary/10 outline outline-1 outline-primary',
          enableCellSelection && 'cursor-cell select-none'
        )}
        onClick={(e) => handleCellClick(e, rowIndex, cell.column.id)}
        onMouseDown={(e) => handleCellMouseDown(e, rowIndex, cell.column.id)}
        onMouseEnter={() => handleCellMouseEnter(rowIndex, cell.column.id)}
      >
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </TableCell>
    )
  }

  return (
    <div className='space-y-4'>
      {renderedToolbar}

      {/* Undo/Redo status */}
      {enableUndoRedo && (
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <span>History: {historyIndex + 1}/{history.length}</span>
          <span>|</span>
          <span>Ctrl+Z to undo, Ctrl+Shift+Z to redo</span>
          {enableClipboard && (
            <>
              <span>|</span>
              <span>Ctrl+C to copy, Ctrl+V to paste</span>
            </>
          )}
        </div>
      )}

      <div
        ref={tableContainerRef}
        className='rounded-md border overflow-auto relative'
        style={{ height: '600px' }}
      >
        <TableComponent style={{ width: table.getTotalSize() }}>
          <TableHeader className='sticky top-0 z-10 bg-background'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isPinned = header.column.getIsPinned()
                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        width: header.getSize(),
                        minWidth: header.getSize(),
                        position: isPinned ? 'sticky' : 'relative',
                        left: isPinned === 'left' ? header.column.getStart('left') : undefined,
                        right: isPinned === 'right' ? header.column.getAfter('right') : undefined,
                        zIndex: isPinned ? 11 : 10,
                      }}
                      className={cx(isPinned && 'bg-background')}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
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
          <TableBody
            style={{
              height: `${totalSize}px`,
              position: 'relative',
            }}
          >
            {virtualRows.length > 0 ? (
              virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index]
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    data-index={virtualRow.index}
                    onClick={() => onRowClick?.(row)}
                    className={cx(
                      onRowClick && 'cursor-pointer',
                      getRowClassName?.(row)
                    )}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {row.getLeftVisibleCells().map((cell) =>
                      renderCell(cell, virtualRow.index, 'left')
                    )}
                    {row.getCenterVisibleCells().map((cell) =>
                      renderCell(cell, virtualRow.index, false)
                    )}
                    {row.getRightVisibleCells().map((cell) =>
                      renderCell(cell, virtualRow.index, 'right')
                    )}
                  </TableRow>
                )
              })
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

      {/* Selection info */}
      {enableCellSelection && selectedCells.size > 0 && (
        <div className='text-xs text-muted-foreground'>
          {selectedCells.size} cell{selectedCells.size !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  )
}
