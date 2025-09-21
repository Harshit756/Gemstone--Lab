import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'

export async function generateQRCode(uniqueId: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(uniqueId, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // Convert data URL to buffer
    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Create filename and path
    const filename = `qr-${uniqueId}.png`
    const filepath = path.join(process.cwd(), 'public', 'qrcodes', filename)

    // Ensure directory exists
    const qrDir = path.join(process.cwd(), 'public', 'qrcodes')
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true })
    }

    // Write file
    fs.writeFileSync(filepath, buffer)

    // Return relative path for database storage
    return `/qrcodes/${filename}`
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}
