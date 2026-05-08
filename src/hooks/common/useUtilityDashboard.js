/**
 * useUtilityDashboard.js
 *
 * Shared utility dashboard hook for admin, super_admin, and finance roles.
 * All roles see the same meter consumption data — there is no role-specific
 * filtering at the meter reading level.
 *
 * Drop-in replacement for useAdminUtilityDashboard and useFinanceUtilityDashboard.
 * Both of those now re-export this hook for backwards compatibility.
 */

import { unwrapPayload } from '@/utils/apiUtils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchSharedUtilityComparison,
  fetchSharedUtilityDaily,
  fetchSharedUtilitySummary,
  getUtilityComparisonSnapshot,
  getUtilityDailySnapshot,
  getUtilitySummarySnapshot,
} from '@/services/common/utilityDashboardService'
import { badgeMeta, computeTrendPercent, normalizeSeries } from '@/utils/seriesUtils'

function normalizeSummaryCard(card = {}, fallbackUnit = '') {
  return {
    usage: Number(card?.usage ?? card?.value ?? 0),
    value: Number(card?.value ?? card?.usage ?? 0),
    periodConsumption: Number(card?.period_consumption ?? card?.usage ?? card?.value ?? 0),
    currentReading: card?.current_reading ?? card?.currentReading ?? null,
    unit: card?.unit ?? fallbackUnit,
    estimatedCost: Number(card?.estimatedCost ?? card?.cost ?? 0),
    cost: Number(card?.cost ?? card?.estimatedCost ?? 0),
    trend: Number(card?.trend ?? card?.delta ?? 0),
    delta: Number(card?.delta ?? card?.trend ?? 0),
    lastUpdated: card?.lastUpdated ?? card?.period ?? 'Last 7 days',
    period: card?.period ?? card?.lastUpdated ?? 'Last 7 days',
    watchName: card?.watchName ?? '',
    rate: Number(card?.rate ?? 0),
    rateName: card?.rateName ?? '',
  }
}

export function useUtilityDashboard() {
  const summarySnapshot = getUtilitySummarySnapshot()
  const dailySnapshot = getUtilityDailySnapshot()
  const comparison7DSnapshot = getUtilityComparisonSnapshot('7D')
  const hasHydratedSummary = Boolean(summarySnapshot)
  const hasHydratedDaily = Boolean(dailySnapshot)
  const summarySnapshotData = unwrapPayload(summarySnapshot)
  const dailySnapshotData = unwrapPayload(dailySnapshot)
  const comparison7DSnapshotData = unwrapPayload(comparison7DSnapshot)

  const initialSummary = {
    electric: normalizeSummaryCard(
      summarySnapshotData?.electric ?? summarySnapshotData?.electricity ?? {},
      'kWh'
    ),
    water: normalizeSummaryCard(
      summarySnapshotData?.water ?? {},
      'm3'
    ),
    thermal: normalizeSummaryCard(
      summarySnapshotData?.thermal ?? {},
      'kBTU'
    ),
  }

  const initialDaily = {
    electric: normalizeSeries(
      dailySnapshotData?.electric ?? dailySnapshotData?.electricity ?? []
    ),
    water: normalizeSeries(dailySnapshotData?.water ?? []),
    thermal: normalizeSeries(dailySnapshotData?.thermal ?? []),
  }

  const initialComparison7D = {
    electric: normalizeSeries(
      comparison7DSnapshotData?.electric ?? comparison7DSnapshotData?.electricity ??
      dailySnapshotData?.electric ?? dailySnapshotData?.electricity ?? []
    ),
    water: normalizeSeries(comparison7DSnapshotData?.water ?? dailySnapshotData?.water ?? []),
    thermal: normalizeSeries(comparison7DSnapshotData?.thermal ?? dailySnapshotData?.thermal ?? []),
  }

  const [summary, setSummary] = useState(initialSummary)
  const [daily, setDaily] = useState(initialDaily)
  const [comparison, setComparison] = useState({
    '7D': initialComparison7D,
    '1M': { electric: [], water: [], thermal: [] },
    '1Y': { electric: [], water: [], thermal: [] },
  })
  const [loadedComparisonRanges, setLoadedComparisonRanges] = useState(
    () => new Set(comparison7DSnapshot || dailySnapshot ? ['7D'] : [])
  )

  const [loading, setLoading] = useState(!(hasHydratedSummary && hasHydratedDaily))
  const [comparisonLoadingRanges, setComparisonLoadingRanges] = useState(() => new Set())
  const [error, setError] = useState('')

  const applyComparisonRange = useCallback((range, response) => {
    const payload = unwrapPayload(response)
    const normalized = {
      electric: normalizeSeries(payload?.electric ?? payload?.electricity ?? []),
      water: normalizeSeries(payload?.water ?? []),
      thermal: normalizeSeries(payload?.thermal ?? []),
    }

    setComparison((prev) => ({
      ...prev,
      [range]: normalized,
    }))
    setLoadedComparisonRanges((prev) => {
      const next = new Set(prev)
      next.add(range)
      return next
    })

    return normalized
  }, [])

  const loadUtilityDashboard = useCallback(async (options = {}) => {
    try {
      setLoading((current) => current || (!hasHydratedSummary && !hasHydratedDaily))
      setError('')

      const [summaryRes, dailyRes] = await Promise.all([
        fetchSharedUtilitySummary(options),
        fetchSharedUtilityDaily(options),
      ])
      const summaryPayload = unwrapPayload(summaryRes)
      const dailyPayload = unwrapPayload(dailyRes)

      setSummary({
        electric: normalizeSummaryCard(
          summaryPayload?.electric ?? summaryPayload?.electricity ?? {},
          'kWh'
        ),
        water: normalizeSummaryCard(
          summaryPayload?.water ?? {},
          'm3'
        ),
        thermal: normalizeSummaryCard(
          summaryPayload?.thermal ?? {},
          'kBTU'
        ),
      })

      setDaily({
        electric: normalizeSeries(
          dailyPayload?.electric ?? dailyPayload?.electricity ?? []
        ),
        water: normalizeSeries(dailyPayload?.water ?? []),
        thermal: normalizeSeries(dailyPayload?.thermal ?? []),
      })

      setComparison((prev) => ({
        ...prev,
        '7D': {
          electric: normalizeSeries(dailyPayload?.electric ?? dailyPayload?.electricity ?? []),
          water: normalizeSeries(dailyPayload?.water ?? []),
          thermal: normalizeSeries(dailyPayload?.thermal ?? []),
        },
      }))
      setLoadedComparisonRanges(new Set(['7D']))
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load utility data.')
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const ensureComparisonRange = useCallback(async (range, options = {}) => {
    if (!range || range === '7D') return
    if (!options.force && loadedComparisonRanges.has(range)) return

    try {
      setLoading(true)
      setComparisonLoadingRanges((prev) => {
        const next = new Set(prev)
        next.add(range)
        return next
      })
      const response = await fetchSharedUtilityComparison(range, options)
      applyComparisonRange(range, response)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load utility comparison data.')
    } finally {
      setComparisonLoadingRanges((prev) => {
        const next = new Set(prev)
        next.delete(range)
        return next
      })
      setLoading(false)
    }
  }, [applyComparisonRange, loadedComparisonRanges])

  useEffect(() => {
    loadUtilityDashboard({ force: true })
  }, [loadUtilityDashboard])

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== 'visible') return
      loadUtilityDashboard({ force: true })
      for (const range of loadedComparisonRanges) {
        if (range !== '7D') ensureComparisonRange(range, { force: true })
      }
    }

    const interval = window.setInterval(refresh, 60000)
    return () => window.clearInterval(interval)
  }, [ensureComparisonRange, loadedComparisonRanges, loadUtilityDashboard])

  const trends = useMemo(() => {
    const electric = computeTrendPercent(daily.electric)
    const water = computeTrendPercent(daily.water)
    const thermal = computeTrendPercent(daily.thermal)

    return {
      electric,
      water,
      thermal,
      electricBadge: badgeMeta(
        electric,
        'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 font-mono text-[10px]',
        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-mono text-[10px]'
      ),
      waterBadge: badgeMeta(
        water,
        'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400 font-mono text-[10px]',
        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-mono text-[10px]'
      ),
      thermalBadge: badgeMeta(
        thermal,
        'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 font-mono text-[10px]',
        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-mono text-[10px]'
      ),
    }
  }, [daily])

  return {
    summary,
    daily,
    comparison,
    trends,
    loading,
    comparisonLoadingRanges,
    error,
    refreshUtilities: loadUtilityDashboard,
    ensureComparisonRange,
  }
}
