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
    const { scheduleId, action } = body // action: 'AKTIFKAN' atau 'SELESAIKAN'

    const status = action === 'AKTIFKAN' ? 'AKTIF' : 'SELESAI'
    
    // Generate token acak baru jika diaktifkan
    let tokenUpdate = {}
    if (action === 'AKTIFKAN') {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      let newToken = ''
      for (let i = 0; i < 6; i++) {
        newToken += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      tokenUpdate = { token: newToken, tokenDirilis: true }
    }

    const updated = await prisma.examSchedule.update({
      where: { id: scheduleId },
      data: { status, ...tokenUpdate }
    })

    // --- TAMBAHKAN LOG AUDIT ---
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        aksi: action === 'AKTIFKAN' ? 'RILIS_TOKEN' : 'HENTIKAN_UJIAN',
        detail: `Proktor ${action === 'AKTIFKAN' ? 'merilis token' : 'menghentikan ujian'} untuk jadwal ID: ${scheduleId}`
      }
    })
    // ---------------------------

    return NextResponse.json({ success: true, schedule: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengubah status' }, { status: 500 })
  }
}