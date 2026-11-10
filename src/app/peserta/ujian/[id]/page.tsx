'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Key, Calendar, Clock, ShieldCheck, CheckCircle, ShieldAlert, List, WifiOff } from 'lucide-react'

function UjianContent() {
  const params = useParams()
  const router = useRouter()
  const scheduleId = params.id as string

  // State Pra-Ujian
  const [token, setToken] = useState('')
  const [tanggalLahir, setTanggalLahir] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // State Countdown
  const [waktuMulai, setWaktuMulai] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState<string>('')
  const [isFetchingJadwal, setIsFetchingJadwal] = useState(true)

  // State Ujian
  const [isUjianDimulai, setIsUjianDimulai] = useState(false)
  const [isSelesai, setIsSelesai] = useState(false)
  const [isDikunci, setIsDikunci] = useState(false)
  const [pesanDikunci, setPesanDikunci] = useState('')
  
  const [participantId, setParticipantId] = useState('')
  const [questions, setQuestions] = useState<any[]>([])
  const [jawaban, setJawaban] = useState<Record<string, string>>({})
  const [sisaWaktu, setSisaWaktu] = useState(0)
  const [skorAkhir, setSkorAkhir] = useState(0)
  
  // State Anti-Curang & Koneksi
  const [isTabHidden, setIsTabHidden] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  // Deteksi Koneksi Internet
  useEffect(() => {
    // Cek status awal
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 1. Ambil info jadwal untuk Countdown
  useEffect(() => {
    const fetchScheduleInfo = async () => {
      try {
        const res = await fetch(`/api/peserta/schedules`)
        const data = await res.json()
        if (res.ok) {
          const currentSchedule = data.schedules.find((s: any) => s.id === scheduleId)
          if (currentSchedule) {
            setWaktuMulai(new Date(currentSchedule.waktuMulai))
          }
        }
      } catch (error) {
        console.error('Gagal mengambil info jadwal', error)
      } finally {
        setIsFetchingJadwal(false)
      }
    }
    fetchScheduleInfo()
  }, [scheduleId])

  // 2. Logika Hitung Mundur
  useEffect(() => {
    if (!waktuMulai) return

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const distance = waktuMulai.getTime() - now

      if (distance < 0) {
        clearInterval(interval)
        setCountdown('')
        return
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setCountdown(`${hours}j ${minutes}m ${seconds}d`)
    }, 1000)

    return () => clearInterval(interval)
  }, [waktuMulai])

  const handleMulaiUjian = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/peserta/mulai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId, token, tanggalLahir })
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Gagal memulai ujian')

      setParticipantId(data.participantId)
      setQuestions(data.questions || [])
      
      if (data.jawabanLama && data.jawabanLama.length > 0) {
        const jawabanMap: Record<string, string> = {}
        data.jawabanLama.forEach((ans: any) => {
          jawabanMap[ans.questionId] = ans.jawaban
        })
        setJawaban(jawabanMap)
      }

      setSisaWaktu(new Date(data.waktuSelesai).getTime() - new Date().getTime())
      setIsUjianDimulai(true)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelesaiUjian = async (isAutoSubmit = false) => {
    if (!isAutoSubmit) {
      const belumDijawab = questions.filter(q => !jawaban[q.id] || jawaban[q.id] === '').length
      let pesan = 'Apakah kamu yakin ingin menyelesaikan ujian? Jawaban tidak bisa diubah lagi.'
      if (belumDijawab > 0) {
        pesan = `⚠️ MASIH ADA ${belumDijawab} SOAL YANG BELUM DIJAWAB!\n\nApakah kamu yakin ingin menyelesaikan ujian sekarang?`
      }
      const konfirmasi = window.confirm(pesan)
      if (!konfirmasi) return
    }

    try {
      const res = await fetch('/api/peserta/ujian', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId })
      })
      
      const data = await res.json()
      if (res.ok && data.skor !== undefined) {
        setSkorAkhir(data.skor)
      }
      
      setIsSelesai(true)
    } catch (error) {
      alert('Gagal menyelesaikan ujian. Periksa koneksi internet.')
    }
  }

  // 3. Timer Ujian & Auto-Submit
  useEffect(() => {
    if (!isUjianDimulai || isSelesai || isDikunci || sisaWaktu <= 0) return
    
    const timer = setInterval(() => {
      setSisaWaktu(prev => {
        if (prev <= 1000) {
          clearInterval(timer)
          handleSelesaiUjian(true)
          return 0
        }
        return prev - 1000
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [isUjianDimulai, isSelesai, isDikunci, sisaWaktu])

  // 4. Fitur Anti-Curang (Tab Switch)
  useEffect(() => {
    if (!isUjianDimulai || isSelesai || isDikunci) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabHidden(true)
        fetch('/api/peserta/pelanggaran', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participantId, scheduleId, tipe: 'PINDAH_TAB', level: 'PERINGATAN' })
        }).catch(err => console.error(err))
      } else {
        setIsTabHidden(false)
        fetch('/api/peserta/pelanggaran', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participantId, scheduleId, tipe: 'KEMBALI_KE_TAB', level: 'PELANGGARAN' })
        }).then(res => res.json()).then(data => {
          if (data.status === 'DIHENTIKAN') {
            setIsDikunci(true)
            setPesanDikunci(data.message || 'UJIAN ANDA DIHENTIKAN: Kamu terdeteksi melakukan kecurangan berkali-kali.')
          }
        }).catch(err => console.error(err))
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isUjianDimulai, isSelesai, isDikunci, participantId, scheduleId])

  // 5. Fitur Blokir Copy-Paste
  useEffect(() => {
    if (!isUjianDimulai || isSelesai || isDikunci) return
    const preventCopy = (e: Event) => {
      e.preventDefault()
      alert('Dilarang menyalin atau menempel pada halaman ujian!')
    }
    document.addEventListener('copy', preventCopy)
    document.addEventListener('paste', preventCopy)
    return () => {
      document.removeEventListener('copy', preventCopy)
      document.removeEventListener('paste', preventCopy)
    }
  }, [isUjianDimulai, isSelesai, isDikunci])

  // 6. Simpan Jawaban (Autosave dengan Cek Koneksi)
  const handleJawab = async (questionId: string, val: string) => {
    // Selalu update state lokal dulu
    setJawaban(prev => ({ ...prev, [questionId]: val }))

    // Jika offline, simpan ke localStorage sementara
    if (!navigator.onLine) {
      const draft = JSON.parse(localStorage.getItem('draft_jawaban') || '{}')
      draft[questionId] = val
      localStorage.setItem('draft_jawaban', JSON.stringify(draft))
      return
    }

    // Jika online, kirim ke server
    fetch('/api/peserta/ujian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, questionId, jawaban: val })
    }).catch(err => {
      console.error('Gagal autosave, menyimpan ke lokal', err)
      // Fallback jika tiba-tiba putus di tengah jalan
      const draft = JSON.parse(localStorage.getItem('draft_jawaban') || '{}')
      draft[questionId] = val
      localStorage.setItem('draft_jawaban', JSON.stringify(draft))
    })
  }

  // Sinkronisasi draft saat online kembali
  useEffect(() => {
    if (isOnline && isUjianDimulai) {
      const draft = JSON.parse(localStorage.getItem('draft_jawaban') || '{}')
      const draftKeys = Object.keys(draft)
      
      if (draftKeys.length > 0) {
        draftKeys.forEach(qId => {
          fetch('/api/peserta/ujian', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participantId, questionId: qId, jawaban: draft[qId] })
          })
        })
        localStorage.removeItem('draft_jawaban')
      }
    }
  }, [isOnline, isUjianDimulai, participantId])

  const formatWaktu = (ms: number) => {
    const totalDetik = Math.floor(ms / 1000)
    const jam = Math.floor(totalDetik / 3600)
    const menit = Math.floor((totalDetik % 3600) / 60)
    const detik = totalDetik % 60
    return `${jam.toString().padStart(2, '0')}:${menit.toString().padStart(2, '0')}:${detik.toString().padStart(2, '0')}`
  }

  // ================= RENDER DIKUNCI (KECURANGAN) =================
  if (isDikunci) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-red-200 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={40} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Ujian Dihentikan</h1>
          <p className="text-slate-600 text-sm mb-8">{pesanDikunci}</p>
          <p className="text-sm text-slate-500 mb-6">Hubungi Proktor untuk di-reset ulang.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    )
  }

  // ================= RENDER SELESAI =================
  if (isSelesai) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Ujian Selesai!</h1>
          <p className="text-slate-500 text-sm mb-6">Jawabanmu sudah tersimpan di sistem.</p>
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8">
            <p className="text-sm font-medium text-emerald-800 mb-1">Skor Sementara (PG):</p>
            <p className="text-4xl font-black text-emerald-600">{skorAkhir}</p>
            <p className="text-xs text-emerald-600/70 mt-2">*Nilai essay akan ditambahkan setelah dikoreksi guru.</p>
          </div>

          <button 
            onClick={() => router.push('/login')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
          >
            Keluar
          </button>
        </div>
      </div>
    )
  }

  // ================= RENDER PRA-UJIAN =================
  if (!isUjianDimulai) {
    if (isFetchingJadwal) {
      return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
    }

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Konfirmasi Ujian</h1>
          <p className="text-center text-slate-500 text-sm mb-8">Masukkan data diri dan token dari proktor.</p>

          {countdown && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center mb-6">
              <p className="text-amber-800 font-medium text-sm mb-1">Ujian belum dimulai. Tunggu sebentar lagi:</p>
              <p className="text-3xl font-mono font-bold text-amber-600">{countdown}</p>
            </div>
          )}

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm border border-red-100">{error}</div>}

          {!countdown && (
            <form onSubmit={handleMulaiUjian} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Lahir</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="date" 
                    required
                    value={tanggalLahir}
                    onChange={(e) => setTanggalLahir(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Token Ujian</label>
                <div className="relative">
                  <Key size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                    className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="XXXXXX"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all mt-4 disabled:opacity-50"
              >
                {isLoading ? 'Memvalidasi...' : 'Mulai Ujian'}
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  // ================= RENDER UJIAN =================
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Indikator Offline */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-center py-2 font-bold animate-pulse flex items-center justify-center gap-2">
          <WifiOff size={18} /> Koneksi Internet Terputus! Jawaban disimpan sementara di perangkat ini.
        </div>
      )}

      {/* Header Timer */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <h1 className="font-bold text-lg text-slate-800">Ujian Online</h1>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold border ${sisaWaktu < 300000 ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            <Clock size={18} /> {formatWaktu(sisaWaktu)}
          </div>
          <button 
            onClick={() => handleSelesaiUjian(false)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Selesai Ujian
          </button>
        </div>
      </header>

      {/* Peringatan Pindah Tab */}
      {isTabHidden && (
        <div className="bg-red-600 text-white text-center py-2 font-bold animate-pulse fixed top-16 left-0 right-0 z-20">
          ⚠️ JANGAN PINDAH TAB! Pelanggaran sedang dicatat.
        </div>
      )}

      {/* Layout Ujian: Kiri Soal, Kanan Navigasi */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col lg:flex-row gap-6 mt-4">
        
        {/* KOLOM KIRI: Daftar Soal */}
        <div className="flex-1 space-y-6">
          {questions.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center text-slate-500">
              <ShieldAlert size={48} className="mx-auto text-amber-400 mb-4" />
              <h2 className="text-lg font-bold text-slate-800 mb-2">Soal Tidak Ditemukan</h2>
              <p>Guru belum memasukkan soal untuk ujian ini.</p>
            </div>
          ) : (
            questions.map((q, idx) => (
              <div key={q.id} id={`soal-${idx}`} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 scroll-mt-24">
                <div className="flex gap-4">
                  <span className="font-bold text-slate-400 text-lg">{idx + 1}.</span>
                  <div className="flex-1">
                    <p className="text-slate-800 text-lg mb-4">{q.teks}</p>
                    {q.gambarUrl && (
                      <img src={q.gambarUrl} alt="Gambar Soal" className="max-h-64 rounded-lg mb-4 border" />
                    )}

                    <div className="space-y-3">
                      {q.tipe === 'ESSAY' ? (
                        <div>
                          <textarea
                            rows={5}
                            className="w-full border border-slate-300 rounded-xl p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Ketik jawaban essay kamu di sini..."
                            value={jawaban[q.id] || ''}
                            onChange={(e) => handleJawab(q.id, e.target.value)}
                          />
                        </div>
                      ) : (
                        q.options.map((opt: any) => (
                          <label key={opt.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                            <input 
                              type={q.tipe === 'PG' ? 'radio' : 'checkbox'} 
                              name={`q-${q.id}`}
                              value={opt.id}
                              checked={q.tipe === 'PG_MULTI' 
                                ? (jawaban[q.id] || '').split(',').includes(opt.id)
                                : jawaban[q.id] === opt.id
                              }
                              onChange={(e) => {
                                if (q.tipe === 'PG') {
                                  handleJawab(q.id, opt.id)
                                } else {
                                  let current = (jawaban[q.id] || '').split(',').filter(Boolean)
                                  if (e.target.checked) current.push(opt.id)
                                  else current = current.filter(id => id !== opt.id)
                                  handleJawab(q.id, current.join(','))
                                }
                              }}
                              className="w-5 h-5 accent-emerald-600"
                            />
                            <span className="text-slate-700">{opt.teks}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* KOLOM KANAN: Navigasi Soal (Sticky) */}
        <div className="lg:w-72 w-full shrink-0">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 sticky top-24">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
              <List size={18} className="text-emerald-600" /> Navigasi Soal
            </h2>
            
            <div className="grid grid-cols-5 gap-2 mb-6">
              {questions.map((q, idx) => {
                const isDijawab = jawaban[q.id] && jawaban[q.id] !== ''
                return (
                  <button
                    key={q.id}
                    onClick={() => document.getElementById(`soal-${idx}`)?.scrollIntoView({ behavior: 'smooth' })}
                    className={`w-full aspect-square flex items-center justify-center text-sm font-bold rounded-lg border transition-all ${
                      isDijawab 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                        : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>

            <div className="space-y-2 text-xs text-slate-500 mb-6 border-t pt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-600 border border-emerald-600"></div>
                <span>Sudah Dijawab</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-50 border border-slate-300"></div>
                <span>Belum Dijawab</span>
              </div>
            </div>

            <button 
              onClick={() => handleSelesaiUjian(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} /> Selesai Ujian
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function UjianPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat...</div>}>
      <UjianContent />
    </Suspense>
  )
}