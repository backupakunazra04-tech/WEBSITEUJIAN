import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// ==========================================
// 1. FUNGSI GET: Mengambil Daftar Mapel
// ==========================================
export async function GET() {
  try {
    const session = await getSession()
    
    // Pastikan yang akses adalah Admin
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const subjects = await prisma.subject.findMany({
      orderBy: { nama: 'asc' }
    })

    return NextResponse.json({ subjects })
  } catch (error) {
    console.error("GET Subjects error:", error)
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}

// ==========================================
// 2. FUNGSI POST: Menambah Mapel Baru
// ==========================================
export async function POST(request: Request) {
  try {
    const session = await getSession()
    
    // Pastikan yang akses adalah Admin
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { nama } = body

    if (!nama || nama.trim() === '') {
      return NextResponse.json({ error: 'Nama mapel wajib diisi' }, { status: 400 })
    }

    // Cek apakah nama mapel sudah ada di database
    const existingSubject = await prisma.subject.findUnique({
      where: { nama }
    })

    if (existingSubject) {
      return NextResponse.json({ error: 'Mata pelajaran sudah ada' }, { status: 400 })
    }

    // Simpan mapel baru
    const subject = await prisma.subject.create({
      data: { 
        nama: nama.trim() 
      }
    })

    return NextResponse.json({ success: true, subject })
  } catch (error) {
    console.error('Tambah mapel error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 })
  }
}

// 3. Hapus Mapel
export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID mapel diperlukan' }, { status: 400 })
    }

    // Cek apakah mapel ini sedang dipakai di jadwal ujian
    const usedInSchedule = await prisma.examSchedule.findFirst({
      where: { subjectId: id }
    })

    if (usedInSchedule) {
      return NextResponse.json({ error: 'Mapel tidak bisa dihapus karena sudah dipakai di jadwal ujian' }, { status: 400 })
    }

    await prisma.subject.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Hapus mapel error:', error)
    return NextResponse.json({ error: 'Gagal menghapus mapel' }, { status: 500 })
  }
}

// 4. Edit Nama Mapel
export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { id, nama } = body

    if (!id || !nama) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: { nama }
    })

    return NextResponse.json({ success: true, subject: updated })
  } catch (error) {
    console.error('Edit mapel error:', error)
    return NextResponse.json({ error: 'Gagal mengedit mapel' }, { status: 500 })
  }
}