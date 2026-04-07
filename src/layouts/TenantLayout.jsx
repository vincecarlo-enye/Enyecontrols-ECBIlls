import { Suspense, useState } from 'react'
import Sidebar from '@/components/navigation/Sidebar'
import Navbar from '@/components/navigation/Navbar'
import { Outlet } from 'react-router-dom'
import AppLoadingScreen from '@/components/common/AppLoadingScreen'

export default function TenantLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen mesh-bg dark:bg-slate-900">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      {/* Main content - offset for sidebar */}
      <div className="lg:pl-[240px] transition-all duration-300 min-h-screen flex flex-col">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-6 pt-20 h-full">
          <Suspense fallback={<AppLoadingScreen embedded />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
