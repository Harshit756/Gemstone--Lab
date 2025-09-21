import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

// ---------- Helper to embed PNG/JPG ----------
async function embedImage(pdfDoc: PDFDocument, imagePath: string) {
  const imageBytes = fs.readFileSync(imagePath)
  const isPng =
    imageBytes[0] === 0x89 &&
    imageBytes[1] === 0x50 &&
    imageBytes[2] === 0x4e &&
    imageBytes[3] === 0x47
  const isJpg = imageBytes[0] === 0xff && imageBytes[1] === 0xd8

  if (isPng) return await pdfDoc.embedPng(imageBytes)
  if (isJpg) return await pdfDoc.embedJpg(imageBytes)
  throw new Error(`Unsupported image format: ${imagePath}`)
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

// ---------- Safe Y Position + PDFPage Break ----------
function addNewPage(pdfDoc: PDFDocument, pages: PDFPage[]): PDFPage {
  const newPage = pdfDoc.addPage([595.28, 841.89])
  pages.push(newPage)
  return newPage
}

// ---------- Estimate Section Height ----------
function estimateSectionHeight(fields: [string, any][]): number {
  const lineHeight = 14
  return 45 + fields.length * lineHeight // 45 for header + spacing
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

    // === Header (First PDFPage Only) ===
    const logoPath = path.join(process.cwd(), 'public', 'logo.jpeg')
    if (fs.existsSync(logoPath)) {
      const logoImage = await embedImage(pdfDoc, logoPath)
      const dims = logoImage.scale(1)
      const scale = Math.min(160 / dims.width, 60 / dims.height)
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

    // Report Info Box
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

    // Photo Box
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
      const imgPath = path.join(process.cwd(), 'public', data.uploadedImage)
      if (fs.existsSync(imgPath)) {
        const gemImage = await embedImage(pdfDoc, imgPath)
        const dims = gemImage.scale(1)
        const scale = Math.min(136 / dims.width, 136 / dims.height)
        page.drawImage(gemImage, {
          x: width - 180 + (136 - dims.width * scale) / 2,
          y: photoBoxY + (136 - dims.height * scale) / 2,
          width: dims.width * scale,
          height: dims.height * scale,
        })
      }
    }

    // === Sections ===
    let yPos = height - 280

    const sections: [string, [string, any][]][] = [
      [
        'Basic Information',
        [
          ['Color', data.test.color],
          ['Cut', data.test.cut],
          ['Clarity', data.test.clarity],
          ['Carat', data.test.carat],
          ['Authenticity', data.test.authenticity],
        ],
      ],
      [
        'Measurements & Physical Properties',
        [
          ['Measurements', data.test.measurements],
          ['Weight', data.test.weight],
          ['Dimension', data.test.dimension],
          ['Shape', data.test.shape],
          ['Transparency', data.test.transparency],
          ['Cutting Style (Crown)', data.test.cuttingStyleCrown],
          ['Cutting Style (Pavilion)', data.test.cuttingStylePavilion],
          ['Optic Character', data.test.opticCharacter],
          ['Refractive Index', data.test.refractiveIndex],
          ['Specific Gravity', data.test.specificGravity],
          ['Magnification', data.test.magnification],
        ],
      ],
      [
        'Species & Origin',
        [
          ['Species', data.test.species],
          ['Variety', data.test.variety],
          ['Origin', data.test.origin],
        ],
      ],
      [
        'Grading',
        [
          ['Color Grade', data.test.colorGrade],
          ['Clarity Grade', data.test.clarityGrade],
          ['Cut Grade', data.test.cutGrade],
          ['Polish', data.test.polish],
          ['Symmetry', data.test.symmetry],
          ['Fluorescence', data.test.fluorescence],
        ],
      ],
    ]

    for (const [section, fields] of sections) {
      const sectionHeight = estimateSectionHeight(fields)
      if (yPos - sectionHeight < BOTTOM_MARGIN) {
        page = addNewPage(pdfDoc, pages)
        yPos = height - 80
      }
      yPos = drawSectionHeader(page, section, LEFT_MARGIN, yPos, boldFont)
      for (const [label, value] of fields) {
        yPos = drawWrappedField(page, label, value, LEFT_MARGIN, yPos, font, FIELD_WIDTH)
      }
    }

    // Notes at End
    const notesHeight = 100
    if (yPos - notesHeight < BOTTOM_MARGIN) {
      page = addNewPage(pdfDoc, pages)
      yPos = height - 80
    }
    yPos = drawSectionHeader(page, 'Notes', LEFT_MARGIN, yPos, boldFont)
    yPos = drawNotes(page, data.test.notes, LEFT_MARGIN, yPos, font, FIELD_WIDTH)

    // === Footer for Each PDFPage ===
    pages.forEach((pg, idx) => {
      pg.drawRectangle({
        x: 20,
        y: 20,
        width: width - 40,
        height: height - 40,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      })

      if (data.qrCodePath) {
        const qrPath = path.join(process.cwd(), 'public', data.qrCodePath)
        if (fs.existsSync(qrPath)) {
          embedImage(pdfDoc, qrPath).then(qrImage => {
            pg.drawImage(qrImage, { x: 40, y: 30, width: 60, height: 60 })
          })
        }
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

      pg.drawText(`PDFPage ${idx + 1} of ${pages.length}`, {
        x: width / 2 - 40,
        y: 28,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      })

      if (fs.existsSync(logoPath)) {
        embedImage(pdfDoc, logoPath).then(logoImage => {
          const dims = logoImage.scale(1)
          const scale = Math.min(350 / dims.width, 350 / dims.height)
          pg.drawImage(logoImage, {
            x: width / 2 - (dims.width * scale) / 2,
            y: height / 2 - (dims.height * scale) / 2,
            width: dims.width * scale,
            height: dims.height * scale,
            opacity: 0.06,
          })
        })
      }
    })

    // === Save ===
    const pdfBytes = await pdfDoc.save()
    const filename = `${reportType}-report-${data.packet.uniqueId}-${Date.now()}.pdf`
    const reportsDir = path.join(process.cwd(), 'public', 'reports')
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true })
    const filepath = path.join(reportsDir, filename)
    fs.writeFileSync(filepath, pdfBytes)

    return `/reports/${filename}`
  } catch (error) {
    console.error('Error generating PDF report:', error)
    throw new Error('Failed to generate PDF report')
  }
}
