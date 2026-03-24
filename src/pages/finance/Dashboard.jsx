import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard,
  FileText, CheckCircle2, Clock, Zap, Droplets, Flame,
  BarChart3, PieChart as PieIcon, Activity,
} from 'lucide-react'
import DashboardCard from '@/components/ui/DashboardCard'
import ChartCard from '@/components/ui/ChartCard'
import AnnouncementPanel from '@/components/common/AnnouncementPanel'
import { usePageLoader } from '@/hooks/usePageLoader'
import { FinanceDashboardSkeleton } from '@/components/skeletons'
import financeDashboardData from '@/data/financeDashboard.json'

// ─── MOCK DATA (loaded from JSON) ─────────────────────────────────────────────
const MONTHLY_REVENUE      = financeDashboardData.monthlyRevenue
const UTILITY_REVENUE      = financeDashboardData.utilityRevenue
const UTILITY_PIE          = financeDashboardData.utilityPie
const RECENT_TRANSACTIONS  = financeDashboardData.recentTransactions

// ─── STYLE HELPERS ─────────────────────────────────────────────────────────────

const STATUS_CLS = {
  Paid:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Pending: 'bg-amber-100   text-amber-700   dark:bg-amber-900/30   dark:text-amber-400',
  Overdue: 'bg-rose-100    text-rose-700    dark:bg-rose-900/30    dark:text-rose-400',
}

const UTILITY_COLOR = {
  Electricity: 'text-amber-600 dark:text-amber-400',
  Water:       'text-cyan-600  dark:text-cyan-400',
  Thermal:     'text-rose-600  dark:text-rose-400',
}

const UTILITY_ICON = {
  Electricity: Zap,
  Water:       Droplets,
  Thermal:     Flame,
}

const TOOLTIP_STYLE = {
  borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)', backgroundColor: '#fff',
}

const fmt = (n) => `₱${n.toLocaleString()}`

// ─── SUMMARY CARDS DATA ────────────────────────────────────────────────────────

const SUMMARY_CARDS = [
  {
    label: 'Total Revenue',
    value: '₱2,819,900',
    icon: DollarSign,
    gradient: 'from-blue-500 to-indigo-600',
    shadow: 'shadow-blue-500/25',
    trend: '+12.4% vs last year',
    trendUp: true,
    sub: 'Cumulative YTD 2026',
  },
  {
    label: 'Utility Revenue',
    value: '₱1,526,800',
    icon: Zap,
    gradient: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/25',
    trend: '+8.7% vs last month',
    trendUp: true,
    sub: 'Elec + Water + Thermal',
  },
  {
    label: 'Pending Payments',
    value: '₱143,210',
    icon: Clock,
    gradient: 'from-amber-400 to-yellow-500',
    shadow: 'shadow-yellow-500/25',
    trend: '28 open invoices',
    trendUp: true,
    sub: 'Requires follow-up',
  },
  {
    label: 'Paid Bills',
    value: '₱2,601,440',
    icon: CheckCircle2,
    gradient: 'from-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-500/25',
    trend: '342 transactions',
    trendUp: false,
    sub: 'Collected this year',
  },
  {
    label: 'Total Bills Generated',
    value: '1,248',
    icon: FileText,
    gradient: 'from-violet-500 to-purple-600',
    shadow: 'shadow-violet-500/25',
    trend: '+42 this month',
    trendUp: true,
    sub: 'Across all tenants',
  },
]

// ─── CUSTOM TOOLTIP ────────────────────────────────────────────────────────────

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-3 shadow-lg text-xs">
      <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500 dark:text-slate-400">{p.name}:</span>
          <span className="font-bold text-slate-700 dark:text-slate-200">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function FinanceDashboard() {
  const loading = usePageLoader(800)

  if (loading) return <FinanceDashboardSkeleton />

  const totalElec    = UTILITY_REVENUE.reduce((s, d) => s + d.electricity, 0)
  const totalWater   = UTILITY_REVENUE.reduce((s, d) => s + d.water, 0)
  const totalThermal = UTILITY_REVENUE.reduce((s, d) => s + d.thermal, 0)

  return (
    <div className="section-gap animate-in pb-4">

      {/* HEADER */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Finance Dashboard
          </h1>
          <p className="muted-text mt-0.5">Revenue analytics, billing insights &amp; financial performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">FY 2026</span>
          </div>
        </div>
      </div>

      {/* ROW 1 — SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {SUMMARY_CARDS.map(({ label, value, icon, gradient, shadow, trend, trendUp, sub }, i) => (
          <DashboardCard
            key={label}
            icon={icon}
            title={label}
            value={value}
            sub={sub}
            badge={trend}
            badgeUp={trendUp}
            gradient={gradient}
            glow={shadow}
            className={`stagger-${i+1} animate-in`}
          />
        ))}
      </div>

      {/* ROW 2 — MONTHLY REVENUE TREND (full width) */}
      <ChartCard
        title="Monthly Revenue Trend"
        subtitle="Total collected payments per month · FY 2026"
        action={<Activity className="w-4 h-4 text-blue-500" />}
        badge={
          <span className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <span className="w-3 h-1.5 rounded-full bg-blue-500 inline-block" />Revenue
            </span>
            <span className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400">
              <span className="w-3 h-1.5 rounded-full bg-rose-400 inline-block" />Expenses
            </span>
          </span>
        }
        badgeCls=""
      >
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.10} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₱${(v/1000).toFixed(0)}K`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Area type="monotone" dataKey="revenue"  stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradRev)" dot={false} name="Revenue" />
            <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2}   fill="url(#gradExp)" dot={false} name="Expenses" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ROW 3 — UTILITY REVENUE BAR + PIE */}
      <div className="grid lg:grid-cols-5 gap-4">

        {/* Utility Revenue Bar Chart */}
        <ChartCard
          className="lg:col-span-3"
          title="Utility Revenue Breakdown"
          subtitle="Monthly income by utility type"
          action={<BarChart3 className="w-4 h-4 text-slate-400" />}
        >
          {/* Totals row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Electricity', value: totalElec,    color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Zap },
              { label: 'Water',       value: totalWater,   color: 'text-cyan-600  dark:text-cyan-400',  bg: 'bg-cyan-50  dark:bg-cyan-900/20',  icon: Droplets },
              { label: 'Thermal',     value: totalThermal, color: 'text-rose-600  dark:text-rose-400',  bg: 'bg-rose-50  dark:bg-rose-900/20',  icon: Flame },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div key={label} className={`rounded-xl p-3 ${bg} text-center`}>
                <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{label}</p>
                <p className={`text-sm font-bold ${color}`}>{fmt(value)}</p>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={UTILITY_REVENUE} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `₱${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<CurrencyTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="electricity" fill="#f59e0b" radius={[4,4,0,0]} name="Electricity" />
              <Bar dataKey="water"       fill="#06b6d4" radius={[4,4,0,0]} name="Water" />
              <Bar dataKey="thermal"     fill="#f43f5e" radius={[4,4,0,0]} name="Thermal" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Utility Distribution Pie */}
        <ChartCard
          className="lg:col-span-2"
          title="Revenue Distribution"
          subtitle="Utility contribution percentage"
          action={<PieIcon className="w-4 h-4 text-slate-400" />}
        >
          <div className="flex-1 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  data={UTILITY_PIE}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {UTILITY_PIE.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, 'Share']} contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 w-full mt-2">
              {UTILITY_PIE.map(({ name, value, color }) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-slate-600 dark:text-slate-300">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
                    </div>
                    <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 w-8 text-right">{value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ROW 4 — REVENUE vs EXPENSES */}
      <ChartCard
        title="Revenue vs Expenses"
        subtitle="Monthly financial performance comparison · FY 2026"
        action={<TrendingUp className="w-4 h-4 text-emerald-500" />}
        badge={
          <div className="flex items-center gap-4 flex-wrap">
            {[
              { label: 'Total Revenue', value: '₱2,819,900', color: 'text-blue-600 dark:text-blue-400'  },
              { label: 'Total Expenses', value: '₱2,122,500', color: 'text-rose-600 dark:text-rose-400' },
              { label: 'Net Profit', value: '₱697,400',  color: 'text-emerald-600 dark:text-emerald-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-right">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{label}</p>
                <p className={`text-sm font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        }
        badgeCls=""
      >
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₱${(v/1000).toFixed(0)}K`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="revenue"  stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} name="Revenue" />
            <Line type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2}   dot={{ r: 4, fill: '#f43f5e' }} name="Expenses" strokeDasharray="5 4" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ROW 5 — RECENT TRANSACTIONS TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-500" />
              Recent Transactions
            </h2>
            <p className="muted-text mt-0.5">Latest payment records across all tenants and utilities</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Paid</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400  inline-block" />Pending</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400   inline-block" />Overdue</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                {['Transaction ID', 'Tenant Name', 'Unit', 'Utility Type', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} className={`px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap ${h === 'Status' ? 'text-center' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {RECENT_TRANSACTIONS.map(row => {
                const UIcon = UTILITY_ICON[row.utility]
                return (
                  <tr key={row.id} className="table-row-hover">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{row.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{row.tenant}</td>
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{row.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 text-[12px] font-medium ${UTILITY_COLOR[row.utility]}`}>
                        <UIcon className="w-3.5 h-3.5" />
                        {row.utility}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap tabular-nums">
                      {fmt(row.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap ${STATUS_CLS[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-[12px]">{row.date}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* Table footer summary */}
        <div className="flex items-center gap-6 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          {[
            { label: 'Paid',    count: RECENT_TRANSACTIONS.filter(t => t.status === 'Paid').length,    cls: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Pending', count: RECENT_TRANSACTIONS.filter(t => t.status === 'Pending').length, cls: 'text-amber-600   dark:text-amber-400' },
            { label: 'Overdue', count: RECENT_TRANSACTIONS.filter(t => t.status === 'Overdue').length, cls: 'text-rose-600    dark:text-rose-400' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5 text-[11px]">
              <span className={`font-bold text-sm ${s.cls}`}>{s.count}</span>
              <span className="text-slate-400">{s.label}</span>
            </div>
          ))}
          <span className="ml-auto text-[11px] text-slate-400">Showing {RECENT_TRANSACTIONS.length} most recent records</span>
        </div>
      </div>

      {/* Announcements */}
      <AnnouncementPanel />

    </div>
  )
}
