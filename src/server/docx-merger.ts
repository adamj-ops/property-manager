/**
 * DOCX Merger
 * Merges multiple rendered DOCX documents into a single document.
 * EPM-43: Lease Document Generation
 *
 * Note: DOCX merging is complex. This is a simplified implementation that
 * combines document bodies with page breaks. For more complex formatting,
 * consider using a dedicated library or converting to PDF and merging PDFs.
 */

import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

/**
 * Merge multiple DOCX documents into a single document.
 * Documents are combined in order with page breaks between them.
 *
 * @param documentBuffers - Array of DOCX file buffers to merge
 * @returns Merged DOCX document as ArrayBuffer
 */
export async function mergeDocxDocuments(
  documentBuffers: ArrayBuffer[]
): Promise<ArrayBuffer> {
  if (documentBuffers.length === 0) {
    throw new Error('No documents to merge')
  }

  if (documentBuffers.length === 1) {
    return documentBuffers[0]
  }

  try {
    // Start with the first document as the base
    const baseZip = new PizZip(documentBuffers[0])
    const baseDoc = new Docxtemplater(baseZip, {
      paragraphLoop: true,
      linebreaks: true,
    })

    // Get the base document XML
    const baseDocumentXml = baseZip.files['word/document.xml'].asText()
    const baseBodyMatch = baseDocumentXml.match(/<w:body[^>]*>([\s\S]*)<\/w:body>/)
    if (!baseBodyMatch) {
      throw new Error('Invalid base document structure')
    }

    let combinedBody = baseBodyMatch[1]

    // Process each additional document
    for (let i = 1; i < documentBuffers.length; i++) {
      const docZip = new PizZip(documentBuffers[i])
      const docDoc = new Docxtemplater(docZip, {
        paragraphLoop: true,
        linebreaks: true,
      })

      const docXml = docZip.files['word/document.xml'].asText()
      const docBodyMatch = docXml.match(/<w:body[^>]*>([\s\S]*)<\/w:body>/)
      if (!docBodyMatch) {
        throw new Error(`Invalid document structure at index ${i}`)
      }

      const docBody = docBodyMatch[1]

      // Add page break before the next document
      const pageBreak =
        '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'

      // Combine bodies
      combinedBody += pageBreak + docBody

      // Merge relationships if they exist
      if (docZip.files['word/_rels/document.xml.rels']) {
        mergeRelationships(baseZip, docZip)
      }

      // Merge media files (images, etc.)
      mergeMediaFiles(baseZip, docZip)
    }

    // Replace the body in the base document
    const newDocumentXml = baseDocumentXml.replace(
      /<w:body[^>]*>[\s\S]*<\/w:body>/,
      `<w:body>${combinedBody}</w:body>`
    )

    // Update the document XML in the zip
    baseZip.file('word/document.xml', newDocumentXml)

    // Generate the merged document
    const output = baseZip.generate({
      type: 'arraybuffer',
      compression: 'DEFLATE',
    })

    return output
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to merge documents: ${error.message}`)
    }
    throw new Error('Failed to merge documents: Unknown error')
  }
}

/**
 * Merge relationships from source zip into target zip.
 * This handles references to images, headers, footers, etc.
 */
function mergeRelationships(targetZip: PizZip, sourceZip: PizZip): void {
  const targetRelsPath = 'word/_rels/document.xml.rels'
  const sourceRelsPath = 'word/_rels/document.xml.rels'

  if (!targetZip.files[targetRelsPath] || !sourceZip.files[sourceRelsPath]) {
    return
  }

  // For MVP, we'll keep the base relationships
  // In a full implementation, we'd need to merge and renumber relationship IDs
  // This is complex and would require XML parsing
}

/**
 * Merge media files (images) from source zip into target zip.
 * This handles images referenced in the documents.
 */
function mergeMediaFiles(targetZip: PizZip, sourceZip: PizZip): void {
  // Copy media files from source to target
  // DOCX stores media in word/media/
  const mediaRegex = /^word\/media\//

  for (const filename in sourceZip.files) {
    if (mediaRegex.test(filename)) {
      const file = sourceZip.files[filename]
      if (file && !targetZip.files[filename]) {
        targetZip.file(filename, file.asArrayBuffer())
      }
    }
  }
}

/**
 * Add a page break to a DOCX document.
 * Useful for separating sections when merging.
 *
 * @param buffer - DOCX file buffer
 * @returns DOCX document with page break added
 */
export async function addPageBreak(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const zip = new PizZip(buffer)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  })

  const documentXml = zip.files['word/document.xml'].asText()
  const bodyMatch = documentXml.match(/<w:body[^>]*>([\s\S]*)<\/w:body>/)
  if (!bodyMatch) {
    throw new Error('Invalid document structure')
  }

  const pageBreak = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
  const newBody = bodyMatch[1] + pageBreak
  const newDocumentXml = documentXml.replace(
    /<w:body[^>]*>[\s\S]*<\/w:body>/,
    `<w:body>${newBody}</w:body>`
  )

  zip.file('word/document.xml', newDocumentXml)

  const output = zip.generate({
    type: 'arraybuffer',
    compression: 'DEFLATE',
  })

  return output
}

