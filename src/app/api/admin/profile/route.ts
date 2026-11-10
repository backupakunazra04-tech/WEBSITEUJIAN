import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcrypt'

export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

    const body = await request.json()
    const { newPassword } = body

    if (!newPassword || newPassword.length < 5) {
      return NextResponse.json({ error: 'Password minimal 5 karakter' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: session.userId },
      data: { 
        passwordHash,
        passwordPlain: newPassword 
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengganti password' }, { status: 500 })
  }
}