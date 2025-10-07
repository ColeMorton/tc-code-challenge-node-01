/**
 * Bill Stage Configuration
 * 
 * Centralized configuration for bill stages with Tailwind CSS classes.
 * This replaces database-stored colors for better performance and maintainability.
 */

/**
 * Bill stage definitions with TypeScript constants
 */
export const BILL_STAGE = {
  DRAFT: {
    label: 'Draft',
    colorClass: 'bg-gray-400',
    textClass: 'text-white'
  },
  SUBMITTED: {
    label: 'Submitted', 
    colorClass: 'bg-blue-500',
    textClass: 'text-white'
  },
  APPROVED: {
    label: 'Approved',
    colorClass: 'bg-green-500', 
    textClass: 'text-white'
  },
  PAYING: {
    label: 'Paying',
    colorClass: 'bg-yellow-500',
    textClass: 'text-white'
  },
  ON_HOLD: {
    label: 'On Hold',
    colorClass: 'bg-red-500',
    textClass: 'text-white'
  },
  REJECTED: {
    label: 'Rejected',
    colorClass: 'bg-red-600',
    textClass: 'text-white'
  },
  PAID: {
    label: 'Paid',
    colorClass: 'bg-green-600',
    textClass: 'text-white'
  }
} as const


/**
 * Stage order for dashboard display
 */
export const STAGE_ORDER = [
  BILL_STAGE.DRAFT.label,
  BILL_STAGE.SUBMITTED.label, 
  BILL_STAGE.APPROVED.label,
  BILL_STAGE.PAYING.label,
  BILL_STAGE.ON_HOLD.label,
  BILL_STAGE.REJECTED.label,
  BILL_STAGE.PAID.label
] as const

/**
 * Get stage configuration by label
 */
export function getStageConfig(stageLabel: string) {
  const stageKey = Object.keys(BILL_STAGE).find(
    key => BILL_STAGE[key as keyof typeof BILL_STAGE].label === stageLabel
  ) as keyof typeof BILL_STAGE | undefined
  
  if (!stageKey) {
    // Fallback to gray for unknown stages
    return {
      label: stageLabel,
      colorClass: 'bg-gray-400',
      textClass: 'text-white'
    }
  }
  
  return BILL_STAGE[stageKey]
}

/**
 * Get all stage labels
 */
export function getAllStageLabels(): string[] {
  return Object.values(BILL_STAGE).map(stage => stage.label)
}

/**
 * Type for stage configuration
 */
export type BillStageConfig = {
  label: string
  colorClass: string
  textClass: string
}

/**
 * TypeScript type for bill stage keys
 */
export type BillStageKey = keyof typeof BILL_STAGE

/**
 * TypeScript type for bill stage labels
 */
export type BillStageLabel = typeof BILL_STAGE[BillStageKey]['label']

/**
 * TypeScript type for bill stage values
 */
export type BillStageValue = typeof BILL_STAGE[BillStageKey]
