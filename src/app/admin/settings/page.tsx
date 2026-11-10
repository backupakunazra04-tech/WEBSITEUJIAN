'use client'

import { useState, useEffect } from 'react'
import { Save, ShieldAlert, KeyRound, Loader2 } from 'lucide-react'

export default function PengaturanPage() {
  const [maxPelanggaran, setMaxPelanggaran] = useState(2)
  const [newPassword, setNewPassword] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [isSubmittingSetting, setIsSubmittingSetting] = useState(false)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings')
        const data = await res.json()
        if (res.ok) setMaxPelanggaran(data.settings.maxPelanggaran)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSimpanPengaturan = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingSetting(true)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPelanggaran })
      })
      if (res.ok) alert('Pengaturan sistem berhasil disimpan!')
      else alert('Gagal menyimpan pengaturan')
    } catch (error) {
      alert('Terjadi kesalahan jaringan')
    } finally {
      setIsSubmittingSetting(false)
    }
  }

  const handleGantiPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingPassword(true)

    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      })
      const data = await res.json()

      if (res.ok) {
        alert('Password Admin berhasil diubah!')
        setNewPassword('')
      } else {
        alert(data.error || 'Gagal mengganti password')
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan')
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat pengaturan...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan Sistem</h1>
        <p className="text-sm text-slate-500 mt-1">Konfigurasi aturan ujian dan keamanan akun Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* PENGATURAN UJIAN */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b pb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <ShieldAlert className="text-red-500" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Aturan Ujian</h2>
              <p className="text-xs text-slate-500">Pengaturan sistem anti-curang.</p>
            </div>
          </div>

          <form onSubmit={handleSimpanPengaturan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Batas Pelanggaran (Maksimal)
              </label>
              <p className="text-xs text-slate-500 mb-2">Siswa akan otomatis dihentikan ujiannya jika melampaui batas ini.</p>
              <input 
                type="number" 
                min={1}
                required
                value={maxPelanggaran}
                onChange={(e) => setMaxPelanggaran(parseInt(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmittingSetting}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition-all shadow-sm disabled:opacity-70 mt-4"
            >
              {isSubmittingSetting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSubmittingSetting ? 'Menyimpan...' : 'Simpan Aturan'}
            </button>
          </form>
        </div>

        {/* PENGATURAN AKUN */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b pb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <KeyRound className="text-blue-500" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Keamanan Akun</h2>
              <p className="text-xs text-slate-500">Ganti password akun Admin Anda.</p>
            </div>
          </div>

          <form onSubmit={handleGantiPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password Baru
              </label>
              <p className="text-xs text-slate-500 mb-2">Minimal 5 karakter. Jangan lupa simpan password ini.</p>
              <input 
                type="text" 
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                placeholder="Masukkan password baru..."
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmittingPassword}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-all shadow-sm disabled:opacity-70 mt-4"
            >
              {isSubmittingPassword ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSubmittingPassword ? 'Menyimpan...' : 'Ganti Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}