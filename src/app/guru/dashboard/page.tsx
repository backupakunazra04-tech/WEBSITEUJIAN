'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, CalendarDays, Clock, FileText, CheckCircle2 } from 'lucide-react'

type Schedule = {
  id: string
  gradeLevel: string
  waktuMulai: string
  waktuSelesai: string
  status: string
  subject: { nama: string }
  _count: { questions: number }
}

export default function GuruDashboard() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await fetch('/api/guru/schedules')
        const data = await res.json()
        if (res.ok) setSchedules(data.schedules)
      } catch (error) {
        console.error('Gagal fetch jadwal', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSchedules()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Daftar Ujian</h1>
        <p className="text-sm text-slate-500 mt-1">Pilih ujian di bawah ini untuk mulai membuat soal atau mengoreksi jawaban.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Memuat data...</div>
      ) : schedules.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500">
          <CalendarDays size={40} className="mx-auto text-slate-300 mb-3" />
          Belum ada jadwal ujian yang tersedia untuk Anda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-emerald-300 transition-colors">
              
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <BookOpen size={24} />
                  </div>
                  <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200">
                    Kelas {schedule.gradeLevel}
                  </span>
                </div>
                
                <h2 className="text-xl font-bold text-slate-800 mb-2">{schedule.subject.nama}</h2>
                
                <div className="space-y-2 text-sm text-slate-500 mb-6">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} /> {formatDate(schedule.waktuMulai)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} /> {new Date(schedule.waktuMulai).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} WIB
                  </div>
                  <div className="flex items-center gap-2 font-medium text-emerald-600">
                    <FileText size={16} /> {schedule._count.questions} Soal dibuat
                  </div>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <Link 
                  href={`/guru/soal/${schedule.id}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 py-2.5 rounded-lg font-medium transition-all shadow-sm text-sm"
                >
                  <CheckCircle2 size={16} /> Buat Soal
                </Link>
                <Link 
                  href={`/guru/koreksi/${schedule.id}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 py-2.5 rounded-lg font-medium transition-all shadow-sm text-sm"
                >
                  <FileText size={16} /> Koreksi
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}