import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// 1. Ambil daftar peserta & jawaban essay mereka
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'GURU') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')

    if (!scheduleId) return NextResponse.json({ error: 'Schedule ID diperlukan' }, { status: 400 })

    // Ambil peserta yang sudah selesai atau sedang ujian
    const participants = await prisma.examParticipant.findMany({
      where: { 
        scheduleId,
        status: { in: ['SELESAI', 'SEDANG_UJIAN'] }
      },
      include: {
        user: { select: { nama: true, username: true } },
        answers: {
          include: {
            question: {
              select: { id: true, teks: true, tipe: true, poin: true }
            }
          }
        }
      }
    })

    return NextResponse.json({ participants })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}

// 2. Simpan nilai essay & hitung total skor
export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'GURU') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { answerId, nilaiEssay, komentarGuru } = body

    if (!answerId) return NextResponse.json({ error: 'Answer ID diperlukan' }, { status: 400 })

    // Update nilai di tabel Answer
    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: { nilaiEssay, komentarGuru }
    })

    // Ambil participantId untuk menghitung ulang total skor
    const participantId = updatedAnswer.participantId

    // Ambil semua jawaban peserta ini
    const allAnswers = await prisma.answer.findMany({
      where: { participantId },
      include: { question: true }
    })

    // Hitung total skor (PG yang benar + Nilai Essay)
    let totalSkor = 0
    for (const ans of allAnswers) {
      if (ans.question.tipe === 'ESSAY') {
        totalSkor += (ans.nilaiEssay || 0)
      } else if (ans.isCorrect) {
        totalSkor += ans.question.poin
      }
    }

    // Simpan total skor ke tabel ExamParticipant
    await prisma.examParticipant.update({
      where: { id: participantId },
      data: { skor: totalSkor }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Koreksi error:', error)
    return NextResponse.json({ error: 'Gagal menyimpan nilai' }, { status: 500 })
  }
}