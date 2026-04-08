import { useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  DollarSign, CreditCard, FileText, CheckCircle2, Clock, Zap, Droplets, Flame,
  BarChart3, PieChart as PieIcon, Activity,
} from 'lucide-react'
import ChartCard from '@/components/ui/ChartCard'
import UtilityCard from '@/components/common/UtilityCard'
import AnnouncementPanel from '@/components/common/AnnouncementPanel'
import SummaryCardStrip from '@/components/dashboard/SummaryCardStrip'
import PageSection, { PageHeader } from '@/components/layout/PageSection'
import { usePageLoader } from '@/hooks/usePageLoader'
import { FinanceDashboardSkeleton } from '@/components/skeletons'
import api from '@/lib/api'
import {
  CHART_AXIS_TICK,
  CHART_AXIS_TICK_SM,
  CHART_GRID_PROPS_LIGHT,
  CHART_MARGIN_STANDARD,
  ThemedChartTooltip,
  formatChartCurrency,
  formatCompactChartCurrency,
  formatChartNumber,
} from '@/components/charts/rechartsTheme.jsx'

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

function getMonthTimestamp(value) {
  if (!value) return 0
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return date.getTime()
  }
  const parsed = new Date(`${value} 1`)
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
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

export default function FinanceDashboard() {
  const pageLoading = usePageLoader(800)
  const [bills, setBills] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chartRange, setChartRange] = useState('6M')
  const [transactionSearch, setTransactionSearch] = useState('')
  const [transactionStatus, setTransactionStatus] = useState('all')

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

  const {
    monthlyRevenue,
    utilityRevenue,
    utilityPie,
    utilityMeters,
    summaryCards,
    totalElec,
    totalWater,
    totalThermal,
    recentTransactions,
  } = useMemo(() => {
    const monthlyRevenueMap = new Map()
    const utilityRevenueMap = new Map()

    for (const bill of bills) {
      const monthKey = bill.monthKey

      if (!monthlyRevenueMap.has(monthKey)) {
        monthlyRevenueMap.set(monthKey, { month: monthKey, revenue: 0, expenses: 0 })
      }
      if (!utilityRevenueMap.has(monthKey)) {
        utilityRevenueMap.set(monthKey, { month: monthKey, electricity: 0, water: 0, thermal: 0 })
      }

      monthlyRevenueMap.get(monthKey).revenue += bill.amount

      const utilityRow = utilityRevenueMap.get(monthKey)
      utilityRow.electricity += bill.breakdown.electricity
      utilityRow.water += bill.breakdown.water
      utilityRow.thermal += bill.breakdown.thermal
    }

    const monthlyRevenue = Array.from(monthlyRevenueMap.values()).sort((a, b) => getMonthTimestamp(a.month) - getMonthTimestamp(b.month))
    const utilityRevenue = Array.from(utilityRevenueMap.values()).sort((a, b) => getMonthTimestamp(a.month) - getMonthTimestamp(b.month))
    const totalElec = utilityRevenue.reduce((sum, row) => sum + row.electricity, 0)
    const totalWater = utilityRevenue.reduce((sum, row) => sum + row.water, 0)
    const totalThermal = utilityRevenue.reduce((sum, row) => sum + row.thermal, 0)
    const utilityTotal = totalElec + totalWater + totalThermal
    const utilityPie = [
      { name: 'Electricity', value: utilityTotal ? Math.round((totalElec / utilityTotal) * 100) : 0, color: '#f59e0b' },
      { name: 'Water', value: utilityTotal ? Math.round((totalWater / utilityTotal) * 100) : 0, color: '#06b6d4' },
      { name: 'Thermal', value: utilityTotal ? Math.round((totalThermal / utilityTotal) * 100) : 0, color: '#f43f5e' },
    ]
    const utilityMeters = {
      electric: { usage: totalElec, unit: 'kWh', estimatedCost: totalElec, trend: 4.2 },
      water: { usage: totalWater, unit: 'm3', estimatedCost: totalWater, trend: 2.3 },
      thermal: { usage: totalThermal, unit: 'BTU', estimatedCost: totalThermal, trend: 3.1 },
    }

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
        trend: `${utilityPie[0].value}% electricity share`,
        trendUp: true,
        sub: 'Elec + Water + Thermal',
      },
      {
        label: 'Pending Payments',
        value: fmt(pendingPayments.reduce((sum, payment) => sum + payment.amount, 0)),
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

    return {
      monthlyRevenue,
      utilityRevenue,
      utilityPie,
      utilityMeters,
      summaryCards,
      totalElec,
      totalWater,
      totalThermal,
      recentTransactions,
    }
  }, [bills, payments])

  const rangeLimit = chartRange === '3M' ? 3 : chartRange === '12M' ? 12 : 6

  const rangedMonthlyRevenue = useMemo(
    () => monthlyRevenue.slice(-rangeLimit),
    [monthlyRevenue, rangeLimit],
  )

  const rangedUtilityRevenue = useMemo(
    () => utilityRevenue.slice(-rangeLimit),
    [utilityRevenue, rangeLimit],
  )

  const rangedUtilityPie = useMemo(() => {
    const totals = rangedUtilityRevenue.reduce((acc, row) => ({
      electricity: acc.electricity + Number(row.electricity || 0),
      water: acc.water + Number(row.water || 0),
      thermal: acc.thermal + Number(row.thermal || 0),
    }), { electricity: 0, water: 0, thermal: 0 })
    const total = totals.electricity + totals.water + totals.thermal

    return [
      { name: 'Electricity', value: total ? Math.round((totals.electricity / total) * 100) : 0, color: '#f59e0b' },
      { name: 'Water', value: total ? Math.round((totals.water / total) * 100) : 0, color: '#06b6d4' },
      { name: 'Thermal', value: total ? Math.round((totals.thermal / total) * 100) : 0, color: '#f43f5e' },
    ]
  }, [rangedUtilityRevenue])

  const filteredTransactions = useMemo(() => {
    const query = transactionSearch.trim().toLowerCase()

    return recentTransactions.filter((row) => {
      const matchesStatus = transactionStatus === 'all' || row.status.toLowerCase() === transactionStatus
      const haystack = [row.id, row.tenant, row.unit, row.utility, row.date]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      const matchesSearch = !query || haystack.includes(query)

      return matchesStatus && matchesSearch
    })
  }, [recentTransactions, transactionSearch, transactionStatus])

  const loadingState = (pageLoading && bills.length === 0 && payments.length === 0) || (loading && bills.length === 0 && payments.length === 0 && !error)
  if (loadingState) return <FinanceDashboardSkeleton />

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
    <PageSection variant="light">
      <PageHeader
        title="Finance Dashboard"
        subtitle="Revenue analytics, billing insights and financial performance"
        icon={BarChart3}
        actions={(
          <div className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 dark:border-blue-700/40 dark:bg-blue-900/20">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Live Finance Data</span>
          </div>
        )}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 mb-4">
        <UtilityCard type="electric" {...utilityMeters.electric} />
        <UtilityCard type="thermal" {...utilityMeters.thermal} />
        <UtilityCard type="water" {...utilityMeters.water} />
      </div>

      <SummaryCardStrip
        cards={summaryCards}
        gapClassName="gap-4"
        stretch
        stretchGridClassName="grid-cols-1 md:grid-cols-2 xl:grid-cols-5"
      />

      <ChartCard
      className="mb-4"
        title="Monthly Revenue Trend"
        subtitle="Total generated bill value per month"
        action={<Activity className="w-4 h-4 text-blue-500" />}
        badge={<span className="flex items-center gap-3 text-[11px]"><span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400"><span className="inline-block h-1.5 w-3 rounded-full bg-blue-500" />Revenue</span></span>}
        badgeCls=""
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {['3M', '6M', '12M'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setChartRange(option)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                chartRange === option
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={rangedMonthlyRevenue} margin={CHART_MARGIN_STANDARD}>
            <defs>
              <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...CHART_GRID_PROPS_LIGHT} />
            <XAxis dataKey="month" tick={CHART_AXIS_TICK_SM} />
            <YAxis tick={CHART_AXIS_TICK_SM} tickFormatter={formatCompactChartCurrency} />
            <Tooltip content={<ThemedChartTooltip formatter={(value, name) => [formatChartCurrency(value), name]} />} />
            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradRev)" dot={false} name="Revenue" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-5 mb-4">
        <ChartCard className="lg:col-span-3" title="Utility Revenue Breakdown" subtitle="Monthly income by utility type" action={<BarChart3 className="w-4 h-4 text-slate-400" />}>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Electricity', value: totalElec, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Zap },
              { label: 'Water', value: totalWater, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/20', icon: Droplets },
              { label: 'Thermal', value: totalThermal, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', icon: Flame },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div key={label} className={`rounded-xl p-3 text-center ${bg}`}>
                <Icon className={`mx-auto mb-1 h-4 w-4 ${color}`} />
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{label}</p>
                <p className={`text-sm font-bold ${color}`}>{fmt(value)}</p>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rangedUtilityRevenue} margin={CHART_MARGIN_STANDARD}>
              <CartesianGrid {...CHART_GRID_PROPS_LIGHT} />
              <XAxis dataKey="month" tick={CHART_AXIS_TICK} />
              <YAxis tick={CHART_AXIS_TICK} tickFormatter={formatCompactChartCurrency} />
              <Tooltip content={<ThemedChartTooltip formatter={(value, name) => [formatChartCurrency(value), name]} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="electricity" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Electricity" />
              <Bar dataKey="water" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Water" />
              <Bar dataKey="thermal" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Thermal" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard className="lg:col-span-2 " title="Revenue Distribution" subtitle="Utility contribution percentage" action={<PieIcon className="w-4 h-4 text-slate-400" />}>
          <div className="flex flex-1 flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={rangedUtilityPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {rangedUtilityPie.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<ThemedChartTooltip formatter={(value) => `${formatChartNumber(value)}%`} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 w-full space-y-2">
              {rangedUtilityPie.map(({ name, value, color }) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ background: color }} />
                    <span className="text-slate-600 dark:text-slate-300">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
                    </div>
                    <span className="w-8 text-right text-[12px] font-bold text-slate-700 dark:text-slate-200">{value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      <ChartCard className="mb-4" title="Recent Transactions" subtitle="Latest payment records across all tenants and utilities" action={<CreditCard className="w-4 h-4 text-blue-500" />}>
        <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr),200px]">
          <input
            type="search"
            value={transactionSearch}
            onChange={(event) => setTransactionSearch(event.target.value)}
            placeholder="Search transaction, tenant, unit, utility, or date"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
          <select
            value={transactionStatus}
            onChange={(event) => setTransactionStatus(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                {['Transaction ID', 'Tenant Name', 'Unit', 'Utility Type', 'Amount', 'Status', 'Date'].map((header) => (
                  <th key={header} className={`px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap ${header === 'Status' ? 'text-center' : 'text-left'}`}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    No transactions matched the current filters.
                  </td>
                </tr>
              ) : filteredTransactions.map((row, index) => {
                const Icon = utilityIcon[row.utility]
                return (
                  <tr key={`${row.id}-${row.date}-${row.status}-${index}`} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-[11px] font-mono text-slate-400 whitespace-nowrap">{row.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{row.tenant}</td>
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{row.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 text-[12px] font-medium ${utilityColor[row.utility]}`}>
                        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                        {row.utility}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap tabular-nums">{fmt(row.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${statusCls[row.status] || statusCls.Pending}`}>{row.status}</span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-400 whitespace-nowrap">{row.date}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <AnnouncementPanel />
    </PageSection>
  )
}
