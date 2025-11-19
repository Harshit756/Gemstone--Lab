import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib'
import { put } from '@vercel/blob'

// ---------- Helper to embed PNG/JPG ----------
async function embedImageFromUrl(pdfDoc: PDFDocument, url: string) {
  const res = await fetch(url)
  const imageBytes = new Uint8Array(await res.arrayBuffer())
  const isPng =
    imageBytes[0] === 0x89 &&
    imageBytes[1] === 0x50 &&
    imageBytes[2] === 0x4e &&
    imageBytes[3] === 0x47
  const isJpg = imageBytes[0] === 0xff && imageBytes[1] === 0xd8
  if (isPng) return await pdfDoc.embedPng(imageBytes)
  if (isJpg) return await pdfDoc.embedJpg(imageBytes)
  throw new Error(`Unsupported image format from URL: ${url}`)
}

// ---------- Section Header ----------
function drawSectionHeader(page: PDFPage, text: string, x: number, y: number, font: any) {
  const textWidth = font.widthOfTextAtSize(text, 13)
  y -= 30
  page.drawText(text, { x, y, size: 13, font, color: rgb(0, 0, 0.7) })
  page.drawLine({
    start: { x, y: y - 2 },
    end: { x: x + textWidth, y: y - 2 },
    thickness: 1,
    color: rgb(0, 0, 0.7),
  })
  return y - 15
}

// ---------- Wrapped Field ----------
function drawWrappedField(
  page: PDFPage,
  label: string,
  value: any,
  x: number,
  y: number,
  font: any,
  maxWidth: number
) {
  const displayValue = value ? String(value) : '-'
  const labelText = `${label}:`
  const labelWidth = font.widthOfTextAtSize(labelText, 11)

  page.drawText(labelText, { x, y, size: 11, font, color: rgb(0.1, 0.1, 0.1) })
  page.drawText(displayValue, {
    x: x + labelWidth + 6,
    y,
    size: 11,
    font,
    color: rgb(0.2, 0.2, 0.2),
  })
  return y - 14
}

// ---------- Notes with Wrapping ----------
function drawNotes(page: PDFPage, notes: string, x: number, y: number, font: any, maxWidth: number) {
  const displayValue = notes ? String(notes) : '-'
  const lineHeight = 14
  let lineY = y

  const words = displayValue.split(' ')
  let line = ''

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? line + ' ' + words[i] : words[i]
    const testWidth = font.widthOfTextAtSize(testLine, 11)
    if (testWidth > maxWidth && line) {
      page.drawText(line, { x, y: lineY, size: 11, font, color: rgb(0.2, 0.2, 0.2) })
      line = words[i]
      lineY -= lineHeight
    } else {
      line = testLine
    }
  }
  if (line) {
    page.drawText(line, { x, y: lineY, size: 11, font, color: rgb(0.2, 0.2, 0.2) })
  }
  return lineY - lineHeight
}

// ---------- Safe Y Position + Page Break ----------
function addNewPage(pdfDoc: PDFDocument, pages: PDFPage[]): PDFPage {
  const newPage = pdfDoc.addPage([595.28, 841.89])
  pages.push(newPage)
  return newPage
}

// ---------- Estimate Section Height ----------
function estimateSectionHeight(fields: [string, any][]): number {
  const lineHeight = 14
  return 45 + fields.length * lineHeight
}

// ---------- Report Field Config ----------
const REPORT_FIELDS: Record<string, [string, [string, string][]][]> = {
  gemstone: [
    [
      'Basic Information',
      [
        ['Shape', 'shape'],
        ['Cut', 'cut'],
        ['Weight', 'weight'],
        ['Color', 'color'],
        ['Dimension', 'dimension'],
      ],
    ],
    [
      'Optical & Physical Properties',
      [
        ['Transparency', 'transparency'],
        ['Optic Character', 'opticCharacter'],
        ['Refractive Index', 'refractiveIndex'],
        ['Beirefringence', 'beirefringence'],
        ['Magnification', 'magnification'],
        ['Specific Gravity', 'specificGravity'],
        ['Species', 'species'],
        ['Variety', 'variety'],
        ['Origin', 'origin'],
      ],
    ],
  ],
  diamond: [
    [
      'Grading',
      [
        ['Color Grade', 'colorGrade'],
        ['Clarity Grade', 'clarityGrade'],
        ['Cut Grade', 'cutGrade'],
        ['Polish', 'polish'],
        ['Symmetry', 'symmetry'],
        ['Fluorescence', 'fluorescence'],
      ],
    ],
    [
      'Species & Origin',
      [
        ['Species', 'species'],
        ['Variety', 'variety'],
        ['Origin', 'origin'],
      ],
    ],
  ],
  jewellery: [
    [
      'Basic Information',
      [
        ['Shape', 'shape'],
        ['Cutting Style Crown','cuttingStyleCrown'],
        ['Weight', 'weight'],
        ['Cutting Style', 'cuttingStylePavilion'],
        ['Trasnparency','transparency'],
        ['Dimension', 'dimension'],
      ],
    ],
  ],
}

export async function generateReportPDF(data: any): Promise<string> {
  try {
    const reportType = data.reportType || 'gemstone'
    const pdfDoc = await PDFDocument.create()
    const pages: PDFPage[] = [pdfDoc.addPage([595.28, 841.89])]
    let page = pages[0]
    const { width, height } = page.getSize()

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const LEFT_MARGIN = 50
    const FIELD_WIDTH = width - LEFT_MARGIN - 60
    const BOTTOM_MARGIN = 100

    // === Header (First Page Only) ===
    if (data.logoUrl) {
      const logoImage = await embedImageFromUrl(pdfDoc, data.logoUrl)
      const dims = logoImage.scale(1)
      const scale = Math.min(300 / dims.width, 85 / dims.height)
      page.drawImage(logoImage, {
        x: (width - dims.width * scale) / 2,
        y: height - 100,
        width: dims.width * scale,
        height: dims.height * scale,
      })
    }

    const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`
    const titleWidth = boldFont.widthOfTextAtSize(title, 16)
    page.drawText(title, {
      x: (width - titleWidth) / 2,
      y: height - 120,
      size: 16,
      font: boldFont,
    })

    page.drawLine({
      start: { x: 30, y: height - 130 },
      end: { x: width - 30, y: height - 130 },
      thickness: 1,
      color: rgb(0, 0, 0),
    })

    // === Contact Number (Header Right) ===
    const contactText = 'Contact No: 9079698209'
    const contactWidth = font.widthOfTextAtSize(contactText, 10)
    page.drawText(contactText, {
      x: width - contactWidth - 40,
      y: height - 70,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    })

    // === Info Box ===
    page.drawRectangle({
      x: 30,
      y: height - 240,
      width: width - 60,
      height: 80,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    })
    const infoY = height - 180
    page.drawText(`Report no: ${data.packet.uniqueId}`, { x: 45, y: infoY, size: 12, font })
    page.drawText(`Customer: ${data.packet.customerName}`, { x: 45, y: infoY - 20, size: 12, font })
    page.drawText(`Gemstone: ${data.packet.gemstoneType}`, { x: 45, y: infoY - 40, size: 12, font })
    const dateText = `Date: ${new Date(data.packet.dateReceived).toLocaleDateString()}`
    const dateWidth = font.widthOfTextAtSize(dateText, 12)
    page.drawText(dateText, { x: width - 60 - dateWidth, y: infoY, size: 12, font })

    // === Photo Box ===
    const photoBoxY = height - 420
    page.drawRectangle({
      x: width - 180,
      y: photoBoxY,
      width: 140,
      height: 140,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    })
    if (data.uploadedImage) {
      const gemImage = await embedImageFromUrl(pdfDoc, data.uploadedImage)
      const dims = gemImage.scale(1)
      const scale = Math.min(136 / dims.width, 136 / dims.height)
      page.drawImage(gemImage, {
        x: width - 180 + (136 - dims.width * scale) / 2,
        y: photoBoxY + (136 - dims.height * scale) / 2,
        width: dims.width * scale,
        height: dims.height * scale,
      })
    }

    // === Dynamic Sections ===
    let yPos = height - 280
    const sections = REPORT_FIELDS[reportType] || []

    for (const [section, fields] of sections) {
      const sectionHasData = fields.some(([_, key]) => {
        if (key === 'origin') {
          return !!data.test.origin
        }
        return !!data.test[key]
      })
      if (!sectionHasData) continue

      const sectionHeight = estimateSectionHeight(fields)
      if (yPos - sectionHeight < BOTTOM_MARGIN) {
        page = addNewPage(pdfDoc, pages)
        yPos = height - 80
      }

      yPos = drawSectionHeader(page, section, LEFT_MARGIN, yPos, boldFont)

      for (const [label, key] of fields) {
        if (key === 'origin' && !data.test.origin) continue
        const value = data.test[key]
        if (value) {
          yPos = drawWrappedField(page, label, value, LEFT_MARGIN, yPos, font, FIELD_WIDTH)
        }
      }
    }

    // === Notes and Remarks ===
    if (data.test.notes) {
      yPos -= 20;
      if (yPos - 100 < BOTTOM_MARGIN) {
        page = addNewPage(pdfDoc, pages)
        yPos = height - 80
      }
      yPos = drawSectionHeader(page, 'Conclusion', LEFT_MARGIN, yPos, boldFont)
      yPos = drawNotes(page, data.test.notes, LEFT_MARGIN, yPos, font, FIELD_WIDTH)
    }

    if (data.test.remark) {
      if (yPos - 100 < BOTTOM_MARGIN) {
        page = addNewPage(pdfDoc, pages)
        yPos = height - 80
      }
      yPos = drawSectionHeader(page, 'Remark', LEFT_MARGIN, yPos, boldFont)
      yPos = drawNotes(page, data.test.remark, LEFT_MARGIN, yPos, font, FIELD_WIDTH)
    }
      
    for (let idx = 0; idx < pages.length; idx++) {
      const pg = pages[idx]
      pg.drawRectangle({
        x: 20,
        y: 25,
        width: width - 40,
        height: height - 45,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      })

      if (data.qrCodeUrl) {
        const qrImage = await embedImageFromUrl(pdfDoc, data.qrCodeUrl)
        pg.drawImage(qrImage, { x: 40, y: 30, width: 60, height: 60 })
      }

      if (data.signUrl) {
      const signImage = await embedImageFromUrl(pdfDoc, data.signUrl)
      pg.drawImage(signImage, { x: width - 140, y: 55, width: 80, height: 60 })
      
    }

      const sigName = 'Preeti Jhalani'
      const sigTitle = 'FGA'
      const sigNameWidth = boldFont.widthOfTextAtSize(sigName, 12)
      pg.drawText(sigName, { x: width - 60 - sigNameWidth, y: 60, size: 12, font: boldFont })
      pg.drawText(sigTitle, {
        x: width - 60 - font.widthOfTextAtSize(sigTitle, 10),
        y: 44,
        size: 10,
        font,
      })

      // === Two-line Address (Centered Footer) ===
      const addressLine1 = '1996, Kothari Bhawan, 2nd Floor, Pitaliyon Ka Chowk,'
      const addressLine2 = 'Johari Bazar, Jaipur.'
      const addressWidth1 = boldFont.widthOfTextAtSize(addressLine1, 9)
      const addressWidth2 = boldFont.widthOfTextAtSize(addressLine2, 9)
      pg.drawText(addressLine1, {
        x: (width - addressWidth1) / 2,
        y: 60,
        size: 9,
        font,
        color: rgb(0.3, 0.3, 0.3),
      })
      pg.drawText(addressLine2, {
        x: (width - addressWidth2) / 2,
        y: 52,
        size: 9,
        font,
        color: rgb(0.3, 0.3, 0.3),
      })

        pg.drawText(`Page ${idx + 1} of ${pages.length}`, {
        x: width / 2 - 40,
        y: 28,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      })


      // === Watermark ===
      if (data.logoUrl) {
        const logoImage = await embedImageFromUrl(pdfDoc, data.logoUrl)
        const dims = logoImage.scale(1)
        const scale = Math.min(350 / dims.width, 350 / dims.height)
        pg.drawImage(logoImage, {
          x: width / 2 - (dims.width * scale) / 2,
          y: height / 2 - (dims.height * scale) / 2,
          width: dims.width * scale,
          height: dims.height * scale,
          opacity: 0.06,
        })
      }

const importantNote =
  'Important note: The conclusions on this gemstone report reflect our findings at the time it is issued. ' +
  'A gemstone could be modified and/or enhanced at any time. Therefore, TGL can reconfirm at any time if a stone is in line with the Gemstone Report.'

const noteFontSize = 8
const noteColor = rgb(0.4, 0.4, 0.4)
const noteMaxWidth = width - 80
const words = importantNote.split(' ')
let line = ''
let noteY = 14 // positioned just below border
const lineHeight = 9

for (let i = 0; i < words.length; i++) {
  const testLine = line ? line + ' ' + words[i] : words[i]
  const testWidth = font.widthOfTextAtSize(testLine, noteFontSize)
  if (testWidth > noteMaxWidth && line) {
    pg.drawText(line, {
      x: 40,
      y: noteY,
      size: noteFontSize,
      font,
      color: noteColor,
    })
    line = words[i]
    noteY -= lineHeight
  } else {
    line = testLine
  }
}
if (line) {
  pg.drawText(line, { x: 40, y: noteY, size: noteFontSize, font, color: noteColor })
}
    }

    // === Save & Upload ===
    const pdfBytes = await pdfDoc.save()
    const buffer = Buffer.from(pdfBytes)
    const filename = `${reportType}-report-${data.packet.uniqueId}-${Date.now()}.pdf`

    const { url } = await put(filename, buffer, {
      access: 'public',
      contentType: 'application/pdf',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return url
  } catch (error) {
    console.error('Error generating PDF report:', error)
    throw new Error('Failed to generate PDF report')
  }
}
