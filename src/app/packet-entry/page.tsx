'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PacketData {
  customerName: string
  contactNumber: string
  gemstoneType: string
}

export default function PacketEntryPage() {
  const [formData, setFormData] = useState<PacketData>({
    customerName: '',
    contactNumber: '',
    gemstoneType: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [packetId, setPacketId] = useState('')
  const [qrCodePath, setQrCodePath] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/packets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setPacketId(data.uniqueId)
        setQrCodePath(data.qrCodePath)
        setSuccess(true)
        setFormData({ customerName: '', contactNumber: '', gemstoneType: '' })
      } else {
        setError(data.message || 'Failed to create packet')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const printQRCode = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow && qrCodePath) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${packetId}</title>
            <style>
              body { text-align: center; font-family: Arial, sans-serif; }
              .qr-container { margin: 20px; }
              .packet-id { font-size: 18px; font-weight: bold; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="packet-id">Packet ID: ${packetId}</div>
              <img src="${qrCodePath}" alt="QR Code" style="max-width: 300px;" />
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-green-600 text-4xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Packet Created Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              Unique ID: <span className="font-mono font-bold">{packetId}</span>
            </p>
            
            {qrCodePath && (
              <div className="mb-6">
                <img 
                  src={qrCodePath} 
                  alt="QR Code" 
                  className="mx-auto mb-4 border border-gray-300 rounded"
                />
                <button
                  onClick={printQRCode}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Print QR Code
                </button>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => {
                  setSuccess(false)
                  setPacketId('')
                  setQrCodePath('')
                }}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Create Another Packet
              </button>
              <Link
                href="/dashboard"
                className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Packet Entry
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.customerName}
                onChange={handleInputChange}
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number
              </label>
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.contactNumber}
                onChange={handleInputChange}
                placeholder="Enter contact number"
              />
            </div>

            <div>
              <label htmlFor="gemstoneType" className="block text-sm font-medium text-gray-700 mb-1">
                Gemstone Type
              </label>
              <input
                id="gemstoneType"
                name="gemstoneType"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.gemstoneType}
                onChange={handleInputChange}
                placeholder="Enter Gemstone type"
              />
            </div>     

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Creating Packet...' : 'Create Packet'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/dashboard"
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
