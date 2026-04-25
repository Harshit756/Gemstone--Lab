import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePVCReport } from '@/lib/generatePVCReport'

export const runtime = 'nodejs'

// ✅ SAME LOGO AS YOUR A4
const logoUrl =
  'https://djstsb6rqhj6a2kj.public.blob.vercel-storage.com/WhatsApp%20Image%202025-11-06%20at%201.56.53%20PM.jpeg'

export async function POST(req: NextRequest) {
  try {
    const { packetId } = await req.json()

    if (!packetId) {
      return NextResponse.json(
        { message: 'Packet ID required' },
        { status: 400 }
      )
    }

    // 🔍 Fetch packet + latest test (same pattern as A4 usage)
    const packet = await prisma.packet.findUnique({
      where: { uniqueId: packetId },
      include: {
        tests: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!packet) {
      return NextResponse.json(
        { message: 'Packet not found' },
        { status: 404 }
      )
    }

    const test = packet.tests?.[0]

    // ✅ Parse JSON stored in notes (CRITICAL)
    let testData: any = {}
    if (test?.notes) {
  try {
    testData = JSON.parse(test.notes)
  } catch (err) {
    console.error('Broken JSON detected, attempting fix...')

    try {
      let fixed = test.notes

      if (!fixed.trim().endsWith('}')) {
        fixed = fixed + '"}'
      }

      testData = JSON.parse(fixed)
    } catch {
      testData = {
        comments: test.notes
      }
    }
  }
    }

    // ✅ FINAL DATA (100% MATCHED WITH YOUR A4 STRUCTURE)
    const data =    {
      reportNumber: packet.uniqueId,
      itemName: packet.gemstoneType,

      // JSON fields
      weight: testData.weight || '',
      shape: testData.shape || '',
      measurements:
        testData.measurements || testData.dimension || '',
      transparency: testData.transparency || '',

      // DB fields
      color: test?.color || '',
      //identification: test?.authenticity || '',
       cut: test?.cut || '',
      // Comments (supports both notes & remark)
      comments: testData.comments || testData.remark || '',

      // Image (same key you store)
      imageUrl: testData.imageUrl || null,

      // QR Code
      qrCodeUrl: packet.qrCodePath,

      // Branding
      logoUrl,
    }

    // 🎯 Generate PVC PDF
    const pdfBytes = await generatePVCReport(data)

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
      },
    })
  } catch (error) {
    console.error('PVC ERROR:', error)

    return NextResponse.json(
      { message: 'Error generating PVC report' },
      { status: 500 }
    )
  }
}