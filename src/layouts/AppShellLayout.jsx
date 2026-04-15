import { memo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/navigation/Sidebar'
import Navbar from '@/components/navigation/Navbar'

const ShellOutlet = memo(function ShellOutlet() {
  return <Outlet />
})

export default function AppShellLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const desktopOffsetClass = collapsed ? 'lg:left-[72px]' : 'lg:left-[240px]'

  return (
    <div className="min-h-screen mesh-bg dark:bg-slate-900">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
      />

      <div
        className={[
          'min-h-screen flex flex-col',
          collapsed ? 'lg:pl-[72px]' : 'lg:pl-[240px]',
        ].join(' ')}
      >
        <div className={`fixed top-0 left-0 right-0 z-20 ${desktopOffsetClass}`}>
          <Navbar onMenuClick={() => setMobileOpen(true)} />
        </div>
        <main className="flex-1 h-full min-w-0 overflow-x-hidden px-3 sm:px-4 lg:px-6 py-4 sm:py-6 pt-[80px] sm:pt-[88px]" style={{ contain: 'layout paint' }}>
          <ShellOutlet />
        </main>
      </div>
    </div>
  )
}



