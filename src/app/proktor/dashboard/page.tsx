'use client'

import { useState, useEffect, useRef } from 'react'
import { Activity, ShieldAlert, MonitorPlay, CheckCircle, RefreshCw, Key, Play, Unlock } from 'lucide-react'

type Schedule = {
  id: string
  gradeLevel: string
  status: string
  token: string
  subject: { nama: string }
}

type Participant = {
  id: string
  status: string
  user: { nama: string, gradeLevel: string } | null
  schedule: { subject: { nama: string } } | null
  violations: { level: string, tipe: string }[]
}

export default function ProktorDashboard() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const prevViolationsRef = useRef<number>(0)

  const playAlertSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log("Audio belum diizinkan oleh browser.", e);
    }
  }

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/proktor/schedules')
      const data = await res.json()
      if (res.ok) setSchedules(data.schedules)
    } catch (error) {
      console.error('Gagal ambil jadwal', error)
    }
  }

  const fetchParticipants = async () => {
    try {
      const res = await fetch('/api/proktor/monitoring')
      const data = await res.json()
      if (res.ok) {
        setParticipants(data.participants)
        setLastUpdated(new Date())

        let totalPelanggaranSaatIni = 0;
        data.participants.forEach((p: any) => {
          totalPelanggaranSaatIni += p.violations.filter((v: any) => v.level === 'PELANGGARAN').length;
        });

        if (totalPelanggaranSaatIni > prevViolationsRef.current) {
           playAlertSound();
        }
        prevViolationsRef.current = totalPelanggaranSaatIni;
      }
    } catch (error) {
      console.error('Gagal ambil monitoring', error)
    }
  }

  useEffect(() => {
    Promise.all([fetchSchedules(), fetchParticipants()]).then(() => setLoading(false))
    const interval = setInterval(() => { fetchParticipants() }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleRilisToken = async (scheduleId: string, action: string) => {
    const konfirmasi = window.confirm(
      action === 'AKTIFKAN' 
        ? 'Rilis token dan aktifkan ujian ini sekarang?' 
        : 'Hentikan ujian ini? Peserta tidak bisa lagi masuk.'
    )
    if (!konfirmasi) return

    try {
      const res = await fetch('/api/proktor/token', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId, action })
      })
      if (res.ok) fetchSchedules()
    } catch (error) {
      alert('Terjadi kesalahan jaringan')
    }
  }

  const handleBukaKunci = async (participantId: string, nama: string) => {
    const konfirmasi = window.confirm(`Buka kunci ujian untuk "${nama}"? Siswa bisa melanjutkan ujiannya.`)
    if (!konfirmasi) return

    try {
      const res = await fetch(`/api/proktor/reset`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: participantId })
      })
      if (res.ok) fetchParticipants()
      else alert('Gagal membuka kunci peserta')
    } catch (error) {
      alert('Terjadi kesalahan jaringan')
    }
  }

  const countPelanggaran = (violations: any[]) => {
    return violations.filter(v => v.level === 'PELANGGARAN').length
  }

  return (
    // Pembungkus utama dengan latar belakang terang
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      <div className="max-w-7xl mx-auto space-y-8 pt-6 px-4 md:px-8">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Proktor</h1>
            <p className="text-sm text-slate-500 mt-1">Pantau jalannya ujian dan rilis token secara real-time.</p>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            <RefreshCw size={12} className="animate-spin text-emerald-500" /> 
            Update terakhir: {lastUpdated ? lastUpdated.toLocaleTimeString('id-ID') : 'Menghubungkan...'}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* KOLOM KIRI */}
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-slate-50">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <MonitorPlay size={18} className="text-emerald-600"/> Kontrol Ujian
                </h2>
              </div>
              <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
                {loading ? (
                  <p className="p-6 text-sm text-slate-500 text-center animate-pulse">Memuat jadwal...</p>
                ) : (
                  schedules.map(sch => (
                    <div key={sch.id} className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-slate-800 text-lg">{sch.subject.nama}</p>
                          <p className="text-sm text-slate-500">Kelas {sch.gradeLevel}</p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${sch.status === 'AKTIF' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {sch.status}
                        </span>
                      </div>
                      
                      {sch.status === 'AKTIF' ? (
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Token Ujian Aktif:</p>
                          <div className="flex flex-col gap-2">
                            <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center font-mono font-bold text-2xl tracking-[0.25em] text-emerald-700 flex items-center justify-center gap-2">
                              <Key size={18} className="text-emerald-500" /> {sch.token}
                            </div>
                            <button 
                              onClick={() => handleRilisToken(sch.id, 'SELESAIKAN')}
                              className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors border border-red-200"
                            >
                              Hentikan Ujian
                            </button>
                          </div>
                        </div>
                      ) : sch.status === 'DRAFT' ? (
                        <button 
                          onClick={() => handleRilisToken(sch.id, 'AKTIFKAN')}
                          className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          <Play size={16} /> Rilis Token & Aktifkan
                        </button>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <Activity size={18} className="text-emerald-600"/> Live Monitoring Peserta
                </h2>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                  {participants.length} Peserta Terpantau
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider bg-slate-50/50">
                      <th className="px-5 py-4">Nama Peserta</th>
                      <th className="px-5 py-4">Kelas</th>
                      <th className="px-5 py-4">Mapel</th>
                      <th className="px-5 py-4 text-center">Status</th>
                      <th className="px-5 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500 animate-pulse">Menghubungkan...</td></tr>
                    ) : participants.length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-16 text-center text-slate-500"><MonitorPlay size={40} className="mx-auto text-slate-300 mb-3" />Belum ada peserta yang masuk ujian.</td></tr>
                    ) : (
                      participants.map(p => {
                        const totalPelanggaran = countPelanggaran(p.violations)
                        const namaPeserta = p.user?.nama || 'Siswa (Dihapus)'
                        const kelasPeserta = p.user?.gradeLevel || '-'
                        const mapelPeserta = p.schedule?.subject?.nama || 'Mapel (Dihapus)'

                        return (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-4 font-semibold text-slate-800">{namaPeserta}</td>
                            <td className="px-5 py-4 text-sm text-slate-600">{kelasPeserta}</td>
                            <td className="px-5 py-4 text-sm text-slate-600">{mapelPeserta}</td>
                            <td className="px-5 py-4 text-center">
                              {p.status === 'SELESAI' ? (
                                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300">
                                  <CheckCircle size={14} /> Selesai
                                </span>
                              ) : p.status === 'DIHENTIKAN' ? (
                                <span className="inline-flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                                  <ShieldAlert size={14} /> Dihentikan
                                </span>
                              ) : totalPelanggaran >= 2 ? (
                                <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-300 animate-pulse">
                                  <ShieldAlert size={14} /> {totalPelanggaran} Pelanggaran
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200">
                                  <CheckCircle size={14} /> Sedang Ujian
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button 
                                onClick={() => handleBukaKunci(p.id, namaPeserta)}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                                title="Buka Kunci / Lanjutkan Ujian"
                              >
                                <Unlock size={16} />
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* NOTICE PERINGATAN DENGAN DESAIN LEBIH BAIK */}
            <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl shadow-sm flex gap-4 items-start">
              <div className="p-2 bg-red-100 rounded-full shrink-0">
                <ShieldAlert size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-red-800 mb-1">Perhatian Proktor</h3>
                <p className="text-sm text-red-700 leading-relaxed">
                  Peserta yang mendapatkan <strong>2 Pelanggaran</strong> akan otomatis dihentikan ujiannya oleh sistem. 
                  Jika siswa terlanjur keluar atau ingin mengulang, klik ikon Gembok Terbuka (Unlock) agar mereka bisa login kembali dan melanjutkan dari soal terakhir.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}