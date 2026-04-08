import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Receipt, Users, Building2, BarChart3,
  Settings, ChevronLeft, ChevronRight, X, FileText, Activity, User,
  TrendingUp, ClipboardList, Zap, Wrench, Cpu,
  FileBarChart, Ticket, CheckSquare, Send, Gauge, Shield, Scale,
  UserCog, Megaphone, Siren, Bell, CalendarClock, Download, HeartPulse, Eye,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const adminNavItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/billing', label: 'Billing', icon: Receipt },
  { path: '/admin/tenants', label: 'Tenants', icon: Users },
  { path: '/admin/units', label: 'Units', icon: Building2 },
  { path: '/admin/usage-reports', label: 'Usage Reports', icon: BarChart3 },
  { path: '/admin/reconciliation', label: 'Reconciliation', icon: Scale },
  { path: '/admin/occupancy-timeline', label: 'Occupancy Timeline', icon: CalendarClock },
  { path: '/admin/owner-portal', label: 'Owner Portal', icon: Eye },
  { path: '/admin/system-health', label: 'System Health', icon: HeartPulse },
  { path: '/admin/operational-exports', label: 'Operational Exports', icon: Download },
  { path: '/admin/tenant-reports', label: 'Tenant Reports', icon: ClipboardList },
  { path: '/admin/anomalies', label: 'Anomalies', icon: Siren },
  { path: '/admin/activity-logs', label: 'Activity Logs', icon: FileText },
  { path: '/admin/notifications', label: 'Notifications', icon: Bell },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
]

const superAdminNavItems = [
  { path: '/super-admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/super-admin/billing', label: 'Billing', icon: Receipt },
  { path: '/super-admin/tenants', label: 'Tenants', icon: Users },
  { path: '/super-admin/units', label: 'Units', icon: Building2 },
  { path: '/super-admin/usage-reports', label: 'Usage Reports', icon: BarChart3 },
  { path: '/super-admin/reconciliation', label: 'Reconciliation', icon: Scale },
  { path: '/super-admin/occupancy-timeline', label: 'Occupancy Timeline', icon: CalendarClock },
  { path: '/super-admin/owner-portal', label: 'Owner Portal', icon: Eye },
  { path: '/super-admin/system-health', label: 'System Health', icon: HeartPulse },
  { path: '/super-admin/operational-exports', label: 'Operational Exports', icon: Download },
  { path: '/super-admin/tenant-reports', label: 'Tenant Reports', icon: ClipboardList },
  { path: '/super-admin/activity-logs', label: 'Activity Logs', icon: FileText },
  { path: '/super-admin/notifications', label: 'Notifications', icon: Bell },
  { path: '/super-admin/meters', label: 'Meter Management', icon: Gauge, superAdminOnly: true },
  { path: '/super-admin/billing-rates', label: 'Billing Rates', icon: Zap, superAdminOnly: true },
  { path: '/super-admin/users', label: 'User Management', icon: UserCog, superAdminOnly: true },
  { path: '/super-admin/announcements', label: 'Announcements', icon: Megaphone, superAdminOnly: true },
]

const tenantNavItems = [
  { path: '/tenant/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tenant/bills', label: 'My Bills', icon: FileText },
  { path: '/tenant/usage', label: 'Usage', icon: Activity },
  { path: '/tenant/consumption-reports', label: 'Consumption Reports', icon: TrendingUp },
  { path: '/tenant/billing-reports', label: 'Billing Reports', icon: BarChart3 },
  { path: '/tenant/activity-logs', label: 'Activity Logs', icon: FileText },
  { path: '/tenant/notifications', label: 'Notifications', icon: Bell },
  { path: '/tenant/profile', label: 'Profile', icon: User },
]

const financeNavItems = [
  { path: '/finance/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/finance/billing', label: 'Billing Management', icon: Send },
  { path: '/finance/payment-review', label: 'Payment Review', icon: CheckSquare },
  { path: '/finance/billing-tickets', label: 'Billing Tickets', icon: Ticket },
  { path: '/finance/reports', label: 'Financial Reports', icon: BarChart3 },
  { path: '/finance/operational-exports', label: 'Operational Exports', icon: Download },
  { path: '/finance/activity-logs', label: 'Activity Logs', icon: FileText },
  { path: '/finance/notifications', label: 'Notifications', icon: Bell },
]

const facilityNavItems = [
  { path: '/facility/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/facility/monitoring', label: 'Building Monitoring', icon: Activity },
  { path: '/facility/consumption', label: 'Utility Consumption', icon: Zap },
  { path: '/facility/anomalies', label: 'Anomaly Alerts', icon: Siren },
  { path: '/facility/maintenance', label: 'Maintenance Requests', icon: Wrench },
  { path: '/facility/equipment', label: 'Equipment Status', icon: Cpu },
  { path: '/facility/reports', label: 'Reports', icon: FileBarChart },
  { path: '/facility/operational-exports', label: 'Operational Exports', icon: Download },
  { path: '/facility/activity-logs', label: 'Activity Logs', icon: FileText },
  { path: '/facility/notifications', label: 'Notifications', icon: Bell },
]

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  let navItems = adminNavItems
  if (user?.role === 'super_admin') navItems = superAdminNavItems
  if (user?.role === 'tenant') navItems = tenantNavItems
  if (user?.role === 'finance') navItems = financeNavItems
  if (user?.role === 'facility_manager') navItems = facilityNavItems

  const isSuperAdmin = user?.role === 'super_admin'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const portalLabel = {
    super_admin: 'Super Admin Portal',
    tenant: 'Tenant Portal',
    facility_manager: 'Facility Portal',
    finance: 'Finance Portal',
  }[user?.role] || 'Admin Portal'

  const regularItems = navItems.filter((i) => !i.superAdminOnly)
  const exclusiveItems = navItems.filter((i) => i.superAdminOnly)

  const END_PATHS = ['/admin', '/super-admin', '/tenant/dashboard', '/finance/dashboard', '/facility/dashboard']

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden" onClick={onMobileClose} />}
      <aside className={`fixed top-0 left-0 h-screen z-30 flex flex-col glass border-r border-slate-200/60 dark:border-slate-700/50 transition-all duration-300 ease-in-out ${collapsed ? 'w-[72px]' : 'w-[240px]'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div onClick={() => navigate('/')} className={`flex items-center h-16 px-4 border-b cursor-pointer transition-colors ${isSuperAdmin ? 'border-violet-200/60 dark:border-violet-700/40 bg-gradient-to-r from-violet-50/50 to-indigo-50/50 dark:from-violet-900/10 dark:to-indigo-900/10' : 'border-slate-200/60 dark:border-slate-700/50'} ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${isSuperAdmin ? 'bg-gradient-to-br from-violet-600 to-indigo-500 shadow-violet-500/30' : 'bg-gradient-to-br from-slate-700 to-slate-300 shadow-blue-500/30'}`}>
            <img src="/src/assets/enye-logo.png" alt="Enye Logo" className="w-6 h-6" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-display font-700 text-[15px] text-slate-800 dark:text-white leading-tight">Enyecontrols</p>
                {isSuperAdmin && <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white leading-none">SA</span>}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider truncate">{portalLabel}</p>
            </div>
          )}
          <button onClick={(e) => { e.stopPropagation(); onMobileClose() }} className="ml-auto lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {!collapsed && <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-600 px-3 pb-2">Menu</p>}
          {regularItems.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} end={END_PATHS.includes(path)} onClick={onMobileClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'} ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? label : undefined}>
              <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.8} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}

          {isSuperAdmin && exclusiveItems.length > 0 && (
            <>
              {!collapsed && (
                <div className="pt-3 pb-1 px-3">
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-px bg-violet-200 dark:bg-violet-700/40" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-violet-500 dark:text-violet-400 whitespace-nowrap flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5" />Super Admin
                    </span>
                    <div className="flex-1 h-px bg-violet-200 dark:bg-violet-700/40" />
                  </div>
                </div>
              )}
              {collapsed && <div className="my-2 mx-2 h-px bg-violet-200 dark:bg-violet-700/40" />}
              {exclusiveItems.map(({ path, label, icon: Icon }) => (
                <NavLink key={path} to={path} onClick={onMobileClose}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 text-violet-700 dark:text-violet-300 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-300'} ${collapsed ? 'justify-center px-0' : ''}`}
                  title={collapsed ? label : undefined}>
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.8} />
                  {!collapsed && <span>{label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-slate-200/60 dark:border-slate-700/50 space-y-2">
          <button onClick={() => setCollapsed((v) => !v)} className={`w-full hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-700 dark:hover:text-slate-200 transition-all ${collapsed ? 'justify-center' : ''}`}>
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
          </button>
          <button onClick={handleLogout} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-700 dark:hover:text-slate-200 transition-all ${collapsed ? 'justify-center' : ''}`}>
            <X className="w-4 h-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
