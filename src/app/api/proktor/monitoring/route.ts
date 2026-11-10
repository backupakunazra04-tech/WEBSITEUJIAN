import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'PROKTOR') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    // Ambil semua peserta yang sedang ujian beserta pelanggarannya
    const participants = await prisma.examParticipant.findMany({
      where: { 
        status: { in: ['SEDANG_UJIAN', 'SELESAI', 'DIHENTIKAN'] } 
      },
      include: {
        user: { select: { nama: true, username: true, gradeLevel: true } },
        schedule: { include: { subject: true } },
        violations: { orderBy: { createdAt: 'desc' } }
      }
    })

    return NextResponse.json({ participants })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data monitoring' }, { status: 500 })
  }
}