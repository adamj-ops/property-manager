/**
 * Lease Document Builder
 * Builds variable data objects for lease document generation from lease, tenant, unit, and property data.
 * EPM-43: Lease Document Generation
 */

import { formatVariableValue } from './template-variables'

// Type definitions matching Prisma schema
interface Lease {
  id: string
  leaseNumber: string
  startDate: Date
  endDate: Date
  moveInDate: Date | null
  signedDate: Date | null
  monthlyRent: number | string | { toNumber(): number }
  securityDeposit: number | string | { toNumber(): number }
  lateFeeAmount: number | string | { toNumber(): number }
  lateFeeGraceDays: number
  rentDueDay: number
  depositInterestRate: number | string | { toNumber(): number }
  depositBankName: string | null
  depositAccountLast4: string | null
  petsAllowed: boolean
  petDeposit: number | string | { toNumber(): number } | null
  petRent: number | string | { toNumber(): number } | null
  utilitiesTenantPays: string[]
  utilitiesOwnerPays: string[]
  parkingIncluded: boolean
  parkingFee: number | string | { toNumber(): number } | null
  storageIncluded: boolean
  storageFee: number | string | { toNumber(): number } | null
}

interface Tenant {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  ssn: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
}

interface Unit {
  id: string
  unitNumber: string
  bedrooms: number
  bathrooms: number | string | { toNumber(): number }
  sqFt: number | null
  floor: number | null
}

interface Property {
  id: string
  name: string
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  zip: string
  yearBuilt: number | null
}

interface LeaseTenant {
  id: string
  tenantId: string
  isPrimary: boolean
}

export interface LeaseDocumentData {
  // Tenant Information
  tenant_name: string
  tenant_first_name: string
  tenant_last_name: string
  tenant_email: string
  tenant_phone: string
  tenant_ssn_last4: string
  tenant_emergency_contact_name: string
  tenant_emergency_contact_phone: string

  // Property Information
  property_name: string
  property_address: string
  property_address_line2: string
  property_city: string
  property_state: string
  property_zip: string
  property_full_address: string
  property_year_built: number

  // Unit Information
  unit_number: string
  unit_bedrooms: number
  unit_bathrooms: number
  unit_sqft: number
  unit_floor: number

  // Lease Terms
  lease_start_date: Date
  lease_end_date: Date
  lease_term_months: number
  move_in_date: Date | null
  signed_date: Date | null

  // Financial Terms
  monthly_rent: number
  security_deposit: number
  late_fee_amount: number
  grace_period_days: number
  rent_due_day: number

  // Security Deposit
  security_deposit_interest_rate: number
  deposit_bank_name: string
  late_fee_cap: number

  // Pet Information
  pets_allowed: boolean
  pet_deposit: number | null
  pet_rent: number | null

  // Parking Information
  parking_included: boolean
  parking_fee: number | null

  // Utilities
  utilities_tenant_pays: string
  utilities_owner_pays: string
}

/**
 * Convert Decimal-like values to numbers
 */
function toNumber(value: number | string | { toNumber(): number } | null | undefined): number {
  if (value === null || value === undefined) {
    return 0
  }
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    return parseFloat(value) || 0
  }
  if (typeof value === 'object' && 'toNumber' in value) {
    return value.toNumber()
  }
  return 0
}

/**
 * Convert Decimal-like values to numbers (allowing null)
 */
function toNumberOrNull(value: number | string | { toNumber(): number } | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? null : parsed
  }
  if (typeof value === 'object' && 'toNumber' in value) {
    return value.toNumber()
  }
  return null
}

/**
 * Convert Decimal-like values to numbers for decimals (bathrooms)
 */
function toDecimal(value: number | string | { toNumber(): number } | null | undefined): number {
  if (value === null || value === undefined) {
    return 1
  }
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    return parseFloat(value) || 1
  }
  if (typeof value === 'object' && 'toNumber' in value) {
    return value.toNumber()
  }
  return 1
}

/**
 * Calculate lease term in months
 */
function calculateLeaseTermMonths(startDate: Date, endDate: Date): number {
  const months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth())
  return Math.max(1, months)
}

/**
 * Format full property address
 */
function formatFullAddress(property: Property): string {
  const parts = [property.addressLine1]
  if (property.addressLine2) {
    parts.push(property.addressLine2)
  }
  parts.push(`${property.city}, ${property.state} ${property.zip}`)
  return parts.join(', ')
}

/**
 * Extract last 4 digits of SSN
 */
function extractSsnLast4(ssn: string | null): string {
  if (!ssn) {
    return ''
  }
  // Remove any non-digits
  const digits = ssn.replace(/\D/g, '')
  // Return last 4 digits
  return digits.slice(-4)
}

/**
 * Build variable data object from lease, tenant, unit, and property data.
 * This maps the actual data to the template variable names defined in STANDARD_VARIABLES.
 */
export function buildLeaseDocumentData(
  lease: Lease,
  tenant: Tenant,
  unit: Unit,
  property: Property
): LeaseDocumentData {
  // Calculate derived values
  const leaseTermMonths = calculateLeaseTermMonths(lease.startDate, lease.endDate)
  const propertyFullAddress = formatFullAddress(property)
  const utilitiesTenantPays = lease.utilitiesTenantPays.join(', ') || ''
  const utilitiesOwnerPays = lease.utilitiesOwnerPays.join(', ') || ''
  const ssnLast4 = extractSsnLast4(tenant.ssn)

  return {
    // Tenant Information
    tenant_name: `${tenant.firstName} ${tenant.lastName}`,
    tenant_first_name: tenant.firstName,
    tenant_last_name: tenant.lastName,
    tenant_email: tenant.email,
    tenant_phone: tenant.phone || '',
    tenant_ssn_last4: ssnLast4,
    tenant_emergency_contact_name: tenant.emergencyContactName || '',
    tenant_emergency_contact_phone: tenant.emergencyContactPhone || '',

    // Property Information
    property_name: property.name,
    property_address: property.addressLine1,
    property_address_line2: property.addressLine2 || '',
    property_city: property.city,
    property_state: property.state,
    property_zip: property.zip,
    property_full_address: propertyFullAddress,
    property_year_built: property.yearBuilt || 0,

    // Unit Information
    unit_number: unit.unitNumber,
    unit_bedrooms: unit.bedrooms,
    unit_bathrooms: toDecimal(unit.bathrooms),
    unit_sqft: unit.sqFt || 0,
    unit_floor: unit.floor || 0,

    // Lease Terms
    lease_start_date: lease.startDate,
    lease_end_date: lease.endDate,
    lease_term_months: leaseTermMonths,
    move_in_date: lease.moveInDate,
    signed_date: lease.signedDate,

    // Financial Terms
    monthly_rent: toNumber(lease.monthlyRent),
    security_deposit: toNumber(lease.securityDeposit),
    late_fee_amount: toNumber(lease.lateFeeAmount),
    grace_period_days: lease.lateFeeGraceDays,
    rent_due_day: lease.rentDueDay,

    // Security Deposit
    security_deposit_interest_rate: toNumber(lease.depositInterestRate) * 100, // Convert to percentage
    deposit_bank_name: lease.depositBankName || '',
    late_fee_cap: 50, // MN statutory cap

    // Pet Information
    pets_allowed: lease.petsAllowed,
    pet_deposit: toNumberOrNull(lease.petDeposit),
    pet_rent: toNumberOrNull(lease.petRent),

    // Parking Information
    parking_included: lease.parkingIncluded,
    parking_fee: toNumberOrNull(lease.parkingFee),

    // Utilities
    utilities_tenant_pays: utilitiesTenantPays,
    utilities_owner_pays: utilitiesOwnerPays,
  }
}

/**
 * Format variable data for template rendering.
 * Converts dates and numbers to formatted strings according to variable definitions.
 */
export function formatLeaseDocumentData(data: LeaseDocumentData): Record<string, string | number | boolean> {
  const formatted: Record<string, string | number | boolean> = {}

  // Format dates
  formatted.lease_start_date = formatVariableValue(data.lease_start_date, 'lease_start_date')
  formatted.lease_end_date = formatVariableValue(data.lease_end_date, 'lease_end_date')
  formatted.move_in_date = data.move_in_date
    ? formatVariableValue(data.move_in_date, 'move_in_date')
    : ''
  formatted.signed_date = data.signed_date ? formatVariableValue(data.signed_date, 'signed_date') : ''

  // Format currency values
  formatted.monthly_rent = formatVariableValue(data.monthly_rent, 'monthly_rent')
  formatted.security_deposit = formatVariableValue(data.security_deposit, 'security_deposit')
  formatted.late_fee_amount = formatVariableValue(data.late_fee_amount, 'late_fee_amount')
  formatted.late_fee_cap = formatVariableValue(data.late_fee_cap, 'late_fee_cap')
  formatted.pet_deposit = data.pet_deposit ? formatVariableValue(data.pet_deposit, 'pet_deposit') : ''
  formatted.pet_rent = data.pet_rent ? formatVariableValue(data.pet_rent, 'pet_rent') : ''
  formatted.parking_fee = data.parking_fee ? formatVariableValue(data.parking_fee, 'parking_fee') : ''

  // Format percentage
  formatted.security_deposit_interest_rate = formatVariableValue(data.security_deposit_interest_rate, 'security_deposit_interest_rate')

  // Format numbers
  formatted.lease_term_months = formatVariableValue(data.lease_term_months, 'lease_term_months')
  formatted.grace_period_days = formatVariableValue(data.grace_period_days, 'grace_period_days')
  formatted.rent_due_day = formatVariableValue(data.rent_due_day, 'rent_due_day')
  formatted.unit_bedrooms = formatVariableValue(data.unit_bedrooms, 'unit_bedrooms')
  formatted.unit_bathrooms = formatVariableValue(data.unit_bathrooms, 'unit_bathrooms')
  formatted.unit_sqft = formatVariableValue(data.unit_sqft, 'unit_sqft')
  formatted.unit_floor = formatVariableValue(data.unit_floor, 'unit_floor')
  formatted.property_year_built = formatVariableValue(data.property_year_built, 'property_year_built')

  // Format booleans
  formatted.pets_allowed = formatVariableValue(data.pets_allowed, 'pets_allowed')
  formatted.parking_included = formatVariableValue(data.parking_included, 'parking_included')

  // Keep strings as-is
  formatted.tenant_name = data.tenant_name
  formatted.tenant_first_name = data.tenant_first_name
  formatted.tenant_last_name = data.tenant_last_name
  formatted.tenant_email = data.tenant_email
  formatted.tenant_phone = data.tenant_phone
  formatted.tenant_ssn_last4 = data.tenant_ssn_last4
  formatted.tenant_emergency_contact_name = data.tenant_emergency_contact_name
  formatted.tenant_emergency_contact_phone = data.tenant_emergency_contact_phone
  formatted.property_name = data.property_name
  formatted.property_address = data.property_address
  formatted.property_address_line2 = data.property_address_line2
  formatted.property_city = data.property_city
  formatted.property_state = data.property_state
  formatted.property_zip = data.property_zip
  formatted.property_full_address = data.property_full_address
  formatted.unit_number = data.unit_number
  formatted.utilities_tenant_pays = data.utilities_tenant_pays
  formatted.utilities_owner_pays = data.utilities_owner_pays
  formatted.deposit_bank_name = data.deposit_bank_name

  return formatted
}

