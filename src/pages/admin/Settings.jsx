import { useEffect, useState } from 'react'
import { Building2, Bell, Shield, Users, Zap, ChevronRight, Lock, KeyRound, UserCog, ClipboardList } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { usePageLoader } from '@/hooks/usePageLoader'
import { SettingsSkeleton } from '@/components/skeletons'
import { usePermissions } from '@/hooks/usePermissions'
import RateConfigCard from '@/components/common/RateConfigCard'
import { useAdminRates } from '@/hooks/adminHooks/useAdminRates'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { fetchActivityLogs, getActivityLogsSnapshot } from '@/services/activityLogService'
import {
  DEFAULT_ADMIN_NOTIFICATION_PREFERENCES,
  getAdminNotificationPreferences,
  getNotificationPreferenceItemsForRole,
  saveAdminNotificationPreferences,
} from '@/services/adminService/adminNotificationPreferencesService'

const sections = [
  { id: 'building',      label: 'Building Info',    icon: Building2 },
  { id: 'notifications', label: 'Notifications',    icon: Bell      },
  { id: 'security',      label: 'Security',         icon: Shield    },
  { id: 'billing',       label: 'Billing Settings', icon: Zap       },
]

const securityPolicyItems = [
  {
    label: 'Forced password change on first login',
    sub: 'Users with temporary passwords are redirected to create a private password before entering the app.',
  },
  {
    label: 'Super Admin password reset control',
    sub: 'Super Admin can issue password resets for managed users from user management.',
  },
  {
    label: 'Role-based route protection',
    sub: 'Every major area is protected by role guards before the page loads.',
  },
]

const accessSummaryItems = [
  {
    label: 'Super Admin',
    sub: 'Full access to user management, password reset, suspension, role assignment, and rate management.',
  },
  {
    label: 'Admin',
    sub: 'Operational access to announcements, tenants, billing views, and building-level workflows without full user administration.',
  },
  {
    label: 'Finance / Facility / Tenant',
    sub: 'Restricted access based on role-specific workflows, with no full user or password administration.',
  },
]

function isSecurityActivity(entry) {
  const haystack = `${entry?.action || ''} ${entry?.description || ''} ${JSON.stringify(entry?.meta || {})}`.toLowerCase()
  return [
    'password',
    'login',
    'logout',
    'user',
    'role',
    'suspend',
    'security',
    'access',
  ].some((token) => haystack.includes(token))
}

function formatSecurityActivityTime(value) {
  if (!value) return 'Unknown time'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown time'
  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function Settings() {
  const loading = usePageLoader(700)
  const { isDark, toggleTheme } = useTheme()
  const { user } = useAuth()
  const [active, setActive] = useState('building')
  const { isSuperAdmin } = usePermissions()
  const { addToast } = useApp()
  const { rates, saveRate, saveAllRates, loading: ratesLoading, error: ratesError } = useAdminRates()
  const [notificationPreferences, setNotificationPreferences] = useState(DEFAULT_ADMIN_NOTIFICATION_PREFERENCES)
  const [securityActivity, setSecurityActivity] = useState(() => {
    const snapshot = getActivityLogsSnapshot({ page: 1, per_page: 10 })
    const rows = Array.isArray(snapshot?.data?.data) ? snapshot.data.data : Array.isArray(snapshot?.data) ? snapshot.data : []
    return rows.filter(isSecurityActivity).slice(0, 5)
  })
  const [securityActivityLoading, setSecurityActivityLoading] = useState(false)
  const [securityActivityError, setSecurityActivityError] = useState('')

  useEffect(() => {
    const savedPreferences = getAdminNotificationPreferences(
      user?.id || user?.email || user?.username || user?.name,
      user?.role
    )
    setNotificationPreferences(savedPreferences)
  }, [user?.email, user?.id, user?.name, user?.role, user?.username])

  const notificationPreferenceItems = getNotificationPreferenceItemsForRole(user?.role)

  useEffect(() => {
    if (active !== 'security') return

    let cancelled = false

    const loadSecurityActivity = async () => {
      try {
        setSecurityActivityLoading(true)
        setSecurityActivityError('')
        const res = await fetchActivityLogs({ page: 1, per_page: 10 })
        const rows = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : []
        if (!cancelled) {
          setSecurityActivity(rows.filter(isSecurityActivity).slice(0, 5))
        }
      } catch (error) {
        if (!cancelled) {
          setSecurityActivityError(error?.response?.data?.message || error?.message || 'Failed to load recent security activity.')
        }
      } finally {
        if (!cancelled) {
          setSecurityActivityLoading(false)
        }
      }
    }

    loadSecurityActivity()

    return () => {
      cancelled = true
    }
  }, [active])

  if (loading) return <SettingsSkeleton />

  const handleNotificationToggle = (key) => {
    setNotificationPreferences((current) => {
      const nextPreferences = {
        ...current,
        [key]: !current[key],
      }

      const savedPreferences = saveAdminNotificationPreferences(
        user?.id || user?.email || user?.username || user?.name,
        nextPreferences,
        user?.role
      )

      addToast?.('Notification preference updated')
      return savedPreferences
    })
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h2 className="font-display font-700 text-xl text-slate-800 dark:text-white">Settings</h2>
        <p className="text-sm text-slate-400 mt-0.5">Configure your Billing system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="glass rounded-2xl p-3 shadow-md h-fit">
          {sections.map(section => {
            const Icon = section.icon
            return (
              <button key={section.id} onClick={() => setActive(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 last:mb-0 transition-all ${active === section.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                <Icon className="w-4 h-4 flex-shrink-0"/>
                {section.label}
                <ChevronRight className="w-3.5 h-3.5 ml-auto"/>
              </button>
            )
          })}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {active === 'building' && (
            <div className="glass rounded-2xl p-6 shadow-md">
              <h3 className="font-display font-700 text-[16px] text-slate-800 dark:text-white mb-5">Building Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Building Name', value: 'Enyecontrols' },
                  { label: 'Building Code', value: 'SBT-001' },
                  { label: 'Address',       value: '82 Sct. Ojeda, Brgy. Obrero, Diliman' },
                  { label: 'Admin Email',   value: 'admin@enye.com' },
                  { label: 'Total Floors',  value: '15' },
                  { label: 'Total Units',   value: '8' },
                ].map(field => (
                  <div key={field.label}>
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">{field.label}</label>
                    <input defaultValue={field.value} className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-all"/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'notifications' && (
            <div className="glass rounded-2xl p-6 shadow-md">
              <h3 className="font-display font-700 text-[16px] text-slate-800 dark:text-white mb-5">Notification Preferences</h3>
              <div className="space-y-4">
                {notificationPreferenceItems.map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(notificationPreferences[item.key])}
                        onChange={() => handleNotificationToggle(item.key)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-checked:bg-blue-600 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5"/>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'security' && (
            <div className="space-y-4">
              <div className="glass rounded-2xl p-6 shadow-md">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-700 text-[16px] text-slate-800 dark:text-white">Password Policy</h3>
                    <p className="text-sm text-slate-400">Security controls already enforced by the current authentication flow.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {securityPolicyItems.map((item) => (
                    <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/40">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-6 shadow-md">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                    <UserCog className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-700 text-[16px] text-slate-800 dark:text-white">Access Summary</h3>
                    <p className="text-sm text-slate-400">Quick view of who can manage security-sensitive actions in the platform.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {accessSummaryItems.map((item) => (
                    <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/40">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.sub}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    Current role: {user?.role || 'Unknown'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    User management: {isSuperAdmin ? 'Allowed' : 'Super Admin only'}
                  </span>
                </div>
              </div>

              <div className="glass rounded-2xl p-6 shadow-md">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-700 text-[16px] text-slate-800 dark:text-white">Recent Security Activity</h3>
                    <p className="text-sm text-slate-400">Recent activity-log items related to password, access, and user-security events.</p>
                  </div>
                </div>

                {securityActivityError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-300">
                    {securityActivityError}
                  </div>
                ) : securityActivityLoading ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                    Loading recent security activity...
                  </div>
                ) : securityActivity.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                    No recent security-related activity found in the latest logs.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {securityActivity.map((item, index) => (
                      <div key={`${item?.id || item?.action || 'activity'}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/40">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              {item?.description || item?.action || 'Security activity'}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                              {item?.action || 'system_event'}
                            </p>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {formatSecurityActivityTime(item?.created_at || item?.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <Link
                    to={`/${user?.role === 'super_admin' ? 'super-admin' : user?.role === 'finance' ? 'finance' : user?.role === 'facility_manager' ? 'facility' : user?.role === 'tenant' ? 'tenant' : 'admin'}/activity-logs`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View full activity logs
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {active === 'billing' && (
            <div className="glass rounded-2xl p-6 shadow-md">
              <h3 className="font-display font-700 text-[16px] text-slate-800 dark:text-white mb-4">Billing Settings</h3>
              {ratesError ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-300">
                  {ratesError}
                </div>
              ) : null}
              {ratesLoading ? (
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                  Loading current billing rates...
                </div>
              ) : null}
              {isSuperAdmin ? (
                <RateConfigCard
                  rates={rates}
                  onSaveRate={async (type, newRate) => {
                    const result = await saveRate(type, { rate: newRate, unit: rates?.[type]?.unit })
                    addToast?.(result?.message || 'Rate updated')
                    return result
                  }}
                  onSaveAllRates={async (nextRates) => {
                    const result = await saveAllRates(nextRates)
                    addToast?.(result?.message || 'Rates updated')
                    return result
                  }}
                />
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
                    <Lock className="w-4 h-4 text-amber-500 flex-shrink-0"/>
                    <p className="text-sm text-amber-700 dark:text-amber-400">Billing rates are managed by the Super Admin. You can view rates but cannot edit them.</p>
                  </div>
                  <RateConfigCard rates={rates} />
                </>
              )}
            </div>
          )}

          {/* Appearance — always visible */}
          <div className="glass rounded-2xl p-6 shadow-md">
            <h3 className="font-display font-700 text-[16px] text-slate-800 dark:text-white mb-4">Appearance</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Dark Mode</p>
                <p className="text-xs text-slate-400">Switch between light and dark theme</p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input type="checkbox" checked={isDark} onChange={toggleTheme} className="sr-only peer"/>
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-checked:bg-blue-600 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5"/>
              </label>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
