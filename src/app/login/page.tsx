'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, User, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login gagal')
        return
      }

      // Redirect berdasarkan role
      if (data.role === 'ADMIN') router.push('/admin/dashboard')
      else if (data.role === 'GURU') router.push('/guru/dashboard')
      else if (data.role === 'PROKTOR') router.push('/proktor/dashboard')
      else router.push('/peserta/dashboard')
      
    } catch (err) {
      setError('Gagal terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Background utama: Gradasi sangat lembut dari putih ke hijau mint
    <div className="min-h-screen flex bg-gradient-to-br from-white via-emerald-50 to-emerald-100/50 selection:bg-emerald-500/30">
      
      {/* KIRI: Area Visual/Gradient (Light Mode) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-white/40 border-r border-white/50">
        {/* Ornamen Lingkaran Abstrak (Efek Glow Halus) */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-300/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-teal-200/40 rounded-full blur-[100px]"></div>
        
        {/* Konten Teks di Kiri */}
        <div className="relative z-10 flex flex-col justify-center p-16 w-full h-full text-slate-800">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-2xl text-white mb-8 shadow-lg shadow-emerald-500/30">
            U
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Selamat Datang di <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              Ujian Online.
            </span>
          </h1>
          <p className="text-slate-500 text-lg max-w-md font-medium">
            Platform ujian terintegrasi dengan sistem keamanan cerdas untuk mencegah kecurangan secara real-time.
          </p>
        </div>
      </div>

      {/* KANAN: Form Login Glassmorphism Light */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        
        {/* Ornamen Latar Belakang Kanan */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-200/20 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Kotak Kaca (Glassmorphism Light) */}
        <div className="relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white/60 backdrop-blur-2xl border border-white shadow-[0_8px_32px_0_rgba(0,0,0,0.05)]">
          
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Hello!</h2>
            <p className="text-slate-500 text-sm">Silakan masuk ke akun Anda</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-6 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Input Username */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-emerald-600/70" />
              </div>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/50 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
                placeholder="Username"
                required 
              />
            </div>

            {/* Input Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-emerald-600/70" />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/50 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
                placeholder="Password"
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Memproses...' : (
                <>
                  Masuk <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="#" className="text-sm text-slate-400 hover:text-emerald-600 font-medium transition-colors">
              Lupa password?
            </a>
          </div>
          
        </div>
      </div>
    </div>
  )
}