import { memo, useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BarChart2,
  Building2,
  Gauge,
  Globe,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { DashboardSkeleton } from '@/components/skeletons'
import UtilityCard from '@/components/common/UtilityCard'
import BillsTable from '@/components/billing/BillsTable'
import BillViewerModal from '@/components/billing/BillViewerModal'
import ChartCard from '@/components/ui/ChartCard'
import MeterOverviewPanel from '@/components/meters/MeterOverviewPanel'
import SummaryCardStrip from '@/components/dashboard/SummaryCardStrip'
import PageSection from '@/components/layout/PageSection'
import {
  CHART_AXIS_TICK,
  CHART_GRID_PROPS,
  CHART_MARGIN_COMPACT,
  ThemedChartTooltip,
  formatChartNumber,
} from '@/components/charts/rechartsTheme.jsx'
import utilitiesData from '@/data/mock/utilities.json'
import { useBills } from '@/components/billing/hooks/useBills'
import { useModalState } from '@/hooks/useModalState'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'

const { stats: utilityStats, electricityDaily, waterDaily, thermalDaily } = utilitiesData

const comparisonColors = {
  electricity: '#f59e0b',
  water: '#06b6d4',
  thermal: '#f43f5e',
}

const RATE_CARDS = [
  {
    type: 'electricity',
    label: 'Electricity',
    panel: 'border-amber-200 bg-amber-50 dark:border-amber-700/50 dark:bg-amber-900/20',
    value: 'text-amber-700 dark:text-amber-300',
  },
  {
    type: 'water',
    label: 'Water',
    panel: 'border-cyan-200 bg-cyan-50 dark:border-cyan-700/50 dark:bg-cyan-900/20',
    value: 'text-cyan-700 dark:text-cyan-300',
  },
  {
    type: 'thermal',
    label: 'Thermal',
    panel: 'border-rose-200 bg-rose-50 dark:border-rose-700/50 dark:bg-rose-900/20',
    value: 'text-rose-700 dark:text-rose-300',
  },
]

const MemoCharts = memo(function Charts() {
  const comparisonData = useMemo(
    () =>
      electricityDaily.map((item, index) => ({
        day: item.day,
        electricity: Number(item.usage || 0),
        water: Number(waterDaily?.[index]?.usage || 0),
        thermal: Number(thermalDaily?.[index]?.usage || 0),
      })),
    []
  )

  const totals = comparisonData.reduce(
    (acc, row) => {
      acc.electricity += row.electricity
      acc.water += row.water
      acc.thermal += row.thermal
      return acc
    },
    { electricity: 0, water: 0, thermal: 0 }
  )

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-5">
        <ChartCard className="lg:col-span-3" title="7-Day Utility Comparison" subtitle="Cross-utility usage comparison across the last 7 days">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={comparisonData} barGap={6} margin={CHART_MARGIN_COMPACT}>
              <CartesianGrid {...CHART_GRID_PROPS} />
              <XAxis dataKey="day" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip content={<ThemedChartTooltip formatter={(value, name) => [formatChartNumber(value), name]} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="electricity" fill={comparisonColors.electricity} radius={[6, 6, 0, 0]} name="Electricity" />
              <Bar dataKey="water" fill={comparisonColors.water} radius={[6, 6, 0, 0]} name="Water" />
              <Bar dataKey="thermal" fill={comparisonColors.thermal} radius={[6, 6, 0, 0]} name="Thermal" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard className="lg:col-span-2" title="Usage Trend Mix" subtitle="Relative movement of all utilities through the week">
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Electricity', value: totals.electricity, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: 'Water', value: totals.water, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
              { label: 'Thermal', value: totals.thermal, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl px-3 py-2 text-center ${item.bg}`}>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{item.label}</p>
                <p className={`text-sm font-bold ${item.color}`}>{Math.round(item.value).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={comparisonData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="saElectric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="saWater" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="saThermal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...CHART_GRID_PROPS} />
              <XAxis dataKey="day" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip content={<ThemedChartTooltip formatter={(value, name) => [formatChartNumber(value), name]} />} />
              <Area type="monotone" dataKey="electricity" stroke="#f59e0b" fill="url(#saElectric)" strokeWidth={2.2} />
              <Area type="monotone" dataKey="water" stroke="#06b6d4" fill="url(#saWater)" strokeWidth={2.2} />
              <Area type="monotone" dataKey="thermal" stroke="#f43f5e" fill="url(#saThermal)" strokeWidth={2.2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <MeterOverviewPanel />
    </>
  )
})

export default function SuperAdminDashboard() {
  const loading = usePageLoader(700)
  const { bills } = useBills()
  const { tenants, meters, billingRates } = useApp()
  const { users } = useAuth()
  const viewer = useModalState()

  if (loading) return <DashboardSkeleton />

  const totalRevenue = bills.filter((bill) => bill.status === 'paid').reduce((sum, bill) => sum + bill.amount, 0)
  const unpaidCount = bills.filter((bill) => ['published', 'overdue'].includes(bill.status)).length
  const activeTenants = tenants.filter((tenant) => tenant.status === 'active').length
  const activeMeters = meters.filter((meter) => meter.status === 'active').length
  const totalUsers = users?.length || 0

  const kpi = [
    { title: 'Total Revenue', value: `PHP ${totalRevenue.toLocaleString()}`, sub: 'All paid bills', icon: TrendingUp, gradient: 'from-blue-500 to-blue-600', glow: 'shadow-blue-500/25' },
    { title: 'Active Tenants', value: activeTenants, sub: 'of all units occupied', icon: Users, gradient: 'from-indigo-500 to-indigo-600', glow: 'shadow-indigo-500/25' },
    { title: 'Active Meters', value: activeMeters, sub: 'across all units', icon: Gauge, gradient: 'from-violet-500 to-violet-600', glow: 'shadow-violet-500/25' },
    { title: 'Unpaid Bills', value: unpaidCount, sub: 'Requires attention', icon: BarChart2, gradient: 'from-rose-500 to-rose-600', glow: 'shadow-rose-500/25' },
    { title: 'System Users', value: totalUsers, sub: 'All roles', icon: Shield, gradient: 'from-emerald-500 to-emerald-600', glow: 'shadow-emerald-500/25' },
    { title: 'Building Floors', value: '15', sub: 'Floors managed', icon: Building2, gradient: 'from-cyan-500 to-cyan-600', glow: 'shadow-cyan-500/25' },
  ]

  return (
    <PageSection variant="dark">
      <div className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-600/10 to-indigo-600/10 px-5 py-3.5 dark:border-violet-700/40">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 shadow-lg shadow-violet-500/30">
          <Shield className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display text-[15px] font-700 text-violet-700 dark:text-violet-300">System Overview</p>
            <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2 py-0.5 text-[9px] font-bold text-white">
              <Globe className="h-2.5 w-2.5" />
              System-wide
            </span>
          </div>
          <p className="text-xs text-violet-500 dark:text-violet-400">Viewing all tenants, meters, and consumption data across the entire building.</p>
        </div>
      </div>

      <SummaryCardStrip cards={kpi} />

      <div>
        <h2 className="section-title mb-3">Current Billing Rates</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {RATE_CARDS.map(({ type, label, panel, value }) => {
            const rate = billingRates?.[type]

            return rate ? (
              <div key={type} className={`rounded-2xl border p-4 ${panel}`}>
                <p className="mb-1 text-xs font-mono uppercase tracking-wider text-slate-400">{label} Rate</p>
                <p className={`text-2xl font-display font-700 ${value}`}>PHP {rate.rate?.toFixed(2)}</p>
                <p className="text-xs text-slate-400">{rate.unit}</p>
              </div>
            ) : null
          })}
        </div>
      </div>

      <div>
        <h2 className="section-title mb-3">System Utility Consumption</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <UtilityCard type="electricity" {...utilityStats.electricity} />
          <UtilityCard type="thermal" {...utilityStats.thermal} />
          <UtilityCard type="water" {...utilityStats.water} />
        </div>
      </div>

      <MemoCharts />

      <BillsTable onView={(bill) => viewer.open(bill)} />
      <BillViewerModal bill={viewer.selectedItem} isOpen={viewer.isOpen} onClose={viewer.close} />
    </PageSection>
  )
}
