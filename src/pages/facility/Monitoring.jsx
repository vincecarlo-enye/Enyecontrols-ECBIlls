
import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Activity, TrendingUp, TrendingDown, AlertTriangle, RefreshCw, CheckCircle2, XCircle, Clock, Calculator, Download, Search } from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { FacilityPageSkeleton } from '@/components/skeletons'
import { useFacilityMonitoring } from '@/hooks/facilityHooks/useFacilityMonitoring'
import { useApp } from '@/context/AppContext'

const statusColor = {
  normal: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  alert: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

const readingStatusColor = {
  pending_approval: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  mixed: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

const utilityLabel = {
  electricity: 'Electricity',
  water: 'Water',
  thermal: 'Thermal',
}

const utilityUnit = {
  electricity: 'kWh',
  water: 'm3',
  thermal: 'kBTU/h',
}

function formatUpdatedAt(value) {
  if (!value) return 'Never'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Just now'

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatReadingDate(value) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatStatus(status) {
  return String(status || 'unknown').replaceAll('_', ' ')
}

function formatNumber(value, fractionDigits = 2) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  })
}

function csvEscape(value) {
  const text = String(value ?? '')
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

function summarizeStatuses(statuses) {
  const unique = Array.from(new Set((statuses || []).filter(Boolean)))
  if (unique.length === 0) return 'unknown'
  if (unique.length === 1) return unique[0]
  return 'mixed'
}

function joinStatuses(statuses) {
  const unique = Array.from(new Set((statuses || []).filter(Boolean)))
  if (unique.length === 0) return 'unknown'
  return unique.map(formatStatus).join(' / ')
}

function renderUtilityCell(entry) {
  if (!entry) {
    return <span className="text-xs text-slate-400">-</span>
  }

  return (
    <div className="space-y-1 min-w-[140px]">
      <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">{entry.watchName || '-'}</div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400">Prev: <span className="font-mono">{formatNumber(entry.previous)}</span></div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400">Curr: <span className="font-mono">{formatNumber(entry.current)}</span></div>
      <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">Delta: <span className="font-mono">{formatNumber(entry.delta)}</span></div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400">Saved: <span className="font-mono">{formatNumber(entry.saved)}</span></div>
    </div>
  )
}

export default function Monitoring() {
  const pageLoading = usePageLoader(700)
  const { addToast } = useApp()
  const {
    liveData,
    currentLoad,
    trend,
    floorData,
    anomaly,
    pendingReadings,
    actualReadings,
    approvalSummary,
    loading,
    acting,
    error,
    lastUpdated,
    reload,
    approveReading,
    rejectReading,
    bulkApproveReadings,
    bulkRejectReadings,
  } = useFacilityMonitoring()
  const [selected, setSelected] = useState('electricity')
  const [refreshing, setRefreshing] = useState(false)
  const [readingsPage, setReadingsPage] = useState(1)
  const [readingsSearch, setReadingsSearch] = useState('')
  const [readingsStatus, setReadingsStatus] = useState('all')
  const [selectedPendingIds, setSelectedPendingIds] = useState([])
  const readingsPerPage = 12

  const loadingState = pageLoading || loading
  const average = useMemo(() => {
    if (!floorData.length) return 0
    return floorData.reduce((sum, row) => sum + Number(row?.[selected] || 0), 0) / floorData.length
  }, [floorData, selected])

  const peakFloor = useMemo(() => {
    if (!floorData.length) return null

    return floorData.reduce((highest, row) => {
      if (!highest) return row
      return Number(row?.[selected] || 0) > Number(highest?.[selected] || 0) ? row : highest
    }, null)
  }, [floorData, selected])

  const groupedPendingReadings = useMemo(() => {
    return pendingReadings.reduce((groups, reading) => {
      const unitLabel = reading.unit_label || 'Unassigned Unit'
      const tenantLabel = reading.tenant_label || 'No tenant assigned'
      const floorLabel = reading.floor_label || 'No floor'
      const key = `${unitLabel}::${tenantLabel}`

      if (!groups[key]) {
        groups[key] = {
          key,
          unitLabel,
          tenantLabel,
          floorLabel,
          count: 0,
          readings: [],
        }
      }

      groups[key].count += 1
      groups[key].readings.push(reading)
      return groups
    }, {})
  }, [pendingReadings])

  const pendingGroups = useMemo(() => {
    return Object.values(groupedPendingReadings).sort((a, b) => {
      const byUnit = a.unitLabel.localeCompare(b.unitLabel)
      if (byUnit !== 0) return byUnit
      return a.tenantLabel.localeCompare(b.tenantLabel)
    })
  }, [groupedPendingReadings])

  const allPendingIds = useMemo(() => pendingReadings.map((reading) => reading.id), [pendingReadings])

  const groupedActualReadings = useMemo(() => {
    const groups = new Map()

    actualReadings.forEach((reading) => {
      const recordedMinute = String(reading.recorded_at || '').slice(0, 16)
      const key = [recordedMinute, reading.unit_label || '', reading.tenant_label || '', reading.floor_label || ''].join('::')

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          recordedAt: reading.recorded_at,
          unitLabel: reading.unit_label || '-',
          tenantLabel: reading.tenant_label || 'No tenant assigned',
          floorLabel: reading.floor_label || '-',
          reviewedBy: reading.reviewed_by_name || '-',
          notes: reading.review_notes || '-',
          statuses: [],
          utilities: {
            electricity: null,
            water: null,
            thermal: null,
          },
        })
      }

      const group = groups.get(key)
      group.statuses.push(reading.status)
      if (group.notes === '-' && reading.review_notes) group.notes = reading.review_notes
      if (group.reviewedBy === '-' && reading.reviewed_by_name) group.reviewedBy = reading.reviewed_by_name

      const type = String(reading.type || '').toLowerCase()
      if (['electricity', 'water', 'thermal'].includes(type)) {
        group.utilities[type] = {
          watchName: reading.watch_name || '-',
          previous: Number(reading.previous_reading_value || 0),
          current: Number(reading.current_reading_value || 0),
          delta: Number(reading.manual_usage_delta || 0),
          saved: Number(reading.usage_value || 0),
        }
      }
    })

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        status: summarizeStatuses(group.statuses),
        statusLabel: joinStatuses(group.statuses),
      }))
      .sort((a, b) => new Date(b.recordedAt || 0) - new Date(a.recordedAt || 0))
  }, [actualReadings])

  const filteredActualReadings = useMemo(() => {
    const needle = readingsSearch.trim().toLowerCase()

    return groupedActualReadings.filter((reading) => {
      const matchesStatus = readingsStatus === 'all' || reading.statuses.includes(readingsStatus)
      if (!matchesStatus) return false
      if (!needle) return true

      const haystack = [
        reading.unitLabel,
        reading.tenantLabel,
        reading.floorLabel,
        reading.reviewedBy,
        reading.notes,
        reading.utilities.electricity?.watchName,
        reading.utilities.water?.watchName,
        reading.utilities.thermal?.watchName,
      ].join(' ').toLowerCase()

      return haystack.includes(needle)
    })
  }, [groupedActualReadings, readingsSearch, readingsStatus])

  const totalReadingsPages = Math.max(1, Math.ceil(filteredActualReadings.length / readingsPerPage))
  const safeReadingsPage = Math.min(readingsPage, totalReadingsPages)
  const pagedActualReadings = useMemo(() => {
    const start = (safeReadingsPage - 1) * readingsPerPage
    return filteredActualReadings.slice(start, start + readingsPerPage)
  }, [filteredActualReadings, safeReadingsPage])

  const togglePendingSelection = (readingId) => {
    setSelectedPendingIds((current) => (
      current.includes(readingId)
        ? current.filter((id) => id !== readingId)
        : [...current, readingId]
    ))
  }

  const toggleAllPending = () => {
    setSelectedPendingIds((current) => (
      current.length === allPendingIds.length ? [] : allPendingIds
    ))
  }

  const handleBulkApprove = async () => {
    if (selectedPendingIds.length === 0) {
      addToast('Select at least one reading to approve.', 'info')
      return
    }

    const result = await bulkApproveReadings(selectedPendingIds)
    addToast(result.message, result.success ? 'success' : 'error')
    if (result.success) setSelectedPendingIds([])
  }

  const handleBulkReject = async () => {
    if (selectedPendingIds.length === 0) {
      addToast('Select at least one reading to reject.', 'info')
      return
    }

    const result = await bulkRejectReadings(selectedPendingIds)
    addToast(result.message, result.success ? 'info' : 'error')
    if (result.success) setSelectedPendingIds([])
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await reload()
      setReadingsPage(1)
    } finally {
      setRefreshing(false)
    }
  }

  const handleApprove = async (readingId) => {
    const result = await approveReading(readingId)
    addToast(result.message, result.success ? 'success' : 'error')
  }

  const handleReject = async (readingId) => {
    const result = await rejectReading(readingId)
    addToast(result.message, result.success ? 'info' : 'error')
  }

  const handleExportCsv = () => {
    if (!filteredActualReadings.length) {
      addToast('No audit readings available to export.', 'info')
      return
    }

    const headers = [
      'Recorded At', 'Unit', 'Tenant', 'Floor',
      'Electricity Meter', 'Electricity Previous', 'Electricity Current', 'Electricity Delta', 'Electricity Saved',
      'Water Meter', 'Water Previous', 'Water Current', 'Water Delta', 'Water Saved',
      'Thermal Meter', 'Thermal Previous', 'Thermal Current', 'Thermal Delta', 'Thermal Saved',
      'Status', 'Reviewed By', 'Review Notes',
    ]

    const rows = filteredActualReadings.map((reading) => ([
      formatReadingDate(reading.recordedAt),
      reading.unitLabel,
      reading.tenantLabel,
      reading.floorLabel,
      reading.utilities.electricity?.watchName || '-',
      formatNumber(reading.utilities.electricity?.previous),
      formatNumber(reading.utilities.electricity?.current),
      formatNumber(reading.utilities.electricity?.delta),
      formatNumber(reading.utilities.electricity?.saved),
      reading.utilities.water?.watchName || '-',
      formatNumber(reading.utilities.water?.previous),
      formatNumber(reading.utilities.water?.current),
      formatNumber(reading.utilities.water?.delta),
      formatNumber(reading.utilities.water?.saved),
      reading.utilities.thermal?.watchName || '-',
      formatNumber(reading.utilities.thermal?.previous),
      formatNumber(reading.utilities.thermal?.current),
      formatNumber(reading.utilities.thermal?.delta),
      formatNumber(reading.utilities.thermal?.saved),
      reading.statusLabel,
      reading.reviewedBy,
      reading.notes,
    ]))

    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `facility-reading-audit-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loadingState) return <FacilityPageSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-xl text-slate-800 dark:text-white">Building Monitoring</h1>
          <p className="text-sm text-slate-400 mt-0.5">Relative utility activity view plus meter reading approval queue</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
            Updated {formatUpdatedAt(lastUpdated)}
          </div>
          <button onClick={handleRefresh} disabled={refreshing} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Current Activity', value: `${Math.round(currentLoad)}%`, tone: 'text-blue-600 dark:text-blue-400', icon: Activity },
          { label: 'Trend', value: `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`, tone: trend > 0 ? 'text-rose-500' : 'text-emerald-500', icon: trend > 0 ? TrendingUp : TrendingDown },
          { label: 'Peak Floor', value: peakFloor?.floor || '-', tone: 'text-slate-800 dark:text-white', icon: AlertTriangle },
          { label: 'Pending Approval', value: approvalSummary?.pending || 0, tone: 'text-amber-600 dark:text-amber-400', icon: Clock },
          { label: 'Approved Today', value: approvalSummary?.approved || 0, tone: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
        ].map((card) => (
          <div key={card.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center">
                <card.icon className={`w-5 h-5 ${card.tone}`} />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400">{card.label}</p>
                <p className={`text-xl font-bold ${card.tone}`}>{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-white">Live Usage Trend</h2>
            <p className="text-xs text-slate-400 mt-0.5">Relative usage activity index based on today's readings</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Current Index:</span>
            <span className="font-bold text-slate-800 dark:text-white">{Math.round(currentLoad)}%</span>
            {trend > 0 ? <TrendingUp className="w-4 h-4 text-rose-500" /> : <TrendingDown className="w-4 h-4 text-emerald-500" />}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={liveData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Line type="monotone" dataKey="load" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} name="Usage Index %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200/70 dark:border-slate-700/50 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-white">Pending Reading Approval</h2>
            <p className="text-xs text-slate-400 mt-0.5">Grouped by assigned unit and tenant for faster approval review</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-xl bg-amber-50 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">{pendingReadings.length} pending</span>
            <button type="button" onClick={toggleAllPending} className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              {selectedPendingIds.length === allPendingIds.length && allPendingIds.length > 0 ? 'Clear All' : 'Select All'}
            </button>
            <button type="button" onClick={handleBulkApprove} disabled={acting || selectedPendingIds.length === 0} className="px-3 py-1 rounded-xl bg-emerald-50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-900/20 dark:text-emerald-300">
              Approve Selected
            </button>
            <button type="button" onClick={handleBulkReject} disabled={acting || selectedPendingIds.length === 0} className="px-3 py-1 rounded-xl bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-900/20 dark:text-rose-300">
              Reject Selected
            </button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {pendingGroups.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No pending meter readings. Finance can generate bills from approved readings.</div>
          ) : pendingGroups.map((group) => (
            <div key={group.key} className="rounded-2xl border border-slate-200/70 dark:border-slate-700/50 overflow-hidden">
              <div className="px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/70 dark:border-slate-700/50 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">Unit {group.unitLabel}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">{group.count} pending</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{group.tenantLabel} · {group.floorLabel}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                      {['Select', 'Recorded At', 'Meter', 'Page', 'Type', 'Reading', 'Usage', 'Actions'].map((header) => (
                        <th key={header} className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {group.readings.map((reading) => (
                      <tr key={reading.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedPendingIds.includes(reading.id)}
                            onChange={() => togglePendingSelection(reading.id)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatReadingDate(reading.recorded_at)}</td>
                        <td className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{reading.watch_name}</td>
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{reading.page_name || '-'}</td>
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 capitalize whitespace-nowrap">{reading.type || '-'}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap">{formatNumber(reading.reading_value)} {reading.unit || ''}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap">{formatNumber(reading.usage_value)}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleApprove(reading.id)} disabled={acting} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60 dark:bg-emerald-900/20 dark:text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Approve</button>
                            <button onClick={() => handleReject(reading.id)} disabled={acting} className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60 dark:bg-rose-900/20 dark:text-rose-400"><XCircle className="w-3.5 h-3.5" /> Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200/70 dark:border-slate-700/50 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-white">Actual Reading Audit Trail</h2>
            <p className="text-xs text-slate-400 mt-0.5">Grouped per unit and timestamp with separate electricity, water, and thermal columns</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={readingsSearch} onChange={(event) => { setReadingsSearch(event.target.value); setReadingsPage(1) }} placeholder="Search unit, tenant, meter..." className="w-full sm:w-64 pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200" />
            </div>
            <select value={readingsStatus} onChange={(event) => { setReadingsStatus(event.target.value); setReadingsPage(1) }} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200">
              <option value="all">All Statuses</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button type="button" onClick={handleExportCsv} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"><Download className="w-4 h-4" /> Export CSV</button>
          </div>
        </div>
        <div className="px-5 py-3 bg-blue-50/70 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-b border-slate-200/70 dark:border-slate-700/50 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span>Manual check formula: <span className="font-mono">Current Reading - Previous Reading = Usage Delta</span></span>
          <span>{filteredActualReadings.length} grouped rows</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1500px]">
            <thead>
              <tr className="border-b border-slate-200/70 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
                {['Recorded At', 'Unit', 'Tenant', 'Floor', 'Electricity', 'Water', 'Thermal', 'Status', 'Reviewed By', 'Notes'].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredActualReadings.length === 0 ? (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-sm text-slate-400">No audit readings found for the current filter.</td></tr>
              ) : pagedActualReadings.map((reading) => (
                <tr key={reading.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors align-top">
                  <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatReadingDate(reading.recordedAt)}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">{reading.unitLabel}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">{reading.tenantLabel}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">{reading.floorLabel}</td>
                  <td className="px-4 py-3.5">{renderUtilityCell(reading.utilities.electricity)}</td>
                  <td className="px-4 py-3.5">{renderUtilityCell(reading.utilities.water)}</td>
                  <td className="px-4 py-3.5">{renderUtilityCell(reading.utilities.thermal)}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${readingStatusColor[reading.status] || readingStatusColor.mixed}`}>{reading.statusLabel}</span></td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">{reading.reviewedBy}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 min-w-[220px]">{reading.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredActualReadings.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-200/70 dark:border-slate-700/50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">Showing {((safeReadingsPage - 1) * readingsPerPage) + 1}-{Math.min(safeReadingsPage * readingsPerPage, filteredActualReadings.length)} of {filteredActualReadings.length} grouped rows</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setReadingsPage((page) => Math.max(1, page - 1))} disabled={safeReadingsPage === 1} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800">Previous</button>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Page {safeReadingsPage} of {totalReadingsPages}</span>
              <button type="button" onClick={() => setReadingsPage((page) => Math.min(totalReadingsPages, page + 1))} disabled={safeReadingsPage >= totalReadingsPages} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800">Next</button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {['electricity', 'water', 'thermal'].map((utility) => (
          <button key={utility} onClick={() => setSelected(utility)} className={`px-4 py-2 text-sm font-medium rounded-xl capitalize transition-all ${selected === utility ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}>
            {utilityLabel[utility]}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200/70 dark:border-slate-700/50 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-white capitalize">{utilityLabel[selected]} Usage per Floor</h2>
          <p className="text-xs text-slate-400">Average: {average.toLocaleString(undefined, { maximumFractionDigits: 1 })} {utilityUnit[selected]}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/70 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Floor</th>
                <th className="text-right px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Usage</th>
                <th className="text-right px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">vs Avg</th>
                <th className="text-center px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {floorData.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">No monitoring data available yet.</td></tr>
              ) : floorData.map((row) => {
                const value = Number(row?.[selected] || 0)
                const diff = average > 0 ? (((value - average) / average) * 100).toFixed(1) : '0.0'

                return (
                  <tr key={row.floor} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-200">{row.floor}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-700 dark:text-slate-200">{value.toLocaleString()} {utilityUnit[selected]}</td>
                    <td className="px-5 py-3.5 text-right"><span className={`flex items-center justify-end gap-1 text-xs font-medium ${Number(diff) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{Number(diff) > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{Math.abs(Number(diff)).toFixed(1)}%</span></td>
                    <td className="px-5 py-3.5 text-center"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${statusColor[row.status] || statusColor.normal}`}>{row.status === 'alert' ? 'Alert' : row.status}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`flex items-start gap-3 p-4 rounded-2xl border ${anomaly?.severity === 'alert' ? 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-700/40' : anomaly?.severity === 'high' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/40' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700/40'}`}>
        <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${anomaly?.severity === 'alert' ? 'text-rose-500' : anomaly?.severity === 'high' ? 'text-amber-500' : 'text-emerald-500'}`} />
        <div>
          <p className={`font-semibold text-sm ${anomaly?.severity === 'alert' ? 'text-rose-700 dark:text-rose-300' : anomaly?.severity === 'high' ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{anomaly?.title || 'No anomaly detected'}</p>
          <p className={`text-xs mt-0.5 ${anomaly?.severity === 'alert' ? 'text-rose-600 dark:text-rose-400' : anomaly?.severity === 'high' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{anomaly?.message || 'All monitored floors are within the expected usage range.'}</p>
        </div>
      </div>
    </div>
  )
}




