import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// 1. Simpan Jawaban (Autosave)
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'PESERTA') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { participantId, questionId, jawaban } = body

    await prisma.answer.upsert({
      where: {
        participantId_questionId: { participantId, questionId }
      },
      update: { jawaban },
      create: { participantId, questionId, jawaban }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menyimpan jawaban' }, { status: 500 })
  }
}

// 2. Selesai Ujian & Auto-Grade PG
export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'PESERTA') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { participantId } = body

    // Ambil semua jawaban siswa beserta kunci jawaban soalnya
    const answers = await prisma.answer.findMany({
      where: { participantId },
      include: {
        question: {
          include: { options: true }
        }
      }
    })

    let totalSkor = 0

    // Lakukan penilaian
    for (const ans of answers) {
      let isCorrect = false

      if (ans.question.tipe === 'PG') {
        // Untuk PG, cocokkan ID opsi yang dipilih dengan opsi yang isCorrect = true
        const correctOption = ans.question.options.find(o => o.isCorrect)
        if (correctOption && ans.jawaban === correctOption.id) {
          isCorrect = true
          totalSkor += ans.question.poin
        }
      } 
      else if (ans.question.tipe === 'PG_MULTI') {
        // Untuk PG Multi, jawaban disimpan sebagai string "id1,id2,id3"
        const correctOptions = ans.question.options.filter(o => o.isCorrect).map(o => o.id).sort()
        const studentOptions = (ans.jawaban || '').split(',').filter(Boolean).sort()
        
        // Cek apakah jumlahnya sama dan isinya persis sama
        if (
          correctOptions.length === studentOptions.length &&
          correctOptions.every((val, index) => val === studentOptions[index])
        ) {
          isCorrect = true
          totalSkor += ans.question.poin
        }
      }
      else if (ans.question.tipe === 'ESSAY') {
        // Untuk essay, ambil nilai yang sudah diinput guru (jika ada)
        totalSkor += (ans.nilaiEssay || 0)
      }

      // Update isCorrect di database
      await prisma.answer.update({
        where: { id: ans.id },
        data: { isCorrect }
      })
    }

    // Ubah status peserta menjadi SELESAI dan simpan total skor
    await prisma.examParticipant.update({
      where: { id: participantId },
      data: { 
        status: 'SELESAI',
        waktuSelesai: new Date(),
        skor: totalSkor
      }
    })

    return NextResponse.json({ success: true, skor: totalSkor })
  } catch (error) {
    console.error('Selesai ujian error:', error)
    return NextResponse.json({ error: 'Gagal menyelesaikan ujian' }, { status: 500 })
  }
}