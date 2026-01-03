/**
 * PDF Converter
 * Converts DOCX documents to PDF using mammoth (DOCX to HTML) and puppeteer (HTML to PDF).
 * EPM-43: Lease Document Generation
 */

import mammoth from 'mammoth'
import puppeteer from 'puppeteer'

/**
 * Convert a DOCX document to PDF.
 * Uses mammoth to convert DOCX to HTML, then puppeteer to render HTML to PDF.
 *
 * @param docxBuffer - DOCX file as ArrayBuffer
 * @param options - Conversion options
 * @returns PDF file as Buffer
 */
export async function convertDocxToPdf(
  docxBuffer: ArrayBuffer,
  options: {
    margin?: {
      top?: string
      right?: string
      bottom?: string
      left?: string
    }
    format?: 'Letter' | 'Legal' | 'Tabloid' | 'Ledger' | 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6'
    printBackground?: boolean
  } = {}
): Promise<Buffer> {
  try {
    // Convert DOCX to HTML using mammoth
    const htmlResult = await mammoth.convertToHtml(
      { arrayBuffer: docxBuffer },
      {
        styleMap: [
          // Map Word styles to HTML/CSS
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Title'] => h1.title:fresh",
          "p[style-name='Subtitle'] => h2.subtitle:fresh",
        ],
      }
    )

    const html = htmlResult.value
    const messages = htmlResult.messages

    // Log any warnings from mammoth
    if (messages.length > 0) {
      console.warn('Mammoth conversion warnings:', messages)
    }

    // Create a complete HTML document with styles
    const fullHtml = createHtmlDocument(html)

    // Convert HTML to PDF using puppeteer
    const pdfBuffer = await convertHtmlToPdf(fullHtml, options)

    return pdfBuffer
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to convert DOCX to PDF: ${error.message}`)
    }
    throw new Error('Failed to convert DOCX to PDF: Unknown error')
  }
}

/**
 * Create a complete HTML document with styles for PDF conversion.
 */
function createHtmlDocument(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      margin: 0;
      padding: 40px;
    }
    h1 {
      font-size: 18pt;
      font-weight: bold;
      margin-top: 12pt;
      margin-bottom: 6pt;
    }
    h2 {
      font-size: 16pt;
      font-weight: bold;
      margin-top: 12pt;
      margin-bottom: 6pt;
    }
    h3 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 10pt;
      margin-bottom: 4pt;
    }
    p {
      margin: 6pt 0;
      text-align: justify;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12pt 0;
    }
    table td, table th {
      border: 1px solid #000;
      padding: 6pt;
      text-align: left;
    }
    table th {
      font-weight: bold;
      background-color: #f0f0f0;
    }
    ul, ol {
      margin: 6pt 0;
      padding-left: 24pt;
    }
    li {
      margin: 3pt 0;
    }
    strong {
      font-weight: bold;
    }
    em {
      font-style: italic;
    }
    @page {
      margin: 1in;
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`
}

/**
 * Convert HTML to PDF using puppeteer.
 */
async function convertHtmlToPdf(
  html: string,
  options: {
    margin?: {
      top?: string
      right?: string
      bottom?: string
      left?: string
    }
    format?: 'Letter' | 'Legal' | 'Tabloid' | 'Ledger' | 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6'
    printBackground?: boolean
  } = {}
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    })

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: options.format || 'Letter',
      margin: {
        top: options.margin?.top || '1in',
        right: options.margin?.right || '1in',
        bottom: options.margin?.bottom || '1in',
        left: options.margin?.left || '1in',
      },
      printBackground: options.printBackground ?? true,
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}

