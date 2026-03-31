/**
 * hooks/usePageLoader.js
 * Lightweight helper for short skeleton flashes only.
 *
 * Many pages now use real API loading state, so this helper is clamped
 * to a very small delay to avoid doubling perceived wait time.
 */
import { useState, useEffect } from 'react'

export function usePageLoader() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setLoading(false))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  return loading
}
