import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Sun, Moon, Search, Menu, ChevronDown, LogOut, AlertTriangle, Info, Building2, Shield } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useUnitFilter } from '@/context/UnitFilterContext'
import { fetchNotifications, markNotificationAsRead } from '@/services/notificationService'

const pageTitles = {
  '/': 'Dashboard',
  '/billing': 'Billing',
  '/tenants': 'Tenants',
  '/units': 'Units',
  '/usage-reports': 'Usage Reports',
  '/settings': 'Settings',
  '/tenant-reports': 'Tenant Reports',
  '/tenant/dashboard': 'My Dashboard',
  '/tenant/bills': 'My Bills',
  '/tenant/usage': 'Usage Monitoring',
  '/tenant/profile': 'My Profile',
  '/tenant/consumption-reports': 'Consumption Reports',
  '/tenant/notifications': 'Notifications',
  '/tenant/make-report': 'Make Report',
  '/admin/meters': 'Meter Management',
  '/admin/notifications': 'Notifications',
  '/super-admin': 'Dashboard',
  '/super-admin/billing': 'Billing',
  '/super-admin/tenants': 'Tenants',
  '/super-admin/units': 'Units',
  '/super-admin/usage-reports': 'Usage Reports',
  '/super-admin/tenant-reports': 'Tenant Reports',
  '/super-admin/notifications': 'Notifications',
  '/super-admin/meters': 'Meter Management',
  '/super-admin/billing-rates': 'Billing Rates',
  '/super-admin/users': 'User Management',
  '/super-admin/announcements': 'Announcements',
  '/finance/notifications': 'Notifications',
  '/facility/notifications': 'Notifications',
}

export default function Navbar({ onMenuClick }) {
  const { isDark, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const { selectedUnit, setSelectedUnit } = useUnitFilter()
  const location = useLocation()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifLoading, setNotifLoading] = useState(false)
  const title = pageTitles[location.pathname] || 'ECBills'
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  const isSuperAdmin = user?.role === 'super_admin'

  const notifTypeConfig = {
    warning: { icon: AlertTriangle, iconClass: 'text-amber-500' },
    info: { icon: Info, iconClass: 'text-blue-500' },
    notice: { icon: Bell, iconClass: 'text-indigo-500' },
  }

  const getNotificationsPath = () => {
    if (user?.role === 'super_admin') return '/super-admin/notifications'
    if (user?.role === 'tenant') return '/tenant/notifications'
    if (user?.role === 'finance') return '/finance/notifications'
    if (user?.role === 'facility_manager') return '/facility/notifications'
    return '/admin/notifications'
  }

  const handleLogout = async () => {
    setShowProfile(false)
    setShowNotifs(false)
    await logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!user) return

    let cancelled = false

    const loadNotifications = async () => {
      try {
        setNotifLoading(true)
        const res = await fetchNotifications()
        if (cancelled) return
        setNotifications(Array.isArray(res?.data) ? res.data : [])
      } catch {
        if (!cancelled) setNotifications([])
      } finally {
        if (!cancelled) setNotifLoading(false)
      }
    }

    loadNotifications()
    const interval = window.setInterval(loadNotifications, 60000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [user])

  const handleNotificationClick = async (notification) => {
    if (!notification?.id) return

    if (!notification.is_read) {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item
        )
      )

      try {
        await markNotificationAsRead(notification.id)
      } catch {}
    }

    setShowNotifs(false)
    navigate(getNotificationsPath(), {
      state: { selectedNotificationId: notification.id },
    })
  }

  const notifs = (notifications || []).slice(0, 5)
  const unreadCount = (notifications || []).filter((item) => !item.is_read).length

  const isTenantPage = location.pathname.startsWith('/tenant')
  const tenantUnits = Array.from(
    new Set(
      (Array.isArray(user?.tenants) ? user.tenants : [user?.tenant])
        .filter(Boolean)
        .map((tenant) => tenant?.unit?.unit_number || tenant?.unit?.name || '')
        .filter(Boolean)
    )
  )
  const showUnitFilter = isTenantPage && user?.role === 'tenant' && tenantUnits.length > 1

  const roleDisplay = user?.role === 'super_admin'
    ? 'Super Admin'
    : user?.role === 'facility_manager'
    ? 'Facility Manager'
    : user?.role === 'finance'
    ? 'Finance'
    : user?.role === 'tenant'
    ? 'Tenant'
    : 'Admin'

  return (
    <header className={`sticky top-0 z-10 h-16 border-b flex items-center px-4 lg:px-6 gap-4 transition-colors
      ${isSuperAdmin
        ? 'glass border-violet-200/60 dark:border-violet-700/40'
        : 'glass border-slate-200/60 dark:border-slate-700/50'
      }`}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="hidden sm:flex items-center gap-2">
        <div>
          <h1 className="font-display font-700 text-[17px] text-slate-800 dark:text-white">{title}</h1>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-sm mx-auto lg:mx-0 lg:ml-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tenants, bills..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-100/80 dark:bg-slate-700/50 border border-transparent focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Unit Filter */}
        {showUnitFilter && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50">
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            <select
              value={selectedUnit}
              onChange={e => setSelectedUnit(e.target.value)}
              className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="all">All Units</option>
              {tenantUnits.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotifs(v => !v); setShowProfile(false) }}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-800" />
                <span className="absolute -top-0.5 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </>
            )}
          </button>

          {showNotifs && (
            <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 glass rounded-2xl shadow-2xl shadow-slate-200/60 dark:shadow-black/40 border border-slate-200/60 dark:border-slate-700/50 overflow-hidden animate-in z-50 max-h-[70vh] overflow-y-auto">
              <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/50">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-sm text-slate-800 dark:text-white">Notifications</p>
                  <span className="text-[10px] font-mono text-slate-400">
                    {unreadCount} unread
                  </span>
                </div>
              </div>
              {notifLoading ? (
                <div className="p-4 text-xs text-slate-400">Loading notifications...</div>
              ) : notifs.length === 0 ? (
                <div className="p-4 text-xs text-slate-400">No notifications found.</div>
              ) : notifs.map(n => {
                const cfg = notifTypeConfig[n.type] || notifTypeConfig.info
                const Icon = cfg.icon
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors border-b border-slate-100 dark:border-slate-700/30 last:border-0 ${
                      n.is_read ? '' : 'bg-blue-50/60 dark:bg-blue-900/10'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 ${cfg.iconClass}`} />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{n.title}</p>
                        {!n.is_read && <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {n.created_at
                          ? new Date(n.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : ''}
                      </p>
                    </div>
                  </button>
                )
              })}
              <button
                onClick={() => {
                  setShowNotifs(false)
                  navigate(getNotificationsPath())
                }}
                className="w-full px-4 py-3 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-100 dark:border-slate-700/30"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setShowProfile(v => !v); setShowNotifs(false) }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow
              ${isSuperAdmin
                ? 'bg-gradient-to-br from-violet-600 to-indigo-500'
                : 'bg-gradient-to-br from-blue-500 to-cyan-400'
              }`}
            >
              {user?.initials || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{user?.name || 'User'}</p>
                {isSuperAdmin && <Shield className="w-3 h-3 text-violet-500" />}
              </div>
              <p className="text-[10px] text-slate-400 capitalize">{roleDisplay}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 glass rounded-2xl shadow-2xl shadow-slate-200/60 dark:shadow-black/40 border border-slate-200/60 dark:border-slate-700/50 overflow-hidden animate-in z-50">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-sm text-slate-800 dark:text-white">{user?.name}</p>
                  {isSuperAdmin && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white leading-none">SA</span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{user?.email}</p>
                {isSuperAdmin && (
                  <div className="mt-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/40">
                    <Shield className="w-3 h-3 text-violet-500" />
                    <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400">Super Administrator</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
