export function safeUsageAt(series = [], index = 0) {
  return Number(series?.[index]?.usage ?? 0)
}

function getSeriesLabel(entry = {}, fallbackLabel = '') {
  return (
    entry?.label ||
    entry?.day ||
    entry?.date ||
    fallbackLabel
  )
}

function getSeriesKey(entry = {}, fallbackLabel = '') {
  if (entry?.date) return `date:${entry.date}`

  const label = getSeriesLabel(entry, fallbackLabel)
  return label ? `label:${label}` : ''
}

export function computeUsageTrend(rows = []) {
  if (!Array.isArray(rows) || rows.length < 2) return 0

  const last = Number(rows[rows.length - 1]?.value ?? 0)
  const prev = Number(rows[rows.length - 2]?.value ?? 0)

  if (prev === 0) {
    if (last === 0) return 0
    return 100
  }

  return Number((((last - prev) / prev) * 100).toFixed(1))
}

export function buildUtilityComparisonRows(filter, electric = [], water = [], thermal = []) {
  const targetLength = Math.max(
    electric.length,
    water.length,
    thermal.length,
    filter === '1Y' ? 12 : filter === '1M' ? 4 : 7
  )
  const fallbackLabel = (index) => (
    filter === '1Y' ? `M${index + 1}` : filter === '1M' ? `Week ${index + 1}` : `Day ${index + 1}`
  )
  const rowMap = new Map()
  const orderedKeys = []

  const ensureRow = (entry, index) => {
    const label = getSeriesLabel(entry, fallbackLabel(index))
    const key = getSeriesKey(entry, fallbackLabel(index)) || `fallback:${index}`

    if (!rowMap.has(key)) {
      rowMap.set(key, {
        key,
        label,
        sortDate: entry?.date ? new Date(entry.date).getTime() : Number.NaN,
        order: orderedKeys.length,
        electricity: 0,
        water: 0,
        thermal: 0,
      })
      orderedKeys.push(key)
    }

    const row = rowMap.get(key)
    if ((!row.label || row.label === fallbackLabel(index)) && label) {
      row.label = label
    }
    if (!Number.isFinite(row.sortDate) && entry?.date) {
      row.sortDate = new Date(entry.date).getTime()
    }

    return row
  }

  electric.forEach((entry, index) => {
    ensureRow(entry, index).electricity = Number(entry?.usage ?? 0)
  })
  water.forEach((entry, index) => {
    ensureRow(entry, index).water = Number(entry?.usage ?? 0)
  })
  thermal.forEach((entry, index) => {
    ensureRow(entry, index).thermal = Number(entry?.usage ?? 0)
  })

  const rows = orderedKeys.map((key) => rowMap.get(key))
  rows.sort((left, right) => {
    const leftHasDate = Number.isFinite(left.sortDate)
    const rightHasDate = Number.isFinite(right.sortDate)
    if (leftHasDate && rightHasDate && left.sortDate !== right.sortDate) {
      return left.sortDate - right.sortDate
    }
    if (leftHasDate !== rightHasDate) {
      return leftHasDate ? -1 : 1
    }
    return left.order - right.order
  })

  while (rows.length < targetLength) {
    const index = rows.length
    rows.push({
      label: fallbackLabel(index),
      electricity: 0,
      water: 0,
      thermal: 0,
    })
  }

  return rows.slice(0, targetLength).map(({ label, electricity, water, thermal }) => ({
    label,
    electricity,
    water,
    thermal,
  }))
}

export function normalizeDashboardBillStatus(status) {
  const normalized = String(status || '').toLowerCase()

  if (normalized === 'unpaid') return 'published'
  if (normalized === 'pending' || normalized === 'payment_submitted' || normalized === 'submitted') {
    return 'submitted'
  }

  return normalized
}

export function getBillingStatusCounts(bills = []) {
  return bills.reduce((acc, bill) => {
    const status = normalizeDashboardBillStatus(bill?.status)

    if (status === 'paid') acc.paid += 1
    else if (status === 'submitted') acc.submitted += 1
    else if (status === 'overdue') acc.overdue += 1
    else if (['published', 'pending', 'partial', 'draft'].includes(status)) acc.open += 1

    return acc
  }, {
    paid: 0,
    open: 0,
    overdue: 0,
    submitted: 0,
  })
}

export function getPaymentReviewCounts(payments = []) {
  return payments.reduce((acc, payment) => {
    const status = String(payment?.status || '').toLowerCase()

    if (status === 'pending') acc.pending += 1
    else if (status === 'verified') acc.verified += 1
    else if (status === 'rejected') acc.rejected += 1

    return acc
  }, {
    pending: 0,
    verified: 0,
    rejected: 0,
  })
}
