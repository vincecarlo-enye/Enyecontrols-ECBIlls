import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

function getHomeByRole(user) {
  switch (user?.role) {
    case 'super_admin':
      return '/super-admin'
    case 'admin':
      return '/admin'
    case 'facility_manager':
      return '/facility/dashboard'
    case 'finance':
      return '/finance/dashboard'
    default:
      return '/tenant/dashboard'
  }
}

export default function ForcePasswordChange() {
  const navigate = useNavigate()
  const { user, forceChangePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setError('')
    setSaving(true)

    try {
      await forceChangePassword(password, confirmPassword)
      navigate(getHomeByRole({ ...user, must_change_password: false }), { replace: true })
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to update your password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen mesh-bg dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-black/40 p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800 dark:text-white">Create a New Password</h1>
              <p className="text-sm text-slate-400 dark:text-slate-500">Your temporary password worked. Set a private one to continue.</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
                New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-11 text-sm text-slate-800 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
                <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-11 text-sm text-slate-800 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
                <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
