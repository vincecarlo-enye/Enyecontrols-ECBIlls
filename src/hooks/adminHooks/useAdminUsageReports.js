import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchAdminOmniPage,
  fetchAdminOmniPages,
  syncAdminOmniPage,
} from '../../services/adminService/adminUsageService'

function normalizePages(response) {
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.data?.pages)) return response.data.pages
  if (Array.isArray(response?.pages)) return response.pages
  return []
}

function normalizeShowResponse(response) {
  return {
    currentData: Array.isArray(response?.data) ? response.data : [],
    dailyHistory: response?.daily_history ?? {
      electricity: [],
      water: [],
      thermal: [],
    },
    monthlyOverview: Array.isArray(response?.monthly_overview) ? response.monthly_overview : [],
  }
}

export function useAdminUsageReports() {
  const [pages, setPages] = useState([])
  const [selectedPage, setSelectedPage] = useState('')
  const [pageData, setPageData] = useState([])
  const [dailyHistory, setDailyHistory] = useState({
    electricity: [],
    water: [],
    thermal: [],
  })
  const [monthlyOverview, setMonthlyOverview] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')

  const loadPages = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetchAdminOmniPages()
      const rawPages = normalizePages(response)
      setPages(rawPages)

      const firstPage =
        rawPages?.[0]?.PageName ||
        rawPages?.[0]?.page_name ||
        rawPages?.[0]?.name ||
        ''

      if (firstPage) {
        setSelectedPage(firstPage)
      } else {
        setPageData([])
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load usage pages.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadPageData = useCallback(async (pageName) => {
    if (!pageName) {
      setPageData([])
      setDailyHistory({ electricity: [], water: [], thermal: [] })
      setMonthlyOverview([])
      return
    }

    try {
      setPageLoading(true)
      setError('')

      const response = await fetchAdminOmniPage(pageName)
      const normalized = normalizeShowResponse(response)
      setPageData(normalized.currentData)
      setDailyHistory(normalized.dailyHistory)
      setMonthlyOverview(normalized.monthlyOverview)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load page usage data.')
      setPageData([])
      setDailyHistory({ electricity: [], water: [], thermal: [] })
      setMonthlyOverview([])
    } finally {
      setPageLoading(false)
    }
  }, [])

  const syncPage = useCallback(
    async (pageName, options = {}) => {
      const { silent = false } = options

      try {
        setSyncing(true)
        if (!silent) {
          setError('')
        }

        const response = await syncAdminOmniPage(pageName)
        await loadPageData(pageName)
        return response
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to sync usage page.')
        throw err
      } finally {
        setSyncing(false)
      }
    },
    [loadPageData]
  )

  useEffect(() => {
    loadPages()
  }, [loadPages])

  useEffect(() => {
    if (!selectedPage) return

    syncPage(selectedPage, { silent: true }).catch(() => {
      loadPageData(selectedPage)
    })
  }, [selectedPage, loadPageData, syncPage])

  const summaryCards = useMemo(
    () => [
      {
        key: 'electricity',
        label: 'Electricity',
        total: dailyHistory.electricity.reduce((sum, item) => sum + Number(item?.usage || 0), 0),
        unit: 'kWh',
      },
      {
        key: 'water',
        label: 'Water',
        total: dailyHistory.water.reduce((sum, item) => sum + Number(item?.usage || 0), 0),
        unit: 'm3',
      },
      {
        key: 'thermal',
        label: 'Thermal',
        total: dailyHistory.thermal.reduce((sum, item) => sum + Number(item?.usage || 0), 0),
        unit: 'kBTU/h',
      },
    ],
    [dailyHistory]
  )

  const chartData = useMemo(
    () => [
      {
        title: 'Electricity',
        data: dailyHistory.electricity,
        key: 'usage',
        unit: 'kWh',
        color: '#f59e0b',
        grad: 'elecR',
      },
      {
        title: 'Water',
        data: dailyHistory.water,
        key: 'usage',
        unit: 'm3',
        color: '#06b6d4',
        grad: 'waterR',
      },
      {
        title: 'Thermal',
        data: dailyHistory.thermal,
        key: 'usage',
        unit: 'kBTU/h',
        color: '#f43f5e',
        grad: 'thermR',
      },
    ],
    [dailyHistory]
  )

  return {
    pages,
    selectedPage,
    setSelectedPage,
    pageData,
    dailyHistory,
    monthlyOverview,
    loading,
    pageLoading,
    syncing,
    error,
    summaryCards,
    chartData,
    loadPages,
    loadPageData,
    syncPage,
  }
}
