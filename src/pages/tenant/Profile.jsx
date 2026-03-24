import { useState } from 'react'
import { User, Mail, Phone, Building2, MapPin, Calendar, Save, CheckCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { usePageLoader } from '@/hooks/usePageLoader'
import { TenantProfileSkeleton } from '@/components/skeletons'

export default function TenantProfile() {
  const loading        = usePageLoader(700)
  const { user }       = useAuth()

  const [form, setForm]       = useState({
    name:    user?.name    || '',
    email:   user?.email   || '',
    phone:   '+63 917 100 0001',
    company: user?.company || 'ABC Corporation',
    unit:    user?.unit    || '12F-A',
  })
  const [saved, setSaved]     = useState(false)
  const [pwForm, setPwForm]   = useState({ current:'', next:'', confirm:'' })
  const [pwSaved, setPwSaved] = useState(false)

  if (loading) return <TenantProfileSkeleton />

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  const handlePwSave = () => {
    if (!pwForm.current || !pwForm.next) return
    if (pwForm.next !== pwForm.confirm) return
    setPwSaved(true)
    setPwForm({ current:'', next:'', confirm:'' })
    setTimeout(() => setPwSaved(false), 2000)
  }

  const details = [
    { icon:User,      label:'Full Name',     value:form.name },
    { icon:Mail,      label:'Email',          value:form.email },
    { icon:Phone,     label:'Phone',          value:form.phone },
    { icon:Building2, label:'Company',        value:form.company },
    { icon:MapPin,    label:'Unit',           value:form.unit },
    { icon:Calendar,  label:'Member Since',   value:'January 2024' },
  ]

  return (
    <div className="space-y-5 animate-in">
      <div>
        <h1 className="font-display font-700 text-xl text-slate-800 dark:text-white">My Profile</h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Profile card */}
        <div className="glass rounded-2xl p-6 shadow-lg flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20 mb-4">
            {user?.initials || 'T'}
          </div>
          <p className="font-semibold text-lg text-slate-800 dark:text-white">{user?.name}</p>
          <p className="text-sm text-slate-400 mt-0.5">{user?.company}</p>
          <span className="mt-2 px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">
            Tenant
          </span>

          <div className="mt-5 w-full space-y-3 text-left">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">{label}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Personal info */}
          <div className="glass rounded-2xl p-5 shadow-lg">
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key:'name',    label:'Full Name',     type:'text' },
                { key:'email',   label:'Email Address', type:'email' },
                { key:'phone',   label:'Phone Number',  type:'tel' },
                { key:'company', label:'Company',       type:'text' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                  />
                </div>
              ))}
              {/* Unit — read-only */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Unit (Read-only)</label>
                <input
                  value={form.unit}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-all"
              >
                {saved ? <CheckCircle className="w-4 h-4"/> : <Save className="w-4 h-4"/>}
                {saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Change password */}
          <div className="glass rounded-2xl p-5 shadow-lg">
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white mb-4">Change Password</h2>
            <div className="space-y-3">
              {[
                { key:'current', label:'Current Password' },
                { key:'next',    label:'New Password' },
                { key:'confirm', label:'Confirm New Password' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">{label}</label>
                  <input
                    type="password"
                    value={pwForm[key]}
                    onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                  />
                </div>
              ))}
              {pwForm.next && pwForm.confirm && pwForm.next !== pwForm.confirm && (
                <p className="text-xs text-red-500">Passwords do not match.</p>
              )}
            </div>
            <div className="mt-4">
              <button
                onClick={handlePwSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-all"
              >
                {pwSaved ? <CheckCircle className="w-4 h-4"/> : <Save className="w-4 h-4"/>}
                {pwSaved ? 'Password Updated!' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
