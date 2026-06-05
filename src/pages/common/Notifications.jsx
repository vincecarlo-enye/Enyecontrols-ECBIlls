import { formatDate } from '@/utils/filterUtils'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, CheckCheck, Clock3, RefreshCw } from 'lucide-react'
import { fetchNotification, fetchNotifications, getNotificationsSnapshot, markNotificationAsRead, markAllNotificationsAsRead } from '@/services/notificationService'
import { usePageLoader } from '@/hooks/usePageLoader'
import { LoadingValue, UpdatingBadge } from '@/components/common/InlineLoadingState'
import PaginationBar from '@/components/common/PaginationBar'


const DEFAULT_PER_PAGE = 10
const DEFAULT_META = {
  current_page: 1,
  per_page: DEFAULT_PER_PAGE,
  total: 0,
  last_page: 1,
  from: 0,
  to: 0,
}

export default function NotificationsPage() {
  const location = useLocation()
  const pageLoading = usePageLoader(120)
  const initialSnapshot = getNotificationsSnapshot({ page: 1, per_page: DEFAULT_PER_PAGE })
  const hasInitialSnapshot = initialSnapshot != null
  const initialNotifications = Array.isArray(initialSnapshot?.data) ? initialSnapshot.data : []
  const initialSelectedId = location.state?.selectedNotificationId ?? initialNotifications[0]?.id ?? null
  const initialSelected = initialNotifications.find((item) => item.id === initialSelectedId) || null
  const [notifications, setNotifications] = useState(initialNotifications)
  const [selectedId, setSelectedId] = useState(null)
  const [selected, setSelected] = useState(initialSelected)
  const [loading, setLoading] = useState(!hasInitialSnapshot)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE)
  const [meta, setMeta] = useState(initialSnapshot?.meta || DEFAULT_META)
  const preselectedId = location.state?.selectedNotificationId ?? null
  const isInitialLoading = (pageLoading || loading) && notifications.length === 0 && !error
  const isRefreshing = !isInitialLoading && (loading || detailLoading)

  useEffect(() => {
    if (initialSelectedId) {
      setSelectedId(initialSelectedId)
    }
  }, [initialSelectedId])

  const loadNotifications = async (nextPage = page, nextPerPage = perPage) => {
    try {
      setLoading((current) => current || (!hasInitialSnapshot && nextPage === 1 && nextPerPage === DEFAULT_PER_PAGE))
      setError('')
      const res = await fetchNotifications({ page: nextPage, per_page: nextPerPage })
      const rows = Array.isArray(res?.data) ? res.data : []
      setNotifications(rows)
      setMeta(res?.meta || {
        ...DEFAULT_META,
        current_page: nextPage,
        per_page: nextPerPage,
      })

      if (preselectedId && rows.some((item) => item.id === preselectedId)) {
        setSelectedId(preselectedId)
        setSelected(rows.find((item) => item.id === preselectedId) || null)
      } else if (!rows.some((item) => item.id === selectedId)) {
        setSelectedId(rows[0]?.id || null)
        setSelected(rows[0] || null)
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load notifications.')
      setNotifications([])
      setMeta(DEFAULT_META)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications(page, perPage)
  }, [page, perPage])

  useEffect(() => {
    if (!selectedId) {
      setSelected(null)
      return
    }

    let cancelled = false

    const loadDetail = async () => {
      try {
        setDetailLoading(true)
        const fallback = notifications.find((item) => item.id === selectedId) || null
        if (fallback) {
          setSelected(fallback)
        }
        const res = await fetchNotification(selectedId)
        if (cancelled) return

        const detail = res?.data || null
        setSelected(detail)
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === selectedId ? { ...item, is_read: true } : item
          )
        )
      } catch {
        if (!cancelled) {
          const fallback = notifications.find((item) => item.id === selectedId) || null
          setSelected(fallback)
        }
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    }

    loadDetail()
    return () => {
      cancelled = true
    }
  }, [selectedId])

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications]
  )

  const handleMarkAllRead = async () => {
    if (markingAllRead || unreadCount === 0) return

    // Optimistic update
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })))

    try {
      setMarkingAllRead(true)
      await markAllNotificationsAsRead(notifications)
    } catch {
      // Keep optimistic state — partial reads are acceptable
    } finally {
      setMarkingAllRead(false)
    }
  }

  const handleSelect = async (notification) => {
    setSelectedId(notification.id)
    setSelected(notification)

    if (!notification.is_read) {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item
        )
      )

      try {
        await markNotificationAsRead(notification.id)
      } catch {}
    }
  }

  return (
    <div className="space-y-5 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-700 text-xl text-slate-800 dark:text-white">
            Notifications
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Read complete notification details and recent system updates
          </p>
        </div>

        <div className="flex items-center gap-2 w-full">
  <UpdatingBadge show={isRefreshing} />

  <div className="ml-auto flex items-center gap-2">
    

    <button
      onClick={() => loadNotifications(page, perPage)}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
    >
      <RefreshCw className="w-4 h-4" />
      <span className="hidden sm:inline">Refresh</span>
    </button>
  </div>
</div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800/50 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 shadow-md overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
  
  {/* Top row */}
  <div className="flex items-center">
    <p className="font-semibold text-[14px] text-slate-800 dark:text-white">
      Recent Notifications
    </p>

    <div className="ml-auto flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40">
        <CheckCheck className="w-4 h-4 text-blue-500" />
        <LoadingValue
          loading={isInitialLoading}
          updating={isRefreshing}
          value={`${unreadCount} unread`}
          className="text-xs font-semibold text-blue-700 dark:text-blue-300"
          spinnerClassName="h-4 w-4 text-blue-500"
        />
      </div>

      {unreadCount > 0 && (
        <button
          onClick={handleMarkAllRead}
          disabled={markingAllRead}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <CheckCheck className="w-4 h-4" />
          {markingAllRead ? 'Marking...' : 'Read All'}
        </button>
      )}
    </div>
  </div>

  {/* Bottom row */}
  <p className="text-xs text-slate-400 mt-0.5">
    {meta.total || notifications.length} total notifications
  </p>
</div>

          {isInitialLoading ? (
            <div className="px-5 py-12 text-center text-sm text-slate-400">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-400">
              No notifications found.
            </div>
          ) : (
            <>
              <div className="max-h-[70vh] overflow-y-auto">
                {notifications.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      selectedId === item.id ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        {item.title}
                      </p>
                      {!item.is_read ? (
                        <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {item.message}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2">
                      {formatDate(item.created_at)}
                    </p>
                  </button>
                ))}
              </div>

              <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700">
                <PaginationBar
                  meta={meta}
                  page={page}
                  perPage={perPage}
                  onPageChange={setPage}
                  onPerPageChange={(value) => {
                    setPerPage(value)
                    setPage(1)
                  }}
                />
              </div>
            </>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 shadow-md overflow-hidden min-h-[420px]">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-500" />
              <p className="font-semibold text-[14px] text-slate-800 dark:text-white">
                Notification Details
              </p>
            </div>
          </div>

          {!selectedId ? (
            <div className="px-6 py-16 text-center text-sm text-slate-400">
              Select a notification to view the full message.
            </div>
          ) : detailLoading ? (
            <div className="px-6 py-16 text-center text-sm text-slate-400">
              Loading notification details...
            </div>
          ) : (
            <div className="px-6 py-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  {selected?.title || 'Notification'}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="w-3.5 h-3.5" />
                    {formatDate(selected?.created_at)}
                  </span>
                  {selected?.created_by ? (
                    <span>By {selected.created_by}</span>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 px-5 py-4">
                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 dark:text-slate-300">
                  {selected?.message || 'No message available.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}