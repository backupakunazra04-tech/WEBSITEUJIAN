import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// 1. Ambil soal berdasarkan ID Jadwal
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'GURU') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID diperlukan' }, { status: 400 })
    }

    const questions = await prisma.question.findMany({
      where: { scheduleId },
      include: {
        options: true
      },
      orderBy: { urutan: 'asc' }
    })

    return NextResponse.json({ questions })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}

// 2. Tambah Soal Baru
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'GURU') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { scheduleId, tipe, teks, gambarUrl, kunciEssay, poin, options } = body

    if (!scheduleId || !tipe || !teks) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const countSoal = await prisma.question.count({
      where: { scheduleId }
    })

    const newQuestion = await prisma.question.create({
      data: {
        scheduleId,
        tipe,
        teks,
        gambarUrl: gambarUrl || null,
        kunciEssay: kunciEssay || null, // <-- Simpan Kunci Essay
        poin: parseInt(poin) || 1,
        urutan: countSoal + 1,
        options: {
          create: options?.map((opt: any) => ({
            teks: opt.teks,
            isCorrect: opt.isCorrect
          })) || []
        }
      }
    })

    return NextResponse.json({ success: true, question: newQuestion })
  } catch (error) {
    console.error('Tambah soal error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 })
  }
}

// 3. Hapus Soal
export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'GURU') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('id')

    if (!questionId) {
      return NextResponse.json({ error: 'ID soal diperlukan' }, { status: 400 })
    }

    await prisma.question.delete({
      where: { id: questionId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Hapus soal error:', error)
    return NextResponse.json({ error: 'Gagal menghapus soal' }, { status: 500 })
  }
}

// 4. Update Soal (Edit)
export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'GURU') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { id, tipe, teks, gambarUrl, kunciEssay, poin, options } = body

    if (!id) {
      return NextResponse.json({ error: 'ID soal diperlukan' }, { status: 400 })
    }

    const updatedQuestion = await prisma.$transaction(async (tx) => {
      await tx.questionOption.deleteMany({
        where: { questionId: id }
      })

      return tx.question.update({
        where: { id },
        data: {
          tipe,
          teks,
          gambarUrl: gambarUrl || null,
          kunciEssay: kunciEssay || null, // <-- Update Kunci Essay
          poin: parseInt(poin) || 1,
          options: {
            create: options?.map((opt: any) => ({
              teks: opt.teks,
              isCorrect: opt.isCorrect
            })) || []
          }
        }
      })
    })

    return NextResponse.json({ success: true, question: updatedQuestion })
  } catch (error) {
    console.error('Edit soal error:', error)
    return NextResponse.json({ error: 'Gagal mengedit soal' }, { status: 500 })
  }
}