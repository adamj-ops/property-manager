'use client'

import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear } from 'date-fns'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { useRef, useState, useCallback, type ReactNode } from 'react'
import {
  LuCalendar,
  LuChevronDown,
  LuDownload,
  LuFileImage,
  LuFileText,
  LuMaximize2,
  LuX,
} from 'react-icons/lu'
import type { DateRange } from 'react-day-picker'

import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet'
import { ScrollArea } from '~/components/ui/scroll-area'
import { cx } from '~/libs/utils'

// Date range presets
type DatePreset = {
  label: string
  value: string
  getRange: () => DateRange
}

const datePresets: DatePreset[] = [
  {
    label: 'Last 7 days',
    value: '7d',
    getRange: () => ({ from: subDays(new Date(), 7), to: new Date() }),
  },
  {
    label: 'Last 30 days',
    value: '30d',
    getRange: () => ({ from: subDays(new Date(), 30), to: new Date() }),
  },
  {
    label: 'Last 3 months',
    value: '3m',
    getRange: () => ({ from: subMonths(new Date(), 3), to: new Date() }),
  },
  {
    label: 'Last 6 months',
    value: '6m',
    getRange: () => ({ from: subMonths(new Date(), 6), to: new Date() }),
  },
  {
    label: 'Last 12 months',
    value: '12m',
    getRange: () => ({ from: subMonths(new Date(), 12), to: new Date() }),
  },
  {
    label: 'This month',
    value: 'this-month',
    getRange: () => ({ from: startOfMonth(new Date()), to: new Date() }),
  },
  {
    label: 'Last month',
    value: 'last-month',
    getRange: () => {
      const lastMonth = subMonths(new Date(), 1)
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) }
    },
  },
  {
    label: 'Year to date',
    value: 'ytd',
    getRange: () => ({ from: startOfYear(new Date()), to: new Date() }),
  },
]

// Chart date filter component
interface ChartDateFilterProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  preset: string
  onPresetChange: (preset: string) => void
  className?: string
}

export function ChartDateFilter({
  dateRange,
  onDateRangeChange,
  preset,
  onPresetChange,
  className,
}: ChartDateFilterProps) {
  const handlePresetChange = (value: string) => {
    onPresetChange(value)
    if (value === 'custom') {
      return
    }
    const presetConfig = datePresets.find((p) => p.value === value)
    if (presetConfig) {
      onDateRangeChange(presetConfig.getRange())
    }
  }

  const formatDateRange = () => {
    if (!dateRange?.from) return 'Select dates'
    const from = format(dateRange.from, 'MMM d, yyyy')
    if (!dateRange.to) return from
    const to = format(dateRange.to, 'MMM d, yyyy')
    return `${from} - ${to}`
  }

  return (
    <div className={cx('flex items-center gap-2', className)}>
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className='h-8 w-[140px]'>
          <SelectValue placeholder='Select range' />
        </SelectTrigger>
        <SelectContent>
          {datePresets.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
          <SelectItem value='custom'>Custom range</SelectItem>
        </SelectContent>
      </Select>

      {preset === 'custom' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant='outline' size='sm' className='h-8 gap-2'>
              <LuCalendar className='size-4' />
              <span className='text-xs'>{formatDateRange()}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            <Calendar
              mode='range'
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
              defaultMonth={dateRange?.from}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

// Export menu component
interface ChartExportMenuProps {
  chartRef: React.RefObject<HTMLDivElement | null>
  title: string
}

export function ChartExportMenu({ chartRef, title }: ChartExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportToPng = useCallback(async () => {
    if (!chartRef.current) return
    setIsExporting(true)
    try {
      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      })
      const link = document.createElement('a')
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Failed to export PNG:', error)
    } finally {
      setIsExporting(false)
    }
  }, [chartRef, title])

  const exportToPdf = useCallback(async () => {
    if (!chartRef.current) return
    setIsExporting(true)
    try {
      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      })
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
      })
      const imgProps = pdf.getImageProperties(dataUrl)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
      pdf.addImage(dataUrl, 'PNG', 0, 20, pdfWidth, pdfHeight)
      pdf.setFontSize(16)
      pdf.text(title, 20, 15)
      pdf.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
    } catch (error) {
      console.error('Failed to export PDF:', error)
    } finally {
      setIsExporting(false)
    }
  }, [chartRef, title])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='size-8' disabled={isExporting}>
          <LuDownload className='size-4' />
          <span className='sr-only'>Export chart</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={exportToPng}>
          <LuFileImage className='mr-2 size-4' />
          Export as PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPdf}>
          <LuFileText className='mr-2 size-4' />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Drill-down data types
export interface DrillDownItem {
  id: string
  label: string
  value: string | number
  subLabel?: string
  status?: 'success' | 'warning' | 'error' | 'info'
  metadata?: Record<string, string | number>
}

export interface DrillDownData {
  title: string
  description?: string
  items: DrillDownItem[]
  columns?: { key: string; label: string }[]
}

// Drill-down sheet component
interface ChartDrillDownProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: DrillDownData | null
}

export function ChartDrillDown({ open, onOpenChange, data }: ChartDrillDownProps) {
  if (!data) return null

  const statusColors = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-lg'>
        <SheetHeader>
          <SheetTitle>{data.title}</SheetTitle>
          {data.description && <SheetDescription>{data.description}</SheetDescription>}
        </SheetHeader>
        <ScrollArea className='mt-6 h-[calc(100vh-150px)]'>
          <div className='space-y-3 pr-4'>
            {data.items.map((item) => (
              <div
                key={item.id}
                className='flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50'
              >
                <div className='flex items-center gap-3'>
                  {item.status && (
                    <div className={cx('size-2 rounded-full', statusColors[item.status])} />
                  )}
                  <div>
                    <p className='font-medium'>{item.label}</p>
                    {item.subLabel && (
                      <p className='text-sm text-muted-foreground'>{item.subLabel}</p>
                    )}
                  </div>
                </div>
                <div className='text-right'>
                  <p className='font-semibold'>{item.value}</p>
                  {item.metadata && (
                    <div className='text-xs text-muted-foreground'>
                      {Object.entries(item.metadata).map(([key, val]) => (
                        <span key={key} className='ml-2'>
                          {key}: {val}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

// Expanded chart dialog
interface ChartExpandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
}

export function ChartExpandDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: ChartExpandDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-5xl'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className='mt-4 h-[500px]'>{children}</div>
      </DialogContent>
    </Dialog>
  )
}

// Main chart container component
interface ChartContainerProps {
  title: string
  description?: string
  children: ReactNode
  showDateFilter?: boolean
  showExport?: boolean
  showExpand?: boolean
  dateRange?: DateRange
  onDateRangeChange?: (range: DateRange | undefined) => void
  preset?: string
  onPresetChange?: (preset: string) => void
  drillDownData?: DrillDownData | null
  onDrillDownClose?: () => void
  expandedContent?: ReactNode
  className?: string
}

export function ChartContainer({
  title,
  description,
  children,
  showDateFilter = false,
  showExport = true,
  showExpand = true,
  dateRange,
  onDateRangeChange,
  preset = '6m',
  onPresetChange,
  drillDownData,
  onDrillDownClose,
  expandedContent,
  className,
}: ChartContainerProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false)
  const [internalPreset, setInternalPreset] = useState(preset)
  const [internalDateRange, setInternalDateRange] = useState<DateRange | undefined>(() => {
    const presetConfig = datePresets.find((p) => p.value === preset)
    return presetConfig?.getRange()
  })

  const handleDrillDownOpenChange = (open: boolean) => {
    setIsDrillDownOpen(open)
    if (!open && onDrillDownClose) {
      onDrillDownClose()
    }
  }

  // Open drill-down when data is provided
  if (drillDownData && !isDrillDownOpen) {
    setIsDrillDownOpen(true)
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-2'>
          <div className='space-y-1'>
            <CardTitle className='text-base'>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className='flex items-center gap-1'>
            {showDateFilter && (
              <ChartDateFilter
                dateRange={onDateRangeChange ? dateRange : internalDateRange}
                onDateRangeChange={onDateRangeChange ?? setInternalDateRange}
                preset={onPresetChange ? preset : internalPreset}
                onPresetChange={onPresetChange ?? setInternalPreset}
              />
            )}
            {showExport && <ChartExportMenu chartRef={chartRef} title={title} />}
            {showExpand && (
              <Button
                variant='ghost'
                size='icon'
                className='size-8'
                onClick={() => setIsExpanded(true)}
              >
                <LuMaximize2 className='size-4' />
                <span className='sr-only'>Expand chart</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div ref={chartRef}>{children}</div>
        </CardContent>
      </Card>

      {/* Expanded view dialog */}
      <ChartExpandDialog
        open={isExpanded}
        onOpenChange={setIsExpanded}
        title={title}
        description={description}
      >
        {expandedContent ?? children}
      </ChartExpandDialog>

      {/* Drill-down sheet */}
      <ChartDrillDown
        open={isDrillDownOpen}
        onOpenChange={handleDrillDownOpenChange}
        data={drillDownData ?? null}
      />
    </>
  )
}

// Utility hook for chart click handlers
export function useChartDrillDown<T>() {
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null)

  const handleChartClick = useCallback(
    (
      payload: T,
      transformFn: (data: T) => DrillDownData
    ) => {
      const data = transformFn(payload)
      setDrillDownData(data)
    },
    []
  )

  const closeDrillDown = useCallback(() => {
    setDrillDownData(null)
  }, [])

  return {
    drillDownData,
    handleChartClick,
    closeDrillDown,
  }
}
