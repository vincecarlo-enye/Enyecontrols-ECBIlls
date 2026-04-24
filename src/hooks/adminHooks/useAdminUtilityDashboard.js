import { unwrapPayload } from '@/utils/apiUtils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchUtilityComparison, fetchUtilityDaily, fetchUtilitySummary, getUtilityComparisonSnapshot, getUtilityDailySnapshot, getUtilitySummarySnapshot } from '../../services/adminService/adminUtilityService'
import { badgeMeta, computeTrendPercent, normalizeSeries } from '../../utils/seriesUtils'


function normalizeSummaryCard(card = {}, fallbackUnit = '') {
  return {
    usage: Number(card?.usage ?? card?.value ?? 0),
    value: Number(card?.value ?? card?.usage ?? 0),
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

export function useAdminUtilityDashboard() {
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
      'mÂ³'
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
      comparison7DSnapshotData?.electric ?? comparison7DSnapshotData?.electricity ?? dailySnapshotData?.electric ?? dailySnapshotData?.electricity ?? []
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

  const loadUtilityDashboard = useCallback(async () => {
    try {
      setLoading((current) => current || (!hasHydratedSummary && !hasHydratedDaily))
      setError('')

      const [summaryRes, dailyRes] = await Promise.all([
        fetchUtilitySummary(),
        fetchUtilityDaily(),
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
          'm³'
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
  }, [])

  const ensureComparisonRange = useCallback(async (range) => {
    if (!range || range === '7D' || loadedComparisonRanges.has(range)) return

    try {
      const response = await fetchUtilityComparison(range)
      applyComparisonRange(range, response)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load utility comparison data.')
    }
  }, [applyComparisonRange, loadedComparisonRanges])

  useEffect(() => {
    loadUtilityDashboard()
  }, [loadUtilityDashboard])

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
    error,
    refreshUtilities: loadUtilityDashboard,
    ensureComparisonRange,
  }
}
