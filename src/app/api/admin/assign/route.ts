import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Ambil daftar Guru & Mapel
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

    const gurus = await prisma.user.findMany({
      where: { role: 'GURU' },
      select: { id: true, nama: true }
    })
    
    const subjects = await prisma.subject.findMany()
    const assignments = await prisma.guruAssignment.findMany({
      include: { guru: true, subject: true }
    })

    return NextResponse.json({ gurus, subjects, assignments })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}

// Simpan Assign
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

    const body = await request.json()
    const { guruId, subjectId, gradeLevel } = body

    await prisma.guruAssignment.create({
      data: { guruId, subjectId, gradeLevel }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menyimpan assign' }, { status: 500 })
  }
}