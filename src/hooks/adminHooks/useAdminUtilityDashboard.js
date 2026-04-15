import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchUtilityDaily, fetchUtilitySummary } from '../../services/adminService/adminUtilityService'

function normalizeSeries(rows = []) {
  return rows.map((item, index) => ({
    day: item.day || item.label || item.date || `Day ${index + 1}`,
    date: item.date || null,
    usage: Number(item.usage ?? item.value ?? item.total ?? 0),
  }))
}

function computeTrendPercent(series = []) {
  if (!Array.isArray(series) || series.length < 2) return 0

  const last = Number(series[series.length - 1]?.usage ?? 0)
  const prev = Number(series[series.length - 2]?.usage ?? 0)

  if (prev === 0) {
    if (last === 0) return 0
    return 100
  }

  return Number((((last - prev) / prev) * 100).toFixed(1))
}

function badgeMeta(value, positiveClass, negativeClass) {
  const sign = value > 0 ? '+' : ''
  return {
    text: `${sign}${value}%`,
    className: value >= 0 ? positiveClass : negativeClass,
  }
}

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
  const [summary, setSummary] = useState({
    electric: {},
    water: {},
    thermal: {},
  })

  const [daily, setDaily] = useState({
    electric: [],
    water: [],
    thermal: [],
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadUtilityDashboard = useCallback(async (options = {}) => {
    const { silent = false } = options

    try {
      if (!silent) {
        setLoading(true)
      }
      setError('')

      const [summaryRes, dailyRes] = await Promise.all([
        fetchUtilitySummary(),
        fetchUtilityDaily(),
      ])

      setSummary({
        electric: normalizeSummaryCard(
          summaryRes?.data?.electric ?? summaryRes?.data?.electricity ?? {},
          'kWh'
        ),
        water: normalizeSummaryCard(
          summaryRes?.data?.water ?? {},
          'm³'
        ),
        thermal: normalizeSummaryCard(
          summaryRes?.data?.thermal ?? {},
          'kBUTh'
        ),
      })

      setDaily({
        electric: normalizeSeries(
          dailyRes?.data?.electric ?? dailyRes?.data?.electricity ?? []
        ),
        water: normalizeSeries(dailyRes?.data?.water ?? []),
        thermal: normalizeSeries(dailyRes?.data?.thermal ?? []),
      })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load utility data.')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

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
    trends,
    loading,
    error,
    refreshUtilities: loadUtilityDashboard,
  }
}
