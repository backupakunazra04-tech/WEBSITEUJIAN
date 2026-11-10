'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Save, Loader2, Download, BookOpen } from 'lucide-react'
import * as XLSX from 'xlsx'

function KoreksiContent() {
  const params = useParams()
  const scheduleId = params.id as string

  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null)
  
  // State form koreksi
  const [nilaiInput, setNilaiInput] = useState<Record<string, string>>({})
  const [komentarInput, setKomentarInput] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/guru/koreksi?scheduleId=${scheduleId}`)
        const data = await res.json()
        if (res.ok) {
          setParticipants(data.participants)
          if (data.participants.length > 0) {
            setSelectedParticipant(data.participants[0])
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [scheduleId])

  // Isi form saat peserta dipilih
  useEffect(() => {
    if (selectedParticipant) {
      const newNilai: Record<string, string> = {}
      const newKomentar: Record<string, string> = {}
      
      selectedParticipant.answers.forEach((ans: any) => {
        if (ans.question.tipe === 'ESSAY') {
          newNilai[ans.id] = ans.nilaiEssay !== null ? ans.nilaiEssay.toString() : ''
          newKomentar[ans.id] = ans.komentarGuru || ''
        }
      })
      
      setNilaiInput(newNilai)
      setKomentarInput(newKomentar)
    }
  }, [selectedParticipant])

  const handleSimpanNilai = async (answerId: string) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/guru/koreksi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answerId,
          nilaiEssay: parseFloat(nilaiInput[answerId] || '0'),
          komentarGuru: komentarInput[answerId]
        })
      })
      
      if (res.ok) {
        alert('Nilai berhasil disimpan!')
      } else {
        alert('Gagal menyimpan nilai')
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExportNilai = () => {
    const excelData = participants.map((p, index) => ({
      'No': index + 1,
      'Nama Siswa': p.user.nama,
      'Username': p.user.username,
      'Status': p.status,
      'Total Skor': p.skor || 0
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Nilai Ujian')
    XLSX.writeFile(workbook, `Nilai_Ujian_${scheduleId}.xlsx`)
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat data peserta...</div>

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Link href="/guru/dashboard" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Koreksi Jawaban Essay</h1>
            <p className="text-sm text-slate-500 mt-1">Berikan nilai untuk jawaban subjektif siswa.</p>
          </div>
        </div>

        <button 
          onClick={handleExportNilai}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all"
        >
          <Download size={18} /> Export Nilai
        </button>
      </div>

      {participants.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500">
          Belum ada siswa yang menyelesaikan ujian ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* KIRI: Daftar Siswa */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h2 className="font-bold text-slate-800">Daftar Siswa</h2>
              </div>
              <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
                {participants.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedParticipant(p)}
                    className={`w-full text-left p-4 transition-colors ${selectedParticipant?.id === p.id ? 'bg-emerald-50 border-l-4 border-emerald-600' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{p.user.nama}</p>
                        <p className="text-xs text-slate-500">{p.status}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* KANAN: Form Koreksi */}
          <div className="lg:col-span-3">
            {selectedParticipant && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="mb-6 border-b pb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Jawaban: {selectedParticipant.user.nama}</h2>
                    <p className="text-sm text-slate-500">Username: {selectedParticipant.user.username}</p>
                  </div>
                  <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg font-bold">
                    Total Skor: {selectedParticipant.skor || 0}
                  </div>
                </div>

                <div className="space-y-8">
                  {selectedParticipant.answers.filter((a: any) => a.question.tipe === 'ESSAY').length === 0 ? (
                    <p className="text-center text-slate-500 py-8">Siswa ini tidak memiliki soal Essay, atau belum menjawab.</p>
                  ) : (
                    selectedParticipant.answers.filter((a: any) => a.question.tipe === 'ESSAY').map((ans: any, idx: number) => (
                      <div key={ans.id} className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <p className="font-semibold text-slate-800 mb-3">{idx + 1}. {ans.question.teks}</p>
                        
                        {/* KUNCI JAWABAN / RUBRIK */}
                        {ans.question.kunciEssay && (
                          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mb-3">
                            <p className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">
                              <BookOpen size={14} /> Kunci Jawaban / Rubrik:
                            </p>
                            <p className="text-sm text-amber-900 whitespace-pre-wrap">{ans.question.kunciEssay}</p>
                          </div>
                        )}

                        <div className="bg-white p-4 rounded-lg border border-slate-200 mb-4 text-slate-700 text-sm">
                          {ans.jawaban ? ans.jawaban : <span className="text-slate-400 italic">Siswa tidak menjawab</span>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nilai (Maks: {ans.question.poin})</label>
                            <input 
                              type="number" 
                              min="0"
                              max={ans.question.poin}
                              value={nilaiInput[ans.id] || ''}
                              onChange={(e) => setNilaiInput({...nilaiInput, [ans.id]: e.target.value})}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Komentar Guru (Opsional)</label>
                            <input 
                              type="text" 
                              value={komentarInput[ans.id] || ''}
                              onChange={(e) => setKomentarInput({...komentarInput, [ans.id]: e.target.value})}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                              placeholder="Bagus, tapi kurang lengkap..."
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3 flex justify-end">
                          <button 
                            onClick={() => handleSimpanNilai(ans.id)}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Simpan Nilai
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

export default function KoreksiPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat...</div>}>
      <KoreksiContent />
    </Suspense>
  )
}