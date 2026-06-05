import { formatDate } from '@/utils/filterUtils'
import { useEffect, useMemo, useState } from 'react'
import { Activity, Download, Eye, RefreshCw, Search } from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { TableLoadingRow, UpdatingBadge } from '@/components/common/InlineLoadingState'
import PaginationBar from '@/components/common/PaginationBar'
import { fetchActivityLogs, fetchActivityTimeline, getActivityLogsSnapshot } from '@/services/activityLogService'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import ActivityTimelineModal from '@/components/activity/ActivityTimelineModal'
import { downloadCsv } from '@/utils/exportCsv'

const DEFAULT_PER_PAGE = 10
const DEFAULT_META = {
  current_page: 1,
  per_page: DEFAULT_PER_PAGE,
  total: 0,
  last_page: 1,
  from: 0,
  to: 0,
}


function prettyLabel(value) {
  if (!value) return 'General'

  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function ActivityLogsPage() {
  const { user } = useAuth()
  const { addToast } = useApp()
  const pageLoading = usePageLoader(120)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [error, setError] = useState('')
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineError, setTimelineError] = useState('')
  const [timelineItems, setTimelineItems] = useState([])
  const [timelineEntity, setTimelineEntity] = useState(null)
  const [exporting, setExporting] = useState(false)
  const initialSnapshot = getActivityLogsSnapshot({ page: 1, per_page: DEFAULT_PER_PAGE })
  const hasInitialSnapshot = initialSnapshot != null
  const [logs, setLogs] = useState(Array.isArray(initialSnapshot?.data) ? initialSnapshot.data : [])
  const [meta, setMeta] = useState(initialSnapshot?.meta || DEFAULT_META)
  const [loading, setLoading] = useState(!hasInitialSnapshot)
  const isInitialLoading = (pageLoading || loading) && logs.length === 0 && !error
  const isRefreshing = !isInitialLoading && loading

  const isGlobalView = ['admin', 'super_admin'].includes(user?.role)

  const loadLogs = async (nextPage = page, nextPerPage = perPage) => {
    try {
      setLoading((current) => current || (!hasInitialSnapshot && nextPage === 1 && nextPerPage === DEFAULT_PER_PAGE))
      setError('')
      const res = await fetchActivityLogs({
        page: nextPage,
        per_page: nextPerPage,
        search,
        role: roleFilter || undefined,
        action: actionFilter || undefined,
      })

      setLogs(Array.isArray(res?.data) ? res.data : [])
      setMeta(
        res?.meta || {
          ...DEFAULT_META,
          current_page: nextPage,
          per_page: nextPerPage,
        }
      )
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load activity logs.')
      setLogs([])
      setMeta(DEFAULT_META)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs(page, perPage)
  }, [page, perPage, search, roleFilter, actionFilter])

  const actionOptions = useMemo(() => {
    return Array.from(new Set(logs.map((item) => item.action).filter(Boolean))).sort()
  }, [logs])

  const roleOptions = useMemo(() => {
    return Array.from(new Set(logs.map((item) => item.role).filter(Boolean))).sort()
  }, [logs])

  const handleSearch = (event) => {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const openTimeline = async (log) => {
    if (!log?.entity_type || !log?.entity_id) return

    setTimelineOpen(true)
    setTimelineLoading(true)
    setTimelineError('')
    setTimelineItems([])
    setTimelineEntity({
      label: prettyLabel(log.entity_type),
      key: `${prettyLabel(log.entity_type)} #${log.entity_id}`,
    })

    try {
      const res = await fetchActivityTimeline(log.entity_type, log.entity_id)
      setTimelineItems(Array.isArray(res?.data) ? res.data : [])
    } catch (err) {
      setTimelineError(err?.response?.data?.message || err?.message || 'Failed to load timeline.')
    } finally {
      setTimelineLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      const res = await fetchActivityLogs({
        page: 1,
        per_page: 5000,
        search,
        role: roleFilter || undefined,
        action: actionFilter || undefined,
      })

      const rows = [
        ['When', 'User', 'Role', 'Action', 'Description', 'Entity Type', 'Entity ID', 'Method', 'Path', 'IP'],
        ...((Array.isArray(res?.data) ? res.data : []).map((item) => [
          formatDate(item.created_at),
          item.user_name || 'System',
          item.role || '',
          item.action || '',
          item.description || '',
          item.entity_type || '',
          item.entity_id || '',
          item.method || '',
          item.path || '',
          item.ip_address || '',
        ])),
      ]

      downloadCsv('activity-logs.csv', rows)
      addToast('Activity logs exported to CSV')
    } catch (err) {
      addToast(err?.response?.data?.message || err?.message || 'Failed to export activity logs.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-5 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-700 text-xl text-slate-800 dark:text-white">
            Activity Logs
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Review account actions, approvals, updates, and other recorded activity
          </p>
        </div>

        <div className="flex items-center gap-2 w-full">
  <UpdatingBadge show={isRefreshing} />

  <div className="ml-auto flex items-center gap-2">
    <button
      onClick={handleExport}
      disabled={exporting}
      aria-label={exporting ? 'Exporting activity logs as CSV' : 'Export activity logs as CSV'}
      title={exporting ? 'Exporting activity logs as CSV' : 'Export activity logs as CSV'}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">
        {exporting ? 'Exporting...' : 'Export CSV'}
      </span>
    </button>

    <button
      onClick={() => loadLogs(page, perPage)}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      aria-label="Refresh activity logs"
      title="Refresh activity logs"
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

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 shadow-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <p className="font-semibold text-[14px] text-slate-800 dark:text-white">
              Recorded Actions
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_1fr_1fr]">
  {/* Search full width */}
  <form onSubmit={handleSearch} className="relative">
    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
    <input
      value={searchInput}
      onChange={(event) => setSearchInput(event.target.value)}
      placeholder="Search by user, action, description, path..."
      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-all"
    />
  </form>

  {/* Filters row (always 2 columns) */}
  <div className="grid grid-cols-2 gap-3">
    <select
      value={roleFilter}
      onChange={(event) => {
        setRoleFilter(event.target.value)
        setPage(1)
      }}
      disabled={!isGlobalView}
      className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-all disabled:opacity-60"
    >
      <option value="">All Roles</option>
      {roleOptions.map((role) => (
        <option key={role} value={role}>
          {prettyLabel(role)}
        </option>
      ))}
    </select>

    <select
      value={actionFilter}
      onChange={(event) => {
        setActionFilter(event.target.value)
        setPage(1)
      }}
      className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-all"
    >
      <option value="">All Actions</option>
      {actionOptions.map((action) => (
        <option key={action} value={action}>
          {prettyLabel(action)}
        </option>
      ))}
    </select>
  </div>
</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/90 dark:bg-slate-800/70">
              <tr className="border-b border-slate-200/70 dark:border-slate-700/60">
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-300">When</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-300">User</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-300">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-300">Action</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-300">Description</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-300">Target</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-300">Route</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-300">Timeline</th>
              </tr>
            </thead>
            <tbody>
              {isInitialLoading ? (
                <TableLoadingRow colSpan={8} />
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    No activity logs found for the selected filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-100 dark:border-slate-800 last:border-0 align-top"
                  >
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      <p className="font-semibold">{log.user_name || 'System'}</p>
                      {log.ip_address ? (
                        <p className="text-xs text-slate-400 mt-1">{log.ip_address}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {prettyLabel(log.role)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-lg bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                        {prettyLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 min-w-[260px]">
                      {log.description}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {log.entity_type ? `${prettyLabel(log.entity_type)}${log.entity_id ? ` #${log.entity_id}` : ''}` : 'General'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      <div className="font-mono text-xs break-all">
                        {log.method ? `${log.method} ` : ''}
                        {log.path || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {log.entity_type && log.entity_id ? (
                        <button
                          onClick={() => openTimeline(log)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Timeline
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
      </div>

      <ActivityTimelineModal
        open={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        entityLabel={timelineEntity?.label}
        entityKey={timelineEntity?.key}
        loading={timelineLoading}
        error={timelineError}
        items={timelineItems}
      />
    </div>
  )
}
