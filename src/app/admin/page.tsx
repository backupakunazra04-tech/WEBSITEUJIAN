import { redirect } from 'next/navigation'

export default function AdminRoot() {
  // Otomatis lempar admin ke halaman dashboard
  redirect('/admin/dashboard')
}