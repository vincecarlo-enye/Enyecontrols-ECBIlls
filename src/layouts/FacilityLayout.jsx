import { useState } from 'react'
import Sidebar from '@/components/navigation/Sidebar'
import Navbar from '@/components/navigation/Navbar'
import { Outlet } from 'react-router-dom'

export default function FacilityLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen mesh-bg dark:bg-slate-900">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="lg:pl-[240px] transition-all duration-300 min-h-screen flex flex-col">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-6 h-full transition-all duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
