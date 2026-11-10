'use client'

import { useState, useEffect } from 'react'
import { Activity, ShieldAlert, Key, RotateCcw, Trash2, FileText } from 'lucide-react'

type Log = {
  id: string
  aksi: string
  detail: string
  createdAt: string
  user: { nama: string, role: string }
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/admin/logs')
        const data = await res.json()
        if (res.ok) setLogs(data.logs)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  const getActionBadge = (aksi: string) => {
    switch (aksi) {
      case 'RILIS_TOKEN': return <span className="flex items-center gap-1.5 w-max bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200"><Key size={14} /> Rilis Token</span>
      case 'HENTIKAN_UJIAN': return <span className="flex items-center gap-1.5 w-max bg-red-100 text-red-800 px-2.5 py-1 rounded-md text-xs font-bold border border-red-200"><ShieldAlert size={14} /> Hentikan Ujian</span>
      case 'RESET_PESERTA': return <span className="flex items-center gap-1.5 w-max bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-200"><RotateCcw size={14} /> Reset Peserta</span>
      case 'HAPUS_JADWAL': return <span className="flex items-center gap-1.5 w-max bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200"><Trash2 size={14} /> Hapus Jadwal</span>
      default: return <span className="flex items-center gap-1.5 w-max bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200"><Activity size={14} /> {aksi}</span>
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Log Aktivitas</h1>
        <p className="text-sm text-slate-500 mt-1">Rekam jejak tindakan Admin dan Proktor pada sistem.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
                <th className="p-4">Waktu</th>
                <th className="p-4">Oleh</th>
                <th className="p-4">Aksi</th>
                <th className="p-4">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Memuat data...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500"><FileText size={32} className="mx-auto text-slate-300 mb-2" /> Belum ada aktivitas tercatat.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800 text-sm">{log.user.nama}</p>
                      <p className="text-xs text-slate-500">{log.user.role}</p>
                    </td>
                    <td className="p-4">{getActionBadge(log.aksi)}</td>
                    <td className="p-4 text-sm text-slate-600">{log.detail}</td>
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