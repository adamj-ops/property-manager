'use client'

import { useState } from 'react'
import { LuLoaderCircle, LuPlus } from 'react-icons/lu'
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
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { useCreateCostLineItemMutation } from '~/services/cost-line-items.query'
import {
  costLineItemTypeEnum,
  costLineItemTypeLabels,
  costLineItemTypeIcons,
  type CostLineItemType,
} from '~/services/cost-line-items.schema'

interface AddCostLineItemDialogProps {
  requestId: string
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function AddCostLineItemDialog({
  requestId,
  trigger,
  onSuccess,
}: AddCostLineItemDialogProps) {
  const [open, setOpen] = useState(false)

  // Form state
  const [type, setType] = useState<CostLineItemType>('LABOR')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitCost, setUnitCost] = useState('')

  // Parts fields
  const [partNumber, setPartNumber] = useState('')
  const [supplier, setSupplier] = useState('')
  const [warranty, setWarranty] = useState(false)
  const [warrantyExpiry, setWarrantyExpiry] = useState('')

  // Labor fields
  const [laborHours, setLaborHours] = useState('')
  const [laborRate, setLaborRate] = useState('')
  const [workerId, setWorkerId] = useState('')

  // Tenant billing
  const [chargeToTenant, setChargeToTenant] = useState(false)
  const [tenantChargeAmount, setTenantChargeAmount] = useState('')

  const createMutation = useCreateCostLineItemMutation()

  const resetForm = () => {
    setType('LABOR')
    setDescription('')
    setQuantity('1')
    setUnitCost('')
    setPartNumber('')
    setSupplier('')
    setWarranty(false)
    setWarrantyExpiry('')
    setLaborHours('')
    setLaborRate('')
    setWorkerId('')
    setChargeToTenant(false)
    setTenantChargeAmount('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!description.trim()) {
      toast.error('Description is required')
      return
    }

    const qty = parseFloat(quantity) || 1
    const cost = parseFloat(unitCost) || 0

    if (cost <= 0) {
      toast.error('Unit cost must be greater than 0')
      return
    }

    try {
      await createMutation.mutateAsync({
        requestId,
        type,
        description: description.trim(),
        quantity: qty,
        unitCost: cost,
        partNumber: partNumber.trim() || undefined,
        supplier: supplier.trim() || undefined,
        warranty,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
        laborHours: laborHours ? parseFloat(laborHours) : undefined,
        laborRate: laborRate ? parseFloat(laborRate) : undefined,
        workerId: workerId.trim() || undefined,
        chargeToTenant,
        tenantChargeAmount: chargeToTenant && tenantChargeAmount
          ? parseFloat(tenantChargeAmount)
          : undefined,
      })

      toast.success('Cost item added', {
        description: `${costLineItemTypeLabels[type]} item added successfully`,
      })

      resetForm()
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      toast.error('Failed to add cost item', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    }
  }

  // Calculate total for display
  const calculatedTotal = (parseFloat(quantity) || 0) * (parseFloat(unitCost) || 0)

  // Show labor fields for labor type
  const showLaborFields = type === 'LABOR' || type === 'SUBCONTRACTOR'
  // Show parts fields for parts/materials types
  const showPartsFields = type === 'PARTS' || type === 'MATERIALS'

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) resetForm()
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button size='sm'>
            <LuPlus className='mr-2 size-4' />
            Add Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Add Cost Item</DialogTitle>
          <DialogDescription>
            Add a labor, parts, or other cost to this work order.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-4'>
          {/* Type Selection */}
          <div className='space-y-2'>
            <Label htmlFor='type'>Type *</Label>
            <Select value={type} onValueChange={(v) => setType(v as CostLineItemType)}>
              <SelectTrigger id='type'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {costLineItemTypeEnum.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    <span className='flex items-center gap-2'>
                      <span>{costLineItemTypeIcons[option]}</span>
                      <span>{costLineItemTypeLabels[option]}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label htmlFor='description'>Description *</Label>
            <Textarea
              id='description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Describe the cost item...'
              rows={2}
            />
          </div>

          {/* Quantity and Unit Cost */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='quantity'>Quantity</Label>
              <Input
                id='quantity'
                type='number'
                min='0.01'
                step='0.01'
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='unitCost'>Unit Cost ($) *</Label>
              <Input
                id='unitCost'
                type='number'
                min='0'
                step='0.01'
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder='0.00'
              />
            </div>
          </div>

          {/* Calculated Total */}
          {calculatedTotal > 0 && (
            <div className='rounded-lg bg-muted p-3'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted-foreground'>Total</span>
                <span className='text-lg font-semibold'>
                  ${calculatedTotal.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Labor-specific fields */}
          {showLaborFields && (
            <div className='space-y-4 rounded-lg border p-4'>
              <h4 className='text-sm font-medium'>Labor Details</h4>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='laborHours'>Hours</Label>
                  <Input
                    id='laborHours'
                    type='number'
                    min='0'
                    step='0.25'
                    value={laborHours}
                    onChange={(e) => setLaborHours(e.target.value)}
                    placeholder='0'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='laborRate'>Rate ($/hr)</Label>
                  <Input
                    id='laborRate'
                    type='number'
                    min='0'
                    step='0.01'
                    value={laborRate}
                    onChange={(e) => setLaborRate(e.target.value)}
                    placeholder='0.00'
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='workerId'>Worker/Technician</Label>
                <Input
                  id='workerId'
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value)}
                  placeholder='Name or ID'
                />
              </div>
            </div>
          )}

          {/* Parts-specific fields */}
          {showPartsFields && (
            <div className='space-y-4 rounded-lg border p-4'>
              <h4 className='text-sm font-medium'>Parts Details</h4>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='partNumber'>Part Number</Label>
                  <Input
                    id='partNumber'
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                    placeholder='SKU or part #'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='supplier'>Supplier</Label>
                  <Input
                    id='supplier'
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder='Store or vendor'
                  />
                </div>
              </div>
              <div className='flex items-center space-x-4'>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='warranty'
                    checked={warranty}
                    onCheckedChange={(checked) => setWarranty(checked === true)}
                  />
                  <Label htmlFor='warranty' className='text-sm'>
                    Has warranty
                  </Label>
                </div>
                {warranty && (
                  <div className='flex-1 space-y-2'>
                    <Input
                      type='date'
                      value={warrantyExpiry}
                      onChange={(e) => setWarrantyExpiry(e.target.value)}
                      placeholder='Expiry date'
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tenant Billing */}
          <div className='space-y-4 rounded-lg border p-4'>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='chargeToTenant'
                checked={chargeToTenant}
                onCheckedChange={(checked) => setChargeToTenant(checked === true)}
              />
              <Label htmlFor='chargeToTenant' className='text-sm'>
                Charge to tenant
              </Label>
            </div>
            {chargeToTenant && (
              <div className='space-y-2'>
                <Label htmlFor='tenantChargeAmount'>Charge Amount ($)</Label>
                <Input
                  id='tenantChargeAmount'
                  type='number'
                  min='0'
                  step='0.01'
                  value={tenantChargeAmount}
                  onChange={(e) => setTenantChargeAmount(e.target.value)}
                  placeholder={calculatedTotal > 0 ? calculatedTotal.toFixed(2) : '0.00'}
                />
                <p className='text-xs text-muted-foreground'>
                  Leave blank to charge the full amount
                </p>
              </div>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <LuLoaderCircle className='mr-2 size-4 animate-spin' />
            ) : (
              <LuPlus className='mr-2 size-4' />
            )}
            Add Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
