import { useState } from 'react'
import { Building2, Bell, Shield, Users, Zap, Save, ChevronRight, Lock } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { usePageLoader } from '@/hooks/usePageLoader'
import { SettingsSkeleton } from '@/components/skeletons'
import { usePermissions } from '@/hooks/usePermissions'
import RateConfigCard from '@/components/common/RateConfigCard'

const sections = [
  { id: 'building',      label: 'Building Info',    icon: Building2 },
  { id: 'notifications', label: 'Notifications',    icon: Bell      },
  { id: 'security',      label: 'Security',         icon: Shield    },
  { id: 'billing',       label: 'Billing Settings', icon: Zap       },
]

export default function Settings() {
  const loading = usePageLoader(700)
  const { isDark, toggleTheme } = useTheme()
  const [active, setActive] = useState('building')
  const { isSuperAdmin } = usePermissions()

  if (loading) return <SettingsSkeleton />

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
                {[
                  { label: 'Bill Generated',       sub: 'Get notified when a new bill is created',      checked: true  },
                  { label: 'Payment Received',      sub: 'Alert when tenant makes a payment',            checked: true  },
                  { label: 'Overdue Bills',         sub: 'Remind when bills pass due date',              checked: true  },
                  { label: 'Utility Spike Detected',sub: 'Alert on unusual usage spikes',               checked: false },
                  { label: 'Maintenance Reminders', sub: 'Scheduled maintenance notifications',          checked: false },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer">
                      <input type="checkbox" defaultChecked={item.checked} className="sr-only peer"/>
                      <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-checked:bg-blue-600 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5"/>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'security' && (
            <div className="glass rounded-2xl p-6 shadow-md">
              <h3 className="font-display font-700 text-[16px] text-slate-800 dark:text-white mb-2">Security</h3>
              <p className="text-sm text-slate-400">This section is under development. Check back soon.</p>
            </div>
          )}

          {active === 'billing' && (
            <div className="glass rounded-2xl p-6 shadow-md">
              <h3 className="font-display font-700 text-[16px] text-slate-800 dark:text-white mb-4">Billing Settings</h3>
              {isSuperAdmin ? (
                <RateConfigCard />
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
                    <Lock className="w-4 h-4 text-amber-500 flex-shrink-0"/>
                    <p className="text-sm text-amber-700 dark:text-amber-400">Billing rates are managed by the Super Admin. You can view rates but cannot edit them.</p>
                  </div>
                  <RateConfigCard />
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

          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5">
            <Save className="w-4 h-4"/>Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
