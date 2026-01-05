import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  LuArrowLeft,
  LuArrowRight,
  LuCalendar,
  LuCheck,
  LuCircleCheck,
  LuClipboardCheck,
  LuDollarSign,
  LuFileText,
  LuLoaderCircle,
  LuMail,
  LuPlus,
  LuSend,
} from 'react-icons/lu'
import { toast } from 'sonner'

import { DamageComparison } from './damage-comparison'
import { AddDamageItemForm, DamageLineItem } from './damage-line-item'
import { DispositionCalculator, DispositionSummaryCard } from './disposition-calculator'
import { ComplianceWarnings } from './compliance-warnings'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Textarea } from '~/components/ui/textarea'
import {
  moveOutStatusQueryOptions,
  moveOutComparisonQueryOptions,
  useInitiateMoveOut,
  useCreateDamageItem,
  useUpdateDamageItem,
  useDeleteDamageItem,
  useCalculateDisposition,
  useSendDispositionLetter,
  useProcessRefund,
} from '~/services/move-out.query'
import type { SendMethod, RefundMethod } from '~/services/move-out.schema'

interface MoveOutWizardProps {
  leaseId: string
}

const STEPS = [
  { id: 'confirm', label: 'Confirm Move-Out', icon: LuCalendar },
  { id: 'inspection', label: 'Move-Out Inspection', icon: LuClipboardCheck },
  { id: 'damages', label: 'Record Damages', icon: LuFileText },
  { id: 'review', label: 'Review Calculation', icon: LuDollarSign },
  { id: 'send', label: 'Send Letter', icon: LuMail },
  { id: 'refund', label: 'Process Refund', icon: LuCheck },
]

export function MoveOutWizard({ leaseId }: MoveOutWizardProps) {
  const navigate = useNavigate()
  const { data: statusData, refetch: refetchStatus } = useSuspenseQuery(
    moveOutStatusQueryOptions(leaseId)
  )

  // Determine current step based on status
  const getInitialStep = () => {
    if (statusData.status === 'NOT_STARTED') return 0
    if (statusData.status === 'DRAFT') return 1
    if (statusData.status === 'PENDING_REVIEW') return 3
    if (statusData.status === 'SENT') return 5
    if (statusData.status === 'ACKNOWLEDGED') return 5
    return 0
  }

  const [currentStep, setCurrentStep] = useState(getInitialStep)

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1))
  const goPrev = () => setCurrentStep((s) => Math.max(s - 1, 0))

  return (
    <div className='space-y-6'>
      {/* Step Indicator */}
      <div className='flex items-center justify-between'>
        {STEPS.map((step, index) => {
          const Icon = step.icon
          const isActive = index === currentStep
          const isComplete = index < currentStep

          return (
            <div key={step.id} className='flex items-center'>
              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isComplete
                      ? 'bg-green-100 text-green-700'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isComplete ? (
                  <LuCircleCheck className='size-4' />
                ) : (
                  <Icon className='size-4' />
                )}
                <span className='hidden text-sm font-medium md:inline'>{step.label}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div className='mx-2 h-px w-8 bg-border' />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className='p-6'>
          {currentStep === 0 && (
            <ConfirmMoveOutStep
              leaseId={leaseId}
              lease={statusData.lease}
              onComplete={() => {
                refetchStatus()
                goNext()
              }}
            />
          )}
          {currentStep === 1 && (
            <InspectionStep
              leaseId={leaseId}
              disposition={statusData.disposition}
              onNext={goNext}
              onPrev={goPrev}
            />
          )}
          {currentStep === 2 && (
            <DamagesStep
              leaseId={leaseId}
              disposition={statusData.disposition}
              damageItems={statusData.damageItems || []}
              onNext={goNext}
              onPrev={goPrev}
              onRefresh={refetchStatus}
            />
          )}
          {currentStep === 3 && (
            <ReviewStep
              leaseId={leaseId}
              disposition={statusData.disposition}
              damageItems={statusData.damageItems || []}
              onNext={goNext}
              onPrev={goPrev}
            />
          )}
          {currentStep === 4 && (
            <SendLetterStep
              leaseId={leaseId}
              disposition={statusData.disposition}
              onNext={() => {
                refetchStatus()
                goNext()
              }}
              onPrev={goPrev}
            />
          )}
          {currentStep === 5 && (
            <ProcessRefundStep
              leaseId={leaseId}
              disposition={statusData.disposition}
              onComplete={() => {
                toast.success('Move-out process completed!')
                navigate({ to: '/app/leases' })
              }}
              onPrev={goPrev}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// Step 1: Confirm Move-Out
// =============================================================================

interface ConfirmMoveOutStepProps {
  leaseId: string
  lease: any
  onComplete: () => void
}

function ConfirmMoveOutStep({ leaseId, lease, onComplete }: ConfirmMoveOutStepProps) {
  const [moveOutDate, setMoveOutDate] = useState(
    lease?.moveOutDate
      ? format(new Date(lease.moveOutDate), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd')
  )
  const initiateMoveOut = useInitiateMoveOut()

  const handleConfirm = async () => {
    try {
      await initiateMoveOut.mutateAsync({
        leaseId,
        moveOutDate: new Date(moveOutDate),
      })
      toast.success('Move-out process initiated')
      onComplete()
    } catch (error) {
      toast.error('Failed to initiate move-out')
    }
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold'>Confirm Move-Out Date</h3>
        <p className='text-muted-foreground'>
          Confirm the tenant's move-out date to begin the deposit disposition process.
        </p>
      </div>

      {lease && (
        <div className='rounded-lg bg-muted/50 p-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div>
              <div className='text-sm text-muted-foreground'>Tenant</div>
              <div className='font-medium'>
                {lease.tenant?.firstName} {lease.tenant?.lastName}
              </div>
            </div>
            <div>
              <div className='text-sm text-muted-foreground'>Property</div>
              <div className='font-medium'>
                {lease.unit?.property?.name} - Unit {lease.unit?.unitNumber}
              </div>
            </div>
            <div>
              <div className='text-sm text-muted-foreground'>Lease End Date</div>
              <div className='font-medium'>
                {format(new Date(lease.endDate), 'MMMM d, yyyy')}
              </div>
            </div>
            <div>
              <div className='text-sm text-muted-foreground'>Security Deposit</div>
              <div className='font-medium'>${Number(lease.securityDeposit).toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      <div className='space-y-2'>
        <Label htmlFor='moveOutDate'>Move-Out Date</Label>
        <Input
          id='moveOutDate'
          type='date'
          value={moveOutDate}
          onChange={(e) => setMoveOutDate(e.target.value)}
        />
        <p className='text-sm text-muted-foreground'>
          The 21-day deadline for deposit disposition will be calculated from this date.
        </p>
      </div>

      <div className='flex justify-end'>
        <Button onClick={handleConfirm} disabled={initiateMoveOut.isPending}>
          {initiateMoveOut.isPending ? (
            <LuLoaderCircle className='mr-2 size-4 animate-spin' />
          ) : (
            <LuArrowRight className='mr-2 size-4' />
          )}
          Confirm & Continue
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// Step 2: Inspection
// =============================================================================

interface InspectionStepProps {
  leaseId: string
  disposition: any
  onNext: () => void
  onPrev: () => void
}

function InspectionStep({ leaseId, disposition, onNext, onPrev }: InspectionStepProps) {
  const navigate = useNavigate()

  const hasMoveOutInspection = !!disposition?.moveOutInspectionId

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold'>Move-Out Inspection</h3>
        <p className='text-muted-foreground'>
          Conduct or link a move-out inspection to document the property condition.
        </p>
      </div>

      {hasMoveOutInspection ? (
        <Card className='border-green-300 bg-green-50/50'>
          <CardContent className='flex items-center gap-4 p-4'>
            <LuCircleCheck className='size-8 text-green-600' />
            <div>
              <p className='font-medium text-green-800'>Move-Out Inspection Completed</p>
              <p className='text-sm text-green-600'>
                The inspection has been linked to this move-out process.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-medium'>No Move-Out Inspection Yet</p>
                  <p className='text-sm text-muted-foreground'>
                    Create a new inspection to document the property condition at move-out.
                  </p>
                </div>
                <Button
                  onClick={() =>
                    navigate({
                      to: '/app/inspections/new',
                      search: { type: 'MOVE_OUT' },
                    })
                  }
                >
                  <LuPlus className='mr-2 size-4' />
                  Create Inspection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <ComplianceWarnings
        deadlineDate={new Date(disposition?.deadlineDate || Date.now())}
        sentDate={disposition?.sentDate}
        bankName={disposition?.bankName}
        accountLast4={disposition?.accountLast4}
      />

      <div className='flex justify-between'>
        <Button variant='outline' onClick={onPrev}>
          <LuArrowLeft className='mr-2 size-4' />
          Back
        </Button>
        <Button onClick={onNext} disabled={!hasMoveOutInspection}>
          <LuArrowRight className='mr-2 size-4' />
          {hasMoveOutInspection ? 'Continue' : 'Complete Inspection First'}
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// Step 3: Record Damages
// =============================================================================

interface DamagesStepProps {
  leaseId: string
  disposition: any
  damageItems: any[]
  onNext: () => void
  onPrev: () => void
  onRefresh: () => void
}

function DamagesStep({
  leaseId,
  disposition,
  damageItems,
  onNext,
  onPrev,
  onRefresh,
}: DamagesStepProps) {
  const [showAddForm, setShowAddForm] = useState(false)

  const { data: comparisonData } = useSuspenseQuery(moveOutComparisonQueryOptions(leaseId))

  const createDamageItem = useCreateDamageItem()
  const updateDamageItem = useUpdateDamageItem()
  const deleteDamageItem = useDeleteDamageItem()

  const handleAddDamage = async (data: any) => {
    if (!disposition?.moveOutInspectionId) return

    try {
      await createDamageItem.mutateAsync({
        inspectionId: disposition.moveOutInspectionId,
        ...data,
      })
      toast.success('Damage item added')
      setShowAddForm(false)
      onRefresh()
    } catch (error) {
      toast.error('Failed to add damage item')
    }
  }

  const handleUpdateDamage = async (id: string, data: any) => {
    try {
      await updateDamageItem.mutateAsync({ id, ...data })
      toast.success('Damage item updated')
      onRefresh()
    } catch (error) {
      toast.error('Failed to update damage item')
    }
  }

  const handleDeleteDamage = async (id: string) => {
    try {
      await deleteDamageItem.mutateAsync(id)
      toast.success('Damage item removed')
      onRefresh()
    } catch (error) {
      toast.error('Failed to remove damage item')
    }
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold'>Record Damages</h3>
        <p className='text-muted-foreground'>
          Compare move-in and move-out conditions, and record any damages for deduction.
        </p>
      </div>

      {/* Comparison */}
      {comparisonData && !comparisonData.missingMoveIn && !comparisonData.missingMoveOut && (
        <div className='space-y-4'>
          <h4 className='font-medium'>Condition Comparison</h4>
          <DamageComparison
            comparison={comparisonData.comparison}
            onAddDamage={(item) => {
              setShowAddForm(true)
            }}
          />
        </div>
      )}

      <Separator />

      {/* Damage Items */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h4 className='font-medium'>Damage Deductions</h4>
          {!showAddForm && (
            <Button variant='outline' onClick={() => setShowAddForm(true)}>
              <LuPlus className='mr-2 size-4' />
              Add Damage
            </Button>
          )}
        </div>

        {showAddForm && (
          <AddDamageItemForm
            onAdd={handleAddDamage}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {damageItems.length === 0 && !showAddForm ? (
          <Card className='border-dashed'>
            <CardContent className='flex flex-col items-center justify-center py-8'>
              <p className='text-muted-foreground'>No damage items recorded</p>
              <p className='text-sm text-muted-foreground'>
                Full deposit will be returned if no damages are added.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-3'>
            {damageItems.map((item) => (
              <DamageLineItem
                key={item.id}
                item={item}
                onUpdate={handleUpdateDamage}
                onDelete={handleDeleteDamage}
              />
            ))}
          </div>
        )}
      </div>

      <div className='flex justify-between'>
        <Button variant='outline' onClick={onPrev}>
          <LuArrowLeft className='mr-2 size-4' />
          Back
        </Button>
        <Button onClick={onNext}>
          <LuArrowRight className='mr-2 size-4' />
          Review Calculation
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// Step 4: Review Calculation
// =============================================================================

interface ReviewStepProps {
  leaseId: string
  disposition: any
  damageItems: any[]
  onNext: () => void
  onPrev: () => void
}

function ReviewStep({ leaseId, disposition, damageItems, onNext, onPrev }: ReviewStepProps) {
  const calculateDisposition = useCalculateDisposition()

  const handleRecalculate = async () => {
    try {
      await calculateDisposition.mutateAsync(leaseId)
      toast.success('Calculation updated')
    } catch (error) {
      toast.error('Failed to recalculate')
    }
  }

  const deductions = damageItems.map((item) => ({
    description: item.description,
    amount: Number(item.repairCost),
    isNormalWear: item.isNormalWear,
    isPreExisting: item.isPreExisting,
  }))

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold'>Review Deposit Disposition</h3>
          <p className='text-muted-foreground'>
            Review the calculated amounts before generating the disposition letter.
          </p>
        </div>
        <Button variant='outline' onClick={handleRecalculate} disabled={calculateDisposition.isPending}>
          {calculateDisposition.isPending ? (
            <LuLoaderCircle className='mr-2 size-4 animate-spin' />
          ) : null}
          Recalculate
        </Button>
      </div>

      <DispositionCalculator
        originalDeposit={Number(disposition?.originalDeposit || 0)}
        interestAccrued={Number(disposition?.interestAccrued || 0)}
        deductions={deductions}
      />

      <ComplianceWarnings
        deadlineDate={new Date(disposition?.deadlineDate || Date.now())}
        sentDate={disposition?.sentDate}
        bankName={disposition?.bankName}
        accountLast4={disposition?.accountLast4}
        itemizedDeductions={disposition?.itemizedDeductions}
      />

      <div className='flex justify-between'>
        <Button variant='outline' onClick={onPrev}>
          <LuArrowLeft className='mr-2 size-4' />
          Back
        </Button>
        <Button onClick={onNext}>
          <LuArrowRight className='mr-2 size-4' />
          Prepare Letter
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// Step 5: Send Letter
// =============================================================================

interface SendLetterStepProps {
  leaseId: string
  disposition: any
  onNext: () => void
  onPrev: () => void
}

function SendLetterStep({ leaseId, disposition, onNext, onPrev }: SendLetterStepProps) {
  const [method, setMethod] = useState<SendMethod>('CERTIFIED_MAIL')
  const [trackingNumber, setTrackingNumber] = useState('')

  const sendLetter = useSendDispositionLetter()

  const handleSend = async () => {
    try {
      await sendLetter.mutateAsync({
        leaseId,
        method,
        trackingNumber: trackingNumber || undefined,
      })
      toast.success('Disposition letter sent')
      onNext()
    } catch (error) {
      toast.error('Failed to send letter')
    }
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold'>Send Disposition Letter</h3>
        <p className='text-muted-foreground'>
          Generate and send the deposit disposition letter to the tenant.
        </p>
      </div>

      <DispositionSummaryCard
        originalDeposit={Number(disposition?.originalDeposit || 0)}
        interestAccrued={Number(disposition?.interestAccrued || 0)}
        totalDeductions={Number(disposition?.totalDeductions || 0)}
        refundAmount={Number(disposition?.refundAmount || 0)}
      />

      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='method'>Delivery Method</Label>
          <Select value={method} onValueChange={(v) => setMethod(v as SendMethod)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='CERTIFIED_MAIL'>Certified Mail (Recommended)</SelectItem>
              <SelectItem value='REGULAR_MAIL'>Regular Mail</SelectItem>
              <SelectItem value='EMAIL'>Email</SelectItem>
              <SelectItem value='HAND_DELIVERED'>Hand Delivered</SelectItem>
            </SelectContent>
          </Select>
          <p className='text-sm text-muted-foreground'>
            Certified mail provides proof of delivery for legal compliance.
          </p>
        </div>

        {(method === 'CERTIFIED_MAIL' || method === 'REGULAR_MAIL') && (
          <div className='space-y-2'>
            <Label htmlFor='tracking'>Tracking Number (Optional)</Label>
            <Input
              id='tracking'
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder='Enter tracking number after mailing'
            />
          </div>
        )}
      </div>

      <ComplianceWarnings
        deadlineDate={new Date(disposition?.deadlineDate || Date.now())}
        sentDate={disposition?.sentDate}
        bankName={disposition?.bankName}
        accountLast4={disposition?.accountLast4}
      />

      <div className='flex justify-between'>
        <Button variant='outline' onClick={onPrev}>
          <LuArrowLeft className='mr-2 size-4' />
          Back
        </Button>
        <Button onClick={handleSend} disabled={sendLetter.isPending}>
          {sendLetter.isPending ? (
            <LuLoaderCircle className='mr-2 size-4 animate-spin' />
          ) : (
            <LuSend className='mr-2 size-4' />
          )}
          Send Letter
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// Step 6: Process Refund
// =============================================================================

interface ProcessRefundStepProps {
  leaseId: string
  disposition: any
  onComplete: () => void
  onPrev: () => void
}

function ProcessRefundStep({ leaseId, disposition, onComplete, onPrev }: ProcessRefundStepProps) {
  const [method, setMethod] = useState<RefundMethod>('CHECK')
  const [checkNumber, setCheckNumber] = useState('')
  const [amount, setAmount] = useState(Number(disposition?.refundAmount || 0))

  const processRefund = useProcessRefund()

  const handleProcess = async () => {
    try {
      await processRefund.mutateAsync({
        leaseId,
        method,
        checkNumber: checkNumber || undefined,
        amount,
      })
      onComplete()
    } catch (error) {
      toast.error('Failed to process refund')
    }
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold'>Process Refund</h3>
        <p className='text-muted-foreground'>
          Record the refund payment to complete the move-out process.
        </p>
      </div>

      <Card className='border-green-300 bg-green-50/50'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-green-600'>Amount to Refund</p>
              <p className='text-2xl font-bold text-green-700'>
                ${Number(disposition?.refundAmount || 0).toFixed(2)}
              </p>
            </div>
            <LuCircleCheck className='size-8 text-green-600' />
          </div>
        </CardContent>
      </Card>

      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='refundMethod'>Payment Method</Label>
          <Select value={method} onValueChange={(v) => setMethod(v as RefundMethod)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='CHECK'>Check</SelectItem>
              <SelectItem value='ACH'>ACH Transfer</SelectItem>
              <SelectItem value='CASH'>Cash</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {method === 'CHECK' && (
          <div className='space-y-2'>
            <Label htmlFor='checkNumber'>Check Number</Label>
            <Input
              id='checkNumber'
              value={checkNumber}
              onChange={(e) => setCheckNumber(e.target.value)}
              placeholder='Enter check number'
            />
          </div>
        )}

        <div className='space-y-2'>
          <Label htmlFor='amount'>Refund Amount</Label>
          <Input
            id='amount'
            type='number'
            min='0'
            step='0.01'
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className='flex justify-between'>
        <Button variant='outline' onClick={onPrev}>
          <LuArrowLeft className='mr-2 size-4' />
          Back
        </Button>
        <Button onClick={handleProcess} disabled={processRefund.isPending}>
          {processRefund.isPending ? (
            <LuLoaderCircle className='mr-2 size-4 animate-spin' />
          ) : (
            <LuCheck className='mr-2 size-4' />
          )}
          Complete Move-Out
        </Button>
      </div>
    </div>
  )
}
