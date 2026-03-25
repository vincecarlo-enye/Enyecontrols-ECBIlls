import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAdminOmniPage, fetchAdminOmniPages, syncAdminOmniPage } from '../../services/adminService/adminUsageService'

function inferType(item) {
  const unit = String(item?.Unit || item?.unit || '').toLowerCase()
  const watch = String(item?.WatchName || item?.watch_name || '').toLowerCase()

  if (unit.includes('kwh') || watch.includes('electric')) return 'electricity'
  if (unit.includes('m³') || unit.includes('m3') || watch.includes('water')) return 'water'
  if (unit.includes('kbtu') || unit.includes('btu') || watch.includes('thermal')) return 'thermal'

  return 'other'
}

function numericValue(item) {
  const value = item?.Value ?? item?.value ?? 0
  return Number(value) || 0
}

export function useAdminUsageReports() {
  const [pages, setPages] = useState([])
  const [selectedPage, setSelectedPage] = useState('')
  const [pageData, setPageData] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')

  const loadPages = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetchAdminOmniPages()

      let rawPages = []

      if (Array.isArray(res?.data)) {
        rawPages = res.data
      } else if (Array.isArray(res?.data?.pages)) {
        rawPages = res.data.pages
      } else if (Array.isArray(res?.pages)) {
        rawPages = res.pages
      }

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
      return
    }

    try {
      setPageLoading(true)
      setError('')
      const res = await fetchAdminOmniPage(pageName)
      setPageData(Array.isArray(res?.data) ? res.data : [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load page usage data.')
      setPageData([])
    } finally {
      setPageLoading(false)
    }
  }, [])

  const syncPage = useCallback(async (pageName) => {
    try {
      setSyncing(true)
      setError('')
      const res = await syncAdminOmniPage(pageName)
      await loadPageData(pageName)
      return res
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to sync usage page.')
      throw err
    } finally {
      setSyncing(false)
    }
  }, [loadPageData])

  useEffect(() => {
    loadPages()
  }, [loadPages])

  useEffect(() => {
    if (selectedPage) {
      loadPageData(selectedPage)
    }
  }, [selectedPage, loadPageData])

  const grouped = useMemo(() => {
    const base = {
      electricity: [],
      water: [],
      thermal: [],
      other: [],
    }

    for (const item of pageData) {
      const type = inferType(item)
      base[type].push(item)
    }

    return base
  }, [pageData])

  const summaryCards = useMemo(() => {
    return [
      {
        key: 'electricity',
        label: 'Electricity',
        count: grouped.electricity.length,
        total: grouped.electricity.reduce((sum, item) => sum + numericValue(item), 0),
        unit: 'kWh',
      },
      {
        key: 'water',
        label: 'Water',
        count: grouped.water.length,
        total: grouped.water.reduce((sum, item) => sum + numericValue(item), 0),
        unit: 'm³',
      },
      {
        key: 'thermal',
        label: 'Thermal',
        count: grouped.thermal.length,
        total: grouped.thermal.reduce((sum, item) => sum + numericValue(item), 0),
        unit: 'kBTU/h',
      },
    ]
  }, [grouped])

  const chartData = useMemo(() => {
    return [
      {
        title: 'Electricity',
        color: '#f59e0b',
        data: grouped.electricity.map((item, index) => ({
          name: item?.WatchName || `Electric ${index + 1}`,
          value: numericValue(item),
        })),
      },
      {
        title: 'Water',
        color: '#06b6d4',
        data: grouped.water.map((item, index) => ({
          name: item?.WatchName || `Water ${index + 1}`,
          value: numericValue(item),
        })),
      },
      {
        title: 'Thermal',
        color: '#f43f5e',
        data: grouped.thermal.map((item, index) => ({
          name: item?.WatchName || `Thermal ${index + 1}`,
          value: numericValue(item),
        })),
      },
    ]
  }, [grouped])

  return {
    pages,
    selectedPage,
    setSelectedPage,
    pageData,
    loading,
    pageLoading,
    syncing,
    error,
    grouped,
    summaryCards,
    chartData,
    loadPages,
    loadPageData,
    syncPage,
  }
}
