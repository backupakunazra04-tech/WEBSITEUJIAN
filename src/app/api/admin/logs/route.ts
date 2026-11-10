import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { nama: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Ambil 100 log terakhir
    })

    return NextResponse.json({ logs })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data log' }, { status: 500 })
  }
}