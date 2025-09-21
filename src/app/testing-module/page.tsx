'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Packet {
  id: number
  uniqueId: string
  customerName: string
  contactNumber: string
  gemstoneType: string
  createdAt: string
}

export default function TestingModulePage() {
  const [packets, setPackets] = useState<Packet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPackets() {
      try {
        const res = await fetch('/api/packets')
        const data = await res.json()
        setPackets(data)
      } catch (err) {
        console.error('Error fetching packets:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPackets()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Testing Module - Packets List
        </h2>

        {loading ? (
          <p className="text-center text-gray-600">Loading packets...</p>
        ) : packets.length === 0 ? (
          <p className="text-center text-gray-600">No packets found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Unique ID</th>
                  <th className="px-4 py-2 border">Customer</th>
                  <th className="px-4 py-2 border">Contact</th>
                  <th className="px-4 py-2 border">Gemstone</th>
                  <th className="px-4 py-2 border">Date</th>
                  <th className="px-4 py-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {packets.map(packet => (
                  <tr key={packet.id} className="text-center">
                    <td className="px-4 py-2 border font-mono">{packet.uniqueId}</td>
                    <td className="px-4 py-2 border">{packet.customerName}</td>
                    <td className="px-4 py-2 border">{packet.contactNumber}</td>
                    <td className="px-4 py-2 border">{packet.gemstoneType}</td>
                    <td className="px-4 py-2 border">
                      {new Date(packet.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 border">
                      <Link
                        href={`/testing/${packet.id}`}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Enter Test
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
