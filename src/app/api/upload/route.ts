import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { requireAuth } from '@/lib/requireAuth'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  const user = requireAuth(request)

  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    if (!file) return NextResponse.json({ message: 'No file uploaded' }, { status: 400 })

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) return NextResponse.json({ message: 'Invalid file type' }, { status: 400 })

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) return NextResponse.json({ message: 'File too large' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const timestamp = Date.now()
    const fileExtension = path.extname(file.name)
    const filename = `gemstone-${timestamp}${fileExtension}`

    // Save directly to Vercel Blob Storage
    const { url } = await put(filename, buffer, {
      access: 'public',
      contentType: file.type,
    })

    return NextResponse.json({ success: true, filename, url, message: 'File uploaded successfully' })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
