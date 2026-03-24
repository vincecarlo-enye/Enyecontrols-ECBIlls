/**
 * hooks/usePageLoader.js
 * Simulates backend data loading for frontend-only mode.
 *
 * Usage:
 *   const loading = usePageLoader()
 *   if (loading) return <MySkeleton />
 *
 * Options:
 *   delay  – ms to wait before resolving (default: 700)
 *
 * The delay is intentionally short to feel snappy while still letting
 * the skeleton flash visibly. When a real API is wired up, replace
 * this hook with actual async fetch state.
 */
import { useState, useEffect } from 'react'

export function usePageLoader(delay = 700) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return loading
}
