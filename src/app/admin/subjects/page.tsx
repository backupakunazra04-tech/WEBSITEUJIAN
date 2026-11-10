'use client'

import { useState, useEffect } from 'react'
import { Plus, BookOpen, Trash2, Pencil, X, Loader2 } from 'lucide-react'

type Subject = {
  id: string
  nama: string
  createdAt: string
}

export default function MataPelajaranPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  // State Modal & Form
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null) // Untuk mode edit
  const [formData, setFormData] = useState({ nama: '' })
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/admin/subjects')
      const data = await res.json()
      if (res.ok) setSubjects(data.subjects)
    } catch (error) {
      console.error('Gagal fetch mapel', error)
    } finally {
      setLoading(false)
    }
  }

  // Fungsi Simpan (Tambah / Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    try {
      const method = editingId ? 'PUT' : 'POST'
      
      const res = await fetch('/api/admin/subjects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: editingId, 
          nama: formData.nama 
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setFormError(data.error || 'Gagal menyimpan mapel')
        return
      }

      // Reset dan tutup modal jika berhasil
      setIsModalOpen(false)
      setFormData({ nama: '' })
      setEditingId(null)
      fetchSubjects() // Refresh tabel

    } catch (error) {
      setFormError('Terjadi kesalahan jaringan')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fungsi saat tombol Edit diklik
  const handleEditClick = (subject: Subject) => {
    setEditingId(subject.id)
    setFormData({ nama: subject.nama })
    setIsModalOpen(true)
  }

  // Fungsi Hapus
  const handleHapusMapel = async (id: string, nama: string) => {
    const konfirmasi = window.confirm(`Yakin ingin menghapus mata pelajaran "${nama}"?`)
    if (!konfirmasi) return

    try {
      const res = await fetch(`/api/admin/subjects?id=${id}`, {
        method: 'DELETE'
      })
      
      const data = await res.json()
      
      if (res.ok) {
        fetchSubjects()
      } else {
        alert(data.error || 'Gagal menghapus mapel')
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan')
    }
  }

  // Fungsi saat tombol Tambah Mapel diklik
  const handleOpenTambah = () => {
    setEditingId(null)
    setFormData({ nama: '' })
    setIsModalOpen(true)
  }

  return (
    <div className="max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mata Pelajaran</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola daftar mata pelajaran yang diujikan.</p>
        </div>
        <button 
          onClick={handleOpenTambah}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all"
        >
          <Plus size={18} /> Tambah Mapel
        </button>
      </div>

      {/* Tabel Data */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider bg-slate-50/50">
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Nama Mata Pelajaran</th>
                <th className="px-6 py-4">Dibuat Pada</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <BookOpen size={32} className="mx-auto text-slate-300 mb-2" />
                    Belum ada mata pelajaran.
                  </td>
                </tr>
              ) : (
                subjects.map((subject, index) => (
                  <tr key={subject.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="px-6 py-4 text-slate-500 text-sm">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <BookOpen size={16} />
                        </div>
                        <span className="font-semibold text-slate-800">{subject.nama}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {new Date(subject.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditClick(subject)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleHapusMapel(subject.id, subject.nama)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Hapus"
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

      {/* MODAL TAMBAH / EDIT MAPEL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
              </h3>
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Mata Pelajaran</label>
                <input 
                  type="text" 
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Misal: Matematika, Bahasa Indonesia"
                />
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
                  {isSubmitting ? 'Menyimpan...' : (editingId ? 'Update Mapel' : 'Simpan Mapel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}