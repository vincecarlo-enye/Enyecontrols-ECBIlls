import { useEffect, useState } from 'react'
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Save,
  CheckCircle,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { usePageLoader } from '@/hooks/usePageLoader'
import { TenantProfileSkeleton } from '@/components/skeletons'
import {
  getTenantProfile,
  updateTenantPassword,
  updateTenantProfile,
} from '@/services/tenantService/tenantProfileService'

function getInitials(name = '') {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getProfileState(user) {
  const tenant = user?.tenant ?? {}
  const unit = tenant?.unit ?? {}

  return {
    name: user?.name ?? tenant?.name ?? '',
    email: user?.email ?? tenant?.email ?? '',
    phone: user?.phone ?? tenant?.phone ?? '',
    building: unit?.building_name ?? '',
    unit: unit?.unit_number ?? '',
    memberSince: user?.created_at ?? tenant?.move_in_date ?? '',
  }
}

function mergeProfileIntoUser(baseUser, profile) {
  if (!baseUser && !profile) return null

  const nextUser = { ...(baseUser || {}) }
  const nextTenant = {
    ...(baseUser?.tenant || {}),
    ...(profile?.tenant || {}),
  }

  if (profile?.name) nextUser.name = profile.name
  if (profile?.email) nextUser.email = profile.email
  if (profile?.phone) nextUser.phone = profile.phone

  if (profile?.tenant?.name || profile?.name) nextTenant.name = profile?.tenant?.name || profile?.name
  if (profile?.tenant?.email || profile?.email) nextTenant.email = profile?.tenant?.email || profile?.email
  if (profile?.tenant?.phone || profile?.phone) nextTenant.phone = profile?.tenant?.phone || profile?.phone
  if (profile?.tenant?.move_in_date) nextTenant.move_in_date = profile.tenant.move_in_date
  if (profile?.tenant?.unit) {
    nextTenant.unit = {
      ...(baseUser?.tenant?.unit || {}),
      ...profile.tenant.unit,
    }
  }

  nextUser.tenant = nextTenant
  return nextUser
}

function formatDate(value) {
  if (!value) return 'â€”'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function TenantProfile() {
  const pageLoading = usePageLoader(700)
  const { user, updateCurrentUser, refreshCurrentUser } = useAuth()
  const { addToast } = useApp()

  const [profileLoading, setProfileLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(() => getProfileState(user))
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true)
        setError('')
        const authUser = await refreshCurrentUser()

        try {
          const profile = await getTenantProfile()
          const mergedUser = mergeProfileIntoUser(authUser, profile)
          updateCurrentUser(mergedUser)
          setForm(getProfileState(mergedUser))
        } catch {
          setForm(getProfileState(authUser))
        }
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load tenant profile.'
        setError(message)
        setForm(getProfileState(user))
      } finally {
        setProfileLoading(false)
      }
    }

    loadProfile()
  }, [refreshCurrentUser, updateCurrentUser])

  if ((pageLoading && !form.name && !form.email) || (profileLoading && !form.name && !form.email)) {
    return <TenantProfileSkeleton />
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')

      const updated = await updateTenantProfile({
        name: form.name,
        email: form.email,
        phone: form.phone,
      })

      if (updated) {
        const freshUser = await refreshCurrentUser()
        const mergedUser = mergeProfileIntoUser(freshUser, updated)
        updateCurrentUser(mergedUser)
        setForm(getProfileState(mergedUser))
      }

      setSaved(true)
      addToast('Profile updated successfully.', 'success')
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update profile.'
      setError(message)
      addToast(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handlePwSave = async () => {
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      addToast('Please complete all password fields.', 'error')
      return
    }

    if (pwForm.next !== pwForm.confirm) {
      addToast('Passwords do not match.', 'error')
      return
    }

    try {
      setPwSaving(true)
      setError('')

      await updateTenantPassword({
        current_password: pwForm.current,
        password: pwForm.next,
        password_confirmation: pwForm.confirm,
      })

      setPwSaved(true)
      setPwForm({ current: '', next: '', confirm: '' })
      addToast('Password updated successfully.', 'success')
      setTimeout(() => setPwSaved(false), 2000)
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update password.'
      setError(message)
      addToast(message, 'error')
    } finally {
      setPwSaving(false)
    }
  }

  const details = [
    { icon: User, label: 'Full Name', value: form.name || 'â€”' },
    { icon: Mail, label: 'Email', value: form.email || 'â€”' },
    { icon: Phone, label: 'Phone', value: form.phone || 'â€”' },
    { icon: Building2, label: 'Building', value: form.building || 'â€”' },
    { icon: MapPin, label: 'Unit', value: form.unit || 'â€”' },
    { icon: Calendar, label: 'Member Since', value: formatDate(form.memberSince) },
  ]

  return (
    <div className="space-y-5 animate-in">
      <div>
        <h1 className="font-display font-700 text-xl text-slate-800 dark:text-white">
          My Profile
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Manage your account information
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="glass rounded-2xl p-6 shadow-lg flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20 mb-4">
            {user?.initials || getInitials(form.name) || 'T'}
          </div>
          <p className="font-semibold text-lg text-slate-800 dark:text-white">
            {form.name || 'Tenant'}
          </p>
          <p className="text-sm text-slate-400 mt-0.5">
            {form.building || 'Tenant Account'}
          </p>
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
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">
                    {label}
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-2xl p-5 shadow-lg">
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white mb-4">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'Full Name', type: 'text' },
                { key: 'email', label: 'Email Address', type: 'email' },
                { key: 'phone', label: 'Phone Number', type: 'tel' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Building
                </label>
                <input
                  value={form.building}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Unit (Read-only)
                </label>
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
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-all disabled:opacity-60"
              >
                {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 shadow-lg">
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white mb-4">
              Change Password
            </h2>
            <div className="space-y-3">
              {[
                { key: 'current', label: 'Current Password' },
                { key: 'next', label: 'New Password' },
                { key: 'confirm', label: 'Confirm New Password' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    {label}
                  </label>
                  <input
                    type="password"
                    value={pwForm[key]}
                    onChange={(e) =>
                      setPwForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    placeholder="........"
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                  />
                </div>
              ))}
              {pwForm.next &&
                pwForm.confirm &&
                pwForm.next !== pwForm.confirm && (
                  <p className="text-xs text-red-500">Passwords do not match.</p>
                )}
            </div>
            <div className="mt-4">
              <button
                onClick={handlePwSave}
                disabled={pwSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-all disabled:opacity-60"
              >
                {pwSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {pwSaving
                  ? 'Updating...'
                  : pwSaved
                    ? 'Password Updated!'
                    : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
