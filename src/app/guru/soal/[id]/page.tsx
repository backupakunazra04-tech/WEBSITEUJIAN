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

  // State Form Soal
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

    const isInvalid = options.some(o => {
      if (tipe === 'PG' || tipe === 'PG_MULTI') return o.teks === ''
      if (tipe === 'BENAR_SALAH') return o.teks === '' && o.gambarUrl === ''
      return false
    })

    if (isInvalid) {
      setError('Teks atau Gambar pada pilihan/pernyataan harus diisi')
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

  // ==========================================
  // DOWNLOAD TEMPLATE EXCEL (1 FILE, 4 CONTOH)
  // ==========================================
  const downloadTemplateExcel = () => {
    const panduanData = [
      { Petunjuk: '1. Di bawah ini adalah contoh untuk setiap tipe soal. Silakan hapus baris contoh jika sudah paham.' },
      { Petunjuk: '2. Kolom "Tipe" wajib diisi: PG, PG_MULTI, BENAR_SALAH, atau ESSAY.' },
      { Petunjuk: '3. URL Gambar Soal & URL Gambar Pilihan (A-E) opsional. Gunakan direct link (misal: i.imgur.com/xxx.jpg).' },
      { Petunjuk: '4. Untuk PG & PG_MULTI, isi Teks Pilihan A-E. Kolom "Kunci PG" isi dengan huruf jawaban (contoh: A atau A,C).' },
      { Petunjuk: '5. Untuk BENAR_SALAH, isi Pernyataan 1-4. Kolom "Kunci B/S" isi angka 1 (Benar) atau 0 (Salah).' },
    ]
    const wsPanduan = XLSX.utils.json_to_sheet(panduanData)
    wsPanduan['!cols'] = [{ wpx: 800 }]

    // DATA CONTOH UNTUK 4 TIPE SOAL
    const templateData = [
      {
        Tipe: 'PG',
        Stimulus: '',
        Pertanyaan: 'Siapakah presiden pertama Indonesia?',
        'URL Gambar Soal': '',
        'Teks A': 'Soekarno', 'URL Gambar A': '',
        'Teks B': 'Soeharto', 'URL Gambar B': '',
        'Teks C': 'B.J. Habibie', 'URL Gambar C': '',
        'Teks D': 'Abdurrahman Wahid', 'URL Gambar D': '',
        'Teks E': 'Megawati', 'URL Gambar E': '',
        'Kunci PG': 'A',
        'Pernyataan 1': '', 'URL Gambar P1': '', 'Pernyataan 2': '', 'URL Gambar P2': '', 'Pernyataan 3': '', 'URL Gambar P3': '', 'Pernyataan 4': '', 'URL Gambar P4': '',
        'Kunci B/S': '',
        Poin: 1
      },
      {
        Tipe: 'PG_MULTI',
        Stimulus: '',
        Pertanyaan: 'Manakah yang termasuk hewan mamalia? (Pilih lebih dari satu)',
        'URL Gambar Soal': '',
        'Teks A': 'Kucing', 'URL Gambar A': '',
        'Teks B': 'Ayam', 'URL Gambar B': '',
        'Teks C': 'Anjing', 'URL Gambar C': '',
        'Teks D': 'Ikan', 'URL Gambar D': '',
        'Teks E': 'Kambing', 'URL Gambar E': '',
        'Kunci PG': 'A, C, E',
        'Pernyataan 1': '', 'URL Gambar P1': '', 'Pernyataan 2': '', 'URL Gambar P2': '', 'Pernyataan 3': '', 'URL Gambar P3': '', 'Pernyataan 4': '', 'URL Gambar P4': '',
        'Kunci B/S': '',
        Poin: 2
      },
      {
        Tipe: 'BENAR_SALAH',
        Stimulus: 'Pada tanggal 17 Agustus 1945, Indonesia memproklamasikan kemerdekaannya. Teks proklamasi dibacakan oleh Ir. Soekarno didampingi Drs. Mohammad Hatta.',
        Pertanyaan: 'Berdasarkan teks di atas, tentukan Benar atau Salah untuk setiap pernyataan berikut!',
        'URL Gambar Soal': '',
        'Teks A': '', 'URL Gambar A': '',
        'Teks B': '', 'URL Gambar B': '',
        'Teks C': '', 'URL Gambar C': '',
        'Teks D': '', 'URL Gambar D': '',
        'Teks E': '', 'URL Gambar E': '',
        'Kunci PG': '',
        'Pernyataan 1': 'Proklamasi dibacakan oleh Ir. Soekarno.', 'URL Gambar P1': '',
        'Pernyataan 2': 'Mohammad Hatta tidak hadir saat proklamasi.', 'URL Gambar P2': '',
        'Pernyataan 3': 'Kemerdekaan diproklamasikan pada 17 Agustus 1945.', 'URL Gambar P3': '',
        'Pernyataan 4': '', 'URL Gambar P4': '',
        'Kunci B/S': '1, 0, 1', 
        Poin: 3
      },
      {
        Tipe: 'ESSAY',
        Stimulus: '',
        Pertanyaan: 'Jelaskan secara singkat proses terjadinya fotosintesis pada tumbuhan!',
        'URL Gambar Soal': '',
        'Teks A': '', 'URL Gambar A': '',
        'Teks B': '', 'URL Gambar B': '',
        'Teks C': '', 'URL Gambar C': '',
        'Teks D': '', 'URL Gambar D': '',
        'Teks E': '', 'URL Gambar E': '',
        'Kunci PG': '',
        'Pernyataan 1': '', 'URL Gambar P1': '', 'Pernyataan 2': '', 'URL Gambar P2': '', 'Pernyataan 3': '', 'URL Gambar P3': '', 'Pernyataan 4': '', 'URL Gambar P4': '',
        'Kunci B/S': '',
        Poin: 5
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    worksheet['!cols'] = [
      { wpx: 100 }, { wpx: 300 }, { wpx: 300 }, { wpx: 200 },
      { wpx: 150 }, { wpx: 150 }, { wpx: 150 }, { wpx: 150 }, { wpx: 150 }, { wpx: 150 }, { wpx: 150 }, { wpx: 150 }, { wpx: 150 },
      { wpx: 100 },
      { wpx: 250 }, { wpx: 150 }, { wpx: 250 }, { wpx: 150 }, { wpx: 250 }, { wpx: 150 }, { wpx: 250 }, { wpx: 150 },
      { wpx: 100 }, { wpx: 50 }
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, wsPanduan, 'Panduan')
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Soal')
    XLSX.writeFile(workbook, 'Template_Import_Soal_Lengkap.xlsx')
  }

  // ==========================================
  // IMPORT EXCEL
  // ==========================================
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames.includes('Data Soal') ? 'Data Soal' : workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

        if (jsonData.length === 0) return alert('File Excel kosong.')

        setIsSubmitting(true)
        let successCount = 0
        
        for (const row of jsonData) {
          const tipe = row['Tipe'] || 'PG'
          const stimulus = row['Stimulus'] || ''
          const teks = row['Pertanyaan']
          const gambarUrlSoal = row['URL Gambar Soal'] || ''
          
          if (!teks) continue 

          const options = []
          if (tipe === 'PG' || tipe === 'PG_MULTI') {
            const kunciPG = (row['Kunci PG'] || '').toUpperCase()
            const opts = ['A', 'B', 'C', 'D', 'E']
            for (const opt of opts) {
              const teksOpsi = row[`Teks ${opt}`]
              const urlOpsi = row[`URL Gambar ${opt}`] || ''
              if (teksOpsi || urlOpsi) {
                options.push({ teks: teksOpsi || '', gambarUrl: urlOpsi, isCorrect: kunciPG.includes(opt) })
              }
            }
          } else if (tipe === 'BENAR_SALAH') {
            const kunciArray = (row['Kunci B/S'] || '').toString().split(',').map((s: string) => s.trim())
            const pernyataanKeys = [1, 2, 3, 4]
            pernyataanKeys.forEach((num, index) => {
              const teksPernyataan = row[`Pernyataan ${num}`]
              const urlPernyataan = row[`URL Gambar P${num}`] || ''
              if (teksPernyataan || urlPernyataan) {
                options.push({ teks: teksPernyataan || '', gambarUrl: urlPernyataan, isCorrect: kunciArray[index] === '1' })
              }
            })
          }

          if (options.length > 0 || tipe === 'ESSAY') {
            await fetch('/api/guru/questions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                scheduleId, tipe, stimulus, teks,
                gambarUrl: gambarUrlSoal,
                kunciEssay: '', 
                poin: row['Poin'] || 1,
                options
              })
            })
            successCount++
          }
        }
        
        alert(`Berhasil mengimport ${successCount} soal!`)
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

        <div className="flex items-center gap-3">
          <button 
            onClick={downloadTemplateExcel}
            type="button" 
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium shadow-sm transition-all"
          >
            <Download size={18} /> Template
          </button>

          <div>
            <input type="file" accept=".xlsx, .xls, .csv" id="import-excel" className="hidden" onChange={handleImportExcel} />
            <label htmlFor="import-excel" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all cursor-pointer">
              <Upload size={18} /> Import Excel
            </label>
          </div>
        </div>
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

              {/* Stimulus */}
              {tipe === 'BENAR_SALAH' && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <label className="block text-sm font-bold text-blue-800 mb-2">Stimulus / Teks Bacaan</label>
                  <textarea required rows={4} value={stimulus} onChange={(e) => setStimulus(e.target.value)} className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm bg-white" placeholder="Tulis teks bacaan..." />
                </div>
              )}

              {/* Teks Soal */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {tipe === 'BENAR_SALAH' ? 'Instruksi Pertanyaan' : 'Pertanyaan'}
                </label>
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