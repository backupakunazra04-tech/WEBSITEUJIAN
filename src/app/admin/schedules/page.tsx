'use client'

import { useState, useEffect } from 'react'
import { Plus, CalendarDays, Clock, X, Loader2, Key, Trash2 } from 'lucide-react'


type Subject = { id: string, nama: string }
type Schedule = {
  id: string
  gradeLevel: string
  waktuMulai: string
  waktuSelesai: string
  token: string
  status: string
  subject: Subject
}

export default function JadwalUjianPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  // State Modal & Form
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    subjectId: '',
    gradeLevel: 'X',
    waktuMulai: '',
    waktuSelesai: '',
    token: ''
  })
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Ambil data jadwal
      const resSchedules = await fetch('/api/admin/schedules')
      const dataSchedules = await resSchedules.json()
      if (resSchedules.ok) setSchedules(dataSchedules.schedules)

      // Ambil data mapel untuk dropdown
      const resSubjects = await fetch('/api/admin/subjects')
      const dataSubjects = await resSubjects.json()
      if (resSubjects.ok) setSubjects(dataSubjects.subjects)

    } catch (error) {
      console.error('Gagal fetch data', error)
    } finally {
      setLoading(false)
    }
  }

  // Fungsi Generate Token Acak
  const generateToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, token: result })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/admin/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setFormError(data.error || 'Gagal menambah jadwal')
        return
      }

      setIsModalOpen(false)
      setFormData({ subjectId: '', gradeLevel: 'X', waktuMulai: '', waktuSelesai: '', token: '' })
      fetchData() // Refresh

    } catch (error) {
      setFormError('Terjadi kesalahan jaringan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAktifkanJadwal = async (id: string, status: string) => {
    const konfirmasi = window.confirm(`Yakin ingin mengubah status jadwal menjadi ${status}?`)
    if (!konfirmasi) return

    try {
      const res = await fetch('/api/admin/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      if (res.ok) fetchData() // Refresh tabel
    } catch (error) {
      alert('Gagal mengubah status')
    }
  }

  const handleHapusJadwal = async (id: string, namaMapel: string) => {
    // Konfirmasi Pertama
    const konfirmasi1 = window.confirm(`Apakah Anda yakin ingin menghapus jadwal ujian "${namaMapel}"?`)
    if (!konfirmasi1) return

    try {
      // Coba hapus biasa
      let res = await fetch(`/api/admin/schedules?id=${id}`, {
        method: 'DELETE'
      })
      
      let data = await res.json()

      // Jika ditolak karena ada peserta, munculkan peringatan ekstra (Konfirmasi Kedua)
      if (!res.ok && data.error && data.error.includes('data peserta')) {
        const konfirmasi2 = window.confirm(
          `⚠️ PERINGATAN KERAS ⚠️\n\nJadwal ini SUDAH MEMILIKI SISWA yang mengerjakan ujian!\n\nJika Anda melanjutkan, SEMUA DATA JAWABAN DAN NILAI SISWA AKAN HILANG PERMANEN DAN TIDAK BISA DIKEMBALIKAN.\n\nApakah Anda benar-benar yakin ingin menghapus semuanya?`
        )
        
        if (konfirmasi2) {
          // Jika setuju, panggil API dengan force=true
          res = await fetch(`/api/admin/schedules?id=${id}&force=true`, {
            method: 'DELETE'
          })
          data = await res.json()
        } else {
          return // Batal
        }
      }

      if (res.ok) {
        fetchData() // Refresh tabel
      } else {
        alert(data.error || 'Gagal menghapus jadwal')
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan')
    }
  }

  // Helper untuk format tanggal cantik
  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
  }
  const formatTime = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
  }

  return (
    <div className="max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jadwal Ujian</h1>
          <p className="text-sm text-slate-500 mt-1">Atur waktu pelaksanaan dan token ujian.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all"
        >
          <Plus size={18} /> Buat Jadwal
        </button>
      </div>

      {/* Tabel Data */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider bg-slate-50/50">
                <th className="px-6 py-4">Mata Pelajaran</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Token</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <CalendarDays size={32} className="mx-auto text-slate-300 mb-2" />
                    Belum ada jadwal ujian.
                  </td>
                </tr>
              ) : (
                schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{schedule.subject.nama}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">Kelas {schedule.gradeLevel}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex flex-col gap-1 text-sm">
                        <span className="flex items-center gap-2"><CalendarDays size={14} className="text-slate-400" /> {formatDate(schedule.waktuMulai)}</span>
                        <span className="flex items-center gap-2"><Clock size={14} className="text-slate-400" /> {formatTime(schedule.waktuMulai)} - {formatTime(schedule.waktuSelesai)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg w-max border border-slate-200">
                        <Key size={14} className="text-emerald-600" />
                        <span className="font-mono font-bold tracking-widest text-slate-700">{schedule.token}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                        schedule.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                        schedule.status === 'SELESAI' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                        'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {schedule.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {schedule.status === 'DRAFT' ? (
                          <button 
                            onClick={() => handleAktifkanJadwal(schedule.id, 'AKTIF')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                          >
                            Aktifkan
                          </button>
                        ) : schedule.status === 'AKTIF' ? (
                          <button 
                            onClick={() => handleAktifkanJadwal(schedule.id, 'SELESAI')}
                            className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-red-200"
                          >
                            Selesaikan
                          </button>
                        ) : (
                          <span className="text-slate-400 text-sm px-3">Selesai</span>
                        )}

                        {/* Tombol Hapus */}
                        <button 
                          onClick={() => handleHapusJadwal(schedule.id, schedule.subject.nama)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                          title="Hapus Jadwal"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH JADWAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Buat Jadwal Ujian</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mata Pelajaran</label>
                  <select 
                    required
                    value={formData.subjectId}
                    onChange={(e) => setFormData({...formData, subjectId: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="" disabled>Pilih Mapel...</option>
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.nama}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kelas</label>
                  <select 
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({...formData, gradeLevel: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="X">Kelas X</option>
                    <option value="XI">Kelas XI</option>
                    <option value="XII">Kelas XII</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Mulai</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.waktuMulai}
                    onChange={(e) => setFormData({...formData, waktuMulai: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Selesai</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.waktuSelesai}
                    onChange={(e) => setFormData({...formData, waktuSelesai: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Token Ujian</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    required
                    value={formData.token}
                    onChange={(e) => setFormData({...formData, token: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold uppercase tracking-widest focus:outline-none focus:border-emerald-500"
                    placeholder="MISAL: AX7K2P"
                  />
                  <button 
                    type="button"
                    onClick={generateToken}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-300"
                  >
                    Acak
                  </button>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}