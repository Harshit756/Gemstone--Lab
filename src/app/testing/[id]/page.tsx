'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Packet {
  id: number
  uniqueId: string
  customerName: string
  contactNumber: string
  gemstoneType: string
  dateReceived: string
  qrCodePath: string
  tests: any[]
  reports?: any[]
}

interface TestData {
  reportType: 'jewellery' | 'gemstone' | 'diamond'
  color?: string
  cut?: string
  clarity?: string
  carat?: string
  authenticity?: string
  notes?: string
  measurements?: string
  weight?: string
  cuttingStyleCrown?: string
  cuttingStylePavilion?: string
  transparency?: string
  shape?: string
  dimension?: string
  opticCharacter?: string
  refractiveIndex?: string
  specificGravity?: string
  magnification?: string
  species?: string
  variety?: string
  origin?: string
  colorGrade?: string
  clarityGrade?: string
  cutGrade?: string
  polish?: string
  symmetry?: string
  fluorescence?: string
}

interface Props {
  params: { id: string }
}

// ---------------- Dropdown values ---------------- //
const dropdowns: Record<string, string[]> = {
  color: ['Red', 'Blue', 'Green', 'Yellow', 'White', 'Black', 'Pink', 'Other'],
  cut: ['Round', 'Princess', 'Emerald', 'Oval', 'Radiant', 'Pear', 'Cushion', 'Marquise', 'Asscher', 'Heart'],
  clarity: ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'],
  authenticity: ['Natural', 'Synthetic', 'Treated', 'Unknown'],
  transparency: ['Transparent', 'Translucent', 'Opaque'],
  opticCharacter: ['Uniaxial', 'Biaxial', 'Isotropic'],
  fluorescence: ['None', 'Faint', 'Medium', 'Strong', 'Very Strong'],
  cutGrade: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
  colorGrade: ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'],
  clarityGrade: ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'],
  polish: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
  symmetry: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor']
}

// ---------------- Field mapping ---------------- //
const reportFields: Record<string, string[]> = {
  gemstone: [
   'shape','cut', 'dimension', 'weight', 'color', 'transparency', 'opticCharacter', 'refractiveIndex', 'specificGravity',  
   'magnification', 'species',  'variety', 'notes' 
  ],
  diamond: [
    'carat', 'cut', 'color', 'clarity', 'measurements', 'cutGrade', 'colorGrade',
    'clarityGrade', 'polish', 'symmetry', 'fluorescence', 'notes'
  ],
  jewellery: [
    'weight', 'cuttingStyleCrown', 'cuttingStylePavilion', 'transparency',
    'shape', 'dimension', 'notes'
  ]
}

export default function TestPage({ params }: Props) {
  const router = useRouter()
  const [packet, setPacket] = useState<Packet | null>(null)
  const [testData, setTestData] = useState<TestData>({ reportType: 'gemstone' })
  const [loading, setLoading] = useState(true)
  const [testLoading, setTestLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // ---------------- Fetch Packet ---------------- //
  useEffect(() => {
    const fetchPacket = async () => {
      try {
        const res = await fetch(`/api/packets?search=${params.id}`)
        const data = await res.json()
        if (res.ok && data.packets && data.packets.length > 0) {
          const pkt = data.packets[0]
          setPacket(pkt)
          if (pkt.tests.length > 0) {
            setTestData({ reportType: pkt.tests[0].reportType || 'gemstone', ...pkt.tests[0] })
            if (pkt.tests[0].uploadedImage) setUploadedImage(pkt.tests[0].uploadedImage)
          }
        } else {
          setError('Packet not found')
        }
      } catch (err) {
        setError('Error fetching packet')
      } finally {
        setLoading(false)
      }
    }
    fetchPacket()
  }, [params.id])

  // ---------------- Input Change ---------------- //
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setTestData(prev => ({ ...prev, [name]: value }))
  }

  // ---------------- Image Upload ---------------- //
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) setUploadedImage(data.url)
      else setError(data.message || 'Upload failed')
    } catch (err) {
      setError('Error uploading image')
    } finally {
      setUploadLoading(false)
    }
  }

  // ---------------- Submit ---------------- //
  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!packet) return
    setTestLoading(true)
    setError('')
    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packetId: packet.id, ...testData, uploadedImage })
      })
      const data = await res.json()
      if (res.ok) setSuccess(true)
      else setError(data.message || 'Failed to save test')
    } catch (err) {
      setError('Error saving test')
    } finally {
      setTestLoading(false)
    }
  }

  // ---------------- Success Screen ---------------- //
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">✅ Test Saved!</h2>
            <p className="mb-4">Packet {packet?.uniqueId}</p>
            <div className="flex flex-col gap-3">
              {/* <button
                onClick={() => router.reload()}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Edit Again
              </button> */}
              <Link href={`/search`} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Back to Search
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---------------- Main Form ---------------- //
  if (loading) return <p className="text-center mt-20">Loading...</p>
  if (error) return <p className="text-center text-red-600 mt-20">{error}</p>

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Gemstone Test Form</h1>

        {packet && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <p><span className="font-semibold">Unique ID:</span> {packet.uniqueId}</p>
            <p><span className="font-semibold">Customer:</span> {packet.customerName}</p>
            <p><span className="font-semibold">Gemstone:</span> {packet.gemstoneType}</p>
            <p><span className="font-semibold">Date Received:</span> {new Date(packet.dateReceived).toLocaleDateString()}</p>
          </div>
        )}

        <form className="bg-white p-6 rounded-lg shadow-lg" onSubmit={handleTestSubmit}>
          {/* Report Type */}
          <div className="mb-4">
            <label className="font-semibold">Report Type:</label>
            <select
              name="reportType"
              value={testData.reportType}
              onChange={handleInputChange}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="gemstone">Gemstone</option>
              <option value="diamond">Diamond</option>
              <option value="jewellery">Jewellery</option>
            </select>
          </div>

          {/* Dynamic Fields */}
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {reportFields[testData.reportType].map((fieldName) => (
              <div key={fieldName}>
                <label className="block text-sm font-semibold mb-1">
                  {fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </label>
                {dropdowns[fieldName] ? (
                  <select
                    name={fieldName}
                    value={(testData as any)[fieldName] || ''}
                    onChange={handleInputChange}
                    className="w-full border px-2 py-1 rounded"
                  >
                    <option value="">Select {fieldName}</option>
                    {dropdowns[fieldName].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name={fieldName}
                    placeholder={`Enter ${fieldName}`}
                    value={(testData as any)[fieldName] || ''}
                    onChange={handleInputChange}
                    className="w-full border px-2 py-1 rounded"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Image Upload */}
          <div className="mt-4">
            <label>Upload Image:</label>
            <input type="file" onChange={handleImageUpload} />
            {uploadLoading && <p>Uploading...</p>}
            {uploadedImage && <img src={uploadedImage} alt="Uploaded" className="mt-2 w-32" />}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={testLoading}
            className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {testLoading ? 'Saving...' : 'Save Test'}
          </button>
        </form>
      </div>
    </div>
  )
}
