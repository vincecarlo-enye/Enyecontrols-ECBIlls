import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  BarChart3, TrendingUp, AlertCircle, CheckCircle2, Zap, Droplets, Flame,
} from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { ReportsSkeleton } from '@/components/skeletons'
import api from '@/lib/api'

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  fontSize: 12,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  backgroundColor: '#fff',
}

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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
  return String(value)
}

function normalizeBill(row = {}) {
  const items = Array.isArray(row?.items) ? row.items : []
  const breakdown = {
    electricity: 0,
    water: 0,
    thermal: 0,
  }

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
    monthKey: formatMonthKey(row?.billing_month || row?.billing_end || row?.created_at || ''),
    amount: Number(row?.amount ?? 0),
    status: String(row?.status || 'draft').toLowerCase(),
    breakdown,
    createdAt: row?.created_at || row?.billing_end || '',
  }
}

function normalizePayment(row = {}) {
  const bill = row?.bill || {}
  return {
    id: row?.id,
    invoiceId: String(bill?.id ?? row?.bill_id ?? ''),
    tenant: row?.tenant?.name || bill?.tenant?.name || 'Unknown Tenant',
    unit: bill?.unit?.unit_number || bill?.unit?.name || 'N/A',
    amount: Number(row?.amount ?? 0),
    status: String(row?.status || 'pending').toLowerCase(),
    date: formatDate(row?.paid_at || row?.verified_at || row?.created_at || ''),
    monthKey: formatMonthKey(bill?.billing_month || row?.created_at || ''),
    breakdown: normalizeBill(bill).breakdown,
  }
}

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-3 shadow-lg text-xs">
      <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span className="text-slate-500">{entry.name}:</span>
          <span className="font-bold text-slate-700 dark:text-slate-200">PHP {Number(entry.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export default function FinanceReports() {
  const pageLoading = usePageLoader(700)
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
        setError(err?.response?.data?.message || 'Failed to load financial reports.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const loadingState = pageLoading || loading
  if (loadingState) return <ReportsSkeleton />

  const monthlyMap = new Map()
  bills.forEach((bill) => {
    const key = bill.monthKey
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, { month: key, revenue: 0, collected: 0, expenses: 0 })
    }
    const row = monthlyMap.get(key)
    row.revenue += bill.amount
  })
  payments.forEach((payment) => {
    const key = payment.monthKey
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, { month: key, revenue: 0, collected: 0, expenses: 0 })
    }
    const row = monthlyMap.get(key)
    if (payment.status === 'verified') row.collected += payment.amount
  })

  const MONTHLY = Array.from(monthlyMap.values()).sort((a, b) => new Date(`${a.month} 1`) - new Date(`${b.month} 1`))

  const utilityMonthlyMap = new Map()
  bills.forEach((bill) => {
    const key = bill.monthKey
    if (!utilityMonthlyMap.has(key)) {
      utilityMonthlyMap.set(key, { month: key, electricity: 0, water: 0, thermal: 0 })
    }
    const row = utilityMonthlyMap.get(key)
    row.electricity += bill.breakdown.electricity
    row.water += bill.breakdown.water
    row.thermal += bill.breakdown.thermal
  })
  const UTILITY_BY_MONTH = Array.from(utilityMonthlyMap.values()).sort((a, b) => new Date(`${a.month} 1`) - new Date(`${b.month} 1`))

  const totalElec = UTILITY_BY_MONTH.reduce((sum, row) => sum + row.electricity, 0)
  const totalWater = UTILITY_BY_MONTH.reduce((sum, row) => sum + row.water, 0)
  const totalThermal = UTILITY_BY_MONTH.reduce((sum, row) => sum + row.thermal, 0)
  const utilityTotal = totalElec + totalWater + totalThermal

  const UTILITY_PIE = [
    { name: 'Electricity', value: utilityTotal ? Math.round((totalElec / utilityTotal) * 100) : 0, color: '#f59e0b' },
    { name: 'Water', value: utilityTotal ? Math.round((totalWater / utilityTotal) * 100) : 0, color: '#06b6d4' },
    { name: 'Thermal', value: utilityTotal ? Math.round((totalThermal / utilityTotal) * 100) : 0, color: '#f43f5e' },
  ]

  const totalRevenue = MONTHLY.reduce((sum, row) => sum + row.revenue, 0)
  const totalCollected = MONTHLY.reduce((sum, row) => sum + row.collected, 0)
  const totalExpenses = 0
  const netProfit = totalRevenue - totalExpenses

  const paidBills = bills.filter((bill) => bill.status === 'paid')
  const unpaidBills = bills.filter((bill) => bill.status !== 'paid')
  const paidAmount = paidBills.reduce((sum, bill) => sum + bill.amount, 0)
  const unpaidAmount = unpaidBills.reduce((sum, bill) => sum + bill.amount, 0)
  const collRate = bills.length ? Math.round((paidBills.length / bills.length) * 100) : 0

  const outstandingByTenant = Object.values(
    unpaidBills.reduce((acc, bill) => {
      if (!acc[bill.tenant]) acc[bill.tenant] = { tenant: bill.tenant, amount: 0, count: 0 }
      acc[bill.tenant].amount += bill.amount
      acc[bill.tenant].count += 1
      return acc
    }, {})
  ).sort((a, b) => b.amount - a.amount)

  const recentTransactions = payments
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 12)
    .map((payment) => {
      const dominantUtility = Object.entries(payment.breakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || 'electricity'
      const utilityLabel = dominantUtility === 'water' ? 'Water' : dominantUtility === 'thermal' ? 'Thermal' : 'Electricity'
      const statusLabel = payment.status === 'verified' ? 'Paid' : payment.status === 'rejected' ? 'Rejected' : 'Pending'
      return {
        id: payment.invoiceId,
        tenant: payment.tenant,
        unit: payment.unit,
        utility: utilityLabel,
        amount: payment.amount,
        status: statusLabel,
        date: payment.date,
      }
    })

  const statusCls = {
    Paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  }

  const utilityColor = {
    Electricity: 'text-amber-600 dark:text-amber-400',
    Water: 'text-cyan-600 dark:text-cyan-400',
    Thermal: 'text-rose-600 dark:text-rose-400',
  }

  const utilityIcon = {
    Electricity: Zap,
    Water: Droplets,
    Thermal: Flame,
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Financial Reports
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Revenue analysis, collection rates and outstanding balances</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40">
          <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Live Finance Data</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Annual Revenue', value: `PHP ${(totalRevenue / 1000000).toFixed(2)}M`, color: 'text-blue-600 dark:text-blue-400', sub: `${bills.length} total bills` },
          { label: 'Total Collected', value: `PHP ${(totalCollected / 1000000).toFixed(2)}M`, color: 'text-emerald-600 dark:text-emerald-400', sub: `${collRate}% collection rate` },
          { label: 'Net Profit', value: `PHP ${(netProfit / 1000000).toFixed(2)}M`, color: 'text-violet-600 dark:text-violet-400', sub: 'Revenue minus expenses' },
          { label: 'Outstanding', value: `PHP ${unpaidAmount.toLocaleString()}`, color: 'text-rose-600 dark:text-rose-400', sub: `${unpaidBills.length} unpaid bills` },
        ].map((card) => (
          <div key={card.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div>
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Monthly Revenue Report
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Revenue, collected payments and expenses</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={MONTHLY} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gCol" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `PHP ${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gRev)" dot={false} name="Revenue" />
            <Area type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2} fill="url(#gCol)" dot={false} name="Collected" />
            <Line type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} dot={false} strokeDasharray="5 4" name="Expenses" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

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
              { label: 'Electricity', value: totalElec, cls: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Zap },
              { label: 'Water', value: totalWater, cls: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/20', icon: Droplets },
              { label: 'Thermal', value: totalThermal, cls: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', icon: Flame },
            ].map(({ label, value, cls, bg, icon: Icon }) => (
              <div key={label} className={`rounded-xl p-3 ${bg} text-center`}>
                <Icon className={`w-4 h-4 mx-auto mb-1 ${cls}`} />
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{label}</p>
                <p className={`text-sm font-bold ${cls}`}>PHP {(value / 1000000).toFixed(2)}M</p>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={UTILITY_BY_MONTH} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
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
        </div>

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
                <Tooltip formatter={(v) => [`${v}%`, 'Share']} contentStyle={TOOLTIP_STYLE} />
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

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Payment Collection Rate
          </h2>
          <div className="text-center py-4">
            <p className="text-6xl font-black text-emerald-600 dark:text-emerald-400">{collRate}%</p>
            <p className="text-sm text-slate-400 mt-1">of total bills collected</p>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${collRate}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Paid', count: paidBills.length, amount: paidAmount, cls: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Unpaid', count: unpaidBills.filter((bill) => bill.status === 'unpaid').length, amount: unpaidBills.filter((bill) => bill.status === 'unpaid').reduce((sum, bill) => sum + bill.amount, 0), cls: 'text-red-600 dark:text-red-400' },
              { label: 'Pending', count: unpaidBills.filter((bill) => ['submitted', 'partial', 'published'].includes(bill.status)).length, amount: unpaidBills.filter((bill) => ['submitted', 'partial', 'published'].includes(bill.status)).reduce((sum, bill) => sum + bill.amount, 0), cls: 'text-amber-600 dark:text-amber-400' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                <p className={`text-xl font-bold ${stat.cls}`}>{stat.count}</p>
                <p className="text-[10px] text-slate-400 capitalize">{stat.label}</p>
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5">PHP {stat.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

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
                const maxAmount = outstandingByTenant[0].amount || 1
                const pct = Math.round((row.amount / maxAmount) * 100)
                return (
                  <div key={row.tenant}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] font-mono text-slate-400 w-4">{i + 1}</span>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{row.tenant}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-sm font-bold text-rose-600 dark:text-rose-400">PHP {row.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">{row.count} bill{row.count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Outstanding</p>
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400">PHP {unpaidAmount.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
          <div>
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Recent Transactions
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Latest payment records across all tenants and utilities</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                {['Transaction ID', 'Tenant Name', 'Unit', 'Utility Type', 'Amount', 'Status', 'Date'].map((header) => (
                  <th key={header} className={`px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap ${header === 'Status' ? 'text-center' : 'text-left'}`}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.map((row) => {
                const Icon = utilityIcon[row.utility]
                return (
                  <tr key={`${row.id}-${row.date}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{row.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{row.tenant}</td>
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{row.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 text-[12px] font-medium ${utilityColor[row.utility]}`}>
                        {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
                        {row.utility}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap tabular-nums">PHP {row.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap ${statusCls[row.status] || statusCls.Pending}`}>
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
        <div className="flex items-center gap-6 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          {[
            { label: 'Paid', count: recentTransactions.filter((row) => row.status === 'Paid').length, cls: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Pending', count: recentTransactions.filter((row) => row.status === 'Pending').length, cls: 'text-amber-600 dark:text-amber-400' },
            { label: 'Rejected', count: recentTransactions.filter((row) => row.status === 'Rejected').length, cls: 'text-rose-600 dark:text-rose-400' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-1.5 text-[11px]">
              <span className={`font-bold text-sm ${stat.cls}`}>{stat.count}</span>
              <span className="text-slate-400">{stat.label}</span>
            </div>
          ))}
          <span className="ml-auto text-[11px] text-slate-400">Showing {recentTransactions.length} most recent records</span>
        </div>
      </div>
    </div>
  )
}

