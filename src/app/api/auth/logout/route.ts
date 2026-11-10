import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  // Hapus cookie session dengan mengaturnya menjadi kosong dan kedaluwarsa
  const cookieStore = await cookies()
  cookieStore.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0), // Waktu di masa lalu
    path: '/'
  })

  // Arahkan kembali ke halaman login
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
}