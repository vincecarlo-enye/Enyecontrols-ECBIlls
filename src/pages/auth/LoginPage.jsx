import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import ecbillsLogo from '@/assets/ecbills_logo.png'
import enyeImage from '@/assets/enyecontrols.jpg'

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
    <div className="relative min-h-[100svh] overflow-hidden mesh-bg dark:bg-slate-950 px-4 py-6 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-500/10" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-blue-400/25 blur-3xl dark:bg-blue-500/10" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-3rem)] w-full max-w-7xl items-center gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.74fr)] xl:gap-8">
        <div className="hidden min-h-[680px] max-h-[820px] lg:flex rounded-[34px] border border-slate-200/70 dark:border-slate-700/40 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.20),_transparent_32%),linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(248,250,252,0.98))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_32%),linear-gradient(180deg,_rgba(15,23,42,0.9),_rgba(2,6,23,0.96))] shadow-[0_28px_90px_rgba(15,23,42,0.14)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)] overflow-hidden">
          <div className="flex w-full flex-col justify-between p-8 xl:p-10">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-blue-200/70 bg-white/75 px-4 py-3 shadow-sm dark:border-cyan-500/20 dark:bg-slate-900/40">
                <img src={ecbillsLogo} alt="ECBills" className="h-12 w-12 rounded-2xl object-cover shadow-sm" />
                <div>
                  <p className="font-display text-lg font-bold text-slate-900 dark:text-white">ECBills</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Smart Utility Platform</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Building billing, monitoring, and operations
                </div>
                <h1 className="font-display text-4xl font-bold leading-tight text-slate-900 dark:text-white xl:text-[2.75rem]">
                  One platform for metering, billing, payment review, and facility visibility.
                </h1>
                <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Keep billing operations organized, traceable, and easier to audit across finance, facility, admin, and tenant portals.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  'Role-based dashboards',
                  'Approval and audit trails',
                  'Meter-based billing flows',
                  'Payment and dispute tracking',
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 text-sm text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <span>{item}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-[28px] border border-slate-200/70 bg-white px-8 py-7 shadow-sm dark:border-slate-700/50 dark:bg-white">
                <img
                  src={enyeImage}
                  alt="Enyecontrols"
                  className="h-36 w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[480px] flex-col justify-center">
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-[28px] bg-white shadow-lg shadow-blue-500/20 mb-4 dark:bg-slate-900">
              <img src={ecbillsLogo} alt="ECBills" className="w-20 h-20 rounded-2xl object-cover" />
            </div>
            <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">ECBills</h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-mono mt-1">Smart Utility Billing Platform</p>
          </div>

          <div className="glass rounded-[30px] shadow-xl shadow-slate-200/60 dark:shadow-black/40 p-6 sm:p-8 lg:p-9">
            <p className="hidden lg:block text-xs font-mono uppercase tracking-[0.22em] text-cyan-500 dark:text-cyan-300 mb-3">ECBills Portal</p>
            <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white mb-1">Welcome back</h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">Sign in to continue to your portal</p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder="admin@enye.com"
                  autoComplete="email"
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    placeholder="********"
                    autoComplete="current-password"
                    className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : <LogIn className="w-4 h-4" />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-600">
            <span>Enyecontrols Billing System © 2026</span>
          </div>
        </div>
      </div>
    </div>
  )
}

