import { formatDate } from '@/utils/filterUtils'
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
  Camera,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { usePageLoader } from '@/hooks/usePageLoader'
import { LoadingValue, UpdatingBadge } from '@/components/common/InlineLoadingState'
import {
  getTenantProfile,
  updateTenantPassword,
  updateTenantProfile,
} from '@/services/tenantService/tenantProfileService'
import AvatarPicker, {
  DEFAULT_AVATAR,
  normalizeAvatarValue,
  TenantAvatar,
} from '@/components/common/AvatarPicker'
import {
  applyStoredAvatarToUser,
  getStoredAvatar,
  persistUserAvatar,
} from '@/utils/avatarStorage'

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
    avatar: getStoredAvatar(user) || user?.avatar || tenant?.avatar || DEFAULT_AVATAR,
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
  const profileAvatar = normalizeAvatarValue(profile?.avatar || profile?.tenant?.avatar || getStoredAvatar(nextUser))
  if (profileAvatar) {
    nextUser.avatar = profileAvatar
    nextTenant.avatar = profileAvatar
  }

  nextUser.tenant = nextTenant
  return applyStoredAvatarToUser(nextUser)
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
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [avatarSaved, setAvatarSaved] = useState(false)
  const [showEditInformation, setShowEditInformation] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(() => getProfileState(user).avatar)
  const [error, setError] = useState('')
  const [form, setForm] = useState(() => getProfileState(user))
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const isInitialLoading = (pageLoading || profileLoading) && !form.name && !error
  const isRefreshing = !isInitialLoading && profileLoading

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true)
        setError('')
        const authUser = applyStoredAvatarToUser(await refreshCurrentUser())

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

  useEffect(() => {
    if (showAvatarModal) {
      setSelectedAvatar(form.avatar || DEFAULT_AVATAR)
    }
  }, [form.avatar, showAvatarModal])

  const persistProfile = async ({
    avatar = form.avatar || DEFAULT_AVATAR,
    successMessage = 'Profile updated successfully.',
    closeAvatarModal = false,
    saveAvatarOnly = false,
  } = {}) => {
    try {
      if (saveAvatarOnly) {
        setAvatarSaving(true)
        setAvatarSaved(false)
      } else {
        setSaving(true)
      }
      setError('')

      const emailToPersist = form.email?.trim() || user?.email?.trim() || user?.tenant?.email?.trim() || ''

      if (!emailToPersist) {
        const message = 'Unable to save profile because the account email is missing.'
        setError(message)
        addToast(message, 'error')
        return
      }

      const avatarToPersist = normalizeAvatarValue(avatar)

      const avatarOwner = mergeProfileIntoUser(user, {
        name: form.name?.trim(),
        email: emailToPersist,
        phone: form.phone?.trim(),
        avatar: avatarToPersist,
        tenant: { avatar: avatarToPersist, email: emailToPersist },
      })
      persistUserAvatar(avatarOwner, avatarToPersist)

      if (saveAvatarOnly) {
        updateCurrentUser(avatarOwner)
        setForm(getProfileState(avatarOwner))
        setAvatarSaved(true)
        setTimeout(() => setAvatarSaved(false), 2000)
        addToast(successMessage, 'success')
        if (closeAvatarModal) setShowAvatarModal(false)
        return
      }

      const profilePayload = {
        name: form.name?.trim(),
        email: emailToPersist,
        phone: form.phone?.trim(),
      }

      let updated
      try {
        updated = await updateTenantProfile(profilePayload)
      } catch (err) {
        const status = err?.response?.status
        const avatarRejected = saveAvatarOnly && (status === 400 || status === 422)
        if (!avatarRejected) throw err

        updated = await updateTenantProfile({
          name: profilePayload.name,
          email: profilePayload.email,
          phone: profilePayload.phone,
        })
      }

      const freshUser = await refreshCurrentUser()
      const mergedUser = mergeProfileIntoUser(freshUser, {
        ...(updated || {}),
        avatar: avatarToPersist,
        tenant: {
          ...(updated?.tenant || {}),
          avatar: avatarToPersist,
        },
      })
      updateCurrentUser(mergedUser)
      setForm(getProfileState(mergedUser))

      if (saveAvatarOnly) {
        setAvatarSaved(true)
        setTimeout(() => setAvatarSaved(false), 2000)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }

      addToast(successMessage, 'success')
      if (closeAvatarModal) setShowAvatarModal(false)
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update profile.'
      setError(message)
      addToast(message, 'error')
    } finally {
      setSaving(false)
      setAvatarSaving(false)
    }
  }

  const handleSave = () => persistProfile()

  const handleAvatarSave = () =>
    persistProfile({
      avatar: selectedAvatar || DEFAULT_AVATAR,
      successMessage: 'Avatar updated successfully.',
      closeAvatarModal: true,
      saveAvatarOnly: true,
    })

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
    { icon: User, label: 'Full Name', value: form.name || '--' },
    { icon: Mail, label: 'Email', value: form.email || '--' },
    { icon: Phone, label: 'Phone', value: form.phone || '--' },
    { icon: Building2, label: 'Building', value: form.building || '--' },
    { icon: MapPin, label: 'Unit', value: form.unit || '--' },
    { icon: Calendar, label: 'Member Since', value: formatDate(form.memberSince) },
  ]

  return (
    <div className="space-y-5 animate-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display font-700 text-xl text-slate-800 dark:text-white">
            My Profile
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage your account information
          </p>
        </div>
        <UpdatingBadge show={isRefreshing} />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="glass rounded-2xl p-6 shadow-lg flex flex-col items-center text-center">
          <button
            type="button"
            onClick={() => setShowAvatarModal(true)}
            className="group relative mb-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/60"
            title="Change avatar"
          >
            <TenantAvatar
              src={form.avatar}
              name={form.name || 'Tenant'}
              size="xl"
              className="shadow-lg shadow-blue-500/20"
            />
            <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Camera className="h-6 w-6 text-white drop-shadow" />
            </span>
          </button>

          {showAvatarModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setShowAvatarModal(false)
                }
              }}
            >
              <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-700/60">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                      Choose Avatar
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Select a profile image
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAvatarModal(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                    aria-label="Close avatar picker"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 dark:border-slate-700/60 dark:bg-slate-800/40">
                  <TenantAvatar src={selectedAvatar} name={form.name} size="md" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                      Selected avatar
                    </p>
                    <p className="truncate text-[10px] font-mono text-slate-400">
                      {selectedAvatar || DEFAULT_AVATAR}
                    </p>
                  </div>
                </div>

                <div className="max-h-[55vh] overflow-y-auto p-5">
                  <AvatarPicker
                    value={selectedAvatar}
                    onChange={setSelectedAvatar}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setShowAvatarModal(false)}
                    disabled={avatarSaving}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAvatarSave}
                    disabled={avatarSaving}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
                  >
                    {avatarSaved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {avatarSaving ? 'Saving...' : avatarSaved ? 'Saved!' : 'Save Avatar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <span className="font-semibold text-lg text-slate-800 dark:text-white">
            {form.name || 'Tenant'}
          </span>
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
          <div className="space-y-3 lg:hidden">
            <button
              type="button"
              onClick={() => setShowEditInformation((prev) => !prev)}
              className="w-full rounded-2xl text-center border border-slate-200 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-3  text-sm font-semibold shadow-sm transition-all hover:border-blue-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500/40 dark:hover:bg-slate-800 hover:opacity-90"
            >
              {showEditInformation ? 'Hide Edit Information' : 'Edit Information'}
            </button>
            <button
              type="button"
              onClick={() => setShowChangePassword((prev) => !prev)}
              className="w-full rounded-2xl border text-center border-slate-200 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-3 text-sm font-semibold shadow-sm transition-all hover:border-blue-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500/40 dark:hover:bg-slate-800 hover:opacity-90"
            >
              {showChangePassword ? 'Hide Change Password' : 'Change Password'}
            </button>
          </div>

          <div className={`${showEditInformation ? 'block' : 'hidden'} lg:block glass rounded-2xl p-5 shadow-lg`}>
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white mb-4">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'Full Name', type: 'text' },
                { key: 'email', label: 'Email Address', type: 'email' },
                { key: 'phone', label: 'Phone Number', type: 'tel' },
              ].map(({ key, label, type }) => {
                const isEmailField = key === 'email'

                return (
                <div key={key}>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={
                      isEmailField
                        ? undefined
                        : (e) =>
                            setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    readOnly={isEmailField}
                    disabled={isEmailField}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm border transition-all ${
                      isEmailField
                        ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400'
                    }`}
                  />
                  {isEmailField && (
                    <p className="mt-1 text-xs text-slate-400">
                      Email address cannot be changed.
                    </p>
                  )}
                </div>
                )
              })}

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

          <div className={`${showChangePassword ? 'block' : 'hidden'} lg:block glass rounded-2xl p-5 shadow-lg`}>
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
