// src/lib/requireAuth.ts
import { NextRequest } from 'next/server'
import { verifyToken, UserPayload } from './authenticate'

export function requireAuth(request: NextRequest): UserPayload {
  const token = request.cookies.get('token')?.value
  if (!token) {
    throw new Error('Unauthorized - no token')
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    throw new Error('Unauthorized - invalid token')
  }

  return decoded
}
