import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import GridBackground from '@/components/common/GridBackground'
import { UpdatingBadge } from '@/components/common/InlineLoadingState'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e?.preventDefault()

    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }

    setError('')
    setLoading(true)

    const user = await login(email.trim(), password)

    if (!user || user.error) {
      setError(user?.message || 'Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    navigate(
      user.role === 'super_admin' ? '/super-admin'
        : user.role === 'admin' ? '/admin'
          : user.role === 'facility_manager' ? '/facility/dashboard'
            : user.role === 'finance' ? '/finance/dashboard'
              : '/tenant/dashboard',
      { replace: true }
    )

    setLoading(false)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4 dark:bg-slate-950">
      <GridBackground />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-300 shadow-lg shadow-blue-500/30">
            <img src="/src/assets/ec_bills.png" alt="Enyecontrols" className="h-24 w-24 rounded-2xl" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Enyecontrols</h1>
          <p className="mt-1 font-mono text-sm text-slate-400 dark:text-slate-500">Billing System</p>
        </div>

        <div className="glass rounded-2xl p-6 shadow-xl shadow-slate-200/60 dark:shadow-black/40 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h2 className="mb-1 text-lg font-semibold text-slate-800 dark:text-white">Welcome back</h2>
              <p className="text-sm text-slate-400 dark:text-slate-500">Sign in to continue to your portal</p>
            </div>
            <UpdatingBadge show={loading} />
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                placeholder="admin@enye.com"
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="********"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-11 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-6 flex items-center justify-center text-center text-xs text-slate-400 dark:text-slate-600">
          <img src="/src/assets/enyecontrols.jpg" alt="Enyecontrols" className="w-32" />&nbsp; Billing System &copy; 2026
        </p>
      </div>
    </div>
  )
}
