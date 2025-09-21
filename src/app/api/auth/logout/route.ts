import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({ message: 'Logout successful' })
    response.cookies.set({
      name: 'token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0
    })
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
