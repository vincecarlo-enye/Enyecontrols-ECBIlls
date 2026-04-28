import { formatDateTime } from '@/utils/filterUtils'
import { useMemo, useState } from 'react'
import { CalendarDays, Lock, ShieldAlert, Unlock } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useBillingPeriodLocks } from '@/hooks/useBillingPeriodLocks'

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(value) {
  if (!value) return ''
  const [year, month] = String(value).split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}


export default function BillingPeriodLockPanel({
  scope = 'finance',
  title = 'Billing Period Lock',
  description = 'Finalized months auto-lock after cutoff. Manual controls are for early lock or approved unlock exceptions.',
}) {
  const { addToast } = useApp()
  const {
    activeLocks,
    loading,
    saving,
    error,
    getMonthLock,
    lockMonth,
    unlockMonth,
  } = useBillingPeriodLocks(scope)

  const [billingMonth, setBillingMonth] = useState(currentMonth)
  const [reason, setReason] = useState('')

  const selectedLock = useMemo(() => getMonthLock(billingMonth), [billingMonth, getMonthLock])
  const isLocked = Boolean(selectedLock?.isLocked)

  const handleSubmit = async () => {
    if (!billingMonth) return

    const result = isLocked
      ? await unlockMonth({ billingMonth, reason })
      : await lockMonth({ billingMonth, reason })

    addToast(
      result?.message || (result?.success ? 'Billing period updated.' : 'Failed to update billing period lock.'),
      result?.success ? 'success' : 'error',
    )

    if (result?.success) {
      setReason('')
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-violet-500" />
            <h3 className="font-display font-700 text-[15px] text-slate-800 dark:text-white">{title}</h3>
          </div>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>

        <div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
          isLocked
            ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
        }`}>
          {isLocked ? <ShieldAlert className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          {isLocked ? `${formatMonthLabel(billingMonth)} is locked` : `${formatMonthLabel(billingMonth)} is open`}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[200px_1fr_auto]">
        <input
          type="month"
          value={billingMonth}
          onChange={(event) => setBillingMonth(event.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
        />
        <input
          type="text"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={isLocked ? 'Reason for unlock (required)' : 'Reason for lock'}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
        />
        <button
          onClick={handleSubmit}
          disabled={!billingMonth || saving || loading || (isLocked && !reason.trim())}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            isLocked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-violet-600 hover:bg-violet-700'
          }`}
        >
          {isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {isLocked ? 'Unlock Month' : 'Lock Month'}
        </button>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
        Periods with finalized bills auto-lock after the monthly cutoff. If a month is manually unlocked, automation leaves it open until it is locked again.
      </div>

      {selectedLock ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          <p><span className="font-semibold">Locked by:</span> {selectedLock.lockedByName}</p>
          <p><span className="font-semibold">Locked at:</span> {formatDateTime(selectedLock.lockedAt)}</p>
          <p><span className="font-semibold">Reason:</span> {selectedLock.reason || 'No reason provided.'}</p>
          {!selectedLock.isLocked ? (
            <>
              <p><span className="font-semibold">Unlocked by:</span> {selectedLock.unlockedByName || 'System'} · {formatDateTime(selectedLock.unlockedAt)}</p>
              <p><span className="font-semibold">Unlock reason:</span> {selectedLock.unlockReason || 'No reason provided.'}</p>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              {['Month', 'Status', 'Locked By', 'Locked At', 'Reason'].map((label) => (
                <th
                  key={label}
                  className="px-3 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-slate-400"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeLocks.slice(0, 6).map((item) => (
              <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-3 py-3 font-medium text-slate-700 dark:text-slate-200">
                  {formatMonthLabel(item.billingMonth)}
                </td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                    Locked
                  </span>
                </td>
                <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{item.lockedByName}</td>
                <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{formatDateTime(item.lockedAt)}</td>
                <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{item.reason || 'No reason provided.'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeLocks.length === 0 && !loading ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-400 dark:border-slate-700">
          No active billing locks yet.
        </div>
      ) : null}
    </div>
  )
}
