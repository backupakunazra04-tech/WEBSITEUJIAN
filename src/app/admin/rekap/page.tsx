'use client'

import { useState, useEffect } from 'react'
import { FileText, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function RekapPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/rekap').then(res => res.json()).then(res => {
      if(res.participants) setData(res.participants)
      setLoading(false)
    })
  }, [])

  const handleExportExcel = () => {
    // Siapkan data untuk Excel
    const excelData = data.map((p, index) => ({
      'No': index + 1,
      'Nama Siswa': p.user?.nama || 'Siswa Dihapus',
      'Kelas': p.user?.gradeLevel || '-',
      'Mata Pelajaran': p.schedule?.subject?.nama || '-',
      'Status': p.status,
      'Skor Akhir': p.skor || 0,
      'Jumlah Pelanggaran': p.violations.filter((v: any) => v.level === 'PELANGGARAN').length
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Nilai')
    XLSX.writeFile(workbook, 'Rekap_Nilai_Ujian.xlsx')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rekap Hasil Ujian</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau kehadiran, nilai, dan pelanggaran siswa.</p>
        </div>
        <button 
          onClick={handleExportExcel}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all"
        >
          <Download size={18} /> Export Excel
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
                <th className="p-4">Nama Siswa</th>
                <th className="p-4">Kelas</th>
                <th className="p-4">Mata Pelajaran</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Skor</th>
                <th className="p-4 text-center">Pelanggaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Belum ada data peserta.</td></tr>
              ) : (
                data.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800">{p.user?.nama || 'Siswa Dihapus'}</td>
                    <td className="p-4 text-slate-600">{p.user?.gradeLevel || '-'}</td>
                    <td className="p-4 text-slate-600">{p.schedule?.subject?.nama || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        p.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-700' : 
                        p.status === 'DIHENTIKAN' ? 'bg-red-100 text-red-700' : 
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-emerald-600 text-lg">{p.skor || 0}</td>
                    <td className="p-4 text-center font-bold text-slate-700">
                      {p.violations.filter((v: any) => v.level === 'PELANGGARAN').length}
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
}