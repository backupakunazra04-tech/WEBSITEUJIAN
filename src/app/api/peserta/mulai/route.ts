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

    // 1. Validasi Data Siswa
    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    })

    if (!user || user.tanggalLahir?.toISOString().split('T')[0] !== tanggalLahir) {
      return NextResponse.json({ error: 'Tanggal lahir tidak cocok' }, { status: 400 })
    }

    // 2. Validasi Jadwal & Token
    const schedule = await prisma.examSchedule.findUnique({
      where: { id: scheduleId },
      include: { questions: { include: { options: true } } }
    })

    if (!schedule) return NextResponse.json({ error: 'Jadwal tidak ditemukan' }, { status: 404 })
    if (schedule.token !== token.toUpperCase()) {
      return NextResponse.json({ error: 'Token salah' }, { status: 400 })
    }

    const now = new Date()
    if (now < schedule.waktuMulai || now > schedule.waktuSelesai) {
      return NextResponse.json({ error: 'Ujian belum dimulai atau sudah berakhir' }, { status: 400 })
    }

    // 3. Cek Status Keikutsertaan Siswa & Ambil Jawaban Lama
    let participant = await prisma.examParticipant.findUnique({
      where: { userId_scheduleId: { userId: user.id, scheduleId } },
      include: {
        answers: true // Ambil jawaban yang sudah pernah diisi
      }
    })

    // --- BLOKIR JIKA SUDAH SELESAI ATAU DIHENTIKAN ---
    if (participant?.status === 'SELESAI') {
      return NextResponse.json({ error: 'Anda sudah menyelesaikan ujian ini.' }, { status: 400 })
    }
    if (participant?.status === 'DIHENTIKAN') {
      return NextResponse.json({ error: 'Ujian Anda telah dihentikan oleh sistem karena pelanggaran.' }, { status: 403 })
    }

    // Jika belum ada data (berarti baru atau baru di-reset), buat baru
    if (!participant) {
      participant = await prisma.examParticipant.create({
        data: {
          userId: user.id,
          scheduleId,
          status: 'SEDANG_UJIAN',
          waktuMulai: now,
          seedAcak: user.id // Gunakan ID user sebagai seed acak
        },
        include: { answers: true }
      })
    }

    // 4. Acak Soal & Opsi Jawaban
    // Menggunakan participant.seedAcak agar urutan konsisten untuk siswa tersebut
    const shuffledQuestions = seededShuffle(schedule.questions, participant.seedAcak)
    
    // 5. Sembunyikan kunci jawaban (isCorrect) agar tidak bisa diintip dari Inspect Element
    const safeQuestions = shuffledQuestions.map((q: any) => ({
      id: q.id,
      tipe: q.tipe,
      teks: q.teks,
      gambarUrl: q.gambarUrl,
      poin: q.poin,
      // Acak opsi jawaban per soal menggunakan (seed + id soal) agar acakan tiap soal berbeda
      options: seededShuffle(q.options, participant!.seedAcak + q.id).map((o: any) => ({
        id: o.id,
        teks: o.teks
      }))
    }))

    return NextResponse.json({ 
      success: true, 
      participantId: participant.id,
      questions: safeQuestions,
      waktuSelesai: schedule.waktuSelesai,
      jawabanLama: participant.answers // Kirim jawaban lama ke frontend
    })

  } catch (error) {
    console.error('Mulai ujian error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 })
  }
}