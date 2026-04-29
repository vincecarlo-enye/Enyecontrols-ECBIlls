function normalizeUtilityType(type) {
  const value = String(type || '').toLowerCase()

  if (value === 'electric' || value === 'electricity') return 'electricity'
  if (value === 'water') return 'water'
  if (value === 'thermal') return 'thermal'

  return value
}

export function getUtilityRate(rates, type) {
  const key = normalizeUtilityType(type)

  if (!rates || !key) return 0

  return Number(
    rates?.[key]?.rate ??
    (key === 'electricity' ? rates?.electric?.rate : 0) ??
    0
  )
}

export function buildUtilityCardMetric({
  type,
  usage = 0,
  unit = '',
  trend = 0,
  rates = null,
  fallbackCurrentRate = 0,
  fallbackEstimatedCost = 0,
  series = [],
}) {
  const safeUsage = Number(usage || 0)
  const appliedRate = getUtilityRate(rates, type) || Number(fallbackCurrentRate || 0)
  const rateBasedEstimatedCost = safeUsage * appliedRate

  return {
    usage: safeUsage,
    unit,
    trend: Number(trend || 0),
    estimatedCost: safeUsage > 0 && appliedRate > 0
      ? Number(rateBasedEstimatedCost.toFixed(2))
      : Number(fallbackEstimatedCost || 0),
    currentRate: appliedRate,
    series: Array.isArray(series) ? series : [],
  }
}
