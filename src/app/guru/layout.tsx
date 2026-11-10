import Link from 'next/link'
import { LayoutDashboard, BookOpen, LogOut } from 'lucide-react'

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      
      {/* SIDEBAR GURU */}
      <aside className="w-[260px] bg-white border-r border-slate-200 flex flex-col fixed h-full z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm mr-3">
            U
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">Guru Panel</span>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          <Link href="/guru/dashboard" className="flex items-center gap-3 px-3 py-2.5 bg-emerald-50 text-emerald-700 font-medium rounded-lg transition-colors border border-emerald-100">
            <LayoutDashboard size={18} className="text-emerald-600" /> Daftar Ujian
          </Link>
          {/* Menu lain bisa ditambah nanti */}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Link href="/api/auth/logout" className="flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium">
            <LogOut size={18} className="text-red-400" /> Keluar
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-[260px] flex flex-col min-h-screen">
        <header className="bg-white h-16 border-b border-slate-200 flex items-center px-6 justify-between sticky top-0 z-10">
          <div className="text-sm text-slate-500">
            Guru / <span className="ml-2 font-semibold text-slate-800">Panel Kontrol</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-emerald-700 text-sm">
              G
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>

    </div>
  )
}