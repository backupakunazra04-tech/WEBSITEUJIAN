import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'PROKTOR') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { id } = body // ID ExamParticipant

    if (!id) {
      return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })
    }

    // Kembalikan status menjadi SEDANG_UJIAN (Buka blokir)
    await prisma.examParticipant.update({
      where: { id },
      data: { status: 'SEDANG_UJIAN' }
    })

    // --- TAMBAHKAN LOG AUDIT ---
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        aksi: 'RESET_PESERTA',
        detail: `Proktor membuka kunci ujian untuk peserta ID: ${id}`
      }
    })
    // ---------------------------

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset peserta error:', error)
    return NextResponse.json({ error: 'Gagal mereset peserta' }, { status: 500 })
  }
}