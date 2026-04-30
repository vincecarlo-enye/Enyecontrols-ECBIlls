import { useCallback, useEffect, useState } from 'react'
import { fetchRateHistory, getRateHistorySnapshot } from '@/services/common/rateHistoryService'

export function useRateHistory() {
  const initialHistory = getRateHistorySnapshot() || []
  const [history, setHistory] = useState(initialHistory)
  const [loading, setLoading] = useState(initialHistory.length === 0)
  const [error, setError] = useState('')

  const loadHistory = useCallback(async () => {
    setLoading((current) => current || history.length === 0)
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
