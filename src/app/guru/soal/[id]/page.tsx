'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams } from 'next/navigation'
import * as XLSX from 'xlsx'
import { 
  Plus, Trash2, ArrowLeft, Image as ImageIcon, Save, Upload, Download, Pencil 
} from 'lucide-react'
import Link from 'next/link'

type Option = { teks: string, isCorrect: boolean }
type Question = {
  id: string
  tipe: string
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

  // State Form Soal Baru / Edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tipe, setTipe] = useState('PG')
  const [teks, setTeks] = useState('')
  const [gambarUrl, setGambarUrl] = useState('')
  const [kunciEssay, setKunciEssay] = useState('') // <-- State Kunci Essay
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
    setTeks('')
    setGambarUrl('')
    setKunciEssay('') // <-- Reset Kunci Essay
    setPoin(1)
    setTipe('PG')
    setOptions([{ teks: '', isCorrect: false }, { teks: '', isCorrect: false }])
  }

  const handleOptionChange = (index: number, val: string) => {
    const newOptions = [...options]
    newOptions[index].teks = val
    setOptions(newOptions)
  }

  const handleCorrectChange = (index: number) => {
    const newOptions = options.map((opt, i) => {
      if (tipe === 'PG') {
        return { ...opt, isCorrect: i === index }
      } else {
        return i === index ? { ...opt, isCorrect: !opt.isCorrect } : opt
      }
    })
    setOptions(newOptions)
  }

  const addOption = () => setOptions([...options, { teks: '', isCorrect: false }])
  const removeOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index))
  }

  const handleSimpanSoal = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    if ((tipe === 'PG' || tipe === 'PG_MULTI') && options.some(o => o.teks === '')) {
      setError('Semua pilihan jawaban harus diisi')
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
          teks, 
          gambarUrl, 
          kunciEssay, // <-- Kirim Kunci Essay
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
    const konfirmasi = window.confirm('Apakah kamu yakin ingin menghapus soal ini?')
    if (!konfirmasi) return

    try {
      const res = await fetch(`/api/guru/questions?id=${questionId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        fetchQuestions()
        if (editingId === questionId) resetForm()
      } else {
        alert('Gagal menghapus soal')
      }
    } catch (error) {
      console.error(error)
      alert('Terjadi kesalahan jaringan')
    }
  }

  const handleEditClick = (q: Question) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setEditingId(q.id)
    setTipe(q.tipe)
    setTeks(q.teks)
    setGambarUrl(q.gambarUrl || '')
    setKunciEssay(q.kunciEssay || '') // <-- Load Kunci Essay
    setPoin(q.poin)
    setOptions(q.options.map(o => ({
      teks: o.teks,
      isCorrect: o.isCorrect
    })))
  }

  // ==========================================
  // FUNGSI TEMPLATE & IMPORT EXCEL
  // ==========================================
  const downloadTemplateExcel = () => {
    const templateData = [
      {
        Tipe: 'PG',
        Pertanyaan: 'Ibu kota Indonesia adalah...',
        'Pilihan A': 'Jakarta',
        'Pilihan B': 'Bandung',
        'Pilihan C': 'Surabaya',
        'Pilihan D': 'Medan',
        'Jawaban Benar': 'A',
        Poin: 1
      },
      {
        Tipe: 'ESSAY',
        Pertanyaan: 'Jelaskan proses fotosintesis!',
        'Pilihan A': '',
        'Pilihan B': '',
        'Pilihan C': '',
        'Pilihan D': '',
        'Jawaban Benar': '',
        Poin: 5
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    worksheet['!cols'] = [
      { wpx: 80 }, { wpx: 300 }, { wpx: 150 }, { wpx: 150 }, 
      { wpx: 150 }, { wpx: 150 }, { wpx: 100 }, { wpx: 50 }
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Soal')
    XLSX.writeFile(workbook, 'Template_Import_Soal.xlsx')
  }

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

        if (jsonData.length === 0) {
          alert('File Excel kosong atau format tidak sesuai.')
          return
        }

        setIsSubmitting(true)
        
        for (const row of jsonData) {
          const tipe = row['Tipe'] || 'PG'
          const teks = row['Pertanyaan']
          if (!teks) continue 

          const options = []
          const jawabanBenar = row['Jawaban Benar'] || ''

          if (tipe === 'PG' || tipe === 'PG_MULTI') {
            const opts = ['A', 'B', 'C', 'D']
            for (const opt of opts) {
              const teksOpsi = row[`Pilihan ${opt}`]
              if (teksOpsi) {
                options.push({
                  teks: teksOpsi,
                  isCorrect: jawabanBenar.toUpperCase().includes(opt) 
                })
              }
            }
          }

          await fetch('/api/guru/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scheduleId,
              tipe,
              teks,
              gambarUrl: '', 
              kunciEssay: '', // Kosongkan dulu jika dari Excel
              poin: row['Poin'] || 1,
              options
            })
          })
        }
        
        alert(`Berhasil mengimport ${jsonData.length} soal!`)
        fetchQuestions() 
      } catch (err) {
        console.error(err)
        alert('Gagal memproses file Excel. Pastikan format sesuai.')
      } finally {
        setIsSubmitting(false)
        e.target.value = '' 
      }
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
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

        {/* Tombol Aksi (Template & Import) */}
        <div className="flex items-center gap-3">
          <button 
            onClick={downloadTemplateExcel}
            type="button"
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium shadow-sm transition-all"
          >
            <Download size={18} /> Template
          </button>

          <div>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              id="import-excel" 
              className="hidden" 
              onChange={handleImportExcel} 
            />
            <label 
              htmlFor="import-excel" 
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all cursor-pointer"
            >
              <Upload size={18} /> Import Excel
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KIRI: Form Tambah/Edit Soal */}
        <div className="lg:col-span-2">
          <div className={`bg-white p-6 rounded-2xl border shadow-sm transition-colors ${editingId ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200'}`}>
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
              {editingId ? 'Edit Soal' : 'Buat Soal Baru'}
            </h2>
            
            <form onSubmit={handleSimpanSoal} className="space-y-5">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

              {/* Tipe Soal */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={tipe === 'PG'} onChange={() => setTipe('PG')} className="accent-emerald-600" /> Pilihan Ganda
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={tipe === 'PG_MULTI'} onChange={() => setTipe('PG_MULTI')} className="accent-emerald-600" /> PG Multi
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={tipe === 'ESSAY'} onChange={() => setTipe('ESSAY')} className="accent-emerald-600" /> Essay
                </label>
              </div>

              {/* Teks Soal */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pertanyaan</label>
                <textarea 
                  required
                  rows={3}
                  value={teks}
                  onChange={(e) => setTeks(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Tulis soal di sini..."
                />
              </div>

              {/* INPUT KUNCI JAWABAN ESSAY */}
              {tipe === 'ESSAY' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kunci Jawaban / Rubrik Penilaian (Opsional)</label>
                  <textarea 
                    rows={3}
                    value={kunciEssay}
                    onChange={(e) => setKunciEssay(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 bg-amber-50"
                    placeholder="Poin-poin penting yang harus ada di jawaban siswa..."
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* URL Gambar */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL Gambar (Opsional)</label>
                  <div className="relative">
                    <ImageIcon size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    <input 
                      type="url" 
                      value={gambarUrl}
                      onChange={(e) => setGambarUrl(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                {/* Poin */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bobot Poin</label>
                  <input 
                    type="number" 
                    min={1}
                    required
                    value={poin}
                    onChange={(e) => setPoin(parseInt(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Opsi Jawaban */}
              {tipe !== 'ESSAY' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-3">Pilihan Jawaban</label>
                  <div className="space-y-2">
                    {options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <input 
                          type={tipe === 'PG' ? 'radio' : 'checkbox'} 
                          checked={opt.isCorrect}
                          onChange={() => handleCorrectChange(i)}
                          className="w-4 h-4 accent-emerald-600 cursor-pointer"
                          name="correct-answer"
                        />
                        <input 
                          type="text" 
                          value={opt.teks}
                          onChange={(e) => handleOptionChange(i, e.target.value)}
                          className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500"
                          placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                        />
                        {options.length > 2 && (
                          <button type="button" onClick={() => removeOption(i)} className="text-slate-400 hover:text-red-500">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addOption} className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                    <Plus size={14} /> Tambah Pilihan
                  </button>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                {editingId && (
                  <button 
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-lg font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Batal Edit
                  </button>
                )}
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition-all shadow-sm disabled:opacity-70"
                >
                  <Save size={18} /> {isSubmitting ? 'Menyimpan...' : (editingId ? 'Update Soal' : 'Simpan Soal')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* KANAN: Daftar Soal */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex justify-between items-center">
              Daftar Soal <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-md">{questions.length}</span>
            </h2>

            {loading ? (
              <p className="text-sm text-slate-500">Memuat...</p>
            ) : questions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Belum ada soal yang dibuat.</p>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg group relative">
                    <div className="flex items-center justify-between mb-1 pr-16">
                      <span className="text-xs font-bold text-slate-500">Soal No. {idx + 1}</span>
                      <span className="text-xs font-semibold bg-white border px-1.5 py-0.5 rounded text-slate-600">{q.tipe}</span>
                    </div>
                    <p className="text-sm text-slate-800 line-clamp-2 pr-16">{q.teks}</p>
                    
                    {/* Tombol Aksi */}
                    <div className="absolute top-1/2 right-2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-slate-50/80 backdrop-blur-sm rounded-md p-1">
                      <button 
                        onClick={() => handleEditClick(q)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md"
                        title="Edit Soal"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => handleHapusSoal(q.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                        title="Hapus Soal"
                      >
                        <Trash2 size={16} />
                      </button>
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