'use client'

import { useState, useEffect } from 'react'
import { Printer, X } from 'lucide-react'
import Link from 'next/link'

type User = {
  id: string
  username: string
  passwordPlain: string
  nama: string
  gradeLevel: string | null
}

type Schedule = {
  id: string
  gradeLevel: string
  waktuMulai: string
  waktuSelesai: string
  subject: { nama: string }
}

export default function CetakKartuPage() {
  const [users, setUsers] = useState<User[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/cetak-kartu')
        const data = await res.json()
        if (res.ok) {
          setUsers(data.users)
          setSchedules(data.schedules)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white print:min-h-0">
      
      {/* CSS KHUSUS PRINT (Menyembunyikan elemen lain & Mengatur Grid) */}
      <style jsx global>{`
        @media print {
          /* Sembunyikan sidebar dan header admin */
          aside, header, nav { display: none !important; }
          
          /* Hapus margin/padding bawaan layout */
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
          main { margin-left: 0 !important; }
          
          @page { size: A4 portrait; margin: 10mm; }
          
          /* Paksa grid menjadi 2 kolom untuk cetak */
          .print-grid { 
            display: grid !important; 
            grid-template-columns: repeat(2, 1fr) !important; 
            gap: 15px !important; 
          }
          
          /* Pastikan kartu tidak terpotong saat pindah halaman */
          .kartu-cetak {
            page-break-inside: avoid;
            border: 2px solid black !important;
          }
        }
      `}</style>

      {/* Tombol Aksi (Hanya muncul di layar, hilang saat dicetak) */}
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center z-10 shadow-sm mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/users" className="text-slate-500 hover:text-slate-800">
            <X size={24} />
          </Link>
          <h1 className="text-xl font-bold text-slate-800">Cetak Kartu Login Peserta</h1>
        </div>
        
        <button 
          onClick={() => window.print()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Printer size={18} /> Cetak (Ctrl+P)
        </button>
      </div>

      {/* Area Cetak */}
      <div className="max-w-7xl mx-auto p-4 print:p-0 print:max-w-none">
        {/* Grid: 2 kolom untuk layar, 2 kolom untuk cetak */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print-grid">
          
          {loading ? (
            <p className="text-center w-full">Memuat data...</p>
          ) : users.length === 0 ? (
            <p className="text-center w-full">Belum ada data peserta.</p>
          ) : (
            users.map(user => {
              const jadwalSiswa = schedules.filter(s => s.gradeLevel === user.gradeLevel)

              return (
                <div 
                  key={user.id} 
                  className="bg-white border-2 border-black rounded-md p-3 shadow-sm relative overflow-hidden flex flex-col kartu-cetak print:w-full"
                >
                  {/* Header Kartu */}
                  <div className="flex items-center gap-2 border-b-2 border-black pb-2 mb-2">
                    <div className="w-8 h-8 border border-black rounded-full flex items-center justify-center overflow-hidden shrink-0">
                      <img src="/logo-sekolah.png" alt="Logo" className="w-6 h-6 object-contain" />
                    </div>
                    <div>
                      <h2 className="font-bold text-[10px] uppercase leading-tight text-black">Kartu Login Peserta</h2>
                      <h2 className="font-bold text-[8px] uppercase leading-tight text-black">SMAS Unggulan BPPT Al Fattah</h2>
                    </div>
                  </div>

                  {/* Data Diri Utama */}
                  <table className="w-full text-[10px] mb-3">
                    <tbody>
                      <tr>
                        <td className="w-16 font-semibold py-0.5">Nama</td>
                        <td className="w-1">:</td>
                        <td className="font-bold uppercase leading-tight">{user.nama}</td>
                      </tr>
                      <tr>
                        <td className="font-semibold py-0.5">Kelas</td>
                        <td>:</td>
                        <td className="font-bold">{user.gradeLevel || '-'}</td>
                      </tr>
                      <tr>
                        <td className="font-semibold py-0.5">Username</td>
                        <td>:</td>
                        <td className="font-mono font-bold">{user.username}</td>
                      </tr>
                      <tr>
                        <td className="font-semibold py-0.5">Password</td>
                        <td>:</td>
                        <td className="font-mono font-bold">{user.passwordPlain || '***'}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Tabel Jadwal Ujian */}
                  <div className="mt-auto">
                    <p className="text-[9px] font-bold mb-1">Jadwal Ujian:</p>
                    <div className="border border-black text-[8px]">
                      <table className="w-full text-center">
                        <thead>
                          <tr className="border-b border-black font-bold bg-slate-100">
                            <th className="border-r border-black py-1 w-12">Tgl</th>
                            <th className="border-r border-black py-1">Mata Pelajaran</th>
                            <th className="py-1 w-14">Waktu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jadwalSiswa.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="py-1 italic text-slate-500">Belum ada jadwal</td>
                            </tr>
                          ) : (
                            jadwalSiswa.map((j, idx) => (
                              <tr key={j.id} className={idx !== jadwalSiswa.length - 1 ? "border-b border-black" : ""}>
                                <td className="border-r border-black py-1">
                                  {new Date(j.waktuMulai).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                                </td>
                                <td className="border-r border-black py-1 text-left px-1">
                                  {j.subject.nama}
                                </td>
                                <td className="py-1">
                                  {new Date(j.waktuMulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )
            })
          )}
          
        </div>
      </div>
    </div>
  )
}