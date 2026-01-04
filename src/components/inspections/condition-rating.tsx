import { cx } from '~/libs/utils'
import type { Condition } from '~/services/inspections.schema'

interface ConditionRatingProps {
  value: Condition
  onChange?: (value: Condition) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const CONDITIONS: { value: Condition; label: string; color: string; bgColor: string }[] = [
  { value: 'NEW', label: 'New', color: 'text-emerald-700', bgColor: 'bg-emerald-100 border-emerald-300' },
  { value: 'GOOD', label: 'Good', color: 'text-green-700', bgColor: 'bg-green-100 border-green-300' },
  { value: 'FAIR', label: 'Fair', color: 'text-yellow-700', bgColor: 'bg-yellow-100 border-yellow-300' },
  { value: 'POOR', label: 'Poor', color: 'text-orange-700', bgColor: 'bg-orange-100 border-orange-300' },
  { value: 'DAMAGED', label: 'Damaged', color: 'text-red-700', bgColor: 'bg-red-100 border-red-300' },
]

export function ConditionRating({ value, onChange, disabled, size = 'md' }: ConditionRatingProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <div className='flex flex-wrap gap-1'>
      {CONDITIONS.map((condition) => {
        const isSelected = value === condition.value
        return (
          <button
            key={condition.value}
            type='button'
            disabled={disabled}
            onClick={() => onChange?.(condition.value)}
            className={cx(
              'rounded-md border font-medium transition-all',
              sizeClasses[size],
              isSelected
                ? `${condition.bgColor} ${condition.color}`
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {condition.label}
          </button>
        )
      })}
    </div>
  )
}

interface ConditionBadgeProps {
  condition: string
  size?: 'sm' | 'md'
}

export function ConditionBadge({ condition, size = 'md' }: ConditionBadgeProps) {
  const conditionConfig = CONDITIONS.find((c) => c.value === condition) || CONDITIONS[2]

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }

  return (
    <span
      className={cx(
        'inline-flex items-center rounded-md border font-medium',
        sizeClasses[size],
        conditionConfig.bgColor,
        conditionConfig.color
      )}
    >
      {conditionConfig.label}
    </span>
  )
}
