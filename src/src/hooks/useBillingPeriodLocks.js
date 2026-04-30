import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchBillingPeriodLocks,
  lockBillingPeriod,
  unlockBillingPeriod,
} from '@/services/billingPeriodLockService'

function normalizeLocks(rows = []) {
  return rows.map((row) => ({
    id: row.id,
    billingMonth: row.billing_month,
    isLocked: Boolean(row.is_locked),
    reason: row.reason || '',
    lockedAt: row.locked_at || '',
    unlockedAt: row.unlocked_at || '',
    lockedByName: row.locker?.name || 'System',
    unlockedByName: row.unlocker?.name || '',
    unlockReason: row.unlock_reason || '',
    raw: row,
  }))
}

export function useBillingPeriodLocks(scope = 'finance') {
  const [locks, setLocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadLocks = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetchBillingPeriodLocks()
      setLocks(normalizeLocks(Array.isArray(response?.data) ? response.data : []))
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load billing period locks.')
      setLocks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLocks()
  }, [loadLocks])

  const lockMap = useMemo(() => {
    const map = new Map()
    locks.forEach((item) => {
      map.set(item.billingMonth, item)
    })
    return map
  }, [locks])

  const activeLocks = useMemo(() => locks.filter((item) => item.isLocked), [locks])

  const isMonthLocked = useCallback((billingMonth) => {
    if (!billingMonth) return false
    return Boolean(lockMap.get(billingMonth)?.isLocked)
  }, [lockMap])

  const getMonthLock = useCallback((billingMonth) => {
    if (!billingMonth) return null
    return lockMap.get(billingMonth) || null
  }, [lockMap])

  const lockMonth = useCallback(async ({ billingMonth, reason }) => {
    try {
      setSaving(true)
      setError('')
      const response = await lockBillingPeriod(scope, { billing_month: billingMonth, reason })
      await loadLocks()
      return { success: true, message: response?.message || 'Billing period locked successfully.' }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to lock billing period.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadLocks, scope])

  const unlockMonth = useCallback(async ({ billingMonth, reason }) => {
    try {
      setSaving(true)
      setError('')
      const response = await unlockBillingPeriod(scope, billingMonth, { reason })
      await loadLocks()
      return { success: true, message: response?.message || 'Billing period unlocked successfully.' }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to unlock billing period.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadLocks, scope])

  return {
    locks,
    activeLocks,
    loading,
    saving,
    error,
    loadLocks,
    isMonthLocked,
    getMonthLock,
    lockMonth,
    unlockMonth,
  }
}
