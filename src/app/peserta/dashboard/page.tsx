'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, CalendarDays, Clock, PlayCircle, FileText, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

type Schedule = {
  id: string
  gradeLevel: string
  waktuMulai: string
  waktuSelesai: string
  status: string
  subject: { nama: string }
}

type Riwayat = {
  id: string
  mapel: string
  status: string
  skor: number | null
  waktuSelesai: string
  jawaban: any[]
}

export default function PesertaDashboard() {
  const [activeTab, setActiveTab] = useState<'aktif' | 'riwayat'>('aktif')
  
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [riwayat, setRiwayat] = useState<Riwayat[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRiwayat, setExpandedRiwayat] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Ambil jadwal aktif
        const resSchedules = await fetch('/api/peserta/schedules')
        const dataSchedules = await resSchedules.json()
        if (resSchedules.ok) setSchedules(dataSchedules.schedules)

        // Ambil riwayat ujian
        const resRiwayat = await fetch('/api/peserta/riwayat')
        const dataRiwayat = await resRiwayat.json()
        if (resRiwayat.ok) setRiwayat(dataRiwayat.riwayat)

      } catch (error) {
        console.error('Gagal fetch data', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const toggleRiwayat = (id: string) => {
    if (expandedRiwayat === id) setExpandedRiwayat(null)
    else setExpandedRiwayat(id)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Siswa</h1>
        <p className="text-sm text-slate-500 mt-1">Pantau ujian aktif dan lihat riwayat hasil ujianmu.</p>
      </div>

      {/* TABS */}
      <div className="flex gap-4 border-b border-slate-200 mb-6">
        <button 
          onClick={() => setActiveTab('aktif')}
          className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'aktif' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Ujian Aktif
        </button>
        <button 
          onClick={() => setActiveTab('riwayat')}
          className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'riwayat' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Riwayat Ujian
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Memuat data...</div>
      ) : activeTab === 'aktif' ? (
        
        // ================= TAB UJIAN AKTIF =================
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500">
              <CalendarDays size={40} className="mx-auto text-slate-300 mb-3" />
              Belum ada jadwal ujian yang aktif untuk kelasmu saat ini.
            </div>
          ) : (
            schedules.map((schedule) => (
              <div key={schedule.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-emerald-300 transition-colors">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                      <BookOpen size={24} />
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200">
                      AKTIF
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
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <Link 
                    href={`/peserta/ujian/${schedule.id}`}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 py-2.5 rounded-lg font-medium transition-all shadow-sm"
                  >
                    <PlayCircle size={18} /> Masuk Ujian
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        
        // ================= TAB RIWAYAT =================
        <div className="space-y-4">
          {riwayat.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500">
              <FileText size={40} className="mx-auto text-slate-300 mb-3" />
              Kamu belum menyelesaikan ujian apa pun.
            </div>
          ) : (
            riwayat.map((r) => (
              <div key={r.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {/* Header Riwayat */}
                <div 
                  onClick={() => toggleRiwayat(r.id)}
                  className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{r.mapel}</h3>
                    <p className="text-sm text-slate-500">Selesai pada: {new Date(r.waktuSelesai).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Skor Akhir</p>
                      <p className="text-2xl font-black text-emerald-600">{r.skor || 0}</p>
                    </div>
                    {expandedRiwayat === r.id ? <ChevronUp size={24} className="text-slate-400" /> : <ChevronDown size={24} className="text-slate-400" />}
                  </div>
                </div>

                {/* Detail Jawaban (Muncul saat diklik) */}
                {expandedRiwayat === r.id && (
                  <div className="border-t border-slate-200 bg-slate-50 p-5 space-y-4">
                    <h4 className="font-bold text-slate-700 mb-2">Detail Jawaban:</h4>
                    {r.jawaban.map((ans, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200">
                        <p className="font-semibold text-sm mb-2">{idx + 1}. {ans.teksSoal}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className={`p-3 rounded-lg border ${ans.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                            <p className="text-xs text-slate-500 mb-1">Jawabanmu:</p>
                            <p className={`font-medium ${ans.isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                              {ans.jawabanSiswa || '-'}
                            </p>
                          </div>
                          
                          <div className="p-3 rounded-lg border bg-slate-50 border-slate-200">
                            <p className="text-xs text-slate-500 mb-1">Kunci / Catatan Guru:</p>
                            <p className="font-medium text-slate-700">
                              {ans.kunciJawaban || '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}