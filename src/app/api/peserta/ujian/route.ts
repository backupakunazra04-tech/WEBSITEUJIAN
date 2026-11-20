import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// 1. Simpan Jawaban (Autosave) - TIDAK BERUBAH, sudah efisien
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'PESERTA') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { participantId, questionId, jawaban } = body

    await prisma.answer.upsert({
      where: { participantId_questionId: { participantId, questionId } },
      update: { jawaban },
      create: { participantId, questionId, jawaban }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menyimpan jawaban' }, { status: 500 })
  }
}

// 2. Selesai Ujian & Auto-Grade (SUDAH DIOPTIMALKAN)
export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'PESERTA') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { participantId } = body

    // Ambil jawaban dengan select spesifik untuk mengurangi data
    const answers = await prisma.answer.findMany({
      where: { participantId },
      select: {
        id: true,
        jawaban: true,
        nilaiEssay: true,
        question: {
          select: {
            tipe: true,
            poin: true,
            options: {
              select: { id: true, isCorrect: true }
            }
          }
        }
      }
    })

    let totalSkor = 0
    const updates: { id: string, isCorrect: boolean }[] = []

    for (const ans of answers) {
      let isCorrect = false

      if (ans.question.tipe === 'PG') {
        const correctOption = ans.question.options.find(o => o.isCorrect)
        if (correctOption && ans.jawaban === correctOption.id) {
          isCorrect = true
          totalSkor += ans.question.poin
        }
      } 
      else if (ans.question.tipe === 'PG_MULTI') {
        const correctOptions = ans.question.options.filter(o => o.isCorrect).map(o => o.id).sort()
        const studentOptions = (ans.jawaban || '').split(',').filter(Boolean).sort()
        if (correctOptions.length === studentOptions.length && correctOptions.every((val, index) => val === studentOptions[index])) {
          isCorrect = true
          totalSkor += ans.question.poin
        }
      }
      else if (ans.question.tipe === 'BENAR_SALAH') {
        const studentAnswers = (ans.jawaban || '').split(',').filter(Boolean)
        let allCorrect = true
        let totalPernyataan = 0

        for (const opt of ans.question.options) {
          totalPernyataan++
          const studentAnswer = studentAnswers.find(a => a.startsWith(opt.id))
          if (!studentAnswer) { allCorrect = false; break; }
          const isStudentTrue = studentAnswer.endsWith(':true')
          if (isStudentTrue !== opt.isCorrect) { allCorrect = false; break; }
        }
        if (allCorrect && totalPernyataan > 0) {
          isCorrect = true
          totalSkor += ans.question.poin
        }
      }
      else if (ans.question.tipe === 'ESSAY') {
        totalSkor += (ans.nilaiEssay || 0)
      }

      // Kumpulkan update, jangan eksekusi satu per satu
      updates.push({ id: ans.id, isCorrect })
    }

    // EKSEKUSI BATCH UPDATE (Jauh lebih cepat dari loop sequential)
    await prisma.$transaction(
      updates.map(u => 
        prisma.answer.update({
          where: { id: u.id },
          data: { isCorrect: u.isCorrect }
        })
      )
    )

    await prisma.examParticipant.update({
      where: { id: participantId },
      data: { status: 'SELESAI', waktuSelesai: new Date(), skor: totalSkor }
    })

    return NextResponse.json({ success: true, skor: totalSkor })
  } catch (error) {
    console.error('Selesai ujian error:', error)
    return NextResponse.json({ error: 'Gagal menyelesaikan ujian' }, { status: 500 })
  }
}