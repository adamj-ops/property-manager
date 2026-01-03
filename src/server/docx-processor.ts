/**
 * DOCX Template Processor
 * Handles parsing DOCX files, extracting variables, and validating template format.
 * EPM-83: Lease Template Import & Management
 */

import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'

export interface ParsedTemplate {
  content: string
  variables: string[]
  rawText: string
}

export interface TemplateValidationResult {
  valid: boolean
  error?: string
  warnings?: string[]
}

// Regex to match Handlebars-style variables: {{variable}} or {{#if condition}}
const VARIABLE_REGEX = /\{\{([#/]?[\w.]+)\}\}/g
const SIMPLE_VARIABLE_REGEX = /\{\{(?!#|\/)([\w.]+)\}\}/g
const CONDITIONAL_START_REGEX = /\{\{#(\w+)\}\}/g
const CONDITIONAL_END_REGEX = /\{\{\/(\w+)\}\}/g

/**
 * Parse a DOCX template file and extract its content and variables.
 * @param buffer - The DOCX file as an ArrayBuffer
 * @returns Parsed template with content and variables
 */
export async function parseDocxTemplate(buffer: ArrayBuffer): Promise<ParsedTemplate> {
  try {
    const zip = new PizZip(buffer)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      // Don't throw on missing variables during parsing
      nullGetter: () => '',
    })

    // Get the raw text content
    const rawText = doc.getFullText()

    // Extract all variables
    const variables = extractVariables(rawText)

    return {
      content: rawText,
      variables,
      rawText,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse DOCX template: ${error.message}`)
    }
    throw new Error('Failed to parse DOCX template: Unknown error')
  }
}

/**
 * Extract variable names from template content.
 * Supports simple variables {{variable}} and conditional blocks {{#if condition}}.
 * @param content - The template text content
 * @returns Array of unique variable names
 */
export function extractVariables(content: string): string[] {
  const variables = new Set<string>()

  // Extract simple variables
  let match
  while ((match = SIMPLE_VARIABLE_REGEX.exec(content)) !== null) {
    variables.add(match[1])
  }

  // Extract conditional variables (the condition itself is a variable)
  while ((match = CONDITIONAL_START_REGEX.exec(content)) !== null) {
    variables.add(match[1])
  }

  // Reset regex indices
  SIMPLE_VARIABLE_REGEX.lastIndex = 0
  CONDITIONAL_START_REGEX.lastIndex = 0

  return Array.from(variables).sort()
}

/**
 * Validate DOCX template format and structure.
 * @param buffer - The DOCX file as an ArrayBuffer
 * @returns Validation result with any errors or warnings
 */
export async function validateTemplateFormat(
  buffer: ArrayBuffer
): Promise<TemplateValidationResult> {
  const warnings: string[] = []

  try {
    // Try to open the file as a ZIP (DOCX is a ZIP format)
    const zip = new PizZip(buffer)

    // Check for required DOCX files
    const requiredFiles = ['word/document.xml', '[Content_Types].xml']
    for (const file of requiredFiles) {
      if (!zip.file(file)) {
        return {
          valid: false,
          error: `Invalid DOCX file: missing ${file}`,
        }
      }
    }

    // Try to create a docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '',
    })

    // Get content to check for variables
    const content = doc.getFullText()

    // Check for at least some template variables
    const variables = extractVariables(content)
    if (variables.length === 0) {
      warnings.push(
        'No template variables found. Templates should contain variables like {{tenant_name}}.'
      )
    }

    // Check for unbalanced conditionals
    const conditionalStarts = (content.match(CONDITIONAL_START_REGEX) || []).length
    const conditionalEnds = (content.match(CONDITIONAL_END_REGEX) || []).length
    if (conditionalStarts !== conditionalEnds) {
      warnings.push(
        `Unbalanced conditional blocks: ${conditionalStarts} opening, ${conditionalEnds} closing.`
      )
    }

    // Reset regex
    CONDITIONAL_START_REGEX.lastIndex = 0
    CONDITIONAL_END_REGEX.lastIndex = 0

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        valid: false,
        error: `Invalid DOCX file: ${error.message}`,
      }
    }
    return {
      valid: false,
      error: 'Invalid DOCX file: Unknown error',
    }
  }
}

/**
 * Render a template with the provided data.
 * @param buffer - The DOCX file as an ArrayBuffer
 * @param data - The data to substitute into the template
 * @returns The rendered document as an ArrayBuffer
 */
export async function renderTemplate(
  buffer: ArrayBuffer,
  data: Record<string, unknown>
): Promise<ArrayBuffer> {
  try {
    const zip = new PizZip(buffer)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: (part) => {
        // Return empty string for missing values
        if (part.module === 'rawxml') {
          return ''
        }
        return `[${part.value}]` // Show placeholder for missing values
      },
    })

    // Render the document with provided data
    doc.render(data)

    // Generate output
    const output = doc.getZip().generate({
      type: 'arraybuffer',
      compression: 'DEFLATE',
    })

    return output
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to render template: ${error.message}`)
    }
    throw new Error('Failed to render template: Unknown error')
  }
}

/**
 * Preview template content with sample data (text only, not full DOCX).
 * Useful for showing a quick preview without generating a full document.
 * @param content - The template text content
 * @param data - The data to substitute
 * @returns The preview text with variables replaced
 */
export function previewTemplateContent(
  content: string,
  data: Record<string, string | number | boolean>
): string {
  let preview = content

  // Replace simple variables
  preview = preview.replace(SIMPLE_VARIABLE_REGEX, (match, variable) => {
    const value = getNestedValue(data, variable)
    if (value !== undefined) {
      return String(value)
    }
    return `[${variable}]` // Show placeholder for missing values
  })

  // Handle conditionals (simplified - just remove the tags if condition is truthy)
  preview = preview.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (match, condition, content) => {
      const value = data[condition]
      if (value) {
        return content
      }
      return '' // Remove the entire block if condition is falsy
    }
  )

  return preview
}

/**
 * Get a nested value from an object using dot notation.
 * @param obj - The object to get the value from
 * @param path - The dot-notation path (e.g., 'tenant.name')
 * @returns The value at the path, or undefined if not found
 */
function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): unknown {
  const parts = path.split('.')
  let current: unknown = obj

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }

  return current
}

