import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { encrypt } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    // 1. Cari user
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return NextResponse.json({ error: 'Username tidak ditemukan' }, { status: 401 })
    }

    // 2. Cek password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Password salah' }, { status: 401 })
    }

    // 3. Buat JWT
    const sessionData = {
      userId: user.id,
      role: user.role,
      nama: user.nama,
      gradeLevel: user.gradeLevel
    }
    
    const token = await encrypt(sessionData)

    // 4. Simpan di Cookie
    const response = NextResponse.json({ success: true, role: user.role })
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 1 hari
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 })
  }
}