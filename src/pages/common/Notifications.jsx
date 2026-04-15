import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, CheckCheck, Clock3, RefreshCw, Search } from 'lucide-react'
import {
  fetchNotification,
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/notificationService'
import { usePageLoader } from '@/hooks/usePageLoader'
import { ReportsSkeleton } from '@/components/skeletons'
import PaginationBar from '@/components/common/PaginationBar'
import PageSection, { PageHeader } from '@/components/layout/PageSection'
import SummaryCardStrip from '@/components/dashboard/SummaryCardStrip'

function formatDate(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const DEFAULT_PER_PAGE = 10
const DEFAULT_META = {
  current_page: 1,
  per_page: DEFAULT_PER_PAGE,
  total: 0,
  last_page: 1,
  from: 0,
  to: 0,
}

const DEFAULT_SUMMARY = {
  total: 0,
  unread: 0,
  read: 0,
}

export default function NotificationsPage() {
  const location = useLocation()
  const pageLoading = usePageLoader(120)
  const [notifications, setNotifications] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE)
  const [meta, setMeta] = useState(DEFAULT_META)
  const [summary, setSummary] = useState(DEFAULT_SUMMARY)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const preselectedId = location.state?.selectedNotificationId ?? null

  const loadNotifications = async (nextPage = page, nextPerPage = perPage) => {
    try {
      setLoading(true)
      setError('')
      const res = await fetchNotifications({
        page: nextPage,
        per_page: nextPerPage,
        status: statusFilter,
        search: search || undefined,
      })
      const rows = Array.isArray(res?.data) ? res.data : []
      setNotifications(rows)
      setMeta(res?.meta || {
        ...DEFAULT_META,
        current_page: nextPage,
        per_page: nextPerPage,
      })
      setSummary(res?.summary || DEFAULT_SUMMARY)

      if (preselectedId && rows.some((item) => item.id === preselectedId)) {
        setSelectedId(preselectedId)
      } else if (!rows.some((item) => item.id === selectedId)) {
        setSelectedId(rows[0]?.id || null)
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load notifications.')
      setNotifications([])
      setMeta(DEFAULT_META)
      setSummary(DEFAULT_SUMMARY)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications(page, perPage)
  }, [page, perPage, statusFilter, search])

  useEffect(() => {
    if (!selectedId) {
      setSelected(null)
      return
    }

    let cancelled = false

    const loadDetail = async () => {
      try {
        setDetailLoading(true)
        const wasUnread = notifications.some((item) => item.id === selectedId && !item.is_read)
        const res = await fetchNotification(selectedId)
        if (cancelled) return

        const detail = res?.data || null
        setSelected(detail)
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === selectedId ? { ...item, is_read: true } : item
          )
        )
        if (wasUnread) {
          setSummary((prev) => ({
            ...prev,
            unread: Math.max(Number(prev.unread || 0) - 1, 0),
            read: Number(prev.read || 0) + 1,
          }))
        }
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

  const unreadOnPageCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications]
  )

  const handleSelect = async (notification) => {
    setSelectedId(notification.id)

    if (!notification.is_read) {
      const wasUnread = !notification.is_read
      try {
        await markNotificationAsRead(notification.id)
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item
          )
        )
        if (wasUnread) {
          setSummary((prev) => ({
            ...prev,
            unread: Math.max(Number(prev.unread || 0) - 1, 0),
            read: Number(prev.read || 0) + 1,
          }))
        }
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Failed to mark notification as read.')
      }
    }
  }

  const handleReadAll = async () => {
    if (summary.unread === 0) return

    try {
      await markAllNotificationsAsRead()
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })))
      if (selected) {
        setSelected((prev) => (prev ? { ...prev, is_read: true } : prev))
      }
      await loadNotifications(page, perPage)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to mark all notifications as read.')
    }
  }

  const handleSearch = (event) => {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  if (pageLoading || loading) {
    return <ReportsSkeleton />
  }

  return (
    <div className="space-y-5 animate-in">
      <PageSection>
        <PageHeader
          title="Notifications"
          subtitle="Read complete notification details and filter updates by unread status or keywords."
          icon={Bell}
          actions={(
            <>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40">
                <CheckCheck className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {summary.unread} unread total
                </span>
              </div>
              <button
                onClick={handleReadAll}
                disabled={summary.unread === 0}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCheck className="w-4 h-4" />
                Read All
              </button>
              <button
                onClick={() => loadNotifications(page, perPage)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </>
          )}
        />
      </PageSection>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800/50 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <SummaryCardStrip
        stretch
        cards={[
          {
            title: 'Total Notifications',
            value: summary.total,
            sub: 'Available in your inbox',
            gradient: 'from-slate-500/15 via-slate-400/10 to-transparent',
          },
          {
            title: 'Unread',
            value: summary.unread,
            sub: 'Still needing attention',
            gradient: 'from-sky-500/20 via-cyan-400/10 to-transparent',
          },
          {
            title: 'Read',
            value: summary.read,
            sub: 'Already reviewed',
            gradient: 'from-emerald-500/20 via-emerald-400/10 to-transparent',
          },
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-5">
        <PageSection padded={false}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 shadow-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <p className="font-semibold text-[14px] text-slate-800 dark:text-white">
                  Recent Notifications
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {(meta.total || notifications.length)} items - {unreadOnPageCount} unread on this page
                </p>
              </div>

              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search title or message..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                />
              </form>

              <div className="grid grid-cols-3 gap-2">
                {[
                  ['all', 'All'],
                  ['unread', 'Unread'],
                  ['read', 'Read'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => {
                      setStatusFilter(value)
                      setPage(1)
                    }}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                      statusFilter === value
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-slate-400">
                No notifications found for the selected filter.
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
        </PageSection>

        <PageSection padded={false}>
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
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold ${selected?.is_read ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'}`}>
                      {selected?.is_read ? 'Read' : 'Unread'}
                    </span>
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
        </PageSection>
      </div>
    </div>
  )
}
