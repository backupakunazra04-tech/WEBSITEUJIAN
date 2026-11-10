import Link from 'next/link'
import Image from 'next/image'
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  BookOpen, 
  Settings,
  LogOut,
  UserPlus,
  FileText,
  Printer,
  Activity
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800 print:bg-white print:min-h-0">
      
      {/* SIDEBAR ADMIN - print:hidden agar tidak ikut tercetak */}
      <aside className="w-[280px] bg-white border-r border-slate-200 flex flex-col fixed h-full z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] print:hidden">
        {/* Header Sekolah & Logo */}
        <div className="h-20 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 p-1 overflow-hidden shrink-0">
            <Image src="/logo-sekolah.png" alt="Logo" width={40} height={40} className="object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-900 leading-tight tracking-tight">SMAS UNGGULAN</span>
            <span className="text-xs font-semibold text-emerald-600 tracking-wide">BPPT AL FATTAH</span>
          </div>
        </div>

        {/* Menu Navigasi */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Menu Utama</p>
          
          <Link href="/admin/dashboard" className="group flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all font-medium">
            <LayoutDashboard size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors" /> Dashboard
          </Link>
          
          <Link href="/admin/users" className="group flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all font-medium">
            <Users size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors" /> Kelola User
          </Link>
          
          <Link href="/admin/subjects" className="group flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all font-medium">
            <BookOpen size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors" /> Mata Pelajaran
          </Link>

          <Link href="/admin/schedules" className="group flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all font-medium">
            <CalendarDays size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors" /> Jadwal Ujian
          </Link>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Laporan & Tugas</p>
            
            <Link href="/admin/assign" className="group flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all font-medium">
              <UserPlus size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors" /> Assign Guru
            </Link>

            <Link href="/admin/rekap" className="group flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all font-medium">
              <FileText size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors" /> Rekap Nilai
            </Link>

            <Link href="/admin/cetak-kartu" className="group flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all font-medium">
              <Printer size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors" /> Cetak Kartu
            </Link>

            <Link href="/admin/logs" className="group flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all font-medium">
              <Activity size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors" /> Log Aktivitas
            </Link>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Pengaturan</p>
            <Link href="/admin/settings" className="group flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-medium">
              <Settings size={20} className="text-slate-400 group-hover:text-slate-600 transition-colors" /> Pengaturan
            </Link>
          </div>
        </nav>

        {/* Tombol Logout */}
        <div className="p-4 border-t border-slate-100">
          <a href="/api/auth/logout" className="flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium">
            <LogOut size={20} className="text-red-400" /> Keluar
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT AREA - print:ml-0 agar margin kiri hilang saat cetak */}
      <main className="flex-1 ml-[280px] flex flex-col min-h-screen print:ml-0">
        
        {/* Topbar - print:hidden agar tidak ikut tercetak */}
        <header className="bg-white/80 backdrop-blur-md h-20 border-b border-slate-200 flex items-center px-8 justify-between sticky top-0 z-10 print:hidden">
          <div className="flex items-center text-sm text-slate-500 font-medium tracking-wide">
            Admin Panel / <span className="ml-2 text-slate-900 font-bold">Kontrol Utama</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px]">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-bold text-emerald-700">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Area Halaman - print:p-0 agar padding hilang saat cetak */}
        <div className="p-8 flex-1 print:p-0">
          {children}
        </div>
      </main>

    </div>
  )
}