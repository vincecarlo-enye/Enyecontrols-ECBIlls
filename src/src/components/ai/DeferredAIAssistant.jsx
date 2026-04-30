import { lazy, Suspense, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const LazyAIAssistant = lazy(() => import('@/components/ai/AIAssistant'))

export default function DeferredAIAssistant() {
  const location = useLocation()
  const { isAuthenticated, loading } = useAuth()
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (loading || !isAuthenticated || location.pathname === '/login') {
      setShouldLoad(false)
      return
    }

    let cancelled = false

    const enableAssistant = () => {
      if (!cancelled) {
        setShouldLoad(true)
      }
    }

    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(enableAssistant, { timeout: 2000 })
      return () => {
        cancelled = true
        window.cancelIdleCallback?.(idleId)
      }
    }

    const timeoutId = window.setTimeout(enableAssistant, 800)
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [isAuthenticated, loading, location.pathname])

  if (!shouldLoad) return null

  return (
    <Suspense fallback={null}>
      <LazyAIAssistant />
    </Suspense>
  )
}
