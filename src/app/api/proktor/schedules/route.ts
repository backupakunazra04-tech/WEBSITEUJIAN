import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'PROKTOR') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const schedules = await prisma.examSchedule.findMany({
      include: { subject: true },
      orderBy: { waktuMulai: 'asc' }
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}