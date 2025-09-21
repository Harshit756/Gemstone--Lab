// src/lib/authenticate.ts
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

// ---------------------- Types ----------------------
export interface UserPayload {
  id: number
  email: string
  role: string
}

// ------------------ Password Utilities ------------------
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// ------------------ JWT Utilities ------------------
export function generateToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload
  } catch {
    return null
  }
}

// ------------------ User Authentication ------------------
export async function authenticateUser(email: string, password: string): Promise<UserPayload | null> {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) return null

  return {
    id: user.id,
    email: user.email,
    role: user.role
  }
}
