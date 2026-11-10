

import { NextResponse } from 'next/server'
// ... sisa kode ...
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    // 1. Ambil semua data peserta
    const users = await prisma.user.findMany({
      where: { role: 'PESERTA' },
      select: {
        id: true,
        username: true,
        passwordPlain: true,
        nama: true,
        gradeLevel: true,
      },
      orderBy: { nama: 'asc' }
    })

    // 2. Ambil semua jadwal ujian (yang sudah aktif/selesai)
    const schedules = await prisma.examSchedule.findMany({
      where: { status: { in: ['AKTIF', 'SELESAI'] } },
      include: { subject: true },
      orderBy: { waktuMulai: 'asc' }
    })

    return NextResponse.json({ users, schedules })
  } catch (error) {
    console.error("GET Cetak error:", error)
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}