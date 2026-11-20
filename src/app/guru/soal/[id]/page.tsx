'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams } from 'next/navigation'
import { 
  Plus, Trash2, ArrowLeft, Save, Pencil, Image as ImageIcon
} from 'lucide-react'
import Link from 'next/link'

type Option = { teks: string, isCorrect: boolean }
type Question = {
  id: string
  tipe: string
  stimulus: string | null
  teks: string
  gambarUrl: string | null
  kunciEssay: string | null
  poin: number
  options: { id: string, teks: string, isCorrect: boolean }[]
}

function BuatSoalContent() {
  const params = useParams()
  const scheduleId = params.id as string

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // State Form
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tipe, setTipe] = useState('PG')
  const [stimulus, setStimulus] = useState('')
  const [teks, setTeks] = useState('')
  const [gambarUrl, setGambarUrl] = useState('')
  const [kunciEssay, setKunciEssay] = useState('') 
  const [poin, setPoin] = useState(1)
  const [options, setOptions] = useState<Option[]>([
    { teks: '', isCorrect: false },
    { teks: '', isCorrect: false },
  ])

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/guru/questions?scheduleId=${scheduleId}`)
      const data = await res.json()
      if (res.ok) setQuestions(data.questions)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setTipe('PG')
    setStimulus('')
    setTeks('')
    setGambarUrl('')
    setKunciEssay('') 
    setPoin(1)
    setOptions([{ teks: '', isCorrect: false }, { teks: '', isCorrect: false }])
  }

  const handleTipeChange = (newTipe: string) => {
    setTipe(newTipe)
    if (newTipe === 'BENAR_SALAH') {
      setOptions([
        { teks: '', isCorrect: true },
        { teks: '', isCorrect: false }
      ])
    } else if (newTipe === 'ESSAY') {
      setOptions([])
    } else {
      setOptions([{ teks: '', isCorrect: false }, { teks: '', isCorrect: false }])
    }
  }

  const handleOptionChange = (index: number, val: string) => {
    const newOptions = [...options]
    newOptions[index].teks = val
    setOptions(newOptions)
  }

  const handleCorrectChange = (index: number, isCorrect: boolean) => {
    const newOptions = [...options]
    newOptions[index].isCorrect = isCorrect
    setOptions(newOptions)
  }

  const handleRadioCorrectChange = (index: number) => {
    const newOptions = options.map((opt, i) => {
      if (tipe === 'PG') {
        return { ...opt, isCorrect: i === index }
      } else {
        return i === index ? { ...opt, isCorrect: !opt.isCorrect } : opt
      }
    })
    setOptions(newOptions)
  }

  const addOption = () => setOptions([...options, { teks: '', isCorrect: true }])
  const removeOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index))
  }

  const handleSimpanSoal = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    if (tipe !== 'ESSAY' && options.some(o => o.teks === '')) {
      setError('Semua pilihan/pernyataan harus diisi')
      setIsSubmitting(false)
      return
    }

    try {
      const method = editingId ? 'PUT' : 'POST'
      
      const res = await fetch('/api/guru/questions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          scheduleId, 
          tipe, 
          stimulus,
          teks, 
          gambarUrl, 
          kunciEssay, 
          poin,
          options: tipe === 'ESSAY' ? [] : options
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      resetForm()
      fetchQuestions()

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleHapusSoal = async (questionId: string) => {
    if (!window.confirm('Yakin ingin menghapus soal ini?')) return
    try {
      const res = await fetch(`/api/guru/questions?id=${questionId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchQuestions()
        if (editingId === questionId) resetForm()
      }
    } catch (error) { console.error(error) }
  }

  const handleEditClick = (q: Question) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setEditingId(q.id)
    setTipe(q.tipe)
    setStimulus(q.stimulus || '')
    setTeks(q.teks)
    setGambarUrl(q.gambarUrl || '')
    setKunciEssay(q.kunciEssay || '') 
    setPoin(q.poin)
    setOptions(q.options.map(o => ({ teks: o.teks, isCorrect: o.isCorrect })))
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/guru/dashboard" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kelola Soal Ujian</h1>
          <p className="text-sm text-slate-500 mt-1">Tambahkan soal untuk ujian ini.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORM KIRI */}
        <div className="lg:col-span-2">
          <div className={`bg-white p-6 rounded-2xl border shadow-sm transition-colors ${editingId ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200'}`}>
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
              {editingId ? 'Edit Soal' : 'Buat Soal Baru'}
            </h2>
            
            <form onSubmit={handleSimpanSoal} className="space-y-5">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

              {/* Tipe Soal */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={tipe === 'PG'} onChange={() => handleTipeChange('PG')} className="accent-emerald-600" /> Pilihan Ganda
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={tipe === 'PG_MULTI'} onChange={() => handleTipeChange('PG_MULTI')} className="accent-emerald-600" /> PG Multi
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={tipe === 'BENAR_SALAH'} onChange={() => handleTipeChange('BENAR_SALAH')} className="accent-emerald-600" /> Benar/Salah
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={tipe === 'ESSAY'} onChange={() => handleTipeChange('ESSAY')} className="accent-emerald-600" /> Essay
                </label>
              </div>

              {/* Stimulus (Hanya muncul jika Benar/Salah) */}
              {tipe === 'BENAR_SALAH' && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <label className="block text-sm font-bold text-blue-800 mb-2">Stimulus / Teks Bacaan</label>
                  <textarea 
                    required
                    rows={4}
                    value={stimulus}
                    onChange={(e) => setStimulus(e.target.value)}
                    className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                    placeholder="Contoh: Sebuah bengkel otomotif sedang melakukan perbaikan besar pada area kaki-kaki..."
                  />
                </div>
              )}

              {/* Teks Pertanyaan */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {tipe === 'BENAR_SALAH' ? 'Instruksi Pertanyaan' : 'Pertanyaan'}
                </label>
                <textarea 
                  required
                  rows={2}
                  value={teks}
                  onChange={(e) => setTeks(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  placeholder={tipe === 'BENAR_SALAH' ? "Tentukan Benar atau Salah untuk setiap pernyataan berikut!" : "Tulis soal di sini..."}
                />
              </div>

              {/* Kunci Essay */}
              {tipe === 'ESSAY' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kunci Jawaban / Rubrik (Opsional)</label>
                  <textarea rows={3} value={kunciEssay} onChange={(e) => setKunciEssay(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-amber-50" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL Gambar (Opsional)</label>
                  <div className="relative">
                    <ImageIcon size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    <input type="url" value={gambarUrl} onChange={(e) => setGambarUrl(e.target.value)} className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm" placeholder="https://..." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bobot Poin</label>
                  <input type="number" min={1} required value={poin} onChange={(e) => setPoin(parseInt(e.target.value))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              {/* OPSI JAWABAN / TABEL BENAR SALAH */}
              {tipe !== 'ESSAY' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {tipe === 'BENAR_SALAH' ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">Tabel Pernyataan</label>
                      <div className="space-y-3">
                        <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 mb-1 px-1">
                          <div className="col-span-7">Pernyataan</div>
                          <div className="col-span-2 text-center">Benar</div>
                          <div className="col-span-2 text-center">Salah</div>
                          <div className="col-span-1"></div>
                        </div>
                        
                        {options.map((opt, i) => (
                          <div key={i} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-7">
                              <input type="text" value={opt.teks} onChange={(e) => handleOptionChange(i, e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder={`Pernyataan ${i + 1}...`} />
                            </div>
                            <div className="col-span-2 flex justify-center">
                              <input type="radio" name={`jawaban-${i}`} checked={opt.isCorrect === true} onChange={() => handleCorrectChange(i, true)} className="w-5 h-5 accent-emerald-600 cursor-pointer" />
                            </div>
                            <div className="col-span-2 flex justify-center">
                              <input type="radio" name={`jawaban-${i}`} checked={opt.isCorrect === false} onChange={() => handleCorrectChange(i, false)} className="w-5 h-5 accent-red-500 cursor-pointer" />
                            </div>
                            <div className="col-span-1 text-center">
                              {options.length > 2 && (
                                <button type="button" onClick={() => removeOption(i)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={addOption} className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"><Plus size={14} /> Tambah Pernyataan</button>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">Pilihan Jawaban</label>
                      <div className="space-y-2">
                        {options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <input type={tipe === 'PG' ? 'radio' : 'checkbox'} checked={opt.isCorrect} onChange={() => handleRadioCorrectChange(i)} className="w-4 h-4 accent-emerald-600 cursor-pointer" name="correct-answer" />
                            <input type="text" value={opt.teks} onChange={(e) => handleOptionChange(i, e.target.value)} className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm" placeholder={`Pilihan ${String.fromCharCode(65 + i)}`} />
                            {options.length > 2 && (
                              <button type="button" onClick={() => removeOption(i)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={addOption} className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"><Plus size={14} /> Tambah Pilihan</button>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex gap-3">
                {editingId && (
                  <button type="button" onClick={resetForm} className="px-4 py-2.5 rounded-lg font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">Batal Edit</button>
                )}
                <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium shadow-sm">
                  <Save size={18} /> {isSubmitting ? 'Menyimpan...' : (editingId ? 'Update Soal' : 'Simpan Soal')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* LIST SOAL KANAN */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex justify-between items-center">
              Daftar Soal <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-md">{questions.length}</span>
            </h2>
            {loading ? (
              <p className="text-sm text-slate-500">Memuat...</p>
            ) : questions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Belum ada soal.</p>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg group relative">
                    <div className="flex items-center justify-between mb-1 pr-16">
                      <span className="text-xs font-bold text-slate-500">Soal No. {idx + 1}</span>
                      <span className="text-xs font-semibold bg-white border px-1.5 py-0.5 rounded text-slate-600">{q.tipe}</span>
                    </div>
                    <p className="text-sm text-slate-800 line-clamp-2 pr-16">{q.teks || q.stimulus}</p>
                    <div className="absolute top-1/2 right-2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-slate-50/80 p-1">
                      <button onClick={() => handleEditClick(q)} className="p-1.5 text-slate-400 hover:text-emerald-600"><Pencil size={16} /></button>
                      <button onClick={() => handleHapusSoal(q.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default function BuatSoalPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat form soal...</div>}>
      <BuatSoalContent />
    </Suspense>
  )
}