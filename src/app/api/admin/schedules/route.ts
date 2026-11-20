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
        subject: true,
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

    // PERBAIKAN TIMEZONE: 
    // Kita paksa waktu yang dikirim dari form dianggap sebagai WIB (+07:00)
    const dateMulai = new Date(`${waktuMulai}:00+07:00`)
    const dateSelesai = new Date(`${waktuSelesai}:00+07:00`)

    // Validasi: Cek apakah jam bentrok dengan jadwal lain di kelas yang sama
    const bentrok = await prisma.examSchedule.findFirst({
      where: {
        gradeLevel,
        OR: [
          {
            waktuMulai: { lt: dateSelesai },
            waktuSelesai: { gt: dateMulai }
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
        waktuMulai: dateMulai,
        waktuSelesai: dateSelesai,
        token: token.toUpperCase(),
        status: 'DRAFT'
      }
    })

    return NextResponse.json({ success: true, schedule })
  } catch (error) {
    console.error('Tambah jadwal error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 })
  }
}

// ✅ FUNGSI BARU: Untuk mengubah status (Aktifkan / Selesaikan)
export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'ID dan Status wajib dikirim' }, { status: 400 })
    }

    // Update status di database
    const updatedSchedule = await prisma.examSchedule.update({
      where: { id: id },
      data: { status: status }
    })

    return NextResponse.json({ success: true, schedule: updatedSchedule })
  } catch (error) {
    console.error('Update status error:', error)
    return NextResponse.json({ error: 'Gagal mengubah status jadwal' }, { status: 500 })
  }
}

// Hapus Jadwal (Dengan Opsi Force Delete)
export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const force = searchParams.get('force') === 'true'

    if (!id) {
      return NextResponse.json({ error: 'ID jadwal diperlukan' }, { status: 400 })
    }

    const hasParticipants = await prisma.examParticipant.findFirst({
      where: { scheduleId: id }
    })

    if (hasParticipants && !force) {
      return NextResponse.json({ 
        error: 'Jadwal ini sudah memiliki data peserta. Diperlukan konfirmasi khusus untuk menghapus.' 
      }, { status: 400 })
    }

    if (force) {
      await prisma.answer.deleteMany({ where: { participant: { scheduleId: id } } })
      await prisma.violation.deleteMany({ where: { scheduleId: id } })
      await prisma.examParticipant.deleteMany({ where: { scheduleId: id } })
    }

    await prisma.examSchedule.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Hapus jadwal error:', error)
    return NextResponse.json({ error: 'Gagal menghapus jadwal' }, { status: 500 })
  }
}