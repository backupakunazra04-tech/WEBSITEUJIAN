import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Ambil Pengaturan
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

    // Cari settingan global, jika belum ada buat baru
    let settings = await prisma.setting.findUnique({ where: { id: 'global' } })
    if (!settings) {
      settings = await prisma.setting.create({ data: { id: 'global', maxPelanggaran: 2 } })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}

// Simpan Pengaturan
export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

    const body = await request.json()
    const { maxPelanggaran } = body

    const settings = await prisma.setting.upsert({
      where: { id: 'global' },
      update: { maxPelanggaran },
      create: { id: 'global', maxPelanggaran }
    })

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan' }, { status: 500 })
  }
}