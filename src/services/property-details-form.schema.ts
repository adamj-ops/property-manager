import { z } from 'zod'

// =============================================================================
// PROPERTY DETAILS FORM SCHEMA
// =============================================================================
// Comprehensive Zod schema with validation for the PropertyDetailsForm.
// Includes address, property type, specs, and financial fields with
// user-friendly error messages.
//
// Usage with TanStack Form:
//   import { propertyDetailsFormSchema, type PropertyDetailsFormData } from '~/services/property-details-form.schema'
//   const form = useForm(propertyDetailsFormSchema, { defaultValues: propertyDetailsFormDefaults })
// =============================================================================

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const CURRENT_YEAR = new Date().getFullYear()
const MIN_YEAR_BUILT = 1800
const MIN_SQFT = 100
const MAX_SQFT = 100000
const MIN_BEDROOMS = 1
const MAX_BEDROOMS = 10
const MIN_BATHROOMS = 1
const MAX_BATHROOMS = 8
const BATHROOM_INCREMENT = 0.5

// US State codes for validation
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'PR', 'VI', 'GU', 'AS', 'MP',
] as const

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------

/**
 * Property type enum matching database schema.
 * Used for categorizing properties by their structural type.
 */
export const propertyTypeEnum = z.enum([
  'SINGLE_FAMILY',
  'MULTI_FAMILY',
  'APARTMENT',
  'CONDO',
  'TOWNHOUSE',
  'COMMERCIAL',
  'MIXED_USE',
], {
  required_error: 'Property type is required',
  invalid_type_error: 'Please select a valid property type',
})

/**
 * Property status enum matching database schema.
 */
export const propertyStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'UNDER_RENOVATION',
  'FOR_SALE',
], {
  required_error: 'Property status is required',
  invalid_type_error: 'Please select a valid property status',
})

/**
 * Financing type enum for the financing details section.
 */
export const financingTypeEnum = z.enum([
  'CONVENTIONAL',
  'FHA',
  'VA',
  'USDA',
  'HARD_MONEY',
  'PRIVATE',
  'SELLER_FINANCING',
  'CASH',
  'OTHER',
], {
  required_error: 'Financing type is required when financing is used',
  invalid_type_error: 'Please select a valid financing type',
})

// -----------------------------------------------------------------------------
// Address Schema
// -----------------------------------------------------------------------------

/**
 * Address schema with validation for street, city, state, and zip.
 * All address fields except addressLine2 are required.
 */
export const addressSchema = z.object({
  /** Street address (required) */
  addressLine1: z
    .string({
      required_error: 'Street address is required',
    })
    .min(1, 'Street address is required')
    .max(200, 'Street address must be less than 200 characters')
    .trim(),

  /** Apartment, suite, or unit number (optional) */
  addressLine2: z
    .string()
    .max(100, 'Address line 2 must be less than 100 characters')
    .trim()
    .optional(),

  /** City name (required) */
  city: z
    .string({
      required_error: 'City is required',
    })
    .min(1, 'City is required')
    .max(100, 'City name must be less than 100 characters')
    .trim(),

  /** State code - 2 letter abbreviation (required, defaults to MN) */
  state: z
    .string({
      required_error: 'State is required',
    })
    .length(2, 'Please enter a valid 2-letter state code')
    .toUpperCase()
    .refine(
      (val: string) => US_STATES.includes(val as typeof US_STATES[number]),
      'Please enter a valid US state code',
    )
    .default('MN'),

  /** ZIP code - 5 digits or ZIP+4 format (required) */
  zipCode: z
    .string({
      required_error: 'ZIP code is required',
    })
    .min(5, 'ZIP code must be at least 5 digits')
    .max(10, 'ZIP code must be no more than 10 characters')
    .regex(
      /^\d{5}(-\d{4})?$/,
      'Please enter a valid ZIP code (e.g., 55401 or 55401-1234)',
    ),

  /** Country code (defaults to US) */
  country: z
    .string()
    .length(2, 'Please enter a valid 2-letter country code')
    .toUpperCase()
    .default('US'),

  /** Latitude for map coordinates (optional) */
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),

  /** Longitude for map coordinates (optional) */
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional(),
})

// -----------------------------------------------------------------------------
// Property Specs Schema
// -----------------------------------------------------------------------------

/**
 * Property specifications schema including square footage, bedrooms, bathrooms, and year built.
 * Validates reasonable ranges for all numeric fields.
 */
export const propertySpecsSchema = z.object({
  /** Total square footage of the property */
  squareFootage: z
    .number({
      required_error: 'Square footage is required',
      invalid_type_error: 'Square footage must be a number',
    })
    .int('Square footage must be a whole number')
    .min(MIN_SQFT, `Square footage must be at least ${MIN_SQFT} sq ft`)
    .max(MAX_SQFT, `Square footage cannot exceed ${MAX_SQFT.toLocaleString()} sq ft`),

  /** Number of bedrooms (whole numbers, 1-10 range) */
  bedrooms: z
    .number({
      required_error: 'Number of bedrooms is required',
      invalid_type_error: 'Bedrooms must be a number',
    })
    .int('Bedrooms must be a whole number')
    .min(MIN_BEDROOMS, `Must have at least ${MIN_BEDROOMS} bedroom`)
    .max(MAX_BEDROOMS, `Cannot exceed ${MAX_BEDROOMS} bedrooms`),

  /** Number of bathrooms (allows .5 increments for half baths, 1-8 range) */
  bathrooms: z
    .number({
      required_error: 'Number of bathrooms is required',
      invalid_type_error: 'Bathrooms must be a number',
    })
    .min(MIN_BATHROOMS, `Must have at least ${MIN_BATHROOMS} bathroom`)
    .max(MAX_BATHROOMS, `Cannot exceed ${MAX_BATHROOMS} bathrooms`)
    .refine(
      (val: number) => val % BATHROOM_INCREMENT === 0,
      'Bathrooms must be in increments of 0.5 (e.g., 1, 1.5, 2, 2.5)',
    ),

  /** Year the property was built (4-digit year, 1800 to current year) */
  yearBuilt: z
    .number({
      required_error: 'Year built is required',
      invalid_type_error: 'Year built must be a number',
    })
    .int('Year must be a whole number')
    .min(MIN_YEAR_BUILT, `Year built cannot be before ${MIN_YEAR_BUILT}`)
    .max(CURRENT_YEAR, `Year built cannot be in the future`),

  /** Lot size in acres (optional) */
  lotSize: z
    .number({
      invalid_type_error: 'Lot size must be a number',
    })
    .positive('Lot size must be greater than 0')
    .max(1000, 'Lot size cannot exceed 1,000 acres')
    .optional(),

  /** Number of parking spaces (optional) */
  parkingSpaces: z
    .number({
      invalid_type_error: 'Parking spaces must be a number',
    })
    .int('Parking spaces must be a whole number')
    .min(0, 'Parking spaces cannot be negative')
    .max(100, 'Parking spaces cannot exceed 100')
    .optional(),

  /** Total number of units in the property */
  totalUnits: z
    .number({
      invalid_type_error: 'Total units must be a number',
    })
    .int('Total units must be a whole number')
    .min(1, 'Must have at least 1 unit')
    .max(500, 'Cannot exceed 500 units')
    .default(1),

  /** Property amenities (optional array of strings) */
  amenities: z
    .array(z.string().trim().min(1, 'Amenity cannot be empty'))
    .default([]),
})

// -----------------------------------------------------------------------------
// Financial Schema
// -----------------------------------------------------------------------------

/**
 * Financial information schema including purchase price, ARV, and current value.
 * Includes cross-field validation to ensure ARV > purchase price.
 */
export const financialSchema = z.object({
  /** Purchase price of the property (currency, must be > 0) */
  purchasePrice: z
    .number({
      required_error: 'Purchase price is required',
      invalid_type_error: 'Purchase price must be a number',
    })
    .positive('Purchase price must be greater than $0')
    .max(999999999.99, 'Purchase price cannot exceed $999,999,999.99'),

  /** After Repair Value - expected value after renovations (currency, must be > purchase price) */
  arv: z
    .number({
      required_error: 'After Repair Value (ARV) is required',
      invalid_type_error: 'ARV must be a number',
    })
    .positive('ARV must be greater than $0')
    .max(999999999.99, 'ARV cannot exceed $999,999,999.99'),

  /** Current market value of the property (optional) */
  currentValue: z
    .number({
      invalid_type_error: 'Current value must be a number',
    })
    .positive('Current value must be greater than $0')
    .max(999999999.99, 'Current value cannot exceed $999,999,999.99')
    .optional(),

  /** Date the property was purchased (optional) */
  purchaseDate: z.coerce
    .date({
      invalid_type_error: 'Please enter a valid date',
    })
    .max(new Date(), 'Purchase date cannot be in the future')
    .optional(),
}).refine(
  (data: { arv: number; purchasePrice: number }) => data.arv > data.purchasePrice,
  {
    message: 'ARV must be greater than the purchase price',
    path: ['arv'],
  },
)

// -----------------------------------------------------------------------------
// Financing Details Schema (Conditional Validation)
// -----------------------------------------------------------------------------

/**
 * Financing details schema with conditional validation.
 * When isFinanced is true, financing type and loan details are required.
 */
export const financingDetailsSchema = z.discriminatedUnion('isFinanced', [
  // Cash purchase - no financing details required
  z.object({
    /** Whether the property is financed */
    isFinanced: z.literal(false),
  }),

  // Financed purchase - additional fields required
  z.object({
    /** Whether the property is financed */
    isFinanced: z.literal(true),

    /** Type of financing used */
    financingType: financingTypeEnum,

    /** Name of the lender (required when financed) */
    lenderName: z
      .string({
        required_error: 'Lender name is required for financed properties',
      })
      .min(1, 'Lender name is required')
      .max(200, 'Lender name must be less than 200 characters')
      .trim(),

    /** Loan amount in dollars */
    loanAmount: z
      .number({
        required_error: 'Loan amount is required for financed properties',
        invalid_type_error: 'Loan amount must be a number',
      })
      .positive('Loan amount must be greater than $0')
      .max(999999999.99, 'Loan amount cannot exceed $999,999,999.99'),

    /** Interest rate as a percentage (e.g., 6.5 for 6.5%) */
    interestRate: z
      .number({
        required_error: 'Interest rate is required for financed properties',
        invalid_type_error: 'Interest rate must be a number',
      })
      .min(0, 'Interest rate cannot be negative')
      .max(30, 'Interest rate cannot exceed 30%'),

    /** Loan term in months */
    loanTermMonths: z
      .number({
        required_error: 'Loan term is required for financed properties',
        invalid_type_error: 'Loan term must be a number',
      })
      .int('Loan term must be a whole number of months')
      .min(1, 'Loan term must be at least 1 month')
      .max(480, 'Loan term cannot exceed 480 months (40 years)'),

    /** Monthly mortgage payment (optional, can be calculated) */
    monthlyPayment: z
      .number({
        invalid_type_error: 'Monthly payment must be a number',
      })
      .positive('Monthly payment must be greater than $0')
      .optional(),

    /** Current mortgage balance (optional) */
    mortgageBalance: z
      .number({
        invalid_type_error: 'Mortgage balance must be a number',
      })
      .min(0, 'Mortgage balance cannot be negative')
      .optional(),

    /** Loan origination date (optional) */
    loanOriginationDate: z.coerce
      .date({
        invalid_type_error: 'Please enter a valid date',
      })
      .optional(),
  }),
])

// -----------------------------------------------------------------------------
// Complete Property Details Form Schema
// -----------------------------------------------------------------------------

/**
 * Complete PropertyDetailsForm schema combining all sections.
 * Use this schema for validating the full property details form.
 *
 * @example
 * ```typescript
 * import { useForm } from '~/components/ui/form'
 * import { propertyDetailsFormSchema, propertyDetailsFormDefaults } from '~/services/property-details-form.schema'
 *
 * const form = useForm(propertyDetailsFormSchema, {
 *   defaultValues: propertyDetailsFormDefaults,
 *   onSubmit: async ({ value }) => {
 *     // Handle form submission
 *   },
 * })
 * ```
 */
export const propertyDetailsFormSchema = z.object({
  /** Property name/title */
  name: z
    .string({
      required_error: 'Property name is required',
    })
    .min(1, 'Property name is required')
    .max(200, 'Property name must be less than 200 characters')
    .trim(),

  /** Property type classification */
  type: propertyTypeEnum,

  /** Property status */
  status: propertyStatusEnum.default('ACTIVE'),

  /** Property address */
  address: addressSchema,

  /** Property specifications */
  specs: propertySpecsSchema,

  /** Financial information */
  financials: financialSchema,

  /** Financing details */
  financing: financingDetailsSchema,

  /** Additional notes about the property (optional) */
  notes: z
    .string()
    .max(5000, 'Notes must be less than 5,000 characters')
    .trim()
    .optional(),

  /** Property image URL (optional) */
  imageUrl: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
})

// -----------------------------------------------------------------------------
// Default Values
// -----------------------------------------------------------------------------

/**
 * Default values for the PropertyDetailsForm.
 * Use these when initializing the form to ensure all fields have valid initial state.
 */
export const propertyDetailsFormDefaults: PropertyDetailsFormData = {
  name: '',
  type: 'SINGLE_FAMILY',
  status: 'ACTIVE',
  address: {
    addressLine1: '',
    addressLine2: undefined,
    city: '',
    state: 'MN',
    zipCode: '',
    country: 'US',
    latitude: undefined,
    longitude: undefined,
  },
  specs: {
    squareFootage: 0,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: CURRENT_YEAR,
    lotSize: undefined,
    parkingSpaces: undefined,
    totalUnits: 1,
    amenities: [],
  },
  financials: {
    purchasePrice: 0,
    arv: 0,
    currentValue: undefined,
    purchaseDate: undefined,
  },
  financing: {
    isFinanced: false,
  },
  notes: undefined,
  imageUrl: undefined,
}

/**
 * Default values for financed property.
 * Use when user indicates the property has financing.
 */
export const financedPropertyDefaults = {
  isFinanced: true as const,
  financingType: 'CONVENTIONAL' as const,
  lenderName: '',
  loanAmount: 0,
  interestRate: 0,
  loanTermMonths: 360, // 30 years
  monthlyPayment: undefined,
  mortgageBalance: undefined,
  loanOriginationDate: undefined,
}

// -----------------------------------------------------------------------------
// Type Exports
// -----------------------------------------------------------------------------

/** Property type enum type */
export type PropertyType = z.infer<typeof propertyTypeEnum>

/** Property status enum type */
export type PropertyStatus = z.infer<typeof propertyStatusEnum>

/** Financing type enum type */
export type FinancingType = z.infer<typeof financingTypeEnum>

/** Address schema type */
export type AddressData = z.infer<typeof addressSchema>

/** Property specs schema type */
export type PropertySpecsData = z.infer<typeof propertySpecsSchema>

/** Financial schema type */
export type FinancialData = z.infer<typeof financialSchema>

/** Financing details schema type (discriminated union) */
export type FinancingDetailsData = z.infer<typeof financingDetailsSchema>

/** Complete property details form data type */
export type PropertyDetailsFormData = z.infer<typeof propertyDetailsFormSchema>

/**
 * Partial property details for updates.
 * All fields are optional for PATCH operations.
 */
export type PropertyDetailsFormUpdateData = z.infer<typeof propertyDetailsFormUpdateSchema>

// -----------------------------------------------------------------------------
// Update Schema (Partial)
// -----------------------------------------------------------------------------

/**
 * Partial schema for updating property details.
 * All fields are optional, useful for PATCH operations.
 */
export const propertyDetailsFormUpdateSchema = propertyDetailsFormSchema.deepPartial()

// -----------------------------------------------------------------------------
// Utility Schemas
// -----------------------------------------------------------------------------

/**
 * Schema for validating just the address portion of the form.
 * Useful for address-only validation scenarios.
 */
export const addressOnlySchema = z.object({
  address: addressSchema,
})

/**
 * Schema for validating just the financial portion of the form.
 * Useful for financial-only validation scenarios.
 */
export const financialsOnlySchema = z.object({
  financials: financialSchema,
  financing: financingDetailsSchema,
})

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Calculate monthly mortgage payment using standard amortization formula.
 * @param principal - Loan amount in dollars
 * @param annualRate - Annual interest rate as percentage (e.g., 6.5)
 * @param termMonths - Loan term in months
 * @returns Monthly payment amount
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number,
): number {
  if (principal <= 0 || termMonths <= 0) return 0
  if (annualRate === 0) return principal / termMonths

  const monthlyRate = annualRate / 100 / 12
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1)

  return Math.round(payment * 100) / 100
}

/**
 * Format currency value for display.
 * @param value - Numeric value to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Validate bathroom value is in valid increments.
 * @param value - Number of bathrooms
 * @returns True if valid increment
 */
export function isValidBathroomCount(value: number): boolean {
  return value >= MIN_BATHROOMS && value <= MAX_BATHROOMS && value % BATHROOM_INCREMENT === 0
}

/**
 * Get list of valid bathroom options for select/dropdown.
 * @returns Array of valid bathroom counts
 */
export function getBathroomOptions(): number[] {
  const options: number[] = []
  for (let i = MIN_BATHROOMS; i <= MAX_BATHROOMS; i += BATHROOM_INCREMENT) {
    options.push(i)
  }
  return options
}

/**
 * Get list of US states for select/dropdown.
 * @returns Array of state codes
 */
export function getStateOptions(): readonly string[] {
  return US_STATES
}
