'use client'

import { useState } from 'react'
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
  reports: { id: number; pdfPath: string }[]
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [packets, setPackets] = useState<Packet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const searchPackets = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/packets?search=${encodeURIComponent(searchTerm)}`)
      const data = await response.json()

      if (response.ok) {
        let { packets: fetchedPackets } = data
        // Filter only packets that have reports
        fetchedPackets = fetchedPackets.filter((pkt: Packet) => pkt.reports.length > 0)
        setPackets(fetchedPackets)
        if (fetchedPackets.length === 0) setError('No packets with reports found')
      } else {
        setError('An error occurred while searching')
      }
    } catch (err) {
      setError('An error occurred while searching')
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = (reportPath: string, packetId: string) => {
    const link = document.createElement('a')
    link.href = reportPath
    link.download = `report-${packetId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Search & Track Packets
        </h1>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Search Packets
          </h2>
          <form onSubmit={searchPackets} className="flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by packet ID, customer name, or contact number"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || !searchTerm.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        </div>

        {/* Results */}
        {packets.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Search Results ({packets.length} found)
            </h2>

            {packets.map((packet) => (
              <div key={packet.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Packet Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Packet Information
                    </h3>
                    <div className="space-y-2">
                      <p>
                        <span className="font-semibold">Unique ID:</span> 
                        <span className="font-mono ml-2 bg-gray-100 px-2 py-1 rounded text-sm">
                          {packet.uniqueId}
                        </span>
                      </p>
                      <p><span className="font-semibold">Customer:</span> {packet.customerName}</p>
                      <p><span className="font-semibold">Contact:</span> {packet.contactNumber}</p>
                      <p><span className="font-semibold">Gemstone Type:</span> {packet.gemstoneType}</p>
                      <p><span className="font-semibold">Date Received:</span> {new Date(packet.dateReceived).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Status Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Status
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="font-semibold">Testing Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-sm ${
                          packet.tests.length > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {packet.tests.length > 0 ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold">Report Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-sm ${
                          packet.reports.length > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {packet.reports.length > 0 ? 'Generated' : 'Pending'}
                        </span>
                      </div>
                      <p><span className="font-semibold">Tests Completed:</span> {packet.tests.length}</p>
                      <p><span className="font-semibold">Reports Generated:</span> {packet.reports.length}</p>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                {packet.qrCodePath && (
                  <div className="mt-6 text-center">
                    <h4 className="font-semibold text-gray-900 mb-2">QR Code</h4>
                    <img 
                      src={packet.qrCodePath} 
                      alt="QR Code" 
                      className="mx-auto border border-gray-300 rounded"
                    />
                  </div>
                )}

                {/* Test Results */}
                {packet.tests.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Test Results</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div><span className="font-semibold">Color:</span> {packet.tests[0].color}</div>
                        <div><span className="font-semibold">Cut:</span> {packet.tests[0].cut}</div>
                        <div><span className="font-semibold">Clarity:</span> {packet.tests[0].clarity}</div>
                        <div><span className="font-semibold">Carat:</span> {packet.tests[0].carat}</div>
                        <div>
                          <span className="font-semibold">Authenticity:</span> 
                          <span className={`ml-1 px-2 py-1 rounded text-xs ${
                            packet.tests[0].authenticity === 'Authentic' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {packet.tests[0].authenticity}
                          </span>
                        </div>
                        {packet.tests[0].notes && (
                          <div className="md:col-span-2 lg:col-span-3">
                            <span className="font-semibold">Notes:</span> {packet.tests[0].notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Report Download Buttons */}
                {packet.reports.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {packet.reports.map((report) => (
                      <button
                        key={report.id}
                        onClick={() => downloadReport(report.pdfPath, packet.uniqueId)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Download Report {report.id}
                      </button>
                    ))}
                  </div>
                )}

                {/* View/Edit Tests */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/testing?search=${packet.uniqueId}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View/Edit Tests
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link 
            href="/dashboard"
            className="text-blue-600 hover:text-blue-500 text-sm"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
