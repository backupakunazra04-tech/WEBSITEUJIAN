import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { seededShuffle } from '@/lib/shuffle'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'PESERTA') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { scheduleId, token, tanggalLahir } = body

    // 1. Validasi Data Siswa (Gunakan select untuk efisiensi)
    const user = await prisma.user.findUnique({ 
      where: { id: session.userId },
      select: { id: true, tanggalLahir: true }
    })
    
    if (!user || user.tanggalLahir?.toISOString().split('T')[0] !== tanggalLahir) {
      return NextResponse.json({ error: 'Tanggal lahir tidak cocok' }, { status: 400 })
    }

    // 2. Validasi Jadwal & Token (Gunakan select untuk efisiensi)
    const schedule = await prisma.examSchedule.findUnique({
      where: { id: scheduleId },
      select: {
        token: true,
        waktuMulai: true,
        waktuSelesai: true,
        questions: {
          select: {
            id: true,
            tipe: true,
            stimulus: true,
            teks: true,
            gambarUrl: true,
            poin: true,
            options: {
              select: {
                id: true,
                teks: true,
                gambarUrl: true,
                isCorrect: true // Tetap diambil untuk penilaian, tapi tidak dikirim ke frontend
              }
            }
          }
        }
      }
    })

    if (!schedule) return NextResponse.json({ error: 'Jadwal tidak ditemukan' }, { status: 404 })
    if (schedule.token !== token.toUpperCase()) {
      return NextResponse.json({ error: 'Token salah' }, { status: 400 })
    }

    const now = new Date()
    if (now < schedule.waktuMulai || now > schedule.waktuSelesai) {
      return NextResponse.json({ error: 'Ujian belum dimulai atau sudah berakhir' }, { status: 400 })
    }

    // 3. Cek Status Keikutsertaan Siswa (Gunakan select untuk efisiensi)
    let participant = await prisma.examParticipant.findUnique({
      where: { userId_scheduleId: { userId: user.id, scheduleId } },
      select: { 
        id: true, 
        status: true, 
        seedAcak: true,
        answers: {
          select: {
            questionId: true,
            jawaban: true
          }
        }
      }
    })

    if (participant?.status === 'SELESAI') {
      return NextResponse.json({ error: 'Anda sudah menyelesaikan ujian ini.' }, { status: 400 })
    }
    if (participant?.status === 'DIHENTIKAN') {
      return NextResponse.json({ error: 'Ujian Anda telah dihentikan oleh sistem karena pelanggaran.' }, { status: 403 })
    }

    if (!participant) {
      participant = await prisma.examParticipant.create({
        data: {
          userId: user.id,
          scheduleId,
          status: 'SEDANG_UJIAN',
          waktuMulai: now,
          seedAcak: user.id
        },
        select: { 
          id: true, 
          status: true, 
          seedAcak: true,
          answers: { select: { questionId: true, jawaban: true } }
        }
      })
    }

    // 4. Acak Soal & Opsi Jawaban
    const shuffledQuestions = seededShuffle(schedule.questions, participant.seedAcak)
    
    // 5. Sembunyikan kunci & Kirim data yang diperlukan
    const safeQuestions = shuffledQuestions.map((q: any) => ({
      id: q.id,
      tipe: q.tipe,
      stimulus: q.stimulus,
      teks: q.teks,
      gambarUrl: q.gambarUrl,
      poin: q.poin,
      options: seededShuffle(q.options, participant!.seedAcak + q.id).map((o: any) => ({
        id: o.id,
        teks: o.teks,
        gambarUrl: o.gambarUrl
      }))
    }))

    return NextResponse.json({ 
      success: true, 
      participantId: participant.id,
      questions: safeQuestions,
      waktuSelesai: schedule.waktuSelesai,
      jawabanLama: participant.answers
    })

  } catch (error) {
    console.error('Mulai ujian error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 })
  }
}