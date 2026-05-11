import { useMemo, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  Activity, AlertTriangle, Building2, Droplets, Flame, Gauge, Plus, Wrench, Zap,
} from 'lucide-react'
import ChartCard from '@/components/ui/ChartCard'
import AnnouncementPanel from '@/components/common/AnnouncementPanel'
import UtilityCard from '@/components/common/UtilityCard'
import FilterPills from '@/components/common/FilterPills'
import SummaryCardStrip from '@/components/dashboard/SummaryCardStrip'
import { usePageLoader } from '@/hooks/usePageLoader'
import { useFacilityMonitoring } from '@/hooks/facilityHooks/useFacilityMonitoring'
import { useFacilityConsumption } from '@/hooks/facilityHooks/useFacilityConsumption'
import { useFacilityMaintenance } from '@/hooks/facilityHooks/useFacilityMaintenance'
import { useFacilityEquipment } from '@/hooks/facilityHooks/useFacilityEquipment'
import { useApp } from '@/context/AppContext'
import { useTheme } from '@/context/ThemeContext'
import { useAdminRates } from '@/hooks/adminHooks/useAdminRates'
import { buildUtilityCardMetric } from '@/utils/utilityCards'
import {
  CHART_AXIS_TICK,
  CHART_AXIS_TICK_SM,
  CHART_GRID_PROPS_LIGHT,
  CHART_MARGIN_STANDARD,
  ThemedChartTooltip,
  formatChartNumber,
} from '@/components/charts/rechartsTheme.jsx'
import { TableLoadingRow, UpdatingBadge } from '@/components/common/InlineLoadingState'

// ─── Constants ───────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all'

const ticketStatusCls = {
  open: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  'in-progress': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

const floorStatusCls = {
  normal: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  alert: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

const TECHNICIANS = ['Unassigned', 'Mark Reyes', 'John Dela Cruz', 'Carlo Santos', 'Anne Flores']
const EMPTY_TICKET = { title: '', type: 'Electrical', priority: 'medium', technician: 'Unassigned', status: 'open' }
const PIE_COLORS = ['#f59e0b', '#06b6d4', '#f43f5e']
const STATUS_COLORS = { online: '#10b981', warning: '#f59e0b', offline: '#ef4444' }

const UTILITY_FOCUS = {
  all: { label: 'All', series: ['electricity', 'water', 'thermal'], color: '#3b82f6' },
  electricity: { label: 'Electricity', series: ['electricity'], color: '#f59e0b' },
  water: { label: 'Water', series: ['water'], color: '#06b6d4' },
  thermal: { label: 'Thermal', series: ['thermal'], color: '#f43f5e' },
}

const FILTER_OPTIONS = ['7D', '1M', '1Y']

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function safeNumber(value) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseDateValue(value) {
  if (!value) return null
  const direct = new Date(value)
  if (!Number.isNaN(direct.getTime())) return direct
  const fallback = new Date(String(value).replace(/-/g, '/'))
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

function isSevenDayFilter(filter) {
  return filter === '7D' || filter === '1D'
}

function mapUtilityType(type) {
  const normalized = String(type || '').toLowerCase()
  if (normalized === 'electric' || normalized === 'electricity' || normalized.includes('power')) return 'electricity'
  if (normalized === 'water') return 'water'
  if (normalized === 'thermal' || normalized.includes('btu')) return 'thermal'
  return null
}

function getAreaLabel(row = {}, index = 0) {
  return (
    row.floor || row.floor_label || row.zone || row.area ||
    row.page_name || row.building_name || row.unit_label ||
    `Area ${index + 1}`
  )
}

// ─── Trend data mapping ────────────────────────────────────────────────────────
function mapTrendData(filter, trendData) {
  if (!Array.isArray(trendData) || trendData.length === 0) return buildEmptyBuckets(filter)

  const normalizedRows = trendData
    .map((row) => {
      const rawDate = row.date || row.day || row.label || null
      const parsedDate = parseDateValue(rawDate)
      return {
        date: parsedDate,
        electricity: Number(row.electricity || 0),
        water: Number(row.water || 0),
        thermal: Number(row.thermal || 0),
      }
    })
    .filter((row) => row.date instanceof Date && !Number.isNaN(row.date.getTime()))
    .sort((a, b) => a.date - b.date)

  // ── 7D: anchor last 7 days ending today ──────────────────────────────────
  if (isSevenDayFilter(filter)) {
    const today = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(today)
      day.setDate(today.getDate() - (6 - i))
      const dayKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`
      const match = normalizedRows.find((row) => {
        const r = row.date
        return `${r.getFullYear()}-${r.getMonth()}-${r.getDate()}` === dayKey
      })
      return {
        t: day.toLocaleDateString('en-US', { weekday: 'short' }),
        electricity: match?.electricity ?? 0,
        water: match?.water ?? 0,
        thermal: match?.thermal ?? 0,
      }
    })
  }

  // ── 1M: bucket into current month's 4 weeks ──────────────────────────────
  if (filter === '1M') {
    if (normalizedRows.length > 0) {
      const today = new Date()
      const month = today.getMonth()
      const year = today.getFullYear()
      const buckets = ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((label) => ({
        t: label, electricity: 0, water: 0, thermal: 0,
      }))
      normalizedRows.forEach((row) => {
        if (row.date.getMonth() !== month || row.date.getFullYear() !== year) return
        const weekIndex = Math.min(3, Math.floor((row.date.getDate() - 1) / 7))
        buckets[weekIndex].electricity += row.electricity
        buckets[weekIndex].water += row.water
        buckets[weekIndex].thermal += row.thermal
      })
      return buckets
    }
    // Raw label fallback (backend returned non-date labels like "Week 1")
    return trendData.slice(0, 4).map((row, i) => ({
      t: row.label || row.t || `Week ${i + 1}`,
      electricity: Number(row.electricity || 0),
      water: Number(row.water || 0),
      thermal: Number(row.thermal || 0),
    }))
  }

  // ── 1Y: rolling latest 7 months ──────────────────────────────────────────
if (normalizedRows.length > 0) {
  const now = new Date()

  const buckets = []

  // build latest 7 months including previous year if needed
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)

    buckets.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      t: d.toLocaleDateString('en-US', {
        month: 'short',
      }),
      electricity: 0,
      water: 0,
      thermal: 0,
    })
  }

  normalizedRows.forEach((row) => {
    const bucket = buckets.find(
      (b) =>
        b.year === row.date.getFullYear() &&
        b.month === row.date.getMonth()
    )

    if (bucket) {
      bucket.electricity += row.electricity
      bucket.water += row.water
      bucket.thermal += row.thermal
    }
  })

  return buckets
}

  return buildEmptyBuckets(filter)
}

function buildEmptyBuckets(filter) {
  if (isSevenDayFilter(filter)) {
    const today = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (6 - i))
      return { t: d.toLocaleDateString('en-US', { weekday: 'short' }), electricity: 0, water: 0, thermal: 0 }
    })
  }
  if (filter === '1M') {
    return ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((t) => ({ t, electricity: 0, water: 0, thermal: 0 }))
  }
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    .map((t) => ({ t, electricity: 0, water: 0, thermal: 0 }))
}

// ─── Utility card trend (same pattern as superadmin/admin) ───────────────────

function computeSeriesTrend(rows = [], key) {
  if (!Array.isArray(rows) || rows.length < 2) return 0
  const last = safeNumber(rows[rows.length - 1]?.[key])
  const prev = safeNumber(rows[rows.length - 2]?.[key])
  if (prev === 0) return last === 0 ? 0 : 100
  return Number((((last - prev) / prev) * 100).toFixed(1))
}

// ─── Area comparison ─────────────────────────────────────────────────────────

function buildAreaUsageRows(rows = []) {
  return rows
    .map((row, i) => ({
      name: getAreaLabel(row, i),
      electricity: safeNumber(row.electricity),
      water: safeNumber(row.water),
      thermal: safeNumber(row.thermal),
    }))
    .filter((row) => row.electricity > 0 || row.water > 0 || row.thermal > 0)
    .map((row) => ({ ...row, total: row.electricity + row.water + row.thermal }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
}

// ─── Maintenance trend ────────────────────────────────────────────────────────

function buildMaintenanceTrend(filter, tickets) {
  const now = new Date()
  const normalized = Array.isArray(tickets) ? tickets : []

  if (isSevenDayFilter(filter)) {
    const labels = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now)
      date.setDate(now.getDate() - (6 - i))
      return {
        key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      }
    })
    return labels.map(({ key, label }) => {
      const bucket = { t: label, open: 0, inProgress: 0, resolved: 0 }
      normalized.forEach((ticket) => {
        const date = parseDateValue(ticket.date || ticket.created_at || ticket.updated_at)
        if (!date) return
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
        if (dateKey !== key) return
        if (ticket.status === 'resolved') bucket.resolved += 1
        else if (ticket.status === 'in-progress') bucket.inProgress += 1
        else bucket.open += 1
      })
      return bucket
    })
  }

  if (filter === '1M') {
    const buckets = Array.from({ length: 4 }, (_, i) => ({ t: `Week ${i + 1}`, open: 0, inProgress: 0, resolved: 0 }))
    normalized.forEach((ticket) => {
      const date = parseDateValue(ticket.date || ticket.created_at || ticket.updated_at)
      if (!date) return
      if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) return
      const weekIndex = Math.min(3, Math.floor((date.getDate() - 1) / 7))
      const bucket = buckets[weekIndex]
      if (ticket.status === 'resolved') bucket.resolved += 1
      else if (ticket.status === 'in-progress') bucket.inProgress += 1
      else bucket.open += 1
    })
    return buckets
  }

  // 1Y → quarterly
  const buckets = Array.from({ length: 4 }, (_, i) => ({ t: `Q${i + 1}`, open: 0, inProgress: 0, resolved: 0 }))
  normalized.forEach((ticket) => {
    const date = parseDateValue(ticket.date || ticket.created_at || ticket.updated_at)
    if (!date || date.getFullYear() !== now.getFullYear()) return
    const qi = Math.floor(date.getMonth() / 3)
    const bucket = buckets[qi]
    if (ticket.status === 'resolved') bucket.resolved += 1
    else if (ticket.status === 'in-progress') bucket.inProgress += 1
    else bucket.open += 1
  })
  return buckets
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FacilityDashboard() {
  const pageLoading = usePageLoader(800)
  const { addToast } = useApp()
  const { isDark } = useTheme()
  const { rates: billingRates } = useAdminRates()

  const [filter, setFilter] = useState('7D')
  const [utilityFocus, setUtilityFocus] = useState('all')
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [ticketForm, setTicketForm] = useState(EMPTY_TICKET)

  const monitoring = useFacilityMonitoring()
  const consumption = useFacilityConsumption({ timeRange: filter })
  const maintenance = useFacilityMaintenance()
  const equipment = useFacilityEquipment()

  // Loading states
  const coreLoading =
    pageLoading ||
    (monitoring.loading && monitoring.floorData.length === 0 && monitoring.liveData.length === 0 && !monitoring.error) ||
    (consumption.loading && consumption.trendData.length === 0 && !consumption.error)
  const isInitialLoading = coreLoading
  const isRefreshing = !isInitialLoading && (monitoring.loading || consumption.loading || maintenance.loading || equipment.loading)

  // ── Chart data ──────────────────────────────────────────────────────────────
  const chartData = useMemo(
    () => mapTrendData(filter, consumption.trendData),
    [filter, consumption.trendData],
  )

  const utilityTrendData = useMemo(
    () => chartData.map((row) => ({
      ...row,
      combined: safeNumber(row.electricity) + safeNumber(row.water) + safeNumber(row.thermal),
    })),
    [chartData],
  )

  // ── Utility cards ───────────────────────────────────────────────────────────
  
  const utilityMeters = useMemo(() => {
    const elecUsage = safeNumber(consumption.summary.electricity)
    const waterUsage = safeNumber(consumption.summary.water)
    const thermalUsage = safeNumber(consumption.summary.thermal)

    return {
      electric: buildUtilityCardMetric({
        type: 'electricity',
        usage: elecUsage,
        unit: 'kWh',
        trend: computeSeriesTrend(utilityTrendData, 'electricity'),
        rates: billingRates,
        fallbackEstimatedCost: elecUsage,
        series: utilityTrendData.map((r) => ({ label: r.t, value: safeNumber(r.electricity) })),
      }),
      water: buildUtilityCardMetric({
        type: 'water',
        usage: waterUsage,
        unit: 'm3',
        trend: computeSeriesTrend(utilityTrendData, 'water'),
        rates: billingRates,
        fallbackEstimatedCost: waterUsage,
        series: utilityTrendData.map((r) => ({ label: r.t, value: safeNumber(r.water) })),
      }),
      thermal: buildUtilityCardMetric({
        type: 'thermal',
        usage: thermalUsage,
        unit: 'kBTU',
        trend: computeSeriesTrend(utilityTrendData, 'thermal'),
        rates: billingRates,
        fallbackEstimatedCost: thermalUsage,
        series: utilityTrendData.map((r) => ({ label: r.t, value: safeNumber(r.thermal) })),
      }),
    }
  }, [billingRates, consumption.summary, utilityTrendData])

  // ── Other memos ─────────────────────────────────────────────────────────────
  const activeAlerts = monitoring.floorData.filter((row) => row.status === 'alert' || row.status === 'high')
  const recentTickets = maintenance.tickets.slice(0, 6)
  const recentFloors = monitoring.floorData.slice(0, 6)

  const utilityDistributionData = useMemo(() => ([
    { name: 'Electricity', value: safeNumber(utilityMeters.electric.usage), color: '#f59e0b' },
    { name: 'Water', value: safeNumber(utilityMeters.water.usage), color: '#06b6d4' },
    { name: 'Thermal', value: safeNumber(utilityMeters.thermal.usage), color: '#f43f5e' },
  ]), [utilityMeters])

  const anomalyTrendData = useMemo(() => {
    const count = utilityTrendData.length || 1
    const avg = utilityTrendData.reduce(
      (acc, row) => ({
        electricity: acc.electricity + safeNumber(row.electricity),
        water: acc.water + safeNumber(row.water),
        thermal: acc.thermal + safeNumber(row.thermal),
      }),
      { electricity: 0, water: 0, thermal: 0 },
    )
    const mean = { electricity: avg.electricity / count, water: avg.water / count, thermal: avg.thermal / count }

    return utilityTrendData.map((row) => ({
      t: row.t,
      warnings: [
        safeNumber(row.electricity) > mean.electricity * 1.08,
        safeNumber(row.water) > mean.water * 1.08,
        safeNumber(row.thermal) > mean.thermal * 1.08,
      ].filter(Boolean).length,
      critical: [
        safeNumber(row.electricity) > mean.electricity * 1.18,
        safeNumber(row.water) > mean.water * 1.18,
        safeNumber(row.thermal) > mean.thermal * 1.18,
      ].filter(Boolean).length,
    }))
  }, [utilityTrendData])

  const maintenanceTrendData = useMemo(
    () => buildMaintenanceTrend(filter, maintenance.tickets),
    [filter, maintenance.tickets],
  )

  const equipmentStatusData = useMemo(() => ([
    { name: 'Online', value: equipment.stats.online, color: STATUS_COLORS.online },
    { name: 'Warning', value: equipment.stats.warning, color: STATUS_COLORS.warning },
    { name: 'Offline', value: equipment.stats.offline, color: STATUS_COLORS.offline },
  ]), [equipment.stats])

  const equipmentAttentionList = useMemo(() => (
    equipment.meters
      .filter((m) => m.status === 'offline' || m.status === 'warning')
      .slice(0, 4)
      .map((m, i) => ({
        id: m.id || m.meter_id || i,
        label: m.name || m.meter_name || m.serial_number || `Meter ${i + 1}`,
        location: m.location || m.floor || m.zone || 'Facility zone',
        status: m.status || 'warning',
        lastReading: m.last_reading_at || m.lastReading || m.last_reading || 'No recent reading',
      }))
  ), [equipment.meters])

  const areaComparisonData = useMemo(() => {
    const consumptionRows = buildAreaUsageRows(consumption.unitConsumption)
    if (consumptionRows.length > 0) return consumptionRows

    const floorRows = buildAreaUsageRows(monitoring.floorData)
    if (floorRows.length > 0) return floorRows

    const grouped = monitoring.actualReadings.reduce((acc, reading, i) => {
      const name = getAreaLabel(reading, i)
      const utilityType = mapUtilityType(reading.type)
      if (!utilityType) return acc
      const current = acc.get(name) || { name, electricity: 0, water: 0, thermal: 0 }
      current[utilityType] += safeNumber(reading.usage_value ?? reading.latest_usage)
      acc.set(name, current)
      return acc
    }, new Map())

    return Array.from(grouped.values())
      .map((row) => ({ ...row, total: row.electricity + row.water + row.thermal }))
      .filter((row) => row.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
  }, [consumption.unitConsumption, monitoring.actualReadings, monitoring.floorData])

  // ── Summary strips ───────────────────────────────────────────────────────────
  const summaryTop = [
    {
      label: 'Monitored Floors',
      value: monitoring.floorData.length.toLocaleString(),
      icon: Building2,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/25',
      trend: `${activeAlerts.length} flagged`,
      trendUp: activeAlerts.length > 0,
      sub: 'Live floor coverage',
    },
    {
      label: 'Active Meters',
      value: equipment.stats.online.toLocaleString(),
      icon: Gauge,
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/25',
      trend: `${equipment.stats.offline} offline`,
      trendUp: equipment.stats.offline > 0,
      sub: `${equipment.meters.length} total devices`,
    },
    {
      label: 'Maintenance',
      value: (maintenance.stats.open + maintenance.stats.inProgress).toLocaleString(),
      icon: Wrench,
      gradient: 'from-amber-500 to-orange-500',
      shadow: 'shadow-amber-500/25',
      trend: `${maintenance.stats.open} open`,
      trendUp: maintenance.stats.open > 0,
      sub: `${maintenance.stats.resolved} resolved`,
    },
    {
      label: 'Utility Alerts',
      value: activeAlerts.length.toLocaleString(),
      icon: AlertTriangle,
      gradient: 'from-rose-500 to-pink-600',
      shadow: 'shadow-rose-500/25',
      trend: monitoring.anomaly?.severity === 'alert' ? 'Critical anomaly' : 'Monitoring normal',
      trendUp: monitoring.anomaly?.severity === 'alert',
      sub: 'Requires immediate review',
    },
  ]

  const summaryToday = [
    {
      label: 'Electricity Today',
      value: `${Math.round(utilityMeters.electric.usage).toLocaleString()} kWh`,
      icon: Zap,
      gradient: 'from-yellow-400 to-amber-500',
      shadow: 'shadow-yellow-500/25',
      trend: `${Math.round(monitoring.currentLoad)}% system load`,
      trendUp: monitoring.trend > 0,
      sub: 'Rolling 24h estimate',
    },
    {
      label: 'Water Today',
      value: `${Math.round(utilityMeters.water.usage).toLocaleString()} m3`,
      icon: Droplets,
      gradient: 'from-cyan-500 to-blue-500',
      shadow: 'shadow-cyan-500/25',
      trend: `${activeAlerts.filter((r) => r.status === 'high').length} floors high`,
      trendUp: activeAlerts.filter((r) => r.status === 'high').length > 0,
      sub: 'Rolling 24h estimate',
    },
    {
      label: 'Thermal Energy',
      value: `${Math.round(utilityMeters.thermal.usage).toLocaleString()} kBTU`,
      icon: Flame,
      gradient: 'from-rose-400 to-red-500',
      shadow: 'shadow-rose-500/25',
      trend: monitoring.anomaly?.severity === 'alert' ? 'Above average' : 'Stable',
      trendUp: monitoring.anomaly?.severity === 'alert',
      sub: monitoring.anomaly?.title || 'No anomaly detected',
    },
  ]

  // ── Ticket handlers ──────────────────────────────────────────────────────────
  const handleCreateTicket = async () => {
    if (!ticketForm.title.trim()) {
      addToast('Issue title is required.', 'error')
      return
    }
    const result = await maintenance.createTicket({
      title: ticketForm.title,
      type: ticketForm.type,
      priority: ticketForm.priority,
      technician: ticketForm.technician === 'Unassigned' ? '' : ticketForm.technician,
      status: ticketForm.status,
    })
    addToast(result.message, result.success ? 'success' : 'error')
    if (result.success) {
      setTicketForm(EMPTY_TICKET)
      setShowTicketForm(false)
    }
  }

  const handleTicketStatus = async (ticketId, status) => {
    const result = await maintenance.updateStatus(ticketId, status)
    addToast(result.message, result.success ? 'success' : 'error')
  }

  const utilityFocusConfig = UTILITY_FOCUS[utilityFocus] || UTILITY_FOCUS.all
  const distributionTotal = utilityDistributionData.reduce((sum, row) => sum + row.value, 0)

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="section-gap animate-in pb-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Facility Dashboard
          </h1>
          <p className="muted-text mt-0.5">Real-time building operations and utility monitoring</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <UpdatingBadge show={isRefreshing} />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Live</span>
          </div>
          {/* ✅ Single filter drives everything — utility cards, charts, maintenance */}
          <FilterPills options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
        </div>
      </div>

      {/* Error banner */}
      {(monitoring.error || consumption.error || maintenance.error || equipment.error) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {monitoring.error || consumption.error || maintenance.error || equipment.error}
        </div>
      )}

      {/* Utility cards — now react to filter */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <UtilityCard type="electric" {...utilityMeters.electric} loading={isInitialLoading} updating={isRefreshing} />
        <UtilityCard type="thermal" {...utilityMeters.thermal} loading={isInitialLoading} updating={isRefreshing} />
        <UtilityCard type="water" {...utilityMeters.water} loading={isInitialLoading} updating={isRefreshing} />
      </div>

      <SummaryCardStrip
        cards={[...summaryTop, ...summaryToday].map((card) => ({ ...card, loading: isInitialLoading, updating: isRefreshing }))}
      />

      {/* Trend + Distribution */}
      <div className="grid gap-4 lg:grid-cols-5">
        <ChartCard
          className="lg:col-span-3"
          title="Utility Consumption Trend"
          exportable
          exportRows={utilityTrendData}
          loading={isInitialLoading && utilityTrendData.length === 0}
          updating={isRefreshing}
          subtitle={`${isSevenDayFilter(filter) ? 'Daily (7 days)' : filter === '1M' ? 'Monthly (4 weeks)' : 'Yearly (12 months)'} operational view`}
          accentHex={utilityFocusConfig.color}
          action={(
            <div className="flex flex-wrap items-center gap-1">
              {Object.entries(UTILITY_FOCUS).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setUtilityFocus(key)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    utilityFocus === key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          )}
        >
          <ResponsiveContainer width="100%" height={240}>
            {utilityFocus === 'all' ? (
              <LineChart data={utilityTrendData} margin={CHART_MARGIN_STANDARD}>
                <CartesianGrid {...CHART_GRID_PROPS_LIGHT} />
                <XAxis dataKey="t" tick={CHART_AXIS_TICK_SM} />
                <YAxis tick={CHART_AXIS_TICK_SM} tickFormatter={formatChartNumber} />
                <Tooltip content={<ThemedChartTooltip isDark={isDark} formatter={(v, n) => [formatChartNumber(v), n]} />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="electricity" stroke="#f59e0b" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} name="Electricity" />
                <Line type="monotone" dataKey="water" stroke="#06b6d4" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} name="Water" />
                <Line type="monotone" dataKey="thermal" stroke="#f43f5e" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} name="Thermal" />
              </LineChart>
            ) : (
              <AreaChart data={utilityTrendData} margin={CHART_MARGIN_STANDARD}>
                <defs>
                  <linearGradient id="facilityElectricity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="facilityWater" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="facilityThermal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...CHART_GRID_PROPS_LIGHT} />
                <XAxis dataKey="t" tick={CHART_AXIS_TICK_SM} />
                <YAxis tick={CHART_AXIS_TICK_SM} tickFormatter={formatChartNumber} />
                <Tooltip content={<ThemedChartTooltip isDark={isDark} formatter={(v, n) => [formatChartNumber(v), n]} />} />
                <Area
                  type="monotone"
                  dataKey={utilityFocus}
                  stroke={utilityFocusConfig.color}
                  strokeWidth={2.75}
                  fill={`url(#facility${utilityFocus.charAt(0).toUpperCase()}${utilityFocus.slice(1)})`}
                  name={utilityFocusConfig.label}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          className="lg:col-span-2"
          title="Consumption Distribution"
          exportable
          exportRows={utilityDistributionData}
          loading={isInitialLoading && utilityDistributionData.every((item) => item.value === 0)}
          updating={isRefreshing}
          subtitle="Current utility mix across the facility"
        >
          <div className="flex flex-col gap-4 lg:h-[240px] lg:flex-row lg:items-center">
            <div className="h-[190px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={utilityDistributionData} dataKey="value" cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3}>
                    {utilityDistributionData.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ThemedChartTooltip isDark={isDark} formatter={(v, n) => [formatChartNumber(v), n]} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {utilityDistributionData.map((item, i) => {
                const share = distributionTotal ? Math.round((item.value / distributionTotal) * 100) : 0
                return (
                  <div key={item.name} className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-[#090c13]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{share}%</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{formatChartNumber(item.value)} total load</span>
                      <span>{item.name === 'Water' ? 'm3' : item.name === 'Thermal' ? 'kBTU' : 'kWh'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Anomaly + Equipment + Maintenance */}
      <div className="grid gap-4 xl:grid-cols-12">
        <ChartCard
          className="xl:col-span-4"
          title="Anomaly / Alert Trend"
          exportable
          exportRows={anomalyTrendData}
          loading={isInitialLoading && anomalyTrendData.length === 0}
          updating={isRefreshing}
          subtitle="Warning and critical event pressure across the selected window"
          accentHex="#ef4444"
        >
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={anomalyTrendData} margin={CHART_MARGIN_STANDARD}>
              <CartesianGrid {...CHART_GRID_PROPS_LIGHT} />
              <XAxis dataKey="t" tick={CHART_AXIS_TICK} />
              <YAxis allowDecimals={false} tick={CHART_AXIS_TICK} />
              <Tooltip content={<ThemedChartTooltip isDark={isDark} formatter={(v, n) => [formatChartNumber(v), n]} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="warnings" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} name="Warnings" />
              <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} name="Critical" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-amber-200/70 bg-amber-50/80 px-3 py-2.5 dark:border-amber-500/20 dark:bg-amber-500/10">
              <p className="text-[11px] uppercase tracking-[0.08em] text-amber-700 dark:text-amber-300">Open Signals</p>
              <p className="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">{activeAlerts.length}</p>
            </div>
            <div className="rounded-xl border border-rose-200/70 bg-rose-50/80 px-3 py-2.5 dark:border-rose-500/20 dark:bg-rose-500/10">
              <p className="text-[11px] uppercase tracking-[0.08em] text-rose-700 dark:text-rose-300">Primary Alert</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{monitoring.anomaly?.severity || 'normal'}</p>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          className="xl:col-span-4"
          title="Equipment Status Overview"
          subtitle="Operational health of meters and monitored devices"
          loading={isInitialLoading && equipmentStatusData.every((item) => item.value === 0)}
          updating={isRefreshing}
        >
          <div className="grid grid-cols-3 gap-3">
            {equipmentStatusData.map((item) => (
              <div key={item.name} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-center dark:border-white/5 dark:bg-[#090c13]">
                <div className="mx-auto mb-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{item.name}</p>
                <p className="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {equipmentAttentionList.length === 0 ? (
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                All monitored devices are healthy right now.
              </div>
            ) : equipmentAttentionList.map((meter) => (
              <div key={meter.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/5 dark:bg-[#090c13]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{meter.label}</p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{meter.location}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${
                    meter.status === 'offline'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {meter.status}
                  </span>
                  <p className="mt-1 text-[10px] text-slate-400">{meter.lastReading}</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          className="xl:col-span-4"
          title="Maintenance Requests Trend"
          exportable
          exportRows={maintenanceTrendData}
          loading={isInitialLoading && maintenanceTrendData.length === 0}
          updating={isRefreshing}
          subtitle="Flow of open, in-progress, and resolved requests"
          accentHex="#8b5cf6"
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={maintenanceTrendData} margin={CHART_MARGIN_STANDARD}>
              <CartesianGrid {...CHART_GRID_PROPS_LIGHT} />
              <XAxis dataKey="t" tick={CHART_AXIS_TICK} />
              <YAxis allowDecimals={false} tick={CHART_AXIS_TICK} />
              <Tooltip content={<ThemedChartTooltip isDark={isDark} formatter={(v, n) => [formatChartNumber(v), n]} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="open" stackId="maintenance" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Open" />
              <Bar dataKey="inProgress" stackId="maintenance" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="In Progress" />
              <Bar dataKey="resolved" stackId="maintenance" fill="#10b981" radius={[4, 4, 0, 0]} name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-white/5 dark:bg-[#090c13]">
              <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Open</p>
              <p className="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">{maintenance.stats.open}</p>
            </div>
            <div className="rounded-xl border border-violet-200/70 bg-violet-50/80 px-3 py-2.5 dark:border-violet-500/20 dark:bg-violet-500/10">
              <p className="text-[11px] uppercase tracking-[0.08em] text-violet-700 dark:text-violet-300">In Progress</p>
              <p className="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">{maintenance.stats.inProgress}</p>
            </div>
            <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/80 px-3 py-2.5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <p className="text-[11px] uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">Resolved</p>
              <p className="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">{maintenance.stats.resolved}</p>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Area comparison */}
      <ChartCard
        title="Building / Floor / Zone Comparison"
        exportable
        exportRows={areaComparisonData}
        loading={isInitialLoading && areaComparisonData.length === 0}
        updating={isRefreshing}
        subtitle="Top monitored areas by combined utility demand"
        accentHex="#0ea5e9"
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={areaComparisonData} layout="vertical" margin={{ top: 5, right: 24, left: 24, bottom: 0 }}>
            <CartesianGrid {...CHART_GRID_PROPS_LIGHT} />
            <XAxis type="number" tick={CHART_AXIS_TICK} tickFormatter={formatChartNumber} />
            <YAxis type="category" dataKey="name" tick={CHART_AXIS_TICK} width={86} />
            <Tooltip content={<ThemedChartTooltip isDark={isDark} formatter={(v, n) => [formatChartNumber(v), n]} />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="electricity" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Electricity" />
            <Bar dataKey="water" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Water" />
            <Bar dataKey="thermal" fill="#f43f5e" radius={[0, 4, 4, 0]} name="Thermal" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Floor monitoring table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
          <div>
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">Floor Monitoring Snapshot</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Live floor utility readings with status flags</p>
          </div>
          <UpdatingBadge show={isRefreshing} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                {['Floor', 'Electricity', 'Water', 'Thermal', 'Status'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isInitialLoading ? (
                <TableLoadingRow colSpan={5} />
              ) : recentFloors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No floor monitoring data available yet.</td>
                </tr>
              ) : recentFloors.map((row) => (
                <tr key={row.floor} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{row.floor}</td>
                  <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-200">{Number(row.electricity || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-200">{Number(row.water || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-200">{Number(row.thermal || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap ${floorStatusCls[row.status] || floorStatusCls.normal}`}>
                      {row.status === 'alert' && <AlertTriangle className="w-3 h-3" />}
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live alerts + Maintenance tickets */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Live alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-md overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">Live Alerts</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Current anomaly and flagged floors</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className={`rounded-xl border px-4 py-3 ${
              monitoring.anomaly?.severity === 'alert'
                ? 'border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-700/40'
                : monitoring.anomaly?.severity === 'high'
                  ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700/40'
                  : 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700/40'
            }`}>
              <p className="font-semibold text-slate-800 dark:text-white">{monitoring.anomaly?.title || 'No anomaly detected'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {monitoring.anomaly?.message || 'All monitored floors are within expected ranges.'}
              </p>
            </div>
            {activeAlerts.length === 0 ? (
              <p className="text-sm text-slate-400">No active floor alerts right now.</p>
            ) : activeAlerts.slice(0, 4).map((row) => (
              <div key={row.floor} className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{row.floor}</p>
                  <p className="text-[11px] text-slate-400">
                    Electric {Number(row.electricity || 0).toLocaleString()} · Water {Number(row.water || 0).toLocaleString()} · Thermal {Number(row.thermal || 0).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${floorStatusCls[row.status] || floorStatusCls.normal}`}>
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance tickets */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-md overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">Recent Maintenance</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Latest facility tickets and status</p>
            </div>
            <button
              onClick={() => setShowTicketForm((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Create Ticket</span>
            </button>
          </div>

          {showTicketForm && (
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-4">
              <input
                value={ticketForm.title}
                onChange={(e) => setTicketForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Issue title"
                className={inputCls}
              />
              <div className="grid grid-cols-2 gap-3">
                <select value={ticketForm.type} onChange={(e) => setTicketForm((prev) => ({ ...prev, type: e.target.value }))} className={inputCls}>
                  {['Electrical', 'Plumbing', 'Thermal', 'HVAC', 'Structural', 'Other'].map((t) => <option key={t}>{t}</option>)}
                </select>
                <select value={ticketForm.priority} onChange={(e) => setTicketForm((prev) => ({ ...prev, priority: e.target.value }))} className={inputCls}>
                  {['low', 'medium', 'high', 'critical'].map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={ticketForm.technician} onChange={(e) => setTicketForm((prev) => ({ ...prev, technician: e.target.value }))} className={inputCls}>
                  {TECHNICIANS.map((t) => <option key={t}>{t}</option>)}
                </select>
                <button
                  onClick={handleCreateTicket}
                  disabled={maintenance.saving}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all disabled:opacity-50"
                >
                  {maintenance.saving ? 'Creating...' : 'Save Ticket'}
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 380 }}>
            <table className="w-full text-xs min-w-[560px]">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur border-b border-slate-100 dark:border-slate-800">
                <tr>
                  {['ID', 'Issue', 'Type', 'Technician', 'Status', 'Date'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">No maintenance tickets yet.</td>
                  </tr>
                ) : recentTickets.map((ticket) => (
                  <tr key={ticket.ticket_id || ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">{ticket.id}</td>
                    <td className="px-4 py-3 max-w-[150px]">
                      <p className="truncate font-medium text-slate-700 dark:text-slate-200">{ticket.title}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{ticket.type}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{ticket.technician || 'Unassigned'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={ticket.status}
                        onChange={(e) => handleTicketStatus(ticket.ticket_id, e.target.value)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border-0 outline-none cursor-pointer ${ticketStatusCls[ticket.status] || ticketStatusCls.open}`}
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{ticket.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnnouncementPanel />
    </div>
  )
}
