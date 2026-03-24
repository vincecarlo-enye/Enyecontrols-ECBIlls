import { useApp } from '@/context/AppContext'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  BarChart3, TrendingUp, DollarSign, AlertCircle, CheckCircle2,
  Zap, Droplets, Flame,
} from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { ReportsSkeleton } from '@/components/skeletons'
import financeReportsData from '@/data/financeReports.json'

const TOOLTIP_STYLE = {
  borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)', backgroundColor: '#fff',
}

const MONTHLY        = financeReportsData.monthly
const UTILITY_BY_MONTH = financeReportsData.utilityByMonth
const UTILITY_PIE    = financeReportsData.utilityPie

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-3 shadow-lg text-xs">
      <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-700 dark:text-slate-200">₱{Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export default function FinanceReports() {
  const loading = usePageLoader(700)
  const { bills } = useApp()

  if (loading) return <ReportsSkeleton />

  const totalRevenue   = MONTHLY.reduce((s, d) => s + d.revenue, 0)
  const totalExpenses  = MONTHLY.reduce((s, d) => s + d.expenses, 0)
  const totalCollected = MONTHLY.reduce((s, d) => s + d.collected, 0)
  const netProfit      = totalRevenue - totalExpenses

  const paidBills    = bills.filter(b => b.status === 'paid')
  const unpaidBills  = bills.filter(b => b.status !== 'paid')
  const paidAmount   = paidBills.reduce((s, b) => s + b.amount, 0)
  const unpaidAmount = unpaidBills.reduce((s, b) => s + b.amount, 0)
  const collRate     = Math.round((paidBills.length / bills.length) * 100)

  const totalElec    = UTILITY_BY_MONTH.reduce((s, d) => s + d.electricity, 0)
  const totalWater   = UTILITY_BY_MONTH.reduce((s, d) => s + d.water, 0)
  const totalThermal = UTILITY_BY_MONTH.reduce((s, d) => s + d.thermal, 0)

  // Outstanding by tenant
  const outstandingByTenant = Object.values(
    unpaidBills.reduce((acc, b) => {
      if (!acc[b.tenant]) acc[b.tenant] = { tenant: b.tenant, amount: 0, count: 0 }
      acc[b.tenant].amount += b.amount
      acc[b.tenant].count++
      return acc
    }, {})
  ).sort((a, b) => b.amount - a.amount)

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Financial Reports
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Revenue analysis, collection rates &amp; outstanding balances</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40">
          <span className="text-xs font-medium text-blue-700 dark:text-blue-400">FY 2026</span>
        </div>
      </div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Annual Revenue',    value: `₱${(totalRevenue/1000000).toFixed(2)}M`,   color: 'text-blue-600 dark:text-blue-400',     sub: `+12.4% vs last year` },
          { label: 'Total Collected',   value: `₱${(totalCollected/1000000).toFixed(2)}M`, color: 'text-emerald-600 dark:text-emerald-400',sub: `${collRate}% collection rate` },
          { label: 'Net Profit',        value: `₱${(netProfit/1000000).toFixed(2)}M`,      color: 'text-violet-600 dark:text-violet-400',  sub: 'Revenue minus expenses' },
          { label: 'Outstanding',       value: `₱${unpaidAmount.toLocaleString()}`,        color: 'text-rose-600 dark:text-rose-400',      sub: `${unpaidBills.length} unpaid bills` },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Report */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div>
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Monthly Revenue Report
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Revenue, collected payments &amp; expenses · Full Year 2026</p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            {[
              { label: 'Revenue', color: '#3b82f6' },
              { label: 'Collected', color: '#10b981' },
              { label: 'Expenses', color: '#f43f5e' },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1.5" style={{ color: l.color }}>
                <span className="w-3 h-1.5 rounded-full inline-block" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={MONTHLY} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gCol" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₱${(v/1000).toFixed(0)}K`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Area type="monotone" dataKey="revenue"   stroke="#3b82f6" strokeWidth={2.5} fill="url(#gRev)" dot={false} name="Revenue" />
            <Area type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2}   fill="url(#gCol)" dot={false} name="Collected" />
            <Line  type="monotone" dataKey="expenses"  stroke="#f43f5e" strokeWidth={2}   dot={false} strokeDasharray="5 4" name="Expenses" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Utility Revenue Breakdown + Pie */}
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              Utility Revenue Breakdown
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Monthly revenue by utility type</p>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Electricity', value: totalElec,    cls: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Zap },
              { label: 'Water',       value: totalWater,   cls: 'text-cyan-600  dark:text-cyan-400',  bg: 'bg-cyan-50  dark:bg-cyan-900/20',  icon: Droplets },
              { label: 'Thermal',     value: totalThermal, cls: 'text-rose-600  dark:text-rose-400',  bg: 'bg-rose-50  dark:bg-rose-900/20',  icon: Flame },
            ].map(({ label, value, cls, bg, icon: Icon }) => (
              <div key={label} className={`rounded-xl p-3 ${bg} text-center`}>
                <Icon className={`w-4 h-4 mx-auto mb-1 ${cls}`} />
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{label}</p>
                <p className={`text-sm font-bold ${cls}`}>₱{(value/1000000).toFixed(2)}M</p>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={UTILITY_BY_MONTH} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
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
        </div>

        {/* Pie + collection rate */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">Revenue Distribution</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Utility contribution %</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={UTILITY_PIE} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                  {UTILITY_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={v => [`${v}%`, 'Share']} contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 w-full mt-3">
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
        </div>
      </div>

      {/* Collection Rate + Outstanding Balances */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Payment Collection Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Payment Collection Rate
          </h2>
          {/* Big rate display */}
          <div className="text-center py-4">
            <p className="text-6xl font-black text-emerald-600 dark:text-emerald-400">{collRate}%</p>
            <p className="text-sm text-slate-400 mt-1">of total bills collected</p>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${collRate}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Paid',    count: paidBills.length,    amount: paidAmount,   cls: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Unpaid',  count: unpaidBills.filter(b=>b.status==='unpaid').length, amount: unpaidBills.filter(b=>b.status==='unpaid').reduce((s,b)=>s+b.amount,0), cls: 'text-red-600 dark:text-red-400' },
              { label: 'Pending', count: unpaidBills.filter(b=>b.status==='pending').length,amount: unpaidBills.filter(b=>b.status==='pending').reduce((s,b)=>s+b.amount,0),cls: 'text-amber-600 dark:text-amber-400' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                <p className={`text-xl font-bold ${s.cls}`}>{s.count}</p>
                <p className="text-[10px] text-slate-400 capitalize">{s.label}</p>
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5">₱{s.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Outstanding Balances */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            Outstanding Balances by Tenant
          </h2>
          {outstandingByTenant.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <CheckCircle2 className="w-10 h-10 mb-3 text-emerald-400" />
              <p className="text-sm font-medium">All bills are paid!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {outstandingByTenant.map((row, i) => {
                const maxAmount = outstandingByTenant[0].amount
                const pct = Math.round((row.amount / maxAmount) * 100)
                return (
                  <div key={row.tenant}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] font-mono text-slate-400 w-4">{i+1}</span>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{row.tenant}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-sm font-bold text-rose-600 dark:text-rose-400">₱{row.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">{row.count} bill{row.count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
              {/* Total */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Outstanding</p>
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400">₱{unpaidAmount.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
