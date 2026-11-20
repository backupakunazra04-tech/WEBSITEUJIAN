import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'PESERTA') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    // Ambil riwayat dengan select spesifik (hindari include berlapis)
    const riwayat = await prisma.examParticipant.findMany({
      where: {
        userId: session.userId,
        status: { in: ['SELESAI', 'DIHENTIKAN'] }
      },
      select: {
        id: true,
        status: true,
        skor: true,
        waktuSelesai: true,
        schedule: {
          select: {
            subject: { select: { nama: true } }
          }
        },
        answers: {
          select: {
            questionId: true,
            jawaban: true,
            isCorrect: true,
            nilaiEssay: true,
            komentarGuru: true,
            question: {
              select: {
                tipe: true,
                teks: true,
                kunciEssay: true,
                options: {
                  select: { id: true, teks: true, isCorrect: true }
                }
              }
            }
          }
        }
      },
      orderBy: { waktuSelesai: 'desc' }
    })

    const safeRiwayat = riwayat.map(r => {
      return {
        id: r.id,
        mapel: r.schedule.subject.nama,
        status: r.status,
        skor: r.skor,
        waktuSelesai: r.waktuSelesai,
        jawaban: r.answers.map(ans => {
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