'use client'
import { useState, useEffect } from 'react'

export default function AssignPage() {
  const [data, setData] = useState<any>({ gurus: [], subjects: [], assignments: [] })
  const [form, setForm] = useState({ guruId: '', subjectId: '', gradeLevel: 'X' })

  const fetchData = async () => {
    const res = await fetch('/api/admin/assign')
    const result = await res.json()
    if (res.ok) setData(result)
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/admin/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    fetchData()
    alert('Berhasil assign guru!')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Assign Guru ke Mapel</h1>
        <p className="text-sm text-slate-500 mt-1">Tentukan guru mana yang mengampu mapel tertentu.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Guru</label>
          <select required value={form.guruId} onChange={e => setForm({...form, guruId: e.target.value})} className="w-full border rounded-lg p-2">
            <option value="">Pilih Guru...</option>
            {data.gurus.map((g: any) => <option key={g.id} value={g.id}>{g.nama}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Mapel</label>
          <select required value={form.subjectId} onChange={e => setForm({...form, subjectId: e.target.value})} className="w-full border rounded-lg p-2">
            <option value="">Pilih Mapel...</option>
            {data.subjects.map((s: any) => <option key={s.id} value={s.id}>{s.nama}</option>)}
          </select>
        </div>
        <div className="w-32">
          <label className="block text-sm font-medium text-slate-700 mb-1">Kelas</label>
          <select value={form.gradeLevel} onChange={e => setForm({...form, gradeLevel: e.target.value})} className="w-full border rounded-lg p-2">
            <option value="X">X</option>
            <option value="XI">XI</option>
            <option value="XII">XII</option>
          </select>
        </div>
        <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700">Simpan</button>
      </form>
    </div>
  )
}