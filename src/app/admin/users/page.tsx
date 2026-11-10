'use client'

import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { 
  Users, PlusCircle, Pencil, Trash2, GraduationCap, ShieldCheck, UserCircle, X, Loader2, Upload, Download
} from 'lucide-react'

type User = {
  id: string
  username: string
  passwordPlain: string | null
  nama: string
  role: string
  gradeLevel: string | null
  tanggalLahir: string | null
  createdAt: string
}

export default function KelolaUserPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // State Modal & Form
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    password: '',
    role: 'PESERTA',
    gradeLevel: 'X',
    tanggalLahir: ''
  })
  
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users)
      } else {
        console.error('API Error:', data.error)
      }
    } catch (error) {
      console.error('Gagal fetch user', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    try {
      const method = editingId ? 'PUT' : 'POST'
      
      // Jika edit, password opsional (hanya dikirim jika diisi)
      const payload: any = { ...formData, id: editingId }
      if (editingId && !formData.password) {
        delete payload.password
      }

      const res = await fetch('/api/admin/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setFormError(data.error || 'Gagal menyimpan user')
        return
      }

      // Reset dan tutup modal
      setIsModalOpen(false)
      setEditingId(null)
      setFormData({ nama: '', username: '', password: '', role: 'PESERTA', gradeLevel: 'X', tanggalLahir: '' })
      fetchUsers() // Refresh tabel

    } catch (error) {
      setFormError('Terjadi kesalahan jaringan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (user: User) => {
    setEditingId(user.id)
    setFormData({
      nama: user.nama,
      username: user.username,
      password: '', // Kosongkan password saat edit
      role: user.role,
      gradeLevel: user.gradeLevel || 'X',
      tanggalLahir: user.tanggalLahir ? new Date(user.tanggalLahir).toISOString().split('T')[0] : ''
    })
    setIsModalOpen(true)
  }

  const handleHapusUser = async (id: string, nama: string) => {
    const konfirmasi = window.confirm(`Yakin ingin menghapus user "${nama}"?`)
    if (!konfirmasi) return

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE'
      })
      
      const data = await res.json()
      if (res.ok) {
        fetchUsers()
      } else {
        alert(data.error || 'Gagal menghapus user')
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan')
    }
  }

  const handleOpenTambah = () => {
    setEditingId(null)
    setFormData({ nama: '', username: '', password: '', role: 'PESERTA', gradeLevel: 'X', tanggalLahir: '' })
    setIsModalOpen(true)
  }

  // ==========================================
  // FUNGSI DOWNLOAD TEMPLATE EXCEL USER
  // ==========================================
  const downloadTemplateExcel = () => {
    const templateData = [
      {
        Nama: 'Budi Santoso',
        Username: 'budi123',
        Password: 'password123',
        Role: 'PESERTA', // Isi dengan PESERTA / GURU / PROKTOR / ADMIN
        Kelas: 'X',      // Isi X / XI / XII (Kosongkan jika bukan PESERTA)
        TanggalLahir: '2008-05-20' // Format YYYY-MM-DD (Kosongkan jika bukan PESERTA)
      },
      {
        Nama: 'Ibu Siti Guru',
        Username: 'siti_guru',
        Password: 'guru123',
        Role: 'GURU',
        Kelas: '',
        TanggalLahir: ''
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    worksheet['!cols'] = [
      { wpx: 200 }, { wpx: 150 }, { wpx: 150 }, { wpx: 100 }, { wpx: 80 }, { wpx: 120 }
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template User')
    XLSX.writeFile(workbook, 'Template_Import_User.xlsx')
  }

  // ==========================================
  // FUNGSI IMPORT EXCEL USER
  // ==========================================
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
        let successCount = 0
        let failCount = 0

        for (const row of jsonData) {
          const nama = row['Nama']
          const username = row['Username']
          const password = row['Password'] || '123456' // Default password jika kosong
          const role = row['Role'] || 'PESERTA'
          const gradeLevel = row['Kelas'] || null
          const tanggalLahir = row['TanggalLahir'] || null

          if (!nama || !username) continue // Skip jika data penting kosong

          try {
            const res = await fetch('/api/admin/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                nama, username, password, role, 
                gradeLevel: role === 'PESERTA' ? gradeLevel : null,
                tanggalLahir: role === 'PESERTA' ? tanggalLahir : null
              })
            })
            
            if (res.ok) successCount++
            else failCount++
          } catch (err) {
            failCount++
          }
        }

        alert(`Import selesai!\nBerhasil: ${successCount} user\nGagal/Duplikat: ${failCount} user`)
        fetchUsers() // Refresh tabel
        
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

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'ADMIN': return <span className="flex items-center gap-1.5 w-max bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200"><ShieldCheck size={14} /> ADMIN</span>
      case 'GURU': return <span className="flex items-center gap-1.5 w-max bg-teal-50 text-teal-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-teal-200"><GraduationCap size={14} /> GURU</span>
      case 'PROKTOR': return <span className="flex items-center gap-1.5 w-max bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-slate-300"><UserCircle size={14} /> PROKTOR</span>
      default: return <span className="flex items-center gap-1.5 w-max bg-white text-emerald-600 px-2.5 py-1 rounded-md text-xs font-semibold border border-emerald-200 shadow-sm"><Users size={14} /> PESERTA</span>
    }
  }

  return (
    <div className="max-w-7xl w-full mx-auto">
      
      {/* Header Konten */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Data Pengguna</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola akses akun untuk Guru, Proktor, dan Peserta.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={downloadTemplateExcel}
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium shadow-sm transition-all"
          >
            <Download size={18} /> Template
          </button>

          <div>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              id="import-user-excel" 
              className="hidden" 
              onChange={handleImportExcel} 
            />
            <label 
              htmlFor="import-user-excel" 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all cursor-pointer"
            >
              <Upload size={18} /> Import Excel
            </label>
          </div>

          <button 
            onClick={handleOpenTambah}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all"
          >
            <PlusCircle size={18} /> Tambah User
          </button>
        </div>
      </div>

      {/* Tabel Data */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider bg-slate-50/50">
                <th className="px-6 py-4">Pengguna</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Role Akses</th>
                <th className="px-6 py-4">Tingkat</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Belum ada data pengguna.
                  </td>
                </tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-emerald-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200">
                        {user.nama.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{user.nama}</div>
                        <div className="text-xs text-slate-400">{new Date(user.createdAt).toLocaleDateString('id-ID')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm font-medium">{user.username}</td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{user.gradeLevel || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditClick(user)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => handleHapusUser(user.id, user.nama)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT USER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="Misal: Budi Santoso"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input 
                  type="text" 
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="Misal: budi123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password {editingId && <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>}
                </label>
                <input 
                  type="text" 
                  required={!editingId}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="Password awal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="PESERTA">Peserta</option>
                    <option value="GURU">Guru</option>
                    <option value="PROKTOR">Proktor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tingkat (Kelas)</label>
                  <select 
                    disabled={formData.role !== 'PESERTA'}
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({...formData, gradeLevel: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="X">Kelas X</option>
                    <option value="XI">Kelas XI</option>
                    <option value="XII">Kelas XII</option>
                  </select>
                </div>
              </div>

              {/* INPUT TANGGAL LAHIR (Hanya untuk Peserta) */}
              {formData.role === 'PESERTA' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Lahir</label>
                  <input 
                    type="date" 
                    required={formData.role === 'PESERTA'}
                    value={formData.tanggalLahir}
                    onChange={(e) => setFormData({...formData, tanggalLahir: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

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
                  {isSubmitting ? 'Menyimpan...' : (editingId ? 'Update User' : 'Simpan User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}