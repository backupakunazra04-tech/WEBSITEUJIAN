'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams } from 'next/navigation'
import * as XLSX from 'xlsx'
import { 
  Plus, Trash2, ArrowLeft, Image as ImageIcon, Save, Upload, Download, Pencil 
} from 'lucide-react'
import Link from 'next/link'

type Option = { teks: string, gambarUrl: string, isCorrect: boolean }
type Question = {
  id: string
  tipe: string
  stimulus: string | null
  teks: string
  gambarUrl: string | null
  kunciEssay: string | null
  poin: number
  options: { id: string, teks: string, gambarUrl: string | null, isCorrect: boolean }[]
}

function BuatSoalContent() {
  const params = useParams()
  const scheduleId = params.id as string

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [tipe, setTipe] = useState('PG')
  const [stimulus, setStimulus] = useState('')
  const [teks, setTeks] = useState('')
  const [gambarUrl, setGambarUrl] = useState('')
  const [kunciEssay, setKunciEssay] = useState('') 
  const [poin, setPoin] = useState(1)
  
  const [options, setOptions] = useState<Option[]>([
    { teks: '', gambarUrl: '', isCorrect: false },
    { teks: '', gambarUrl: '', isCorrect: false },
    { teks: '', gambarUrl: '', isCorrect: false },
    { teks: '', gambarUrl: '', isCorrect: false },
    { teks: '', gambarUrl: '', isCorrect: false },
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
    setOptions([
      { teks: '', gambarUrl: '', isCorrect: false },
      { teks: '', gambarUrl: '', isCorrect: false },
      { teks: '', gambarUrl: '', isCorrect: false },
      { teks: '', gambarUrl: '', isCorrect: false },
      { teks: '', gambarUrl: '', isCorrect: false },
    ])
  }

  const handleTipeChange = (newTipe: string) => {
    setTipe(newTipe)
    if (newTipe === 'BENAR_SALAH') {
      setOptions([
        { teks: '', gambarUrl: '', isCorrect: true },
        { teks: '', gambarUrl: '', isCorrect: false }
      ])
    } else if (newTipe === 'ESSAY') {
      setOptions([])
    } else {
      setOptions([
        { teks: '', gambarUrl: '', isCorrect: false },
        { teks: '', gambarUrl: '', isCorrect: false },
        { teks: '', gambarUrl: '', isCorrect: false },
        { teks: '', gambarUrl: '', isCorrect: false },
        { teks: '', gambarUrl: '', isCorrect: false },
      ])
    }
  }

  const handleOptionChange = (index: number, field: 'teks' | 'gambarUrl', val: string) => {
    const newOptions = [...options]
    newOptions[index][field] = val
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

  const addOption = () => setOptions([...options, { teks: '', gambarUrl: '', isCorrect: false }])
  const removeOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index))
  }

  const handleSimpanSoal = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    // VALIDASI SANTAI: Hanya pastikan pertanyaan utama tidak kosong
    if (!teks) {
      setError('Pertanyaan utama wajib diisi')
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
    if (!window.confirm('Apakah kamu yakin ingin menghapus soal ini?')) return
    try {
      const res = await fetch(`/api/guru/questions?id=${questionId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchQuestions()
        if (editingId === questionId) resetForm()
      } else {
        alert('Gagal menghapus soal')
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
    setOptions(q.options.map(o => ({ teks: o.teks, gambarUrl: o.gambarUrl || '', isCorrect: o.isCorrect })))
  }

  // ... (Fungsi Template & Import Excel tetap sama) ...
  const downloadTemplateExcel = () => { /* ... kode template ... */ }
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... kode import ... */ }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header ... */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/guru/dashboard" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kelola Soal Ujian</h1>
            <p className="text-sm text-slate-500 mt-1">Tambahkan soal untuk ujian ini.</p>
          </div>
        </div>
        {/* Tombol Template & Import ... */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className={`bg-white p-6 rounded-2xl border shadow-sm transition-colors ${editingId ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200'}`}>
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
              {editingId ? 'Edit Soal' : 'Buat Soal Baru'}
            </h2>
            
            <form onSubmit={handleSimpanSoal} className="space-y-5">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

              {/* Tipe Soal */}
              <div className="flex flex-wrap gap-4">
                {['PG', 'PG_MULTI', 'BENAR_SALAH', 'ESSAY'].map(t => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={tipe === t} onChange={() => handleTipeChange(t)} className="accent-emerald-600" /> 
                    {t === 'PG' ? 'Pilihan Ganda' : t === 'PG_MULTI' ? 'PG Multi' : t === 'BENAR_SALAH' ? 'Benar/Salah' : 'Essay'}
                  </label>
                ))}
              </div>

              {/* Stimulus (Bebas diisi untuk semua tipe soal) */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <label className="block text-sm font-bold text-blue-800 mb-2">Stimulus / Teks Bacaan (Opsional)</label>
                <textarea 
                  rows={3}
                  value={stimulus}
                  onChange={(e) => setStimulus(e.target.value)}
                  className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm bg-white"
                  placeholder="Jika soal ini butuh teks bacaan, isi di sini..."
                />
              </div>

              {/* Teks Soal */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pertanyaan Utama</label>
                <textarea required rows={2} value={teks} onChange={(e) => setTeks(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Tulis soal..." />
              </div>

              {tipe === 'ESSAY' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kunci Jawaban / Rubrik (Opsional)</label>
                  <textarea rows={3} value={kunciEssay} onChange={(e) => setKunciEssay(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-amber-50" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL Gambar Soal Utama (Opsional)</label>
                  <input type="url" value={gambarUrl} onChange={(e) => setGambarUrl(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="https://..." />
                  {gambarUrl && (
                    <img src={gambarUrl} alt="Preview" className="mt-2 h-32 object-contain rounded border" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Rusak'} />
                  )}
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
                      <label className="block text-sm font-medium text-slate-700 mb-3">Tabel Pernyataan (Bisa berisi Teks & Gambar)</label>
                      <div className="space-y-4">
                        <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 mb-1 px-1">
                          <div className="col-span-7">Pernyataan</div>
                          <div className="col-span-2 text-center">Benar</div>
                          <div className="col-span-2 text-center">Salah</div>
                          <div className="col-span-1"></div>
                        </div>
                        
                        {options.map((opt, i) => (
                          <div key={i} className="grid grid-cols-12 gap-2 items-start border-b border-slate-200 pb-3 last:border-0">
                            <div className="col-span-7 space-y-2">
                              <input type="text" value={opt.teks} onChange={(e) => handleOptionChange(i, 'teks', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder={`Teks Pernyataan ${i + 1}...`} />
                              <div className="flex gap-2 items-center">
                                <ImageIcon size={14} className="text-slate-400" />
                                <input type="url" value={opt.gambarUrl} onChange={(e) => handleOptionChange(i, 'gambarUrl', e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs" placeholder="URL Gambar Pernyataan (Opsional)" />
                              </div>
                              {opt.gambarUrl && (
                                <img src={opt.gambarUrl} alt="Preview" className="h-16 object-contain rounded border" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50?text=X'} />
                              )}
                            </div>
                            <div className="col-span-2 flex justify-center pt-2">
                              <input type="radio" name={`jawaban-${i}`} checked={opt.isCorrect === true} onChange={() => handleCorrectChange(i, true)} className="w-5 h-5 accent-emerald-600 cursor-pointer" />
                            </div>
                            <div className="col-span-2 flex justify-center pt-2">
                              <input type="radio" name={`jawaban-${i}`} checked={opt.isCorrect === false} onChange={() => handleCorrectChange(i, false)} className="w-5 h-5 accent-red-500 cursor-pointer" />
                            </div>
                            <div className="col-span-1 text-center pt-2">
                              {options.length > 2 && <button type="button" onClick={() => removeOption(i)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={addOption} className="mt-3 text-sm font-medium text-emerald-600 flex items-center gap-1"><Plus size={14} /> Tambah Pernyataan</button>
                    </div>
                  ) : (
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">Pilihan Jawaban (A-E)</label>
                      <div className="space-y-4">
                        {options.map((opt, i) => (
                          <div key={i} className="flex gap-3 items-start border-b border-slate-200 pb-3 last:border-0">
                            <input type={tipe === 'PG' ? 'radio' : 'checkbox'} checked={opt.isCorrect} onChange={() => handleRadioCorrectChange(i)} className="w-4 h-4 mt-2 accent-emerald-600 cursor-pointer" name="correct-answer" />
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex gap-2">
                                <span className="font-bold text-slate-500 mt-2">{String.fromCharCode(65 + i)}.</span>
                                <input type="text" value={opt.teks} onChange={(e) => handleOptionChange(i, 'teks', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm" placeholder={`Teks Pilihan ${String.fromCharCode(65 + i)}`} />
                              </div>
                              <div className="flex gap-2 items-center pl-5">
                                <ImageIcon size={16} className="text-slate-400" />
                                <input type="url" value={opt.gambarUrl} onChange={(e) => handleOptionChange(i, 'gambarUrl', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-1 text-xs text-slate-600" placeholder="URL Gambar Pilihan (Opsional)" />
                              </div>
                              {opt.gambarUrl && (
                                <div className="pl-5 mt-1">
                                  <img src={opt.gambarUrl} alt={`Preview ${String.fromCharCode(65 + i)}`} className="h-20 object-contain rounded border" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Rusak'} />
                                </div>
                              )}
                            </div>

                            {options.length > 2 && (
                              <button type="button" onClick={() => removeOption(i)} className="text-slate-400 hover:text-red-500 mt-2"><Trash2 size={16} /></button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={addOption} className="mt-3 text-sm font-medium text-emerald-600 flex items-center gap-1"><Plus size={14} /> Tambah Pilihan</button>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex gap-3">
                {editingId && <button type="button" onClick={resetForm} className="px-4 py-2.5 rounded-lg font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">Batal Edit</button>}
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
            {loading ? <p className="text-sm text-slate-500">Memuat...</p> : questions.length === 0 ? <p className="text-sm text-slate-500 text-center py-6">Belum ada soal.</p> : (
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