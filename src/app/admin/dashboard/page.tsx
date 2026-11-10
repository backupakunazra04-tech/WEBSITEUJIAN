import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, CalendarDays, BookOpen, Activity, ArrowRight } from 'lucide-react'

export const instant = false

export default async function AdminDashboard() {
  const session = await getSession()

  if (!session || session.role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <div className="max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
        <p className="text-slate-500 mt-1">Selamat datang kembali, <span className="font-semibold text-emerald-600">{session.nama}</span>.</p>
      </div>

      {/* Grid Menu Utama */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        <Link href="/admin/users" className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
            <Users size={24} className="text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Kelola User</h2>
          <p className="text-sm text-slate-500 mb-4">Atur akun peserta, guru, dan proktor.</p>
          <div className="flex items-center text-emerald-600 text-sm font-medium">
            Buka Halaman <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link href="/admin/schedules" className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
            <CalendarDays size={24} className="text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Jadwal Ujian</h2>
          <p className="text-sm text-slate-500 mb-4">Buat jadwal, atur sesi, dan token.</p>
          <div className="flex items-center text-emerald-600 text-sm font-medium">
            Buka Halaman <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link href="/admin/subjects" className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
            <BookOpen size={24} className="text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Mata Pelajaran</h2>
          <p className="text-sm text-slate-500 mb-4">Kelola daftar mata pelajaran ujian.</p>
          <div className="flex items-center text-emerald-600 text-sm font-medium">
            Buka Halaman <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Info Tambahan / Status Sistem */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="text-emerald-500" size={20} />
          <h3 className="font-bold text-slate-800">Status Sistem</h3>
        </div>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-sm text-slate-600 font-medium">Database Terhubung</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-sm text-slate-600 font-medium">Server API Berjalan</span>
          </div>
        </div>
      </div>

    </div>
  )
}