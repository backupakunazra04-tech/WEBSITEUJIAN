import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

    const participants = await prisma.examParticipant.findMany({
      include: {
        user: { select: { nama: true, gradeLevel: true } },
        schedule: { include: { subject: true } },
        violations: true
      },
      orderBy: { waktuMulai: 'desc' }
    })

    return NextResponse.json({ participants })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}