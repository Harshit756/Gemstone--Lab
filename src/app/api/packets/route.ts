import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateUniqueId } from '@/lib/utils'
import { generateQRCode } from '@/lib/qr-generator'
import { requireAuth } from '@/lib/requireAuth'

export async function POST(request: NextRequest) {
  const user = requireAuth(request) // auto-401 if invalid

  const { customerName, contactNumber, gemstoneType } = await request.json()
  if (!customerName || !contactNumber || !gemstoneType) {
    return NextResponse.json({ message: 'All fields are required' }, { status: 400 })
  }

  try {
    const uniqueId = generateUniqueId()
    const qrCodePath = await generateQRCode(uniqueId)

    const packet = await prisma.packet.create({
      data: { uniqueId, customerName, contactNumber, gemstoneType, qrCodePath }
    })

    return NextResponse.json({
      id: packet.id,
      uniqueId: packet.uniqueId,
      qrCodePath: packet.qrCodePath,
      message: 'Packet created successfully'
    })
  } catch (error) {
    console.error('Packet creation error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const user = requireAuth(request)

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Raw query for case-insensitive search
    const packets = await prisma.$queryRaw<
      Array<{
        id: number
        uniqueId: string
        customerName: string
        contactNumber: string
        gemstoneType: string
        qrCodePath: string
        createdAt: Date
      }>
    >`
      SELECT *
      FROM Packet
      WHERE id = ${`${search.toLowerCase()}`}
         OR LOWER(uniqueId) = ${`${search.toLowerCase()}`}
         OR LOWER(customerName) LIKE ${`%${search.toLowerCase()}%`}
         OR LOWER(contactNumber) LIKE ${`%${search.toLowerCase()}%`}
      ORDER BY createdAt DESC
    `

    // Fetch related tests and reports for each packet
    const packetsWithRelations = await Promise.all(
      packets.map(async (packet) => {
        const tests = await prisma.test.findMany({ where: { packetId: packet.id } })
        const reports = await prisma.report.findMany({ where: { packetId: packet.id } })
        return { ...packet, tests, reports }
      })
    )

    return NextResponse.json({ packets: packetsWithRelations })
  } catch (error) {
    console.error('Error fetching packets:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
