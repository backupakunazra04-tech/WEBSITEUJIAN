import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'PESERTA') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    // Ambil semua ujian yang sudah diselesaikan (atau dihentikan) oleh siswa ini
    const riwayat = await prisma.examParticipant.findMany({
      where: {
        userId: session.userId,
        status: { in: ['SELESAI', 'DIHENTIKAN'] }
      },
      include: {
        schedule: {
          include: { subject: true }
        },
        answers: {
          include: {
            question: {
              include: {
                options: true // Ambil opsi untuk cek jawaban benar
              }
            }
          }
        }
      },
      orderBy: { waktuSelesai: 'desc' }
    })

    // Format data agar aman dikirim ke frontend (sembunyikan isCorrect dari opsi yang tidak dipilih)
    const safeRiwayat = riwayat.map(r => {
      return {
        id: r.id,
        mapel: r.schedule.subject.nama,
        status: r.status,
        skor: r.skor,
        waktuSelesai: r.waktuSelesai,
        jawaban: r.answers.map(ans => {
          // Cari opsi yang benar dari database
          const correctOption = ans.question.options.find(o => o.isCorrect)
          
          return {
            questionId: ans.questionId,
            tipe: ans.question.tipe,
            teksSoal: ans.question.teks,
            jawabanSiswa: ans.jawaban,
            isCorrect: ans.isCorrect,
            kunciJawaban: ans.question.tipe === 'ESSAY' ? ans.question.kunciEssay : correctOption?.teks,
            nilaiEssay: ans.nilaiEssay,
            komentarGuru: ans.komentarGuru
          }
        })
      }
    })

    return NextResponse.json({ riwayat: safeRiwayat })
  } catch (error) {
    console.error('GET Riwayat error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}