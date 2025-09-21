import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateReportPDF } from '@/lib/pdf-generator'
import { requireAuth } from '@/lib/requireAuth'
import { Console } from 'console'

export async function POST(request: NextRequest) {
  const user = requireAuth(request)

  const {
    packetId, reportType, color, cut, clarity, carat, authenticity, notes,
    measurements, weight, cuttingStyleCrown, cuttingStylePavilion,
    transparency, shape, dimension, opticCharacter, refractiveIndex,
    specificGravity, magnification, species, variety, origin, colorGrade,
    clarityGrade, cutGrade, polish, symmetry, fluorescence, uploadedImage
  } = await request.json()

  if (!packetId || !reportType) {
    return NextResponse.json({ message: 'All required fields must be provided' }, { status: 400 })
  }
    const packet = await prisma.packet.findUnique({ where: { id: parseInt(packetId) } })
  try {
    const test = await prisma.test.create({
  data: {
    packetId: parseInt(packetId),
    color: color || null,
    cut: cut || null,
    clarity: clarity || null,
    carat: carat || null,
    authenticity: authenticity || null,
   // notes: notes || null,
    notes:JSON.stringify({
      // 👈 make sure you added a `details Json` field in your Prisma schema
      measurements, weight, cuttingStyleCrown, cuttingStylePavilion,
      transparency, shape, dimension, opticCharacter, refractiveIndex,
      specificGravity, magnification, species, variety, origin,
      colorGrade, clarityGrade, cutGrade, polish, symmetry, fluorescence,
      reportType,notes
    })
  }
})
    if (!packet) return NextResponse.json({ message: 'Packet not found' }, { status: 404 })

    try {
      const pdfPath = await generateReportPDF({
        packet: {
          uniqueId: packet.uniqueId,
          customerName: packet.customerName,
          contactNumber: packet.contactNumber,
          gemstoneType: packet.gemstoneType,
          dateReceived: packet.dateReceived
        },
        test: {
          color, cut, clarity, carat, authenticity, notes, measurements,
          weight, cuttingStyleCrown, cuttingStylePavilion, transparency,
          shape, dimension, opticCharacter, refractiveIndex, specificGravity,
          magnification, species, variety, origin, colorGrade, clarityGrade,
          cutGrade, polish, symmetry, fluorescence
        },
        qrCodePath: packet.qrCodePath,
        reportType: reportType || 'gemstone',
        uploadedImage
      })
      await prisma.report.create({ data: { packetId: parseInt(packetId), pdfPath } })
      return NextResponse.json({ test, reportGenerated: true, message: 'Test results saved and report generated successfully' })
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError)
      return NextResponse.json({ test, reportGenerated: false, message: 'Test results saved but report generation failed' })
    }
  } catch (error) {
    console.error('Test creation error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const user = requireAuth(request)

  try {
    const { searchParams } = new URL(request.url)
    const packetId = searchParams.get('packetId')
    let tests

    if (packetId) {
      tests = await prisma.test.findMany({
        where: { packetId: parseInt(packetId) },
        include: { packet: true },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      tests = await prisma.test.findMany({
        include: { packet: true },
        orderBy: { createdAt: 'desc' }
      })
    }

    return NextResponse.json({ tests })
  } catch (error) {
    console.error('Error fetching tests:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
