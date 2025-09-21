import QRCode from 'qrcode'
import { put } from '@vercel/blob'

export async function generateQRCode(uniqueId: string): Promise<string> {
  try {
    // Generate QR Code as Data URL
    const qrCodeDataURL = await QRCode.toDataURL(uniqueId, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    // Convert data URL to buffer
    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Create filename
    const filename = `qr-${uniqueId}.png`

    // Upload to Vercel Blob
    const { url } = await put(filename, buffer, {
      access: 'public',
      contentType: 'image/png',
    })

    // Return public URL (instead of local /public path)
    return url
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}
