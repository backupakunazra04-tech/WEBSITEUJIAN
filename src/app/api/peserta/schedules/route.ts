import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'PESERTA') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    // Ambil data user untuk tahu kelasnya (X, XI, XII)
    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    })

    if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

    // Ambil jadwal ujian khusus untuk kelas peserta ini
    const schedules = await prisma.examSchedule.findMany({
      where: {
        gradeLevel: user.gradeLevel || 'X',
        status: 'AKTIF' // Hanya ambil yang statusnya AKTIF (sudah diaktifkan admin)
      },
      include: {
        subject: true
      },
      orderBy: { waktuMulai: 'asc' }
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}