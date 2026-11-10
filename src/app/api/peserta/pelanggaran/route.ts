import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'PESERTA') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { participantId, scheduleId, tipe, level } = body

    // 1. Catat pelanggaran ke database
    await prisma.violation.create({
      data: { participantId, scheduleId, tipe, level }
    })

    // 2. Jika yang masuk adalah PELANGGARAN (bukan peringatan), cek batasnya
    if (level === 'PELANGGARAN') {
      const totalPelanggaran = await prisma.violation.count({
        where: { 
          participantId, 
          level: 'PELANGGARAN' 
        }
      })

      // Ambil batas pelanggaran dari Pengaturan Admin
      const setting = await prisma.setting.findUnique({ where: { id: 'global' } })
      const batasPelanggaran = setting?.maxPelanggaran || 2 // Default 2 jika belum diatur

      // Jika total pelanggaran sudah mencapai atau melebihi batas
      if (totalPelanggaran >= batasPelanggaran) {
        await prisma.examParticipant.update({
          where: { id: participantId },
          data: { status: 'DIHENTIKAN', waktuSelesai: new Date() }
        })
        
        return NextResponse.json({ 
          status: 'DIHENTIKAN', 
          message: `Ujian dihentikan otomatis karena mencapai ${batasPelanggaran} pelanggaran.` 
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Catat pelanggaran error:', error)
    return NextResponse.json({ error: 'Gagal mencatat pelanggaran' }, { status: 500 })
  }
}