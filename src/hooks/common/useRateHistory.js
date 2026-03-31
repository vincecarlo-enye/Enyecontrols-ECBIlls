import { useCallback, useEffect, useState } from 'react'
import { fetchRateHistory } from '@/services/common/rateHistoryService'

export function useRateHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const rows = await fetchRateHistory()
      setHistory(rows)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load rate history.')
      setHistory([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  return {
    history,
    loading,
    error,
    reload: loadHistory,
  }
}
