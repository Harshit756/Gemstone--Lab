'use client'

import { useState, useEffect } from 'react'
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

  /* =========================================================
     FETCH ALL PACKETS
     ========================================================= */
  const fetchAllPackets = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/packets')
      const data = await response.json()

      if (response.ok) {
        let fetchedPackets = data.packets || []

        fetchedPackets = fetchedPackets.filter(
          (pkt: Packet) => pkt.reports.length > 0
        )

        setPackets(fetchedPackets)

        if (fetchedPackets.length === 0) {
          setError('No packets with reports found')
        }
      } else {
        setError('Failed to load packets')
      }
    } catch {
      setError('Failed to load packets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllPackets()
  }, [])

  /* =========================================================
     SEARCH
     ========================================================= */
  const searchPackets = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `/api/packets?search=${encodeURIComponent(searchTerm)}`
      )
      const data = await response.json()

      if (response.ok) {
        let fetchedPackets = data.packets

        fetchedPackets = fetchedPackets.filter(
          (pkt: Packet) => pkt.reports.length > 0
        )

        setPackets(fetchedPackets)

        if (fetchedPackets.length === 0) {
          setError('No packets with reports found')
        }
      } else {
        setError('An error occurred while searching')
      }
    } catch {
      setError('An error occurred while searching')
    } finally {
      setLoading(false)
    }
  }

  /* =========================================================
     DOWNLOAD REPORT (UPDATED)
     ========================================================= */
  const downloadReport = async (
    format: 'A4' | 'PVC',
    reportPath: string,
    packetId: string
  ) => {
    // ✅ A4 (unchanged)
    if (format === 'A4') {
      const link = document.createElement('a')
      link.href = reportPath
      link.download = `report-${packetId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }

    // ✅ PVC (new)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'PVC',
          packetId,
        }),
      })

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)

      window.open(url, '_blank')
    } catch (err) {
      console.error(err)
      alert('Failed to generate PVC report')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Search & Track Packets
        </h1>

        {/* SEARCH */}
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {error && (
            <p className="text-red-600 text-sm mt-3 text-center">{error}</p>
          )}
        </div>

        {/* LOADING */}
        {loading && (
          <p className="text-center text-gray-600">Loading packets...</p>
        )}

        {/* RESULTS */}
        {packets.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Packets ({packets.length})
            </h2>

            {packets.map((packet) => (
              <div key={packet.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p><strong>Unique ID:</strong> {packet.uniqueId}</p>
                    <p><strong>Customer:</strong> {packet.customerName}</p>
                    <p><strong>Contact:</strong> {packet.contactNumber}</p>
                    <p><strong>Gemstone:</strong> {packet.gemstoneType}</p>
                    <p>
                      <strong>Date:</strong>{' '}
                      {new Date(packet.dateReceived).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p>
                      <strong>Testing:</strong>{' '}
                      {packet.tests.length > 0 ? 'Completed' : 'Pending'}
                    </p>
                    <p>
                      <strong>Reports:</strong>{' '}
                      {packet.reports.length > 0 ? 'Generated' : 'Pending'}
                    </p>
                  </div>
                </div>

                {/* REPORT BUTTONS (UPDATED) */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {packet.reports.map((report, index) => (
                    <div key={report.id} className="flex gap-2">
                      <button
                        onClick={() =>
                          downloadReport(
                            'A4',
                            report.pdfPath,
                            packet.uniqueId
                          )
                        }
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        A4 Report
                      </button>

                      <button
                        onClick={() =>
                          downloadReport(
                            'PVC',
                            report.pdfPath,
                            packet.uniqueId
                          )
                        }
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        PVC Card
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <Link
                    href={`/testing?search=${packet.uniqueId}`}
                    className="text-blue-600 hover:underline"
                  >
                    View / Edit Tests →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}