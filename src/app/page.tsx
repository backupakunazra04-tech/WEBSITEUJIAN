'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, ShieldCheck, Monitor, ArrowRight, CheckCircle, UserCheck } from 'lucide-react'

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [role, setRole] = useState('')
  const [currentYear, setCurrentYear] = useState<number | null>(null) // <-- State untuk tahun

  // Cek apakah user sudah login & set tahun
  useEffect(() => {
    // Set tahun saat komponen dimuat (aman dari error build)
    setCurrentYear(new Date().getFullYear())

    // Cek status login
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) {
          setIsLoggedIn(true)
          setRole(data.role)
        }
      })
      .catch(() => {})
  }, [])

  const getDashboardLink = () => {
    if (role === 'ADMIN') return '/admin/dashboard'
    if (role === 'GURU') return '/guru/dashboard'
    if (role === 'PROKTOR') return '/proktor/dashboard'
    return '/peserta/dashboard'
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      
      {/* NAVBAR */}
      <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 p-1">
              <Image src="/logo-sekolah.png" alt="Logo" width={40} height={40} className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 leading-tight tracking-tight">SMAS UNGGULAN</span>
              <span className="text-xs font-semibold text-emerald-600 tracking-wide">BPPT AL FATTAH</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#fitur" className="hover:text-emerald-600 transition-colors">Fitur</a>
            <a href="#panduan" className="hover:text-emerald-600 transition-colors">Panduan</a>
            <a href="#tentang" className="hover:text-emerald-600 transition-colors">Tentang</a>
          </div>

          <div>
            {isLoggedIn ? (
              <Link href={getDashboardLink()} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg shadow-emerald-500/30 transition-all">
                Buka Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <Link href="/login" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg shadow-emerald-500/30 transition-all">
                Login Ujian <UserCheck size={18} />
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50/30 -z-10"></div>
        
        {/* Ornamen Lingkaran */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12">
          
          {/* Teks Hero */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-emerald-200">
              <ShieldCheck size={16} /> Sistem Ujian Terintegrasi Anti-Curang
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
              Ujian Lebih Aman, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                Hasil Lebih Akurat.
              </span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0">
              Platform Ujian Online resmi SMAS Unggulan BPPT Al Fattah. Dilengkapi dengan deteksi kecurangan, pengacakan soal, dan penilaian otomatis untuk pengalaman ujian yang jujur dan modern.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-emerald-700 hover:-translate-y-1 transition-all shadow-xl shadow-emerald-500/30">
                Masuk Ujian Sekarang <ArrowRight size={20} />
              </Link>
              <a href="#panduan" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-8 py-3.5 rounded-xl font-bold hover:bg-slate-50 transition-all">
                Baca Panduan
              </a>
            </div>
          </div>

          {/* Gambar/Ilustrasi Hero */}
          <div className="flex-1 w-full max-w-lg relative">
            <div className="relative bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-90 flex flex-col items-center justify-center text-white">
                  <Monitor size={64} className="mb-4 opacity-80" />
                  <p className="font-bold text-xl">Sistem Ujian Online</p>
                  <p className="text-emerald-100">SMAS Unggulan BPPT Al Fattah</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FITUR SECTION */}
      <section id="fitur" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Mengapa Menggunakan Sistem Ini?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Dirancang khusus untuk menjaga integritas ujian sekolah dengan teknologi terbaru.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Anti-Curang Ketat</h3>
              <p className="text-slate-600 leading-relaxed">Sistem mendeteksi siswa yang pindah tab, memblokir copy-paste, dan menghentikan ujian otomatis jika melanggar aturan.</p>
            </div>
            
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                <BookOpen size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Pengacakan Soal</h3>
              <p className="text-slate-600 leading-relaxed">Urutan soal dan pilihan jawaban (A, B, C, D) diacak secara unik untuk setiap siswa, meminimalisir kerja sama antar teman.</p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Penilaian Cepat</h3>
              <p className="text-slate-600 leading-relaxed">Soal Pilihan Ganda dinilai secara otomatis. Guru hanya perlu fokus mengoreksi soal Essay, menghemat waktu dan tenaga.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PANDUAN SECTION */}
      <section id="panduan" className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Panduan Singkat Peserta</h2>
            <p className="text-slate-600">Ikuti langkah-langkah berikut sebelum memulai ujian.</p>
          </div>

          <div className="space-y-4">
            {[
              "Siapkan perangkat (Laptop/HP) dengan koneksi internet yang stabil.",
              "Pastikan Anda sudah mendapatkan Username, Password, dan Token dari Proktor.",
              "Login ke sistem menggunakan Username dan Password Anda.",
              "Masukkan Tanggal Lahir dan Token Ujian pada halaman konfirmasi.",
              "Baca soal dengan teliti. Dilarang membuka tab lain atau menyontek!",
              "Klik 'Selesai Ujian' jika sudah yakin dengan semua jawaban Anda."
            ].map((text, i) => (
              <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 flex items-start gap-4 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </div>
                <p className="text-slate-700 mt-1">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="tentang" className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 p-1">
              <Image src="/logo-sekolah.png" alt="Logo" width={40} height={40} className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 leading-tight tracking-tight">SMAS UNGGULAN</span>
              <span className="text-xs font-semibold text-emerald-600 tracking-wide">BPPT AL FATTAH</span>
            </div>
          </div>
          
          <p className="text-sm text-slate-500 text-center md:text-left">
            &copy; {currentYear || 2026} SMAS Unggulan BPPT Al Fattah. <br className="md:hidden" />
            Sistem Ujian Online Terintegrasi.
          </p>
        </div>
      </footer>

    </div>
  )
}