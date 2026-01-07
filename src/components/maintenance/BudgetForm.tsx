'use client'

import { useState, useMemo } from 'react'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-adapter'
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns'
import { LuLoader2 } from 'react-icons/lu'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Slider } from '~/components/ui/slider'
import { useToast } from '~/hooks/use-toast'

import { useCreateBudget, useUpdateBudget } from '~/services/maintenance-budget.query'
import { usePropertiesQuery } from '~/services/properties.query'
import { createBudgetSchema, updateBudgetSchema, type BudgetPeriod } from '~/services/maintenance-budget.schema'
import type { MaintenanceCategory } from '~/services/maintenance.schema'

const CATEGORIES: { value: MaintenanceCategory; label: string }[] = [
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'HVAC', label: 'HVAC' },
  { value: 'APPLIANCE', label: 'Appliance' },
  { value: 'STRUCTURAL', label: 'Structural' },
  { value: 'PEST_CONTROL', label: 'Pest Control' },
  { value: 'LANDSCAPING', label: 'Landscaping' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'PAINTING', label: 'Painting' },
  { value: 'FLOORING', label: 'Flooring' },
  { value: 'WINDOWS_DOORS', label: 'Windows/Doors' },
  { value: 'ROOF', label: 'Roof' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'OTHER', label: 'Other' },
]

const PERIODS: { value: BudgetPeriod; label: string }[] = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUAL', label: 'Annual' },
]

interface BudgetFormProps {
  budget?: {
    id: string
    propertyId: string
    category: MaintenanceCategory
    budgetAmount: number
    period: BudgetPeriod
    fiscalYear: number
    warningThreshold: number
    criticalThreshold: number
    notes?: string | null
  }
  defaultFiscalYear?: number
  onSuccess?: () => void
}

function calculatePeriodDates(period: BudgetPeriod, fiscalYear: number, quarterOrMonth?: number) {
  const year = fiscalYear

  switch (period) {
    case 'ANNUAL':
      return {
        startDate: startOfYear(new Date(year, 0, 1)),
        endDate: endOfYear(new Date(year, 0, 1)),
      }
    case 'QUARTERLY': {
      const quarter = quarterOrMonth ?? 1
      const startMonth = (quarter - 1) * 3
      return {
        startDate: startOfQuarter(new Date(year, startMonth, 1)),
        endDate: endOfQuarter(new Date(year, startMonth, 1)),
      }
    }
    case 'MONTHLY': {
      const month = quarterOrMonth ?? 0
      return {
        startDate: startOfMonth(new Date(year, month, 1)),
        endDate: endOfMonth(new Date(year, month, 1)),
      }
    }
    default:
      return {
        startDate: startOfYear(new Date(year, 0, 1)),
        endDate: endOfYear(new Date(year, 0, 1)),
      }
  }
}

export function BudgetForm({ budget, defaultFiscalYear, onSuccess }: BudgetFormProps) {
  const { toast } = useToast()
  const isEditing = !!budget

  const createBudget = useCreateBudget()
  const updateBudget = useUpdateBudget()

  const { data: properties } = usePropertiesQuery({})
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  const [selectedPeriod, setSelectedPeriod] = useState<BudgetPeriod>(budget?.period ?? 'ANNUAL')
  const [selectedYear, setSelectedYear] = useState(budget?.fiscalYear ?? defaultFiscalYear ?? currentYear)
  const [quarterOrMonth, setQuarterOrMonth] = useState(1)

  const form = useForm({
    defaultValues: {
      propertyId: budget?.propertyId ?? '',
      category: budget?.category ?? ('' as MaintenanceCategory),
      budgetAmount: budget?.budgetAmount ?? 0,
      period: budget?.period ?? ('ANNUAL' as BudgetPeriod),
      fiscalYear: budget?.fiscalYear ?? defaultFiscalYear ?? currentYear,
      warningThreshold: budget?.warningThreshold ?? 80,
      criticalThreshold: budget?.criticalThreshold ?? 95,
      notes: budget?.notes ?? '',
    },
    onSubmit: async ({ value }) => {
      try {
        const { startDate, endDate } = calculatePeriodDates(
          value.period,
          value.fiscalYear,
          quarterOrMonth
        )

        if (isEditing) {
          await updateBudget.mutateAsync({
            id: budget.id,
            budgetAmount: value.budgetAmount,
            warningThreshold: value.warningThreshold,
            criticalThreshold: value.criticalThreshold,
            notes: value.notes || undefined,
          })
          toast({
            title: 'Budget updated',
            description: 'The budget has been updated successfully.',
          })
        } else {
          await createBudget.mutateAsync({
            propertyId: value.propertyId,
            category: value.category,
            budgetAmount: value.budgetAmount,
            period: value.period,
            fiscalYear: value.fiscalYear,
            startDate,
            endDate,
            warningThreshold: value.warningThreshold,
            criticalThreshold: value.criticalThreshold,
            notes: value.notes || undefined,
          })
          toast({
            title: 'Budget created',
            description: 'The budget has been created successfully.',
          })
        }
        onSuccess?.()
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to save budget',
          variant: 'destructive',
        })
      }
    },
  })

  const isSubmitting = createBudget.isPending || updateBudget.isPending

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className='space-y-6'
    >
      {/* Property Selection */}
      {!isEditing && (
        <form.Field name='propertyId'>
          {(field) => (
            <div className='space-y-2'>
              <Label htmlFor={field.name}>Property</Label>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select a property' />
                </SelectTrigger>
                <SelectContent>
                  {properties?.properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.state.meta.errors.length > 0 && (
                <p className='text-sm text-destructive'>{field.state.meta.errors.join(', ')}</p>
              )}
            </div>
          )}
        </form.Field>
      )}

      {/* Category Selection */}
      {!isEditing && (
        <form.Field name='category'>
          {(field) => (
            <div className='space-y-2'>
              <Label htmlFor={field.name}>Category</Label>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v as MaintenanceCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select a category' />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.state.meta.errors.length > 0 && (
                <p className='text-sm text-destructive'>{field.state.meta.errors.join(', ')}</p>
              )}
            </div>
          )}
        </form.Field>
      )}

      {/* Period and Year Selection */}
      {!isEditing && (
        <div className='grid gap-4 sm:grid-cols-2'>
          <form.Field name='period'>
            {(field) => (
              <div className='space-y-2'>
                <Label htmlFor={field.name}>Budget Period</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(v) => {
                    field.handleChange(v as BudgetPeriod)
                    setSelectedPeriod(v as BudgetPeriod)
                    setQuarterOrMonth(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name='fiscalYear'>
            {(field) => (
              <div className='space-y-2'>
                <Label htmlFor={field.name}>Fiscal Year</Label>
                <Select
                  value={String(field.state.value)}
                  onValueChange={(v) => {
                    field.handleChange(Number(v))
                    setSelectedYear(Number(v))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>
        </div>
      )}

      {/* Quarter/Month selector for non-annual periods */}
      {!isEditing && selectedPeriod === 'QUARTERLY' && (
        <div className='space-y-2'>
          <Label>Quarter</Label>
          <Select
            value={String(quarterOrMonth)}
            onValueChange={(v) => setQuarterOrMonth(Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='1'>Q1 (Jan - Mar)</SelectItem>
              <SelectItem value='2'>Q2 (Apr - Jun)</SelectItem>
              <SelectItem value='3'>Q3 (Jul - Sep)</SelectItem>
              <SelectItem value='4'>Q4 (Oct - Dec)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {!isEditing && selectedPeriod === 'MONTHLY' && (
        <div className='space-y-2'>
          <Label>Month</Label>
          <Select
            value={String(quarterOrMonth)}
            onValueChange={(v) => setQuarterOrMonth(Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'].map((month, i) => (
                <SelectItem key={i} value={String(i)}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Budget Amount */}
      <form.Field name='budgetAmount'>
        {(field) => (
          <div className='space-y-2'>
            <Label htmlFor={field.name}>Budget Amount ($)</Label>
            <Input
              id={field.name}
              type='number'
              min={0}
              step={100}
              value={field.state.value || ''}
              onChange={(e) => field.handleChange(Number(e.target.value))}
              placeholder='0.00'
            />
            {field.state.meta.errors.length > 0 && (
              <p className='text-sm text-destructive'>{field.state.meta.errors.join(', ')}</p>
            )}
          </div>
        )}
      </form.Field>

      {/* Alert Thresholds */}
      <div className='space-y-4'>
        <Label>Alert Thresholds</Label>

        <form.Field name='warningThreshold'>
          {(field) => (
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Warning at</span>
                <span className='text-sm font-medium text-yellow-600'>{field.state.value}%</span>
              </div>
              <Slider
                value={[field.state.value]}
                onValueChange={([v]) => field.handleChange(v)}
                min={50}
                max={95}
                step={5}
                className='[&_[role=slider]]:bg-yellow-500'
              />
            </div>
          )}
        </form.Field>

        <form.Field name='criticalThreshold'>
          {(field) => (
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Critical at</span>
                <span className='text-sm font-medium text-orange-600'>{field.state.value}%</span>
              </div>
              <Slider
                value={[field.state.value]}
                onValueChange={([v]) => field.handleChange(v)}
                min={60}
                max={100}
                step={5}
                className='[&_[role=slider]]:bg-orange-500'
              />
            </div>
          )}
        </form.Field>
      </div>

      {/* Notes */}
      <form.Field name='notes'>
        {(field) => (
          <div className='space-y-2'>
            <Label htmlFor={field.name}>Notes (optional)</Label>
            <Textarea
              id={field.name}
              value={field.state.value || ''}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder='Add any notes about this budget...'
              rows={3}
            />
          </div>
        )}
      </form.Field>

      {/* Submit Button */}
      <div className='flex justify-end gap-3'>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting && <LuLoader2 className='mr-2 size-4 animate-spin' />}
          {isEditing ? 'Update Budget' : 'Create Budget'}
        </Button>
      </div>
    </form>
  )
}
