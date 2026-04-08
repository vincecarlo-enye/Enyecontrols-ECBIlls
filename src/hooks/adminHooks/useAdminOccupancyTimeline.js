import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAdminOccupancyTimeline } from '@/services/adminService/adminOccupancyTimelineService'

function getCurrentMonthValue() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

function normalizeResponse(response) {
  const data = response?.data || response || {}

  return {
    period: data.period || {},
    summary: data.summary || {},
    monthlyActivity: Array.isArray(data.monthly_activity) ? data.monthly_activity : [],
    timeline: Array.isArray(data.timeline) ? data.timeline : [],
    unitSnapshot: Array.isArray(data.unit_snapshot) ? data.unit_snapshot : [],
  }
}

export function useAdminOccupancyTimeline() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue)
  const [data, setData] = useState({
    period: {},
    summary: {},
    monthlyActivity: [],
    timeline: [],
    unitSnapshot: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTimeline = useCallback(async (month = selectedMonth) => {
    try {
      setLoading(true)
      setError('')
      const response = await fetchAdminOccupancyTimeline({ month })
      setData(normalizeResponse(response))
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load occupancy timeline.')
      setData({
        period: {},
        summary: {},
        monthlyActivity: [],
        timeline: [],
        unitSnapshot: [],
      })
    } finally {
      setLoading(false)
    }
  }, [selectedMonth])

  useEffect(() => {
    loadTimeline(selectedMonth)
  }, [selectedMonth, loadTimeline])

  const summaryCards = useMemo(() => ([
    {
      key: 'active_occupancies',
      label: 'Active Occupancies',
      value: Number(data.summary?.active_occupancies || 0),
      tone: 'blue',
      sub: 'Occupied unit records active by month end',
    },
    {
      key: 'active_tenant_users',
      label: 'Active Tenant Users',
      value: Number(data.summary?.active_tenant_users || 0),
      tone: 'emerald',
      sub: 'Distinct tenant users with active occupancy',
    },
    {
      key: 'move_ins',
      label: 'Move-Ins',
      value: Number(data.summary?.move_ins || 0),
      tone: 'amber',
      sub: 'Recorded move-ins during the selected month',
    },
    {
      key: 'move_outs',
      label: 'Move-Outs',
      value: Number(data.summary?.move_outs || 0),
      tone: 'rose',
      sub: 'Recorded move-outs during the selected month',
    },
    {
      key: 'multi_unit_users',
      label: 'Multi-Unit Users',
      value: Number(data.summary?.multi_unit_users || 0),
      tone: 'violet',
      sub: 'Tenant users occupying multiple units',
    },
  ]), [data.summary])

  return {
    selectedMonth,
    setSelectedMonth,
    data,
    loading,
    error,
    summaryCards,
    reload: loadTimeline,
  }
}
