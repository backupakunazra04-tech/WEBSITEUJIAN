import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) { // 👈 Tambahkan parameter request
  // Hapus cookie session
  const cookieStore = await cookies()
  cookieStore.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0), // Waktu di masa lalu
    path: '/'
  })

  // ✅ PERBAIKAN: Deteksi URL domain secara dinamis dari request
  const url = new URL(request.url)
  // url.origin akan otomatis menghasilkan 'https://webujianmasunggulan...vercel.app' 
  // saat di Vercel, atau 'http://localhost:3000' saat di laptop.
  const loginUrl = new URL('/login', url.origin)

  // Arahkan kembali ke halaman login
  return NextResponse.redirect(loginUrl)
}