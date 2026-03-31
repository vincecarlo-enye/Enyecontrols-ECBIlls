import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  DollarSign, CreditCard, FileText, CheckCircle2, Clock, Zap, Droplets, Flame,
  BarChart3, PieChart as PieIcon, Activity,
} from 'lucide-react'
import DashboardCard from '@/components/ui/DashboardCard'
import ChartCard from '@/components/ui/ChartCard'
import AnnouncementPanel from '@/components/common/AnnouncementPanel'
import { usePageLoader } from '@/hooks/usePageLoader'
import { FinanceDashboardSkeleton } from '@/components/skeletons'
import api from '@/lib/api'

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  fontSize: 12,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  backgroundColor: '#fff',
}

const fmt = (n) => `PHP ${Number(n || 0).toLocaleString()}`

function formatMonthKey(value) {
  if (!value) return 'Unknown'
  if (/^\d{4}-\d{2}$/.test(String(value))) {
    const [year, month] = String(value).split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }
  }
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }
  return String(value)
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  }
  return String(value)
}

function normalizeBill(row = {}) {
  const items = Array.isArray(row?.items) ? row.items : []
  const breakdown = { electricity: 0, water: 0, thermal: 0 }
  items.forEach((item) => {
    const type = String(item?.type || '').toLowerCase()
    const amount = Number(item?.amount ?? 0)
    if (type === 'electric' || type === 'electricity') breakdown.electricity += amount
    if (type === 'water') breakdown.water += amount
    if (type === 'thermal') breakdown.thermal += amount
  })

  return {
    id: String(row?.id ?? ''),
    tenant: row?.tenant?.name || 'Unknown Tenant',
    unit: row?.unit?.unit_number || row?.unit?.name || 'N/A',
    amount: Number(row?.amount ?? 0),
    status: String(row?.status || 'draft').toLowerCase(),
    monthKey: formatMonthKey(row?.billing_month || row?.billing_end || row?.created_at || ''),
    dueDate: formatDate(row?.due_date || ''),
    breakdown,
  }
}

function normalizePayment(row = {}) {
  const bill = row?.bill || {}
  const breakdown = normalizeBill(bill).breakdown
  return {
    id: row?.id,
    invoiceId: String(bill?.id ?? row?.bill_id ?? ''),
    tenant: row?.tenant?.name || bill?.tenant?.name || 'Unknown Tenant',
    unit: bill?.unit?.unit_number || bill?.unit?.name || 'N/A',
    amount: Number(row?.amount ?? 0),
    status: String(row?.status || 'pending').toLowerCase(),
    date: formatDate(row?.paid_at || row?.verified_at || row?.created_at || ''),
    monthKey: formatMonthKey(bill?.billing_month || row?.created_at || ''),
    breakdown,
  }
}

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-3 shadow-lg text-xs">
      <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500 dark:text-slate-400">{p.name}:</span>
          <span className="font-bold text-slate-700 dark:text-slate-200">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function FinanceDashboard() {
  const pageLoading = usePageLoader(800)
  const [bills, setBills] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const [billsRes, paymentsRes] = await Promise.all([
          api.get('/api/finance/bills'),
          api.get('/api/finance/payments'),
        ])
        setBills((Array.isArray(billsRes?.data?.data) ? billsRes.data.data : []).map(normalizeBill))
        setPayments((Array.isArray(paymentsRes?.data?.data) ? paymentsRes.data.data : []).map(normalizePayment))
      } catch (err) {
        setBills([])
        setPayments([])
        setError(err?.response?.data?.message || 'Failed to load finance dashboard.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const loadingState = pageLoading || loading
  if (loadingState) return <FinanceDashboardSkeleton />

  const monthlyRevenue = new Map()
  bills.forEach((bill) => {
    const key = bill.monthKey
    if (!monthlyRevenue.has(key)) {
      monthlyRevenue.set(key, { month: key, revenue: 0, expenses: 0 })
    }
    monthlyRevenue.get(key).revenue += bill.amount
  })
  const MONTHLY_REVENUE = Array.from(monthlyRevenue.values())

  const utilityRevenue = new Map()
  bills.forEach((bill) => {
    const key = bill.monthKey
    if (!utilityRevenue.has(key)) {
      utilityRevenue.set(key, { month: key, electricity: 0, water: 0, thermal: 0 })
    }
    const row = utilityRevenue.get(key)
    row.electricity += bill.breakdown.electricity
    row.water += bill.breakdown.water
    row.thermal += bill.breakdown.thermal
  })
  const UTILITY_REVENUE = Array.from(utilityRevenue.values())

  const totalElec = UTILITY_REVENUE.reduce((sum, row) => sum + row.electricity, 0)
  const totalWater = UTILITY_REVENUE.reduce((sum, row) => sum + row.water, 0)
  const totalThermal = UTILITY_REVENUE.reduce((sum, row) => sum + row.thermal, 0)
  const utilityTotal = totalElec + totalWater + totalThermal

  const UTILITY_PIE = [
    { name: 'Electricity', value: utilityTotal ? Math.round((totalElec / utilityTotal) * 100) : 0, color: '#f59e0b' },
    { name: 'Water', value: utilityTotal ? Math.round((totalWater / utilityTotal) * 100) : 0, color: '#06b6d4' },
    { name: 'Thermal', value: utilityTotal ? Math.round((totalThermal / utilityTotal) * 100) : 0, color: '#f43f5e' },
  ]

  const totalRevenue = bills.reduce((sum, bill) => sum + bill.amount, 0)
  const pendingPayments = payments.filter((payment) => payment.status === 'pending')
  const verifiedPayments = payments.filter((payment) => payment.status === 'verified')
  const paidBills = bills.filter((bill) => bill.status === 'paid')
  const totalCollected = verifiedPayments.reduce((sum, payment) => sum + payment.amount, 0)

  const recentTransactions = payments
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8)
    .map((payment) => {
      const activeUtilities = Object.entries(payment.breakdown || {})
        .filter(([, value]) => Number(value || 0) > 0)
        .map(([key]) => key)

      let utility = 'No Utility Data'

      if (activeUtilities.length === 1) {
        utility = activeUtilities[0] === 'water'
          ? 'Water'
          : activeUtilities[0] === 'thermal'
            ? 'Thermal'
            : 'Electricity'
      } else if (activeUtilities.length > 1) {
        utility = 'Mixed Utilities'
      }

      return {
        id: payment.invoiceId,
        tenant: payment.tenant,
        unit: payment.unit,
        utility,
        amount: payment.amount,
        status: payment.status === 'verified' ? 'Paid' : payment.status === 'rejected' ? 'Rejected' : 'Pending',
        date: payment.date,
      }
    })

  const summaryCards = [
    {
      label: 'Total Revenue',
      value: fmt(totalRevenue),
      icon: DollarSign,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/25',
      trend: `${bills.length} bills`,
      trendUp: true,
      sub: 'All generated bills',
    },
    {
      label: 'Utility Revenue',
      value: fmt(utilityTotal),
      icon: Zap,
      gradient: 'from-amber-500 to-orange-500',
      shadow: 'shadow-amber-500/25',
      trend: `${UTILITY_PIE[0].value}% electricity share`,
      trendUp: true,
      sub: 'Elec + Water + Thermal',
    },
    {
      label: 'Pending Payments',
      value: fmt(pendingPayments.reduce((sum, p) => sum + p.amount, 0)),
      icon: Clock,
      gradient: 'from-amber-400 to-yellow-500',
      shadow: 'shadow-yellow-500/25',
      trend: `${pendingPayments.length} open receipts`,
      trendUp: true,
      sub: 'Requires follow-up',
    },
    {
      label: 'Paid Bills',
      value: fmt(totalCollected),
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-500/25',
      trend: `${paidBills.length} completed`,
      trendUp: false,
      sub: 'Collected payments',
    },
    {
      label: 'Total Bills Generated',
      value: bills.length.toLocaleString(),
      icon: FileText,
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/25',
      trend: `${verifiedPayments.length} verified payments`,
      trendUp: true,
      sub: 'Across all tenants',
    },
  ]

  const utilityColor = {
    Electricity: 'text-amber-600 dark:text-amber-400',
    Water: 'text-cyan-600 dark:text-cyan-400',
    Thermal: 'text-rose-600 dark:text-rose-400',
    'Mixed Utilities': 'text-violet-600 dark:text-violet-400',
    'No Utility Data': 'text-slate-500 dark:text-slate-400',
  }
  const utilityIcon = { Electricity: Zap, Water: Droplets, Thermal: Flame, 'Mixed Utilities': Activity }
  const statusCls = {
    Paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  }

  return (
    <div className="section-gap animate-in pb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Finance Dashboard
          </h1>
          <p className="muted-text mt-0.5">Revenue analytics, billing insights and financial performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Live Finance Data</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {summaryCards.map((card, i) => (
          <DashboardCard key={card.label} icon={card.icon} title={card.label} value={card.value} sub={card.sub} badge={card.trend} badgeUp={card.trendUp} gradient={card.gradient} glow={card.shadow} className={`stagger-${i + 1} animate-in`} />
        ))}
      </div>

      <ChartCard
        title="Monthly Revenue Trend"
        subtitle="Total generated bill value per month"
        action={<Activity className="w-4 h-4 text-blue-500" />}
        badge={<span className="flex items-center gap-3 text-[11px]"><span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400"><span className="w-3 h-1.5 rounded-full bg-blue-500 inline-block" />Revenue</span></span>}
        badgeCls=""
      >
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `PHP ${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradRev)" dot={false} name="Revenue" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid lg:grid-cols-5 gap-4">
        <ChartCard className="lg:col-span-3" title="Utility Revenue Breakdown" subtitle="Monthly income by utility type" action={<BarChart3 className="w-4 h-4 text-slate-400" />}>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Electricity', value: totalElec, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Zap },
              { label: 'Water', value: totalWater, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/20', icon: Droplets },
              { label: 'Thermal', value: totalThermal, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', icon: Flame },
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
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `PHP ${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CurrencyTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="electricity" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Electricity" />
              <Bar dataKey="water" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Water" />
              <Bar dataKey="thermal" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Thermal" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard className="lg:col-span-2" title="Revenue Distribution" subtitle="Utility contribution percentage" action={<PieIcon className="w-4 h-4 text-slate-400" />}>
          <div className="flex-1 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={UTILITY_PIE} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {UTILITY_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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

      <ChartCard title="Recent Transactions" subtitle="Latest payment records across all tenants and utilities" action={<CreditCard className="w-4 h-4 text-blue-500" />}>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                {['Transaction ID', 'Tenant Name', 'Unit', 'Utility Type', 'Amount', 'Status', 'Date'].map((h) => (
                  <th key={h} className={`px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap ${h === 'Status' ? 'text-center' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.map((row, index) => {
                const Icon = utilityIcon[row.utility]
                return (
                  <tr key={`${row.id}-${row.date}-${row.status}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{row.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{row.tenant}</td>
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{row.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 text-[12px] font-medium ${utilityColor[row.utility]}`}>
                        {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
                        {row.utility}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap tabular-nums">{fmt(row.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap ${statusCls[row.status] || statusCls.Pending}`}>{row.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-[12px]">{row.date}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <AnnouncementPanel />
    </div>
  )
}


