

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'GURU') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    // Ambil jadwal yang mapelnya di-assign ke guru ini
    const schedules = await prisma.examSchedule.findMany({
      where: {
        subject: {
          guruAssignments: {
            some: {
              guruId: session.userId // Filter berdasarkan ID guru yang login
            }
          }
        }
      },
      include: {
        subject: true,
        _count: {
          select: { questions: true }
        }
      },
      orderBy: { waktuMulai: 'asc' }
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error("GET Guru Schedules error:", error)
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}