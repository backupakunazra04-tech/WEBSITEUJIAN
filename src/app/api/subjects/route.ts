import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Ambil daftar mapel
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const subjects = await prisma.subject.findMany({
      orderBy: { nama: 'asc' }
    })

    return NextResponse.json({ subjects })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}

// Tambah mapel baru
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { nama } = body

    if (!nama) {
      return NextResponse.json({ error: 'Nama mapel wajib diisi' }, { status: 400 })
    }

    // Cek apakah mapel sudah ada
    const existingSubject = await prisma.subject.findUnique({
      where: { nama }
    })

    if (existingSubject) {
      return NextResponse.json({ error: 'Mata pelajaran sudah ada' }, { status: 400 })
    }

    const subject = await prisma.subject.create({
      data: { nama }
    })

    return NextResponse.json({ success: true, subject })
  } catch (error) {
    console.error('Tambah mapel error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 })
  }
}