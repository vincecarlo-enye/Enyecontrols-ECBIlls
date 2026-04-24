import { normalizeResponse } from './utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAdminReconciliation, getAdminReconciliationSnapshot } from '@/services/adminService/adminReconciliationService'

function getCurrentMonthValue() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

function normalizeReconciliationResponse(response) {
  const data = normalizeResponse(response)

  return {
    period: data.period || {},
    meta: data.meta || {},
    summary: data.summary || {},
    monthlySeries: data.monthlySeries || data.monthly_series || [],
    pageBreakdown: data.pageBreakdown || data.page_breakdown || [],
  }
}

export function useAdminReconciliation() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue)
  const initialSnapshot = getAdminReconciliationSnapshot({ month: getCurrentMonthValue() })
  const hasInitialSnapshot = initialSnapshot != null
  const [data, setData] = useState(() => normalizeReconciliationResponse(initialSnapshot))
  const [loading, setLoading] = useState(!hasInitialSnapshot)
  const [error, setError] = useState('')

  const loadReconciliation = useCallback(async (month = selectedMonth) => {
    try {
      setLoading((current) => current || !hasInitialSnapshot)
      setError('')
      const response = await fetchAdminReconciliation({ month })
      setData(normalizeReconciliationResponse(response))
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
  }, [hasInitialSnapshot, selectedMonth])

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
