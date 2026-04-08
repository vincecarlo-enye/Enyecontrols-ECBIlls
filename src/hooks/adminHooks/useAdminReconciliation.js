import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAdminReconciliation } from '@/services/adminService/adminReconciliationService'

function getCurrentMonthValue() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

function normalizeResponse(response) {
  const data = response?.data || response || {}

  return {
    period: data.period || {},
    meta: data.meta || {},
    summary: data.summary || {},
    monthlySeries: Array.isArray(data.monthly_series) ? data.monthly_series : [],
    pageBreakdown: Array.isArray(data.page_breakdown) ? data.page_breakdown : [],
  }
}

export function useAdminReconciliation() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue)
  const [data, setData] = useState({
    period: {},
    meta: {},
    summary: {},
    monthlySeries: [],
    pageBreakdown: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReconciliation = useCallback(async (month = selectedMonth) => {
    try {
      setLoading(true)
      setError('')
      const response = await fetchAdminReconciliation({ month })
      setData(normalizeResponse(response))
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load reconciliation data.')
      setData({
        period: {},
        meta: {},
        summary: {},
        monthlySeries: [],
        pageBreakdown: [],
      })
    } finally {
      setLoading(false)
    }
  }, [selectedMonth])

  useEffect(() => {
    loadReconciliation(selectedMonth)
  }, [selectedMonth, loadReconciliation])

  const utilityCards = useMemo(() => {
    const summary = data.summary || {}

    return [
      {
        key: 'electricity',
        label: 'Electricity',
        unit: summary.electricity?.unit || 'kWh',
        ...summary.electricity,
      },
      {
        key: 'water',
        label: 'Water',
        unit: summary.water?.unit || 'm3',
        ...summary.water,
      },
      {
        key: 'thermal',
        label: 'Thermal',
        unit: summary.thermal?.unit || 'kBTU',
        ...summary.thermal,
      },
    ]
  }, [data.summary])

  return {
    selectedMonth,
    setSelectedMonth,
    data,
    loading,
    error,
    utilityCards,
    reload: loadReconciliation,
  }
}
