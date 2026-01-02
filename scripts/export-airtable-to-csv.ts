/**
 * Airtable to CSV Export Script
 *
 * Usage:
 *   pnpm airtable:export
 *   pnpm airtable:export "Custom Table Name"
 *
 * Environment variables required in .env.development:
 *   - AIRTABLE_API_KEY or AIRTABLE_PAT: Your Airtable Personal Access Token
 *   - AIRTABLE_BASE_ID: The Base ID (starts with "app")
 *
 * You can also pass the table name as a command line argument:
 *   pnpm airtable:export "Property Profile"
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

import { config } from 'dotenv'

// Load environment variables from .env.development
config({ path: '.env.development' })
// Also try .env as fallback
config({ path: '.env' })

// Configuration
const API_KEY = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_PAT
const BASE_ID = process.env.AIRTABLE_BASE_ID
const TABLE_NAME = process.argv[2] || 'Property Profile'
const OUTPUT_DIR = path.join(process.cwd(), 'exports')

interface AirtableRecord {
  id: string
  createdTime: string
  fields: Record<string, unknown>
}

interface AirtableResponse {
  records: AirtableRecord[]
  offset?: string
}

async function fetchAllRecords(
  baseId: string,
  tableName: string,
  apiKey: string,
): Promise<AirtableRecord[]> {
  const allRecords: AirtableRecord[] = []
  let offset: string | undefined

  // Encode table name for URL (handles spaces and special characters)
  const encodedTableName = encodeURIComponent(tableName)
  const baseUrl = `https://api.airtable.com/v0/${baseId}/${encodedTableName}`

  console.log(`📡 Fetching records from "${tableName}"...`)

  do {
    const url = offset ? `${baseUrl}?offset=${offset}` : baseUrl

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Airtable API error (${response.status}): ${errorText}`)
    }

    const data = (await response.json()) as AirtableResponse

    allRecords.push(...data.records)
    offset = data.offset

    console.log(`   Fetched ${allRecords.length} records so far...`)
  } while (offset)

  console.log(`✅ Total records fetched: ${allRecords.length}`)
  return allRecords
}

function recordsToCsv(records: AirtableRecord[]): string {
  if (records.length === 0) {
    return ''
  }

  // Collect all unique field names across all records
  const fieldNames = new Set<string>()
  for (const record of records) {
    for (const key of Object.keys(record.fields)) fieldNames.add(key)
  }

  // Sort field names alphabetically for consistent column order
  const sortedFields = [...fieldNames].sort()

  // Add metadata columns
  const allColumns = ['Record ID', 'Created Time', ...sortedFields]

  // Helper to escape CSV values
  const escapeValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return ''
    }

    let stringValue: string

    if (Array.isArray(value)) {
      // Handle arrays (e.g., linked records, attachments, multi-select)
      stringValue = value
        .map((item) => {
          if (typeof item === 'object' && item !== null) {
            // For attachments or linked records, try to get a meaningful value
            if ('url' in item) return item.url
            if ('name' in item) return item.name
            if ('id' in item) return item.id
            return JSON.stringify(item)
          }
          return String(item)
        })
        .join('; ')
    }
    else if (typeof value === 'object') {
      // Handle objects (e.g., collaborators, barcode)
      stringValue = JSON.stringify(value)
    }
    else {
      stringValue = String(value)
    }

    // Escape quotes and wrap in quotes if needed
    if (
      stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n')
    ) {
      return `"${stringValue.replaceAll('"', '""')}"`
    }

    return stringValue
  }

  // Create header row
  const headerRow = allColumns.map(escapeValue).join(',')

  // Create data rows
  const dataRows = records.map((record) => {
    const row = [
      record.id,
      record.createdTime,
      ...sortedFields.map((field) => escapeValue(record.fields[field])),
    ]
    return row.join(',')
  })

  return [headerRow, ...dataRows].join('\n')
}

async function main() {
  console.log('\n🚀 Airtable to CSV Export')
  console.log('========================\n')

  // Validate configuration
  if (!API_KEY) {
    console.error(
      '❌ Error: AIRTABLE_API_KEY or AIRTABLE_PAT environment variable is required',
    )
    console.error(
      '   Add it to your .env.development file or set it in your environment',
    )
    process.exit(1)
  }

  if (!BASE_ID) {
    console.error('❌ Error: AIRTABLE_BASE_ID environment variable is required')
    console.error(
      '   You can find your Base ID in the Airtable URL: airtable.com/appXXXXXX/...',
    )
    process.exit(1)
  }

  console.log('📋 Configuration:')
  console.log(`   Base ID: ${BASE_ID}`)
  console.log(`   Table: ${TABLE_NAME}`)
  console.log(`   API Key: ${API_KEY.slice(0, 10)}...${API_KEY.slice(-4)}`)
  console.log('')

  try {
    // Fetch all records
    const records = await fetchAllRecords(BASE_ID, TABLE_NAME, API_KEY)

    if (records.length === 0) {
      console.log('⚠️  No records found in the table')
      return
    }

    // Convert to CSV
    const csv = recordsToCsv(records)

    // Ensure exports directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replaceAll(/[.:]/g, '-')
    const safeTableName = TABLE_NAME.replaceAll(/[^\dA-Za-z]/g, '_').toLowerCase()
    const filename = `${safeTableName}_${timestamp}.csv`
    const outputPath = path.join(OUTPUT_DIR, filename)

    // Write CSV file
    fs.writeFileSync(outputPath, csv, 'utf-8')

    console.log('\n📁 CSV exported successfully!')
    console.log(`   Location: ${outputPath}`)
    console.log(`   Records: ${records.length}`)

    // Also print the first few records as a preview
    console.log('\n📊 Preview (first 3 records):')
    console.log('─'.repeat(50))
    for (const [i, record] of records.slice(0, 3).entries()) {
      console.log(`\nRecord ${i + 1}:`)
      for (const [key, value] of Object.entries(record.fields)
        .slice(0, 5)) {
        const displayValue =
            typeof value === 'object' ? JSON.stringify(value) : value
        console.log(`  ${key}: ${displayValue}`)
      }
      if (Object.keys(record.fields).length > 5) {
        console.log(`  ... and ${Object.keys(record.fields).length - 5} more fields`)
      }
    }
  }
  catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
