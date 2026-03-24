import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const DEMO = [
  { role: 'Super Admin',    email: 'superadmin@enye.com', password: 'super123',  desc: 'All permissions + meter management' },
  { role: 'Admin',            email: 'admin@enye.com',    password: 'admin123',  desc: 'Full dashboard access'      },
  { role: 'Finance',          email: 'finance@example.com',password: 'password',  desc: 'Finance analytics access'   },
  { role: 'Tenant',           email: 'tenant@enye.com',   password: 'tenant123', desc: 'Tenant portal access'       },
  { role: 'Facility Manager', email: 'facility@enye.com', password: '123456',    desc: 'Facility operations access' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setError('')
    setLoading(true)
    setTimeout(() => {
      const user = login(email.trim(), password)
      if (!user || user.error) {
        setError(user?.message || 'Invalid email or password. Please try again.')
        setLoading(false)
        return
      }
      navigate(
        (user.role === 'super_admin' || user.role === 'admin') ? '/'
        : user.role === 'facility_manager' ? '/facility/dashboard'
        : user.role === 'finance' ? '/finance/dashboard'
        : '/tenant/dashboard',
        { replace: true }
      )
    }, 500)
  }

  const fillDemo = (d) => { setEmail(d.email); setPassword(d.password); setError('') }

  return (
    <div className="min-h-screen mesh-bg dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-300 shadow-lg shadow-blue-500/30 mb-4">
            <img src="/src/assets/enye-logo.png" alt="Enyecontrols" className="w-10 h-10" />
          </div>          <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">Enyecontrols</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-mono mt-1">Billing System</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-black/40 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">Welcome back</h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">Sign in to continue to your portal</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="admin@enye.com"
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-500 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : <LogIn className="w-4 h-4" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-3">Demo Accounts</p>
            <div className="space-y-2">
              {DEMO.map(d => (
                <div
                  key={d.role}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{d.role}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{d.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillDemo(d)}
                    className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Use
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="flex justify-center align-middle text-center text-xs text-slate-400 dark:text-slate-600 mt-6">
          <img src="/src/assets/enyecontrols.jpg" alt="Enyecontrols" className="w-32" />&nbsp; Billing System © 2026
        </p>
      </div>
    </div>
  )
}
