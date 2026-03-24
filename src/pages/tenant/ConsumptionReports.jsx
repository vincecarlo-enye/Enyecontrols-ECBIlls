import { Zap, Droplets, Flame } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useUnitFilter } from '@/context/UnitFilterContext'
import { useAuth } from '@/context/AuthContext'
import UnitFilterBar from '@/components/common/UnitFilterBar'
import { MONTHLY_CONSUMPTION, getCombinedConsumption } from '@/utils/consumption'
import { usePageLoader } from '@/hooks/usePageLoader'
import { ReportsSkeleton } from '@/components/skeletons'

const TENANT_UNITS = ['12F-A', '12F-B']

const ttStyle = {
  contentStyle: { background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(226,232,240,0.8)', borderRadius: '10px', fontSize: '12px' },
}

function ChartCard({ title, subtitle, icon: Icon, gradient, glow, children }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-700/50 shadow-md`}>
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${glow} flex-shrink-0`}>
          <Icon className="w-4 h-4 text-white" strokeWidth={2} />
        </div>
        <div>
          <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">{title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function TenantConsumptionReports() {
  const loading = usePageLoader(700)
  const { user } = useAuth()
  const { selectedUnit } = useUnitFilter()

  if (loading) return <ReportsSkeleton />

  const data = selectedUnit === 'all'
    ? getCombinedConsumption(TENANT_UNITS)
    : (MONTHLY_CONSUMPTION[selectedUnit] || [])

  const totalElec = data.reduce((s, r) => s + r.electricity, 0)
  const totalWater = data.reduce((s, r) => s + r.water, 0)
  const totalThermal = data.reduce((s, r) => s + r.thermal, 0)

  const summaryCards = [
    { label: '6-Month Electricity', value: `${totalElec.toLocaleString()} kWh`, icon: Zap, grad: 'from-amber-500 to-amber-600', glow: 'shadow-amber-500/20' },
    { label: '6-Month Water', value: `${totalWater.toLocaleString()} m³`, icon: Droplets, grad: 'from-cyan-500 to-cyan-600', glow: 'shadow-cyan-500/20' },
    { label: '6-Month Thermal', value: `${totalThermal.toLocaleString()} kBTU`, icon: Flame, grad: 'from-rose-500 to-rose-600', glow: 'shadow-rose-500/20' },
  ]

  const unitLabel = selectedUnit === 'all' ? 'All Units' : `Unit ${selectedUnit}`

  return (
    <div className="space-y-5 animate-in">
      <div>
        <h1 className="font-display font-700 text-xl text-slate-800 dark:text-white">Consumption Reports</h1>
        <p className="text-sm text-slate-400 mt-0.5">Monthly utility consumption trends · {unitLabel}</p>
      </div>

      <UnitFilterBar />

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={s.label} className={`glass rounded-2xl p-4 shadow-lg ${s.glow} card-hover stagger-${i + 1} animate-in`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">{s.label}</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{s.value}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Last 6 months · {unitLabel}</p>
                </div>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

      {/* Electricity Chart */}
      <ChartCard
        title="Electricity Usage"
        subtitle={`Monthly consumption (kWh) · ${unitLabel}`}
        icon={Zap}
        gradient="from-amber-500 to-amber-600"
        glow="shadow-amber-500/30"
      >
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="elecGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip {...ttStyle} formatter={(v) => [`${v.toLocaleString()} kWh`, 'Electricity']} />
            <Area type="monotone" dataKey="electricity" stroke="#f59e0b" strokeWidth={2.5} fill="url(#elecGrad)" dot={{ fill: '#f59e0b', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Water Chart */}
      <ChartCard
        title="Water Usage"
        subtitle={`Monthly consumption (m³) · ${unitLabel}`}
        icon={Droplets}
        gradient="from-cyan-500 to-cyan-600"
        glow="shadow-cyan-500/30"
      >
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip {...ttStyle} formatter={(v) => [`${v.toLocaleString()} m³`, 'Water']} />
            <Area type="monotone" dataKey="water" stroke="#06b6d4" strokeWidth={2.5} fill="url(#waterGrad)" dot={{ fill: '#06b6d4', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Thermal Chart */}
      <ChartCard
        title="Thermal Energy Usage"
        subtitle={`Monthly consumption (kBTU/h) · ${unitLabel}`}
        icon={Flame}
        gradient="from-rose-500 to-rose-600"
        glow="shadow-rose-500/30"
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barSize={20} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip {...ttStyle} formatter={(v) => [`${v.toLocaleString()} kBTU/h`, 'Thermal']} />
            <Bar dataKey="thermal" name="Thermal Energy" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Combined Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-700/50 shadow-md">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">Combined Overview</h2>
          <p className="text-xs text-slate-400 mt-0.5">All utilities side by side · {unitLabel}</p>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} barSize={14} barGap={3} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip {...ttStyle} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="electricity" name="Electricity (kWh)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="water" name="Water (m³)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="thermal" name="Thermal (kBTU/h)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
    </div>
  )
}
