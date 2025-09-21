export interface User {
  id: number
  email: string
  password: string
  role: string
  createdAt: Date
  updatedAt: Date
}

export interface Packet {
  id: number
  uniqueId: string
  customerName: string
  contactNumber: string
  gemstoneType: string
  dateReceived: Date
  qrCodePath: string
  createdAt: Date
  updatedAt: Date
  tests?: Test[]
  reports?: Report[]
}

export interface Test {
  id: number
  packetId: number
  color: string
  cut: string
  clarity: string
  carat: string
  authenticity: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  packet?: Packet
}

export interface Report {
  id: number
  packetId: number
  pdfPath: string
  createdAt: Date
  updatedAt: Date
  packet?: Packet
}

export interface CreatePacketData {
  customerName: string
  contactNumber: string
  gemstoneType: string
}

export interface CreateTestData {
  packetId: number
  color: string
  cut: string
  clarity: string
  carat: string
  authenticity: string
  notes?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: {
    id: number
    email: string
    role: string
  }
}
