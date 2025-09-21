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
  tests: any[]
  reports?: any[]
}

export default function TestingPage() {
  const [searchId, setSearchId] = useState('')
  const [pendingPackets, setPendingPackets] = useState<Packet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch pending packets
  const fetchPendingPackets = async () => {
    try {
      const res = await fetch('/api/packets')
      const data = await res.json()
      if (res.ok && data.packets) {
        setPendingPackets(
          data.packets.filter((p: Packet) => p.tests.length === 0 || (p.reports?.length || 0) === 0)
        )
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { fetchPendingPackets() }, [])

  // Search packet
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchId.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/packets?search=${encodeURIComponent(searchId)}`)
      const data = await res.json()
      if (res.ok && data.packets.length > 0) {
        // Navigate to test page with first matched packet
        window.location.href = `/testing/${data.packets[0].id}`
      } else {
        setError('Packet not found')
      }
    } catch (err) {
      setError('Error searching packet')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Gemstone Testing Module</h1>

        {/* Pending Packets Table */}
        {pendingPackets.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">Pending Packets</h2>
            <table className="min-w-full table-auto border border-gray-300">
              <thead>
                <tr className="bg-gray-100 text-center">
                  <th className="px-4 py-2 border">Unique ID</th>
                  <th className="px-4 py-2 border">Customer</th>
                  <th className="px-4 py-2 border">Gemstone Type</th>
                  <th className="px-4 py-2 border">Date Received</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPackets.map(p => (
                  <tr key={p.id} className="text-center">
                    <td className="px-4 py-2 border">{p.uniqueId}</td>
                    <td className="px-4 py-2 border">{p.customerName}</td>
                    <td className="px-4 py-2 border">{p.gemstoneType}</td>
                    <td className="px-4 py-2 border">{new Date(p.dateReceived).toLocaleDateString()}</td>
                    <td className="px-4 py-2 border">
                      <Link
                        href={`/testing/${p.id}`}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >Complete Test</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Search Packet</h2>
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter packet ID"
              className="flex-1 border px-3 py-2 rounded"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >{loading ? 'Searching...' : 'Search'}</button>
          </form>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  )
}
