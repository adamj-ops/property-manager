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
  enableKeyboardNavigation?: boolean
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
  enableKeyboardNavigation = true,
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

  // Keyboard navigation state
  const [focusedCell, setFocusedCell] = useState<CellPosition | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Undo/redo state
  const [history, setHistory] = useState<HistoryEntry<TData>[]>([{ data: initialData, timestamp: Date.now() }])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Refs
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef<Map<string, HTMLTableCellElement>>(new Map())

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

  // Get navigable column IDs (visible, non-select, non-action columns for editing)
  const getNavigableColumnIds = useCallback(() => {
    // This will be populated after table is created
    return [] as string[]
  }, [])

  // Navigate to a specific cell
  const navigateToCell = useCallback((rowIndex: number, columnId: string) => {
    setFocusedCell({ rowIndex, columnId })
    setSelectedCells(new Set([getCellKey(rowIndex, columnId)]))
    setSelectionStart({ rowIndex, columnId })

    // Scroll cell into view
    const cellElement = cellRefs.current.get(getCellKey(rowIndex, columnId))
    cellElement?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [])

  // Start editing the focused cell
  const startEditing = useCallback(() => {
    if (!focusedCell) return
    setIsEditing(true)

    // Find and focus the input within the cell
    const cellElement = cellRefs.current.get(getCellKey(focusedCell.rowIndex, focusedCell.columnId))
    if (cellElement) {
      // Look for editable input/select within the cell
      const editableElement = cellElement.querySelector('input, select, [contenteditable="true"]') as HTMLElement
      if (editableElement) {
        editableElement.focus()
        if (editableElement instanceof HTMLInputElement) {
          editableElement.select()
        }
      } else {
        // Trigger a double-click to activate editable cells
        const clickEvent = new MouseEvent('dblclick', { bubbles: true })
        cellElement.dispatchEvent(clickEvent)
      }
    }
  }, [focusedCell])

  // Stop editing
  const stopEditing = useCallback(() => {
    setIsEditing(false)
  }, [])

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

  // Get all navigable column IDs for keyboard navigation
  const navigableColumnIds = useMemo(() => {
    return allColumns.map((c) => c.id)
  }, [allColumns])

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if we're in an input/textarea (editing mode)
      const target = e.target as HTMLElement
      const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && enableUndoRedo) {
        e.preventDefault()
        undo()
        return
      }

      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        if (enableUndoRedo) {
          e.preventDefault()
          redo()
        }
        return
      }

      // Copy: Ctrl/Cmd + C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && enableClipboard && !isInInput) {
        copyToClipboard()
        return
      }

      // Paste: Ctrl/Cmd + V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && enableClipboard && !isInInput) {
        pasteFromClipboard()
        return
      }

      // Keyboard navigation (only when not editing)
      if (!enableKeyboardNavigation) return

      // Escape: Clear selection and exit edit mode
      if (e.key === 'Escape') {
        if (isEditing) {
          stopEditing()
          // Refocus the cell
          if (focusedCell) {
            const cellElement = cellRefs.current.get(getCellKey(focusedCell.rowIndex, focusedCell.columnId))
            cellElement?.focus()
          }
        } else {
          setSelectedCells(new Set())
          setSelectionStart(null)
          setFocusedCell(null)
        }
        return
      }

      // Enter: Start editing or confirm and move down
      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
        if (isInInput) {
          // Confirm edit and move to next row
          e.preventDefault()
          stopEditing()
          if (focusedCell && focusedCell.rowIndex < rows.length - 1) {
            navigateToCell(focusedCell.rowIndex + 1, focusedCell.columnId)
          }
        } else if (focusedCell) {
          // Start editing
          e.preventDefault()
          startEditing()
        }
        return
      }

      // Skip arrow/tab navigation if in input
      if (isInInput) return

      // Arrow keys navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()

        if (!focusedCell) {
          // Start at first cell if no focus
          if (rows.length > 0 && navigableColumnIds.length > 0) {
            navigateToCell(0, navigableColumnIds[0])
          }
          return
        }

        const currentRowIndex = focusedCell.rowIndex
        const currentColIndex = navigableColumnIds.indexOf(focusedCell.columnId)
        let newRowIndex = currentRowIndex
        let newColIndex = currentColIndex

        switch (e.key) {
          case 'ArrowUp':
            newRowIndex = Math.max(0, currentRowIndex - 1)
            break
          case 'ArrowDown':
            newRowIndex = Math.min(rows.length - 1, currentRowIndex + 1)
            break
          case 'ArrowLeft':
            newColIndex = Math.max(0, currentColIndex - 1)
            break
          case 'ArrowRight':
            newColIndex = Math.min(navigableColumnIds.length - 1, currentColIndex + 1)
            break
        }

        // Handle Shift+Arrow for range selection
        if (e.shiftKey && selectionStart) {
          const newPosition = { rowIndex: newRowIndex, columnId: navigableColumnIds[newColIndex] }
          const newSelection = selectCellRange(selectionStart, newPosition, navigableColumnIds)
          setSelectedCells(newSelection)
          setFocusedCell(newPosition)
          // Scroll into view
          rowVirtualizer.scrollToIndex(newRowIndex, { align: 'auto' })
        } else {
          navigateToCell(newRowIndex, navigableColumnIds[newColIndex])
          // Scroll into view
          rowVirtualizer.scrollToIndex(newRowIndex, { align: 'auto' })
        }
        return
      }

      // Tab navigation
      if (e.key === 'Tab') {
        if (!focusedCell) {
          // Let default tab behavior happen if no focus
          return
        }

        e.preventDefault()
        const currentRowIndex = focusedCell.rowIndex
        const currentColIndex = navigableColumnIds.indexOf(focusedCell.columnId)

        if (e.shiftKey) {
          // Move left, wrap to previous row
          if (currentColIndex > 0) {
            navigateToCell(currentRowIndex, navigableColumnIds[currentColIndex - 1])
          } else if (currentRowIndex > 0) {
            navigateToCell(currentRowIndex - 1, navigableColumnIds[navigableColumnIds.length - 1])
            rowVirtualizer.scrollToIndex(currentRowIndex - 1, { align: 'auto' })
          }
        } else {
          // Move right, wrap to next row
          if (currentColIndex < navigableColumnIds.length - 1) {
            navigateToCell(currentRowIndex, navigableColumnIds[currentColIndex + 1])
          } else if (currentRowIndex < rows.length - 1) {
            navigateToCell(currentRowIndex + 1, navigableColumnIds[0])
            rowVirtualizer.scrollToIndex(currentRowIndex + 1, { align: 'auto' })
          }
        }
        return
      }

      // Home/End navigation
      if (e.key === 'Home') {
        e.preventDefault()
        if (e.ctrlKey || e.metaKey) {
          // Go to first cell in table
          if (rows.length > 0 && navigableColumnIds.length > 0) {
            navigateToCell(0, navigableColumnIds[0])
            rowVirtualizer.scrollToIndex(0)
          }
        } else if (focusedCell) {
          // Go to first cell in row
          navigateToCell(focusedCell.rowIndex, navigableColumnIds[0])
        }
        return
      }

      if (e.key === 'End') {
        e.preventDefault()
        if (e.ctrlKey || e.metaKey) {
          // Go to last cell in table
          if (rows.length > 0 && navigableColumnIds.length > 0) {
            navigateToCell(rows.length - 1, navigableColumnIds[navigableColumnIds.length - 1])
            rowVirtualizer.scrollToIndex(rows.length - 1)
          }
        } else if (focusedCell) {
          // Go to last cell in row
          navigateToCell(focusedCell.rowIndex, navigableColumnIds[navigableColumnIds.length - 1])
        }
        return
      }

      // Page Up/Down for jumping multiple rows
      if (e.key === 'PageUp' || e.key === 'PageDown') {
        e.preventDefault()
        const jump = 10 // Jump 10 rows
        if (!focusedCell) {
          if (rows.length > 0 && navigableColumnIds.length > 0) {
            navigateToCell(0, navigableColumnIds[0])
          }
          return
        }

        const newRowIndex = e.key === 'PageUp'
          ? Math.max(0, focusedCell.rowIndex - jump)
          : Math.min(rows.length - 1, focusedCell.rowIndex + jump)

        navigateToCell(newRowIndex, focusedCell.columnId)
        rowVirtualizer.scrollToIndex(newRowIndex, { align: 'auto' })
        return
      }

      // Type to start editing (alphanumeric keys)
      if (focusedCell && !isInInput && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        startEditing()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    copyToClipboard,
    enableClipboard,
    enableKeyboardNavigation,
    enableUndoRedo,
    focusedCell,
    isEditing,
    navigableColumnIds,
    navigateToCell,
    pasteFromClipboard,
    redo,
    rows.length,
    rowVirtualizer,
    selectCellRange,
    selectionStart,
    startEditing,
    stopEditing,
    undo,
  ])

  // Cell click handler for selection
  const handleCellClick = useCallback(
    (e: React.MouseEvent, rowIndex: number, columnId: string) => {
      if (!enableCellSelection) return

      const position: CellPosition = { rowIndex, columnId }
      const columnIds = allColumns.map((c) => c.id)

      // Always set focused cell on click
      setFocusedCell(position)
      stopEditing()

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
    [allColumns, enableCellSelection, selectCellRange, selectionStart, stopEditing]
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

  // Handle double-click to edit
  const handleCellDoubleClick = useCallback(
    (rowIndex: number, columnId: string) => {
      if (!enableKeyboardNavigation) return
      setFocusedCell({ rowIndex, columnId })
      startEditing()
    },
    [enableKeyboardNavigation, startEditing]
  )

  // Render cell with selection and focus styling
  const renderCell = (cell: ReturnType<typeof rows[0]['getVisibleCells']>[0], rowIndex: number, isPinned: 'left' | 'right' | false) => {
    const cellKey = getCellKey(rowIndex, cell.column.id)
    const isSelected = selectedCells.has(cellKey)
    const isFocused = focusedCell?.rowIndex === rowIndex && focusedCell?.columnId === cell.column.id

    return (
      <TableCell
        key={cell.id}
        ref={(el) => {
          if (el) {
            cellRefs.current.set(cellKey, el)
          } else {
            cellRefs.current.delete(cellKey)
          }
        }}
        tabIndex={isFocused ? 0 : -1}
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
          isSelected && 'bg-primary/10',
          isFocused && 'ring-2 ring-primary ring-inset',
          isSelected && !isFocused && 'outline outline-1 outline-primary/50',
          enableCellSelection && 'cursor-cell select-none',
          'focus:outline-none'
        )}
        onClick={(e) => handleCellClick(e, rowIndex, cell.column.id)}
        onDoubleClick={() => handleCellDoubleClick(rowIndex, cell.column.id)}
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

      {/* Status bar with keyboard hints */}
      {(enableUndoRedo || enableKeyboardNavigation) && (
        <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
          {enableUndoRedo && (
            <span>History: {historyIndex + 1}/{history.length}</span>
          )}
          {enableKeyboardNavigation && (
            <>
              <span className='text-muted-foreground/60'>|</span>
              <span>Arrow keys to navigate</span>
              <span className='text-muted-foreground/60'>•</span>
              <span>Enter to edit</span>
              <span className='text-muted-foreground/60'>•</span>
              <span>Tab to move right</span>
              <span className='text-muted-foreground/60'>•</span>
              <span>Escape to cancel</span>
            </>
          )}
          {enableUndoRedo && (
            <>
              <span className='text-muted-foreground/60'>|</span>
              <span>Ctrl+Z undo</span>
              <span className='text-muted-foreground/60'>•</span>
              <span>Ctrl+Shift+Z redo</span>
            </>
          )}
          {enableClipboard && (
            <>
              <span className='text-muted-foreground/60'>|</span>
              <span>Ctrl+C copy</span>
              <span className='text-muted-foreground/60'>•</span>
              <span>Ctrl+V paste</span>
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
