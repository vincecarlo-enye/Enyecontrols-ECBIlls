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
import SummaryCardStrip from '@/components/dashboard/SummaryCardStrip'
import { usePageLoader } from '@/hooks/usePageLoader'
import { FacilityDashboardSkeleton } from '@/components/skeletons'
import { useFacilityMonitoring } from '@/hooks/facilityHooks/useFacilityMonitoring'
import { useFacilityConsumption } from '@/hooks/facilityHooks/useFacilityConsumption'
import { useFacilityMaintenance } from '@/hooks/facilityHooks/useFacilityMaintenance'
import { useFacilityEquipment } from '@/hooks/facilityHooks/useFacilityEquipment'
import { useApp } from '@/context/AppContext'
import { useTheme } from '@/context/ThemeContext'
import {
  CHART_AXIS_TICK,
  CHART_AXIS_TICK_SM,
  CHART_GRID_PROPS_LIGHT,
  CHART_MARGIN_STANDARD,
  ThemedChartTooltip,
  formatChartNumber,
} from '@/components/charts/rechartsTheme.jsx'

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all'

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
const STATUS_COLORS = {
  online: '#10b981',
  warning: '#f59e0b',
  offline: '#ef4444',
}
const UTILITY_FOCUS = {
  all: {
    label: 'All',
    series: ['electricity', 'water', 'thermal'],
    color: '#3b82f6',
  },
  electricity: {
    label: 'Electricity',
    series: ['electricity'],
    color: '#f59e0b',
  },
  water: {
    label: 'Water',
    series: ['water'],
    color: '#06b6d4',
  },
  thermal: {
    label: 'Thermal',
    series: ['thermal'],
    color: '#f43f5e',
  },
}

function mapTrendData(filter, trendData) {
  if (!Array.isArray(trendData)) return []

  if (filter === 'Daily') {
    return trendData.map((row) => ({
      t: row.day,
      electricity: Number(row.electricity || 0),
      water: Number(row.water || 0),
      thermal: Number(row.thermal || 0),
    }))
  }

  if (filter === 'Monthly') {
    const total = trendData.reduce((acc, row) => {
      acc.electricity += Number(row.electricity || 0)
      acc.water += Number(row.water || 0)
      acc.thermal += Number(row.thermal || 0)
      return acc
    }, { electricity: 0, water: 0, thermal: 0 })

    const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
    return labels.map((label, index) => ({
      t: label,
      electricity: Math.round(total.electricity / 4 * (index === 3 ? 1.1 : 0.95)),
      water: Math.round(total.water / 4 * (index === 3 ? 1.08 : 0.96)),
      thermal: Math.round(total.thermal / 4 * (index === 3 ? 1.06 : 0.97)),
    }))
  }

  const total = trendData.reduce((acc, row) => {
    acc.electricity += Number(row.electricity || 0)
    acc.water += Number(row.water || 0)
    acc.thermal += Number(row.thermal || 0)
    return acc
  }, { electricity: 0, water: 0, thermal: 0 })

  return ['Q1', 'Q2', 'Q3', 'Q4'].map((label, index) => ({
    t: label,
    electricity: Math.round(total.electricity * (0.7 + index * 0.1)),
    water: Math.round(total.water * (0.68 + index * 0.1)),
    thermal: Math.round(total.thermal * (0.72 + index * 0.08)),
  }))
}

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

function buildMaintenanceTrend(filter, tickets) {
  const now = new Date()
  const normalized = Array.isArray(tickets) ? tickets : []

  if (filter === 'Daily') {
    const labels = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now)
      date.setDate(now.getDate() - (6 - index))
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

  if (filter === 'Monthly') {
    return Array.from({ length: 4 }, (_, index) => {
      const bucket = { t: `Week ${index + 1}`, open: 0, inProgress: 0, resolved: 0 }
      normalized.forEach((ticket, ticketIndex) => {
        const weekIndex = ticketIndex % 4
        if (weekIndex !== index) return
        if (ticket.status === 'resolved') bucket.resolved += 1
        else if (ticket.status === 'in-progress') bucket.inProgress += 1
        else bucket.open += 1
      })
      return bucket
    })
  }

  return Array.from({ length: 4 }, (_, index) => {
    const bucket = { t: `Q${index + 1}`, open: 0, inProgress: 0, resolved: 0 }
    normalized.forEach((ticket, ticketIndex) => {
      const quarterIndex = ticketIndex % 4
      if (quarterIndex !== index) return
      if (ticket.status === 'resolved') bucket.resolved += 1
      else if (ticket.status === 'in-progress') bucket.inProgress += 1
      else bucket.open += 1
    })
    return bucket
  })
}

export default function FacilityDashboard() {
  const pageLoading = usePageLoader(800)
  const { addToast } = useApp()
  const { isDark } = useTheme()
  const [filter, setFilter] = useState('Monthly')
  const [utilityFocus, setUtilityFocus] = useState('all')
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [ticketForm, setTicketForm] = useState(EMPTY_TICKET)

  const monitoring = useFacilityMonitoring()
  const consumption = useFacilityConsumption()
  const maintenance = useFacilityMaintenance()
  const equipment = useFacilityEquipment()

  const coreLoading = pageLoading
    || (monitoring.loading && monitoring.floorData.length === 0 && monitoring.liveData.length === 0 && !monitoring.error)
    || (consumption.loading && consumption.trendData.length === 0 && !consumption.error)

  const chartData = useMemo(() => mapTrendData(filter, consumption.trendData), [filter, consumption.trendData])
  const activeAlerts = monitoring.floorData.filter((row) => row.status === 'alert' || row.status === 'high')
  const recentTickets = maintenance.tickets.slice(0, 6)
  const recentFloors = monitoring.floorData.slice(0, 6)
  const utilityMeters = {
    electric: {
      usage: consumption.summary.electricity,
      estimatedCost: consumption.summary.electricity,
      trend: monitoring.trend,
      unit: 'kWh',
    },
    water: {
      usage: consumption.summary.water,
      estimatedCost: consumption.summary.water,
      trend: activeAlerts.filter((row) => row.status === 'high').length || 0,
      unit: 'm3',
    },
    thermal: {
      usage: consumption.summary.thermal,
      estimatedCost: consumption.summary.thermal,
      trend: monitoring.anomaly?.severity === 'alert' ? 4.5 : monitoring.anomaly?.severity === 'high' ? 2.1 : -1.2,
      unit: 'BTU',
    },
  }

  const utilityTrendData = useMemo(() => (
    chartData.map((row) => ({
      ...row,
      combined: safeNumber(row.electricity) + safeNumber(row.water) + safeNumber(row.thermal),
    }))
  ), [chartData])

  const utilityDistributionData = useMemo(() => ([
    { name: 'Electricity', value: safeNumber(consumption.summary.electricity), color: '#f59e0b' },
    { name: 'Water', value: safeNumber(consumption.summary.water), color: '#06b6d4' },
    { name: 'Thermal', value: safeNumber(consumption.summary.thermal), color: '#f43f5e' },
  ]), [consumption.summary.electricity, consumption.summary.water, consumption.summary.thermal])

  const anomalyTrendData = useMemo(() => {
    const averages = utilityTrendData.reduce((acc, row) => ({
      electricity: acc.electricity + safeNumber(row.electricity),
      water: acc.water + safeNumber(row.water),
      thermal: acc.thermal + safeNumber(row.thermal),
    }), { electricity: 0, water: 0, thermal: 0 })

    const count = utilityTrendData.length || 1
    const mean = {
      electricity: averages.electricity / count,
      water: averages.water / count,
      thermal: averages.thermal / count,
    }

    return utilityTrendData.map((row) => {
      const warningCount = [
        safeNumber(row.electricity) > mean.electricity * 1.08,
        safeNumber(row.water) > mean.water * 1.08,
        safeNumber(row.thermal) > mean.thermal * 1.08,
      ].filter(Boolean).length
      const criticalCount = [
        safeNumber(row.electricity) > mean.electricity * 1.18,
        safeNumber(row.water) > mean.water * 1.18,
        safeNumber(row.thermal) > mean.thermal * 1.18,
      ].filter(Boolean).length

      return {
        t: row.t,
        warnings: warningCount,
        critical: criticalCount,
      }
    })
  }, [utilityTrendData])

  const maintenanceTrendData = useMemo(
    () => buildMaintenanceTrend(filter, maintenance.tickets),
    [filter, maintenance.tickets],
  )

  const equipmentStatusData = useMemo(() => ([
    { name: 'Online', value: equipment.stats.online, color: STATUS_COLORS.online },
    { name: 'Warning', value: equipment.stats.warning, color: STATUS_COLORS.warning },
    { name: 'Offline', value: equipment.stats.offline, color: STATUS_COLORS.offline },
  ]), [equipment.stats.offline, equipment.stats.online, equipment.stats.warning])

  const equipmentAttentionList = useMemo(() => (
    equipment.meters
      .filter((meter) => meter.status === 'offline' || meter.status === 'warning')
      .slice(0, 4)
      .map((meter, index) => ({
        id: meter.id || meter.meter_id || index,
        label: meter.name || meter.meter_name || meter.serial_number || `Meter ${index + 1}`,
        location: meter.location || meter.floor || meter.zone || 'Facility zone',
        status: meter.status || 'warning',
        lastReading: meter.last_reading_at || meter.lastReading || meter.last_reading || 'No recent reading',
      }))
  ), [equipment.meters])

  const areaComparisonData = useMemo(() => (
    monitoring.floorData
      .map((row, index) => ({
        name: row.floor || row.zone || row.area || `Area ${index + 1}`,
        electricity: safeNumber(row.electricity),
        water: safeNumber(row.water),
        thermal: safeNumber(row.thermal),
        total: safeNumber(row.electricity) + safeNumber(row.water) + safeNumber(row.thermal),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
  ), [monitoring.floorData])

  if (coreLoading) return <FacilityDashboardSkeleton />

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
      value: `${Math.round(consumption.summary.electricity).toLocaleString()} kWh`,
      icon: Zap,
      gradient: 'from-yellow-400 to-amber-500',
      shadow: 'shadow-yellow-500/25',
      trend: `${Math.round(monitoring.currentLoad)}% system load`,
      trendUp: monitoring.trend > 0,
      sub: 'Rolling 24h estimate',
    },
    {
      label: 'Water Today',
      value: `${Math.round(consumption.summary.water).toLocaleString()} m3`,
      icon: Droplets,
      gradient: 'from-cyan-500 to-blue-500',
      shadow: 'shadow-cyan-500/25',
      trend: `${activeAlerts.filter((row) => row.status === 'high').length} floors high`,
      trendUp: activeAlerts.filter((row) => row.status === 'high').length > 0,
      sub: 'Rolling 24h estimate',
    },
    {
      label: 'Thermal Energy',
      value: `${Math.round(consumption.summary.thermal).toLocaleString()} kBTU/h`,
      icon: Flame,
      gradient: 'from-rose-400 to-red-500',
      shadow: 'shadow-rose-500/25',
      trend: monitoring.anomaly?.severity === 'alert' ? 'Above average' : 'Stable',
      trendUp: monitoring.anomaly?.severity === 'alert',
      sub: monitoring.anomaly?.title || 'No anomaly detected',
    },
  ]

  return (
    <div className="section-gap animate-in pb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-500" />Facility Dashboard</h1>
          <p className="muted-text mt-0.5">Real-time building operations and utility monitoring</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Live</span>
          </div>
          <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            {['Daily', 'Monthly', 'Yearly'].map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-2 text-sm font-medium transition-all ${filter === value ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(monitoring.error || consumption.error || maintenance.error || equipment.error) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {monitoring.error || consumption.error || maintenance.error || equipment.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <UtilityCard type="electric" {...utilityMeters.electric} />
        <UtilityCard type="thermal" {...utilityMeters.thermal} />
        <UtilityCard type="water" {...utilityMeters.water} />
      </div>

      <SummaryCardStrip cards={[...summaryTop, ...summaryToday]} />

      <div className="grid gap-4 lg:grid-cols-5">
        <ChartCard
          className="lg:col-span-3"
          title="Utility Consumption Trend"
          subtitle={`${filter} operational view across facility utilities`}
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
                <Tooltip
                  content={(
                    <ThemedChartTooltip
                      isDark={isDark}
                      formatter={(value, name) => [formatChartNumber(value), name]}
                    />
                  )}
                />
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
                <Tooltip
                  content={(
                    <ThemedChartTooltip
                      isDark={isDark}
                      formatter={(value, name) => [formatChartNumber(value), name]}
                    />
                  )}
                />
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
          subtitle="Current utility mix across the facility"
        >
          <div className="flex flex-col gap-4 lg:h-[240px] lg:flex-row lg:items-center">
            <div className="h-[190px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={utilityDistributionData} dataKey="value" cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3}>
                    {utilityDistributionData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={(
                      <ThemedChartTooltip
                        isDark={isDark}
                        formatter={(value, name) => [formatChartNumber(value), name]}
                      />
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {utilityDistributionData.map((item, index) => {
                const share = distributionTotal ? Math.round((item.value / distributionTotal) * 100) : 0
                return (
                  <div key={item.name} className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-[#090c13]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{share}%</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{formatChartNumber(item.value)} total load</span>
                      <span>{item.name === 'Water' ? 'm3' : item.name === 'Thermal' ? 'BTU' : 'kWh'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <ChartCard
          className="xl:col-span-4"
          title="Anomaly / Alert Trend"
          subtitle="Warning and critical event pressure across the selected window"
          accentHex="#ef4444"
        >
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={anomalyTrendData} margin={CHART_MARGIN_STANDARD}>
              <CartesianGrid {...CHART_GRID_PROPS_LIGHT} />
              <XAxis dataKey="t" tick={CHART_AXIS_TICK} />
              <YAxis allowDecimals={false} tick={CHART_AXIS_TICK} />
              <Tooltip
                content={(
                  <ThemedChartTooltip
                    isDark={isDark}
                    formatter={(value, name) => [formatChartNumber(value), name]}
                  />
                )}
              />
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
                  }`}
                  >
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
          subtitle="Flow of open, in-progress, and resolved requests"
          accentHex="#8b5cf6"
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={maintenanceTrendData} margin={CHART_MARGIN_STANDARD}>
              <CartesianGrid {...CHART_GRID_PROPS_LIGHT} />
              <XAxis dataKey="t" tick={CHART_AXIS_TICK} />
              <YAxis allowDecimals={false} tick={CHART_AXIS_TICK} />
              <Tooltip
                content={(
                  <ThemedChartTooltip
                    isDark={isDark}
                    formatter={(value, name) => [formatChartNumber(value), name]}
                  />
                )}
              />
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

      <ChartCard
        title="Building / Floor / Zone Comparison"
        subtitle="Top monitored areas by combined utility demand"
        accentHex="#0ea5e9"
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={areaComparisonData} layout="vertical" margin={{ top: 5, right: 24, left: 24, bottom: 0 }}>
            <CartesianGrid {...CHART_GRID_PROPS_LIGHT} />
            <XAxis type="number" tick={CHART_AXIS_TICK} tickFormatter={formatChartNumber} />
            <YAxis type="category" dataKey="name" tick={CHART_AXIS_TICK} width={86} />
            <Tooltip
              content={(
                <ThemedChartTooltip
                  isDark={isDark}
                  formatter={(value, name) => [formatChartNumber(value), name]}
                />
              )}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="electricity" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Electricity" />
            <Bar dataKey="water" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Water" />
            <Bar dataKey="thermal" fill="#f43f5e" radius={[0, 4, 4, 0]} name="Thermal" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
          <div>
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">Floor Monitoring Snapshot</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Live floor utility readings with status flags</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                {['Floor', 'Electricity', 'Water', 'Thermal', 'Status'].map((header) => (
                  <th key={header} className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentFloors.length === 0 ? (
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

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-md overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">Live Alerts</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Current anomaly and flagged floors</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className={`rounded-xl border px-4 py-3 ${monitoring.anomaly?.severity === 'alert' ? 'border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-700/40' : monitoring.anomaly?.severity === 'high' ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700/40' : 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700/40'}`}>
              <p className="font-semibold text-slate-800 dark:text-white">{monitoring.anomaly?.title || 'No anomaly detected'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{monitoring.anomaly?.message || 'All monitored floors are within expected ranges.'}</p>
            </div>
            {activeAlerts.length === 0 ? (
              <p className="text-sm text-slate-400">No active floor alerts right now.</p>
            ) : activeAlerts.slice(0, 4).map((row) => (
              <div key={row.floor} className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{row.floor}</p>
                  <p className="text-[11px] text-slate-400">Electric {Number(row.electricity || 0).toLocaleString()} · Water {Number(row.water || 0).toLocaleString()} · Thermal {Number(row.thermal || 0).toLocaleString()}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${floorStatusCls[row.status] || floorStatusCls.normal}`}>{row.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-md overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">Recent Maintenance</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Latest facility tickets and status</p>
            </div>
            <button onClick={() => setShowTicketForm((value) => !value)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-all">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Create Ticket</span>
            </button>
          </div>

          {showTicketForm && (
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-4">
              <input value={ticketForm.title} onChange={(e) => setTicketForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Issue title" className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <select value={ticketForm.type} onChange={(e) => setTicketForm((prev) => ({ ...prev, type: e.target.value }))} className={inputCls}>
                  {['Electrical', 'Plumbing', 'Thermal', 'HVAC', 'Structural', 'Other'].map((type) => <option key={type}>{type}</option>)}
                </select>
                <select value={ticketForm.priority} onChange={(e) => setTicketForm((prev) => ({ ...prev, priority: e.target.value }))} className={inputCls}>
                  {['low', 'medium', 'high', 'critical'].map((priority) => <option key={priority}>{priority}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={ticketForm.technician} onChange={(e) => setTicketForm((prev) => ({ ...prev, technician: e.target.value }))} className={inputCls}>
                  {TECHNICIANS.map((technician) => <option key={technician}>{technician}</option>)}
                </select>
                <button onClick={handleCreateTicket} disabled={maintenance.saving} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all disabled:opacity-50">
                  {maintenance.saving ? 'Creating...' : 'Save Ticket'}
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 380 }}>
            <table className="w-full text-xs min-w-[560px]">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur border-b border-slate-100 dark:border-slate-800">
                <tr>{['ID', 'Issue', 'Type', 'Technician', 'Status', 'Date'].map((header) => (
                  <th key={header} className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap">{header}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">No maintenance tickets yet.</td>
                  </tr>
                ) : recentTickets.map((ticket) => (
                  <tr key={ticket.ticket_id || ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">{ticket.id}</td>
                    <td className="px-4 py-3 max-w-[150px]"><p className="truncate font-medium text-slate-700 dark:text-slate-200">{ticket.title}</p></td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{ticket.type}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{ticket.technician || 'Unassigned'}</td>
                    <td className="px-4 py-3">
                      <select value={ticket.status} onChange={(e) => handleTicketStatus(ticket.ticket_id, e.target.value)} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border-0 outline-none cursor-pointer ${ticketStatusCls[ticket.status] || ticketStatusCls.open}`}>
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
