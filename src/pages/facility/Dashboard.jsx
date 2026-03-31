import { useMemo, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  Activity, AlertTriangle, BarChart3, Building2, Droplets, Flame, Gauge, Plus, Wrench, Zap,
} from 'lucide-react'
import DashboardCard from '@/components/ui/DashboardCard'
import ChartCard from '@/components/ui/ChartCard'
import AnnouncementPanel from '@/components/common/AnnouncementPanel'
import { usePageLoader } from '@/hooks/usePageLoader'
import { FacilityDashboardSkeleton } from '@/components/skeletons'
import { useFacilityMonitoring } from '@/hooks/facilityHooks/useFacilityMonitoring'
import { useFacilityConsumption } from '@/hooks/facilityHooks/useFacilityConsumption'
import { useFacilityMaintenance } from '@/hooks/facilityHooks/useFacilityMaintenance'
import { useFacilityEquipment } from '@/hooks/facilityHooks/useFacilityEquipment'
import { useApp } from '@/context/AppContext'

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

export default function FacilityDashboard() {
  const pageLoading = usePageLoader(800)
  const { addToast } = useApp()
  const [filter, setFilter] = useState('Monthly')
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [ticketForm, setTicketForm] = useState(EMPTY_TICKET)

  const monitoring = useFacilityMonitoring()
  const consumption = useFacilityConsumption()
  const maintenance = useFacilityMaintenance()
  const equipment = useFacilityEquipment()

  const loadingState = pageLoading || monitoring.loading || consumption.loading || maintenance.loading || equipment.loading

  const chartData = useMemo(() => mapTrendData(filter, consumption.trendData), [filter, consumption.trendData])
  const comparisonData = useMemo(() => chartData.map((row) => ({
    t: row.t,
    electricity: row.electricity,
    water: row.water,
    thermal: row.thermal,
  })), [chartData])

  const activeAlerts = monitoring.floorData.filter((row) => row.status === 'alert' || row.status === 'high')
  const recentTickets = maintenance.tickets.slice(0, 6)
  const recentFloors = monitoring.floorData.slice(0, 6)

  if (loadingState) return <FacilityDashboardSkeleton />

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

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryTop.map((card, index) => (
          <DashboardCard key={card.label} icon={card.icon} title={card.label} value={card.value} sub={card.sub} badge={card.trend} badgeUp={card.trendUp} gradient={card.gradient} glow={card.shadow} className={`stagger-${index + 1} animate-in`} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {summaryToday.map((card, index) => (
          <DashboardCard key={card.label} icon={card.icon} title={card.label} value={card.value} sub={card.sub} badge={card.trend} badgeUp={card.trendUp} gradient={card.gradient} glow={card.shadow} className={`stagger-${index + 1} animate-in`} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Electricity Consumption" subtitle={`${filter} kWh trend`} accentHex="#f59e0b">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="facilityElec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip />
              <Area type="monotone" dataKey="electricity" stroke="#f59e0b" strokeWidth={2.5} fill="url(#facilityElec)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Water Consumption" subtitle={`${filter} m3 trend`} accentHex="#06b6d4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip />
              <Bar dataKey="water" fill="#06b6d4" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <ChartCard className="lg:col-span-2" title="Thermal Energy" subtitle={`${filter} thermal trend`} accentHex="#f43f5e">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="facilityThermal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip />
              <Area type="monotone" dataKey="thermal" stroke="#f43f5e" strokeWidth={2.5} fill="url(#facilityThermal)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard className="lg:col-span-3" title="Utility Comparison" subtitle={`${filter} comparison`} action={<BarChart3 className="w-4 h-4 text-slate-400" />}>
          <ResponsiveContainer width="100%" height={232}>
            <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="electricity" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Electricity" />
              <Bar dataKey="water" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Water" />
              <Bar dataKey="thermal" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Thermal" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

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
