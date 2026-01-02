/**
 * Seed Script for Property Management Database
 *
 * Imports data from Airtable CSV exports into Supabase via Prisma
 *
 * Usage:
 *   pnpm db:seed
 *
 * Prerequisites:
 *   1. Run `pnpm db:push:d` to create/update tables
 *   2. Ensure CSV files exist in /exports folder
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// CSV parsing helper
function parseCSV(filePath: string): Record<string, string>[] {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`)
    return []
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter((line) => line.trim())

  if (lines.length < 2) return []

  // Parse header - handle quoted fields
  const parseRow = (row: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < row.length; i++) {
      const char = row[i]

      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseRow(lines[0])
  const records: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i])
    const record: Record<string, string> = {}

    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = values[j] || ''
    }
    records.push(record)
  }

  return records
}

// Find the latest export file matching a pattern
function findLatestExport(prefix: string): string | null {
  const exportsDir = path.join(process.cwd(), 'exports')

  if (!fs.existsSync(exportsDir)) {
    console.log('⚠️  No exports directory found')
    return null
  }

  const files = fs.readdirSync(exportsDir)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.csv'))
    .sort()
    .reverse()

  return files[0] ? path.join(exportsDir, files[0]) : null
}

// Parse phone numbers to clean format
function cleanPhone(phone: string | undefined): string | null {
  if (!phone) return null
  return phone.replace(/[^\d+]/g, '').slice(0, 20) || null
}

// Parse rent amount from string
function parseDecimal(value: string | undefined): number | null {
  if (!value) return null
  const cleaned = value.replace(/[$,]/g, '')
  const num = Number.parseFloat(cleaned)
  return Number.isNaN(num) ? null : num
}

// Parse integer
function parseInt(value: string | undefined): number | null {
  if (!value) return null
  const num = Number.parseInt(value, 10)
  return Number.isNaN(num) ? null : num
}

// Parse name into first/last
function parseName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/[\s,]+/).filter(Boolean)

  if (parts.length === 0) {
    return { firstName: 'Unknown', lastName: 'Tenant' }
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }

  // Check if format is "Last, First"
  if (fullName.includes(',')) {
    return { firstName: parts[1] || '', lastName: parts[0] }
  }

  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

async function seedProperties(managerId: string) {
  const file = findLatestExport('properties_')
  if (!file) {
    console.log('⚠️  No properties export found')
    return new Map<string, string>()
  }

  const records = parseCSV(file)
  console.log(`📦 Seeding ${records.length} properties...`)

  const propertyMap = new Map<string, string>() // Airtable ID -> Supabase ID

  for (const record of records) {
    const airtableId = record['Record ID']
    const address = record['Property Address']

    if (!address) continue

    try {
      const property = await prisma.property.upsert({
        where: {
          id: airtableId, // This won't work for new records, use create
        },
        update: {},
        create: {
          name: address,
          addressLine1: address,
          city: record['City'] || 'Unknown',
          state: record['State'] || 'MN',
          zipCode: record['ZIP Code'] || '00000',
          totalUnits: parseInt(record['Beds']) || 1,
          totalSqFt: parseInt(record['Sq. Ft.']),
          notes: record['Notes'] || null,
          imageUrl: record['Property Photo']?.split(';')[0]?.trim() || null,
          managerId,
          type: 'MULTI_FAMILY',
          status: 'ACTIVE',
        },
      })

      propertyMap.set(airtableId, property.id)
      console.log(`   ✓ ${address}`)
    } catch (error) {
      // If upsert fails, try create
      try {
        const property = await prisma.property.create({
          data: {
            name: address,
            addressLine1: address,
            city: record['City'] || 'Unknown',
            state: record['State'] || 'MN',
            zipCode: record['ZIP Code'] || '00000',
            totalUnits: parseInt(record['Beds']) || 1,
            totalSqFt: parseInt(record['Sq. Ft.']),
            notes: record['Notes'] || null,
            imageUrl: record['Property Photo']?.split(';')[0]?.trim() || null,
            managerId,
            type: 'MULTI_FAMILY',
            status: 'ACTIVE',
          },
        })
        propertyMap.set(airtableId, property.id)
        console.log(`   ✓ ${address}`)
      } catch (createError) {
        console.log(`   ✗ ${address}: ${createError}`)
      }
    }
  }

  return propertyMap
}

async function seedVendors() {
  const file = findLatestExport('vendors_')
  if (!file) {
    console.log('⚠️  No vendors export found')
    return new Map<string, string>()
  }

  const records = parseCSV(file)
  console.log(`📦 Seeding ${records.length} vendors...`)

  const vendorMap = new Map<string, string>()

  for (const record of records) {
    const airtableId = record['Record ID']
    const name = record['Name']
    const email = record['Email Address']

    if (!name) continue

    try {
      const vendor = await prisma.vendor.create({
        data: {
          companyName: name,
          contactName: record['Contact Name'] || name,
          email: email || `${name.toLowerCase().replace(/\s+/g, '')}@placeholder.com`,
          phone: cleanPhone(record['Phone Number']) || '0000000000',
          altPhone: cleanPhone(record['Phone Number 2']),
          addressLine1: record['Mailing Address']?.split('\n')[0] || null,
          city: record['Mailing Address']?.split('\n')[1]?.split(',')[0]?.trim() || null,
          state: record['Mailing Address']?.split('\n')[1]?.split(',')[1]?.trim()?.split(' ')[0] || 'MN',
          zipCode: record['Mailing Address']?.split('\n')[1]?.split(' ').pop() || null,
          notes: record['Notes'] || null,
          categories: [],
          status: 'ACTIVE',
        },
      })

      vendorMap.set(airtableId, vendor.id)
      console.log(`   ✓ ${name}`)
    } catch (error) {
      console.log(`   ✗ ${name}: Email might be duplicate, skipping`)
    }
  }

  return vendorMap
}

async function seedUnitsAndTenants(propertyMap: Map<string, string>) {
  const file = findLatestExport('units_')
  if (!file) {
    console.log('⚠️  No units export found')
    return
  }

  const records = parseCSV(file)
  console.log(`📦 Seeding ${records.length} units with tenants...`)

  // First pass: create all units
  for (const record of records) {
    const unitNumber = record['Unit No.']
    const propertyIds = record['Properties']?.replace(/[\[\]"]/g, '').split(';').map((s) => s.trim())
    const airtablePropertyId = propertyIds?.[0]

    if (!unitNumber || !airtablePropertyId) continue

    const propertyId = propertyMap.get(airtablePropertyId)
    if (!propertyId) {
      console.log(`   ⚠️  Property not found for unit ${unitNumber}`)
      continue
    }

    const rentAmount = parseDecimal(record['Rent Amount']) || 1000
    const renterName = record['Renter(s) Names']?.trim()
    const tenantEmail = record['Tenant Email']?.trim()
    const tenantPhone = record['Tenant Number']?.trim()
    const rentStatus = record['Rent Status']?.toLowerCase()
    const leaseTerms = record['Lease Terms']?.trim()

    try {
      // Create unit
      const unit = await prisma.unit.create({
        data: {
          unitNumber,
          propertyId,
          bedrooms: parseInt(record['Bed']) || 1,
          bathrooms: parseInt(record['Bath']) || 1,
          marketRent: rentAmount,
          currentRent: rentAmount,
          status: rentStatus === 'vacant' ? 'VACANT' : 'OCCUPIED',
          notes: record['Notes'] || null,
        },
      })

      console.log(`   ✓ Unit ${unitNumber}`)

      // Create tenant if there's a renter
      if (renterName && renterName.toLowerCase() !== 'vacant') {
        const { firstName, lastName } = parseName(renterName)
        const email = tenantEmail || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@tenant.placeholder.com`

        try {
          const tenant = await prisma.tenant.create({
            data: {
              firstName,
              lastName,
              email,
              phone: cleanPhone(tenantPhone),
              status: 'ACTIVE',
            },
          })

          // Create lease
          const isMonthToMonth = leaseTerms?.toLowerCase().includes('month')
          const startDate = record['Lease From']
            ? new Date(record['Lease From'])
            : new Date()
          const endDate = record['Lease To']
            ? new Date(record['Lease To'])
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

          await prisma.lease.create({
            data: {
              unitId: unit.id,
              tenantId: tenant.id,
              startDate,
              endDate,
              monthlyRent: rentAmount,
              securityDeposit: rentAmount, // Default to 1 month
              status: isMonthToMonth ? 'MONTH_TO_MONTH' : 'ACTIVE',
              type: isMonthToMonth ? 'MONTH_TO_MONTH' : 'FIXED_TERM',
            },
          })

          console.log(`      └─ Tenant: ${firstName} ${lastName}`)
        } catch (tenantError) {
          console.log(`      └─ ⚠️  Tenant ${renterName}: ${tenantError}`)
        }
      }
    } catch (error) {
      console.log(`   ✗ Unit ${unitNumber}: ${error}`)
    }
  }
}

async function main() {
  console.log('\n🌱 Property Management Database Seed')
  console.log('=====================================\n')

  try {
    // Create or find a default manager user
    console.log('👤 Setting up default manager...')

    let manager = await prisma.user.findFirst({
      where: { email: 'admin@everydayhomebuyers.com' },
    })

    if (!manager) {
      manager = await prisma.user.create({
        data: {
          name: 'Property Manager',
          email: 'admin@everydayhomebuyers.com',
          emailVerified: true,
          role: 'admin',
        },
      })
      console.log('   ✓ Created default manager user')
    } else {
      console.log('   ✓ Using existing manager user')
    }

    // Seed vendors first (no dependencies)
    console.log('')
    const vendorMap = await seedVendors()
    console.log(`   Total vendors: ${vendorMap.size}`)

    // Seed properties
    console.log('')
    const propertyMap = await seedProperties(manager.id)
    console.log(`   Total properties: ${propertyMap.size}`)

    // Seed units and tenants
    console.log('')
    await seedUnitsAndTenants(propertyMap)

    console.log('\n✅ Seed completed successfully!')

    // Print summary
    const counts = await Promise.all([
      prisma.property.count(),
      prisma.unit.count(),
      prisma.tenant.count(),
      prisma.lease.count(),
      prisma.vendor.count(),
    ])

    console.log('\n📊 Database Summary:')
    console.log(`   Properties: ${counts[0]}`)
    console.log(`   Units: ${counts[1]}`)
    console.log(`   Tenants: ${counts[2]}`)
    console.log(`   Leases: ${counts[3]}`)
    console.log(`   Vendors: ${counts[4]}`)
  } catch (error) {
    console.error('\n❌ Seed failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
