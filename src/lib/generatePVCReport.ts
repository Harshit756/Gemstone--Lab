import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

/* =========================
   IMAGE HELPER
========================= */
async function embedImageFromUrl(pdfDoc: any, url: string) {
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Image fetch failed: ${res.status} ${url}`)
  }

  const bytes = new Uint8Array(await res.arrayBuffer())

  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47

  const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8

  if (isPng) return await pdfDoc.embedPng(bytes)
  if (isJpg) return await pdfDoc.embedJpg(bytes)

  throw new Error('Unsupported image format')
}

/* =========================
   SAFE JSON PARSER (KEY FIX)
========================= */
function parseComments(comments: any) {
  let parsed: any = {}

  try {
    // already object
    if (typeof comments === 'object' && comments !== null) {
      return comments
    }

    if (typeof comments === 'string') {
      let str = comments.trim()

      // fix double encoded JSON
      if (str.startsWith('"') && str.endsWith('"')) {
        str = JSON.parse(str)
      }

      parsed = JSON.parse(str)
    }
  } catch (e) {
    console.error('Invalid comments JSON:', comments)
  }

  return parsed
}

/* =========================
   MAIN FUNCTION
========================= */
export async function generatePVCReport(data: any) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([242.65, 153.07])
  const { width, height } = page.getSize()

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  /* =========================
     PARSE COMMENTS (FIXED)
  ========================= */
  const parsed = parseComments(data.notes)

  /* =========================
     FIX URLS (relative → absolute)
  ========================= */
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const fixUrl = (url: string) =>
    url?.startsWith('http') ? url : url ? baseUrl + url : null

  const imageUrl = fixUrl(data.imageUrl)
  const logoUrl = fixUrl(data.logoUrl)
  const qrUrl = fixUrl(data.qrCodeUrl)

  /* =========================
     BORDER
  ========================= */
  page.drawRectangle({
    x: 2,
    y: 2,
    width: width - 4,
    height: height - 4,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
  })

  /* =========================
     LOGO
  ========================= */
  if (logoUrl) {
    try {
      const logo = await embedImageFromUrl(pdfDoc, logoUrl)
      page.drawImage(logo, {
        x: 8,
        y: height - 30,
        width: 60,
        height: 20,
      })
    } catch (e) {
      console.error('Logo failed:', e)
    }
  }
   page.drawText('ISO 9001:2015', {
    x: width - 55,
    y: height - 20,
    size: 5,
  
    })
  /* =========================
     TITLE
  ========================= */
  page.drawText('GEMSTONE REPORT', {
    x: width - 160,
    y: height - 40,
    size: 8,
    font: boldFont,
  })

  /* =========================
     LEFT DATA
  ========================= */
  let y = height - 55
  const gap = 8

  const drawRow = (label: string, value: string) => {
    page.drawText(label, { x: 10, y, size: 6, font: boldFont })
    page.drawText(`: ${value || '-'}`, {
      x: 95,
      y,
      size: 6,
      font,
    })
    y -= gap
  }

  drawRow('Report #', data.reportNumber)
  //drawRow('Item', data.itemName)
  drawRow('Weight', data.weight || parsed.weight)
  drawRow('Shape', data.shape || parsed.shape)
  drawRow('Cut', data.cut)
  drawRow('Measurements', data.measurements)
  drawRow('Color', data.color)
  drawRow('Transparency', data.transparency || parsed.transparency)
  drawRow('Identification', data.identification)

  /* =========================
     COMMENTS (CLEAN)
  ========================= */
const startY = y - 2

const label = 'Comments:'
const labelWidth = boldFont.widthOfTextAtSize(label, 6)

page.drawText(label, {
  x: 10,
  y: startY,
  size: 6,
  font: boldFont,
})

const commentText =
  data.comments ||
  [
    parsed.remark && `Remark: ${parsed.remark}`,
    parsed.weight && `Wt: ${parsed.weight}`,
    parsed.transparency && `Trans: ${parsed.transparency}`,
    parsed.shape && `Shape: ${parsed.shape}`,
  ]
    .filter(Boolean)
    .join(', ') || '-'

page.drawText(commentText, {
  x: 10 + labelWidth + 4,
  y: startY,
  size: 6,
  font,
  maxWidth: width - (10 + labelWidth + 10),
  lineHeight: 7,
})
  /* =========================
     GEM IMAGE
  ========================= */
  if (imageUrl) {
    try {
      console.log('Loading image:', imageUrl)

      const img = await embedImageFromUrl(pdfDoc, imageUrl)
      page.drawImage(img, {
        x: width - 60,
        y: 45,
        width: 50,
        height: 50,
      })
    } catch (e) {
      console.error('Image failed:', e)
    }
  }

  /* =========================
     QR CODE
  ========================= */
  if (qrUrl) {
    try {
      const qr = await embedImageFromUrl(pdfDoc, qrUrl)
      page.drawImage(qr, {
        x: width - 30,
        y: 5,
        width: 20,
        height: 20,
      })
    } catch (e) {
      console.error('QR failed:', e)
    }
  }

  /* =========================
     FOOTER
  ========================= */
  page.drawText(
    'Terms, Conditions and Disclosures on https://tgllaboratory.com',
    {
      x: 10,
      y: 8,
      size: 5,
      font,
    }
  )

  return await pdfDoc.save()
}