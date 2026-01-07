'use client'

import { useState, useCallback } from 'react'
import {
  LuCalendar,
  LuDollarSign,
  LuFileText,
  LuLoaderCircle,
  LuUpload,
  LuX,
} from 'react-icons/lu'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/libs/utils'
import { useCreateInvoiceMutation } from '~/services/invoices.query'
import { useVendorsQuery } from '~/services/vendors.query'

interface InvoiceUploadDialogProps {
  requestId: string
  children?: React.ReactNode
}

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

function validateInvoiceFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'File type not allowed. Use PDF, JPEG, PNG, GIF, or WebP.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
  }
  return null
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function InvoiceUploadDialog({
  requestId,
  children,
}: InvoiceUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Form state
  const [vendorId, setVendorId] = useState<string>('')
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [subtotal, setSubtotal] = useState('')
  const [taxAmount, setTaxAmount] = useState('0')

  const { data: vendorsData } = useVendorsQuery({ status: 'ACTIVE' })
  const createMutation = useCreateInvoiceMutation()

  const resetForm = useCallback(() => {
    setSelectedFile(null)
    setFileError(null)
    setVendorId('')
    setVendorInvoiceNumber('')
    setInvoiceDate(new Date().toISOString().split('T')[0])
    setDueDate('')
    setDescription('')
    setSubtotal('')
    setTaxAmount('0')
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    const error = validateInvoiceFile(file)
    if (error) {
      setFileError(error)
      setSelectedFile(null)
    } else {
      setFileError(null)
      setSelectedFile(file)
    }
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

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a file')
      return
    }

    const subtotalNum = parseFloat(subtotal)
    if (isNaN(subtotalNum) || subtotalNum <= 0) {
      toast.error('Please enter a valid subtotal amount')
      return
    }

    const taxNum = parseFloat(taxAmount) || 0

    try {
      setIsUploading(true)

      // For now, create a mock file URL - in production this would upload to Supabase
      // TODO: Implement actual file upload to Supabase Storage
      const mockFileUrl = `https://storage.example.com/invoices/${requestId}/${Date.now()}-${selectedFile.name}`

      await createMutation.mutateAsync({
        requestId,
        vendorId: vendorId || undefined,
        vendorInvoiceNumber: vendorInvoiceNumber || undefined,
        invoiceDate: new Date(invoiceDate),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        description: description || undefined,
        subtotal: subtotalNum,
        taxAmount: taxNum,
        fileUrl: mockFileUrl,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
      })

      toast.success('Invoice uploaded', {
        description: 'The invoice has been added as a draft.',
      })

      resetForm()
      setOpen(false)
    } catch (error) {
      toast.error('Upload failed', {
        description:
          error instanceof Error ? error.message : 'Failed to upload invoice',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const totalAmount = (parseFloat(subtotal) || 0) + (parseFloat(taxAmount) || 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <LuUpload className='mr-2 size-4' />
            Upload Invoice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Upload Invoice</DialogTitle>
          <DialogDescription>
            Upload a vendor invoice for this work order. You can submit it for
            approval after uploading.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* File Upload Area */}
          <div
            className={cn(
              'relative rounded-lg border-2 border-dashed p-6 text-center transition-colors',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50',
              fileError && 'border-destructive'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type='file'
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleInputChange}
              className='absolute inset-0 cursor-pointer opacity-0'
            />

            {selectedFile ? (
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <LuFileText className='size-8 text-primary' />
                  <div className='text-left'>
                    <p className='font-medium'>{selectedFile.name}</p>
                    <p className='text-sm text-muted-foreground'>
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                  }}
                >
                  <LuX className='size-4' />
                </Button>
              </div>
            ) : (
              <div>
                <LuUpload className='mx-auto size-8 text-muted-foreground' />
                <p className='mt-2 text-sm font-medium'>
                  Drop invoice here or click to browse
                </p>
                <p className='text-xs text-muted-foreground'>
                  PDF, JPEG, PNG up to 20MB
                </p>
              </div>
            )}
          </div>

          {fileError && (
            <p className='text-sm text-destructive'>{fileError}</p>
          )}

          {/* Vendor Selection */}
          <div className='space-y-2'>
            <Label>Vendor (optional)</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger>
                <SelectValue placeholder='Select vendor' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=''>No vendor</SelectItem>
                {vendorsData?.vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vendor Invoice Number */}
          <div className='space-y-2'>
            <Label>Vendor Invoice # (optional)</Label>
            <Input
              placeholder='e.g., INV-12345'
              value={vendorInvoiceNumber}
              onChange={(e) => setVendorInvoiceNumber(e.target.value)}
            />
          </div>

          {/* Dates */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Invoice Date</Label>
              <div className='relative'>
                <LuCalendar className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  type='date'
                  className='pl-9'
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label>Due Date (optional)</Label>
              <div className='relative'>
                <LuCalendar className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  type='date'
                  className='pl-9'
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Amounts */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Subtotal *</Label>
              <div className='relative'>
                <LuDollarSign className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  type='number'
                  placeholder='0.00'
                  className='pl-9'
                  step='0.01'
                  min='0'
                  value={subtotal}
                  onChange={(e) => setSubtotal(e.target.value)}
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label>Tax Amount</Label>
              <div className='relative'>
                <LuDollarSign className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  type='number'
                  placeholder='0.00'
                  className='pl-9'
                  step='0.01'
                  min='0'
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Total Display */}
          {subtotal && (
            <div className='rounded-lg bg-muted p-3'>
              <div className='flex justify-between text-sm'>
                <span>Subtotal</span>
                <span>${(parseFloat(subtotal) || 0).toFixed(2)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span>Tax</span>
                <span>${(parseFloat(taxAmount) || 0).toFixed(2)}</span>
              </div>
              <div className='mt-1 flex justify-between border-t pt-1 font-medium'>
                <span>Total</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Description */}
          <div className='space-y-2'>
            <Label>Description (optional)</Label>
            <Textarea
              placeholder='Brief description of invoice...'
              className='min-h-16'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => {
              resetForm()
              setOpen(false)
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || !subtotal || isUploading}
          >
            {isUploading ? (
              <LuLoaderCircle className='mr-2 size-4 animate-spin' />
            ) : (
              <LuUpload className='mr-2 size-4' />
            )}
            Upload Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
