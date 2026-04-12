import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

// ✅ SAME IMAGE HELPER AS A4
async function embedImageFromUrl(pdfDoc: any, url: string) {
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

  throw new Error('Unsupported image format')
}

export async function generatePVCReport(data: any) {
  const pdfDoc = await PDFDocument.create()

  // ✅ PVC CARD SIZE
  const page = pdfDoc.addPage([242.65, 153.07])
  const { width, height } = page.getSize()

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

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
  if (data.logoUrl) {
    try {
      const logo = await embedImageFromUrl(pdfDoc, data.logoUrl)
      page.drawImage(logo, {
        x: 8,
        y: height - 30,
        width: 60,
        height: 20,
      })
    } catch {}
  }

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
     LEFT TEXT
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
  drawRow('Item', data.itemName)
  drawRow('Weight', data.weight)
  drawRow('Shape', data.shape)
   drawRow('Cut', data.cut)
  drawRow('Measurements', data.measurements)
  drawRow('Color', data.color)
  drawRow('Transparency', data.transparency)
  drawRow('Identification', data.identification)

  /* =========================
     COMMENTS
  ========================= */
  page.drawText('Comments:', {
    x: 10,
    y: y - 2,
    size: 6,
    font: boldFont,
  })

  page.drawText(data.comments || '-', {
    x: 10,
    y: y - 10,
    size: 6,
    maxWidth: 130,
    lineHeight: 7,
    font,
  })

  /* =========================
     GEM IMAGE
  ========================= */
  if (data.imageUrl) {
    try {
      const img = await embedImageFromUrl(pdfDoc, data.imageUrl)
      page.drawImage(img, {
        x: width - 60,
        y: 45,
        width: 50,
        height: 50,
      })
    } catch {}
  }

  /* =========================
     QR CODE
  ========================= */
  if (data.qrCodeUrl) {
    try {
      const qr = await embedImageFromUrl(pdfDoc, data.qrCodeUrl)
      page.drawImage(qr, {
        x: width - 30,
        y: 5,
        width: 20,
        height: 20,
      })
    } catch {}
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