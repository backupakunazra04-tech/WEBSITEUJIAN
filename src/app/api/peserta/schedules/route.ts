import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'PESERTA') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    // Ambil data user (hanya field yang perlu)
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { gradeLevel: true }
    })

    if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

    // Ambil jadwal ujian (Gunakan select untuk efisiensi)
    const schedules = await prisma.examSchedule.findMany({
      where: {
        gradeLevel: user.gradeLevel || 'X',
        status: 'AKTIF'
      },
      select: {
        id: true,
        gradeLevel: true,
        waktuMulai: true,
        waktuSelesai: true,
        status: true,
        subject: {
          select: { nama: true }
        }
      },
      orderBy: { waktuMulai: 'asc' }
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error('GET Schedules error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}