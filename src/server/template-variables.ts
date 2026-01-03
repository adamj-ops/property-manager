/**
 * Template Variable System
 * Defines standard variables available for lease templates and provides validation.
 * EPM-83: Lease Template Import & Management
 */

export interface VariableDefinition {
  name: string
  description: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency'
  format?: string // Date format, currency format, etc.
  category: VariableCategory
  required?: boolean
  example?: string | number | boolean
}

export type VariableCategory =
  | 'tenant'
  | 'property'
  | 'unit'
  | 'lease'
  | 'financial'
  | 'compliance'
  | 'pet'
  | 'parking'
  | 'utilities'

export interface VariableSchema {
  variables: VariableDefinition[]
  categories: Record<VariableCategory, VariableDefinition[]>
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  unknownVariables: string[]
  missingRequired: string[]
}

/**
 * Standard variables available for all lease templates.
 * These are the variables that can be used in template placeholders.
 */
export const STANDARD_VARIABLES: VariableDefinition[] = [
  // Tenant Information
  {
    name: 'tenant_name',
    description: 'Full name of the primary tenant',
    type: 'string',
    category: 'tenant',
    required: true,
    example: 'John Smith',
  },
  {
    name: 'tenant_first_name',
    description: 'First name of the primary tenant',
    type: 'string',
    category: 'tenant',
    example: 'John',
  },
  {
    name: 'tenant_last_name',
    description: 'Last name of the primary tenant',
    type: 'string',
    category: 'tenant',
    example: 'Smith',
  },
  {
    name: 'tenant_email',
    description: 'Email address of the primary tenant',
    type: 'string',
    category: 'tenant',
    required: true,
    example: 'john.smith@email.com',
  },
  {
    name: 'tenant_phone',
    description: 'Phone number of the primary tenant',
    type: 'string',
    category: 'tenant',
    example: '(612) 555-1234',
  },
  {
    name: 'tenant_ssn_last4',
    description: 'Last 4 digits of tenant SSN (for identification)',
    type: 'string',
    category: 'tenant',
    example: '1234',
  },
  {
    name: 'tenant_emergency_contact_name',
    description: 'Name of tenant emergency contact',
    type: 'string',
    category: 'tenant',
    example: 'Jane Smith',
  },
  {
    name: 'tenant_emergency_contact_phone',
    description: 'Phone of tenant emergency contact',
    type: 'string',
    category: 'tenant',
    example: '(612) 555-5678',
  },

  // Property Information
  {
    name: 'property_name',
    description: 'Name of the property',
    type: 'string',
    category: 'property',
    required: true,
    example: 'Humboldt Court Community',
  },
  {
    name: 'property_address',
    description: 'Full street address of the property',
    type: 'string',
    category: 'property',
    required: true,
    example: '123 Main Street',
  },
  {
    name: 'property_address_line2',
    description: 'Second line of property address (if applicable)',
    type: 'string',
    category: 'property',
    example: 'Suite 100',
  },
  {
    name: 'property_city',
    description: 'City where the property is located',
    type: 'string',
    category: 'property',
    required: true,
    example: 'Brooklyn Center',
  },
  {
    name: 'property_state',
    description: 'State where the property is located',
    type: 'string',
    category: 'property',
    required: true,
    example: 'MN',
  },
  {
    name: 'property_zip',
    description: 'ZIP code of the property',
    type: 'string',
    category: 'property',
    required: true,
    example: '55430',
  },
  {
    name: 'property_full_address',
    description: 'Complete formatted address',
    type: 'string',
    category: 'property',
    example: '123 Main Street, Brooklyn Center, MN 55430',
  },
  {
    name: 'property_year_built',
    description: 'Year the property was built',
    type: 'number',
    category: 'property',
    example: 1975,
  },

  // Unit Information
  {
    name: 'unit_number',
    description: 'Unit number or identifier',
    type: 'string',
    category: 'unit',
    required: true,
    example: '101',
  },
  {
    name: 'unit_bedrooms',
    description: 'Number of bedrooms',
    type: 'number',
    category: 'unit',
    example: 2,
  },
  {
    name: 'unit_bathrooms',
    description: 'Number of bathrooms',
    type: 'number',
    category: 'unit',
    example: 1,
  },
  {
    name: 'unit_sqft',
    description: 'Square footage of the unit',
    type: 'number',
    category: 'unit',
    example: 850,
  },
  {
    name: 'unit_floor',
    description: 'Floor number of the unit',
    type: 'number',
    category: 'unit',
    example: 1,
  },

  // Lease Terms
  {
    name: 'lease_start_date',
    description: 'Start date of the lease',
    type: 'date',
    format: 'MMMM D, YYYY',
    category: 'lease',
    required: true,
    example: 'January 1, 2026',
  },
  {
    name: 'lease_end_date',
    description: 'End date of the lease',
    type: 'date',
    format: 'MMMM D, YYYY',
    category: 'lease',
    required: true,
    example: 'December 31, 2026',
  },
  {
    name: 'lease_term_months',
    description: 'Length of lease in months',
    type: 'number',
    category: 'lease',
    example: 12,
  },
  {
    name: 'move_in_date',
    description: 'Move-in date',
    type: 'date',
    format: 'MMMM D, YYYY',
    category: 'lease',
    example: 'January 1, 2026',
  },
  {
    name: 'signed_date',
    description: 'Date the lease was signed',
    type: 'date',
    format: 'MMMM D, YYYY',
    category: 'lease',
    example: 'December 15, 2025',
  },

  // Financial Terms
  {
    name: 'monthly_rent',
    description: 'Monthly rent amount',
    type: 'currency',
    format: '$0,0.00',
    category: 'financial',
    required: true,
    example: 1250.0,
  },
  {
    name: 'security_deposit',
    description: 'Security deposit amount',
    type: 'currency',
    format: '$0,0.00',
    category: 'financial',
    required: true,
    example: 1250.0,
  },
  {
    name: 'late_fee_amount',
    description: 'Late fee amount (MN cap: $50)',
    type: 'currency',
    format: '$0,0.00',
    category: 'financial',
    example: 50.0,
  },
  {
    name: 'grace_period_days',
    description: 'Grace period before late fee applies (days)',
    type: 'number',
    category: 'financial',
    example: 5,
  },
  {
    name: 'rent_due_day',
    description: 'Day of month rent is due',
    type: 'number',
    category: 'financial',
    example: 1,
  },

  // Minnesota Compliance
  {
    name: 'security_deposit_interest_rate',
    description: 'Security deposit interest rate (MN: 1%)',
    type: 'number',
    format: '0.00%',
    category: 'compliance',
    example: 1,
  },
  {
    name: 'late_fee_cap',
    description: 'Maximum late fee per MN statute ($50)',
    type: 'currency',
    format: '$0,0.00',
    category: 'compliance',
    example: 50.0,
  },
  {
    name: 'deposit_bank_name',
    description: 'Bank where security deposit is held',
    type: 'string',
    category: 'compliance',
    example: 'First National Bank',
  },

  // Pet Information
  {
    name: 'pets_allowed',
    description: 'Whether pets are allowed',
    type: 'boolean',
    category: 'pet',
    example: true,
  },
  {
    name: 'pet_deposit',
    description: 'Pet deposit amount',
    type: 'currency',
    format: '$0,0.00',
    category: 'pet',
    example: 250.0,
  },
  {
    name: 'pet_rent',
    description: 'Monthly pet rent',
    type: 'currency',
    format: '$0,0.00',
    category: 'pet',
    example: 25.0,
  },
  {
    name: 'pet_name',
    description: 'Name of the pet',
    type: 'string',
    category: 'pet',
    example: 'Buddy',
  },
  {
    name: 'pet_type',
    description: 'Type of pet (dog, cat, etc.)',
    type: 'string',
    category: 'pet',
    example: 'Dog',
  },
  {
    name: 'pet_breed',
    description: 'Breed of the pet',
    type: 'string',
    category: 'pet',
    example: 'Golden Retriever',
  },
  {
    name: 'pet_weight',
    description: 'Weight of the pet in pounds',
    type: 'number',
    category: 'pet',
    example: 65,
  },

  // Parking Information
  {
    name: 'parking_included',
    description: 'Whether parking is included',
    type: 'boolean',
    category: 'parking',
    example: true,
  },
  {
    name: 'parking_fee',
    description: 'Monthly parking fee',
    type: 'currency',
    format: '$0,0.00',
    category: 'parking',
    example: 50.0,
  },
  {
    name: 'parking_space_number',
    description: 'Assigned parking space number',
    type: 'string',
    category: 'parking',
    example: 'P-12',
  },

  // Utilities
  {
    name: 'utilities_tenant_pays',
    description: 'Utilities paid by tenant',
    type: 'string',
    category: 'utilities',
    example: 'Electric, Gas',
  },
  {
    name: 'utilities_owner_pays',
    description: 'Utilities paid by owner',
    type: 'string',
    category: 'utilities',
    example: 'Water, Sewer, Trash',
  },
]

/**
 * Build a variable schema from the standard variables.
 * Groups variables by category for easy access.
 */
export function buildVariableSchema(): VariableSchema {
  const categories: Record<VariableCategory, VariableDefinition[]> = {
    tenant: [],
    property: [],
    unit: [],
    lease: [],
    financial: [],
    compliance: [],
    pet: [],
    parking: [],
    utilities: [],
  }

  for (const variable of STANDARD_VARIABLES) {
    categories[variable.category].push(variable)
  }

  return {
    variables: STANDARD_VARIABLES,
    categories,
  }
}

/**
 * Get all available variable names.
 */
export function getAvailableVariableNames(): string[] {
  return STANDARD_VARIABLES.map((v) => v.name)
}

/**
 * Get required variable names.
 */
export function getRequiredVariableNames(): string[] {
  return STANDARD_VARIABLES.filter((v) => v.required).map((v) => v.name)
}

/**
 * Validate template variables against the standard variable set.
 * @param templateVariables - Variables extracted from the template
 * @returns Validation result with any issues found
 */
export function validateVariables(templateVariables: string[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const unknownVariables: string[] = []
  const missingRequired: string[] = []

  const availableNames = getAvailableVariableNames()
  const requiredNames = getRequiredVariableNames()

  // Check for unknown variables
  for (const variable of templateVariables) {
    if (!availableNames.includes(variable)) {
      unknownVariables.push(variable)
      warnings.push(`Unknown variable: {{${variable}}}`)
    }
  }

  // Check for missing required variables (for main lease templates)
  for (const required of requiredNames) {
    if (!templateVariables.includes(required)) {
      missingRequired.push(required)
    }
  }

  if (missingRequired.length > 0) {
    warnings.push(
      `Missing recommended variables: ${missingRequired.map((v) => `{{${v}}}`).join(', ')}`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    unknownVariables,
    missingRequired,
  }
}

/**
 * Get variable definition by name.
 */
export function getVariableDefinition(name: string): VariableDefinition | undefined {
  return STANDARD_VARIABLES.find((v) => v.name === name)
}

/**
 * Get sample data for all standard variables.
 * Used for template preview.
 */
export function getSampleData(): Record<string, string | number | boolean> {
  const data: Record<string, string | number | boolean> = {}

  for (const variable of STANDARD_VARIABLES) {
    if (variable.example !== undefined) {
      data[variable.name] = variable.example
    }
  }

  return data
}

/**
 * Format a value according to the variable definition.
 * @param value - The raw value
 * @param variableName - The variable name to get formatting rules
 * @returns Formatted value as string
 */
export function formatVariableValue(
  value: unknown,
  variableName: string
): string {
  const definition = getVariableDefinition(variableName)

  if (value === null || value === undefined) {
    return ''
  }

  if (!definition) {
    return String(value)
  }

  switch (definition.type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(Number(value))

    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      }
      return String(value)

    case 'boolean':
      return value ? 'Yes' : 'No'

    case 'number':
      return new Intl.NumberFormat('en-US').format(Number(value))

    default:
      return String(value)
  }
}

