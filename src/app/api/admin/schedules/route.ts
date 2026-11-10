import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Ambil daftar jadwal
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const schedules = await prisma.examSchedule.findMany({
      include: {
        subject: true, // Ambil data nama mapel juga
      },
      orderBy: { waktuMulai: 'desc' }
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error("GET Schedules error:", error)
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}

// Tambah jadwal baru
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { subjectId, gradeLevel, waktuMulai, waktuSelesai, token } = body

    if (!subjectId || !gradeLevel || !waktuMulai || !waktuSelesai || !token) {
      return NextResponse.json({ error: 'Semua kolom wajib diisi' }, { status: 400 })
    }

    // Validasi: Cek apakah jam bentrok dengan jadwal lain di kelas yang sama
    const bentrok = await prisma.examSchedule.findFirst({
      where: {
        gradeLevel,
        OR: [
          {
            waktuMulai: { lt: new Date(waktuSelesai) },
            waktuSelesai: { gt: new Date(waktuMulai) }
          }
        ]
      }
    })

    if (bentrok) {
      return NextResponse.json({ error: 'Jadwal bentrok dengan ujian lain di kelas ini!' }, { status: 400 })
    }

    const schedule = await prisma.examSchedule.create({
      data: {
        subjectId,
        gradeLevel,
        waktuMulai: new Date(waktuMulai),
        waktuSelesai: new Date(waktuSelesai),
        token: token.toUpperCase(), // Token biasanya huruf besar
        status: 'DRAFT'
      }
    })

    return NextResponse.json({ success: true, schedule })
  } catch (error) {
    console.error('Tambah jadwal error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 })
  }
}

// 4. Hapus Jadwal (Dengan Opsi Force Delete)
export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const force = searchParams.get('force') === 'true' // Cek apakah dipaksa hapus

    if (!id) {
      return NextResponse.json({ error: 'ID jadwal diperlukan' }, { status: 400 })
    }

    // Cek apakah sudah ada peserta
    const hasParticipants = await prisma.examParticipant.findFirst({
      where: { scheduleId: id }
    })

    // Jika ada peserta tapi tidak menggunakan force delete, tolak
    if (hasParticipants && !force) {
      return NextResponse.json({ 
        error: 'Jadwal ini sudah memiliki data peserta. Diperlukan konfirmasi khusus untuk menghapus.' 
      }, { status: 400 })
    }

    // Jika force delete (admin sudah setuju), hapus data terkait terlebih dahulu
    if (force) {
      await prisma.answer.deleteMany({ where: { participant: { scheduleId: id } } })
      await prisma.violation.deleteMany({ where: { scheduleId: id } })
      await prisma.examParticipant.deleteMany({ where: { scheduleId: id } })
    }

    // Hapus jadwal ujian
    await prisma.examSchedule.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Hapus jadwal error:', error)
    return NextResponse.json({ error: 'Gagal menghapus jadwal' }, { status: 500 })
  }
}