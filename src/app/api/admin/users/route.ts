import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcrypt'

// 1. Ambil Daftar User
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        passwordPlain: true,
        nama: true,
        role: true,
        gradeLevel: true,
        tanggalLahir: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error("GET Users error detail:", error.message) // <-- Tambahkan detail log
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}

// 2. Tambah User Baru
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { username, password, nama, role, gradeLevel, tanggalLahir } = body

    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        passwordPlain: password,
        nama,
        role,
        gradeLevel: role === 'PESERTA' ? gradeLevel : null,
        tanggalLahir: role === 'PESERTA' && tanggalLahir ? new Date(tanggalLahir) : null
      }
    })

    return NextResponse.json({ success: true, user: newUser })
  } catch (error: any) {
    console.error('Tambah user error:', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 })
  }
}

// 3. Edit User
export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { id, username, password, nama, role, gradeLevel, tanggalLahir } = body

    if (!id) return NextResponse.json({ error: 'ID user diperlukan' }, { status: 400 })

    const existingUser = await prisma.user.findFirst({
      where: { 
        username,
        NOT: { id }
      }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Username sudah digunakan user lain' }, { status: 400 })
    }

    const updateData: any = {
      username,
      nama,
      role,
      gradeLevel: role === 'PESERTA' ? gradeLevel : null,
      tanggalLahir: role === 'PESERTA' && tanggalLahir ? new Date(tanggalLahir) : null
    }

    if (password && password.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(password, 10)
      updateData.passwordPlain = password
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error: any) {
    console.error('Edit user error:', error.message)
    return NextResponse.json({ error: 'Gagal mengedit user' }, { status: 500 })
  }
}

// 4. Hapus User
export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID user diperlukan' }, { status: 400 })

    if (id === session.userId) {
      return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 })
    }

    // Cek apakah user sudah ujian
    const hasParticipated = await prisma.examParticipant.findFirst({
      where: { userId: id }
    })

    if (hasParticipated) {
      return NextResponse.json({ error: 'User tidak bisa dihapus karena sudah memiliki riwayat ujian.' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Hapus user error:', error.message)
    return NextResponse.json({ error: 'Gagal menghapus user' }, { status: 500 })
  }
}