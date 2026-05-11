import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  BarChart2,
  Building2,
  CreditCard,
  Globe,
  Shield,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import UtilityCard from '@/components/common/UtilityCard'
import FilterPills from '@/components/common/FilterPills'
import BillsTable from '@/components/billing/BillsTable'
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
import { useAdminRates } from '@/hooks/adminHooks/useAdminRates'
import { useAdminUtilityDashboard } from '@/hooks/adminHooks/useAdminUtilityDashboard'
import {
  buildUtilityComparisonRows,
  normalizeDashboardBillStatus,
} from '@/utils/dashboardCharts'
import { buildUtilityCardMetric } from '@/utils/utilityCards'
import { fetchAdminBills, fetchAdminBill, deleteAdminBill, fetchAdminPayments, getAdminBillsSnapshot, getAdminPaymentsSnapshot } from '@/services/adminService/adminBillingService'
import { fetchAdminTenants, getAdminTenantsSnapshot } from '@/services/adminService/adminTenantService'
import { fetchAdminUnits, getAdminUnitsSnapshot } from '@/services/adminService/adminUnitService'
import { fetchAdminMeters, getAdminMetersSnapshot } from '@/services/adminService/adminMeterService'
import { useApp } from '@/context/AppContext'
import { ChartLoadingState, LoadingValue, TableLoadingRow, UpdatingBadge } from '@/components/common/InlineLoadingState'

const FILTER_OPTIONS = [
  { key: '7D', label: '7D' },
  { key: '1M', label: '1M' },
  { key: '1Y', label: '1Y' },
]

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

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function distributeTotal(total, weights, index) {
  const safeWeights = Array.isArray(weights) && weights.length ? weights : [1]
  const totalWeight = safeWeights.reduce((sum, weight) => sum + weight, 0) || safeWeights.length
  const value = toNumber(safeWeights[index], 1)
  return Math.round((toNumber(total) * value) / totalWeight)
}

function formatPeso(value) {
  return `PHP ${toNumber(value).toLocaleString()}`
}

function formatShortPeriodDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function formatMonthLabel(value) {
  if (!value) return '-'
  if (/^\d{4}-\d{2}$/.test(String(value))) {
    const [year, month] = String(value).split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
      }).format(date)
    }
  }

  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

  return String(value)
}

function normalizeBills(rows = []) {
  return rows.map((bill) => {
    const amount = Number(
      bill?.grand_total ??
      bill?.total_amount ??
      bill?.amount ??
      0
    )
    const billingStart = bill?.billing_start || null
    const billingEnd = bill?.billing_end || null

    return {
      id: String(bill?.id ?? ''),
      tenant: bill?.tenant?.name || bill?.tenant_name || 'Unknown Tenant',
      unit: bill?.unit?.unit_number || bill?.unit?.name || bill?.unit_name || '-',
      month: formatMonthLabel(bill?.billing_month || billingEnd),
      billingMonth: bill?.billing_month || '',
      billingStart,
      billingEnd,
      billingPeriod: billingStart && billingEnd
        ? `${formatShortPeriodDate(billingStart)} - ${formatShortPeriodDate(billingEnd)}`
        : billingEnd
          ? formatShortPeriodDate(billingEnd)
          : '-',
      amount,
      dueDate: bill?.due_date || null,
      status: bill?.status || 'draft',
      raw: bill,
    }
  })
}

function normalizeMeters(rows = []) {
  return rows.map((meter) => ({
    id: meter.id,
    type: String(meter.type || '').toLowerCase() === 'electricity' ? 'electric' : String(meter.type || '').toLowerCase(),
    meterName: meter.meter_name || meter.meterName || meter.watch_name || meter.watchName || `Meter #${meter.id}`,
    unit:
      meter?.unit?.unit_number ||
      meter?.unit?.name ||
      (Array.isArray(meter?.assigned_units) ? meter.assigned_units.map((unit) => unit?.unit_number || unit?.name).filter(Boolean).join(', ') : ''),
    tenant: meter?.tenant?.name || '',
    status: meter.status || 'active',
  }))
}

function normalizeUnits(rows = []) {
  return rows.map((unit) => {
    const tenants = Array.isArray(unit?.tenants) ? unit.tenants : []
    const occupied = tenants.some((tenant) => ['active', 'inactive'].includes(String(tenant?.status || '').toLowerCase()))
    return {
      id: unit.id,
      status: unit.status || (occupied ? 'occupied' : 'vacant'),
      tenants,
    }
  })
}

function normalizePayments(rows = []) {
  return rows.map((payment) => ({
    id: payment.id,
    amount: Number(payment?.amount ?? payment?.bill?.amount ?? 0),
    status: String(payment?.status || '').toLowerCase(),
  }))
}

export default function SuperAdminDashboard() {
  const loading = usePageLoader(700)
  const { addToast } = useApp()
  const { rates: billingRates, loading: ratesLoading } = useAdminRates()
  const { summary, daily, comparison, loading: utilitiesLoading, comparisonLoadingRanges, ensureComparisonRange } = useAdminUtilityDashboard()
  const billsSnapshot = getAdminBillsSnapshot()
  const tenantsSnapshot = getAdminTenantsSnapshot()
  const unitsSnapshot = getAdminUnitsSnapshot()
  const metersSnapshot = getAdminMetersSnapshot()
  const paymentsSnapshot = getAdminPaymentsSnapshot()
  const initialBills = normalizeBills(Array.isArray(billsSnapshot?.data) ? billsSnapshot.data : [])
  const initialTenants = Array.isArray(tenantsSnapshot?.data) ? tenantsSnapshot.data : []
  const initialUnits = normalizeUnits(Array.isArray(unitsSnapshot?.data) ? unitsSnapshot.data : [])
  const initialMeters = normalizeMeters(Array.isArray(metersSnapshot?.data) ? metersSnapshot.data : [])
  const initialPayments = normalizePayments(Array.isArray(paymentsSnapshot?.data) ? paymentsSnapshot.data : [])
  const hasDashboardSnapshot =
    initialBills.length > 0 ||
    initialTenants.length > 0 ||
    initialUnits.length > 0 ||
    initialMeters.length > 0 ||
    initialPayments.length > 0

  const [comparisonFilter, setComparisonFilter] = useState('7D')
  const [isDesktopCharts, setIsDesktopCharts] = useState(false)
  const [dashboardLoading, setDashboardLoading] = useState(!hasDashboardSnapshot)
  const [dashboardError, setDashboardError] = useState('')
  const [bills, setBills] = useState(initialBills)
  const [tenants, setTenants] = useState(initialTenants)
  const [meters, setMeters] = useState(initialMeters)
  const [payments, setPayments] = useState(initialPayments)
  const [units, setUnits] = useState(initialUnits)
  const isComparisonRangeLoading = comparisonLoadingRanges?.has?.(comparisonFilter)
  const isInitialLoading = (loading || dashboardLoading || utilitiesLoading) && bills.length === 0 && tenants.length === 0 && meters.length === 0 && payments.length === 0
  const isRefreshing = !isInitialLoading && (dashboardLoading || utilitiesLoading || ratesLoading || isComparisonRangeLoading)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const syncLayout = (event) => setIsDesktopCharts(event.matches)

    setIsDesktopCharts(mediaQuery.matches)

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncLayout)
      return () => mediaQuery.removeEventListener('change', syncLayout)
    }

    mediaQuery.addListener(syncLayout)
    return () => mediaQuery.removeListener(syncLayout)
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadDashboard = async () => {
      try {
        setDashboardLoading((current) => current || !hasDashboardSnapshot)
        setDashboardError('')

        const [billsRes, tenantsRes, unitsRes, metersRes, paymentsRes] = await Promise.all([
          fetchAdminBills(),
          fetchAdminTenants(),
          fetchAdminUnits(),
          fetchAdminMeters(),
          fetchAdminPayments(),
        ])

        if (cancelled) return

        setBills(normalizeBills(Array.isArray(billsRes?.data) ? billsRes.data : []))
        setTenants(Array.isArray(tenantsRes?.data) ? tenantsRes.data : [])
        setUnits(normalizeUnits(Array.isArray(unitsRes?.data) ? unitsRes.data : []))
        setMeters(normalizeMeters(Array.isArray(metersRes?.data) ? metersRes.data : []))
        setPayments(normalizePayments(Array.isArray(paymentsRes?.data) ? paymentsRes.data : []))
      } catch (error) {
        if (!cancelled) {
          setDashboardError(error?.response?.data?.message || 'Failed to load dashboard data.')
          setBills([])
          setTenants([])
          setUnits([])
          setMeters([])
          setPayments([])
        }
      } finally {
        if (!cancelled) setDashboardLoading(false)
      }
    }

    loadDashboard()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    ensureComparisonRange(comparisonFilter)
  }, [comparisonFilter, ensureComparisonRange])

  const comparisonData = useMemo(
    () => {
      const activeSeries = comparison?.[comparisonFilter] || {
        electric: daily.electric,
        water: daily.water,
        thermal: daily.thermal,
      }

      return buildUtilityComparisonRows(
        comparisonFilter,
        activeSeries.electric,
        activeSeries.water,
        activeSeries.thermal,
      )
    },
    [comparison, comparisonFilter, daily]
  )

  const filteredUtilityCards = useMemo(() => {
    const buildCard = (summaryKey, rateKey, rowKey) => {
      const cardSummary = summary?.[summaryKey] || {}
      const values = comparisonData.map((row) => ({
        label: row.label,
        value: toNumber(row?.[rowKey]),
      }))
      const periodConsumption = toNumber(cardSummary.periodConsumption ?? cardSummary.usage ?? cardSummary.value)

      return buildUtilityCardMetric({
        type: rateKey,
        usage: periodConsumption,
        unit: cardSummary.unit || (summaryKey === 'electric' ? 'kWh' : summaryKey === 'thermal' ? 'kBTU' : 'm3'),
        trend: toNumber(cardSummary.trend ?? cardSummary.delta),
        rates: billingRates,
        fallbackEstimatedCost: toNumber(cardSummary.estimatedCost ?? cardSummary.cost),
        series: values,
      })
    }

    return {
      electricity: buildCard('electric', 'electricity', 'electricity'),
      thermal: buildCard('thermal', 'thermal', 'thermal'),
      water: buildCard('water', 'water', 'water'),
    }
  }, [billingRates, comparisonData, summary])

  const dashboardMetrics = useMemo(() => {
    const normalizedBills = bills.map((bill) => ({
      ...bill,
      normalizedStatus: normalizeDashboardBillStatus(bill.status),
      amountValue: toNumber(bill.amount),
    }))

    const totalBilled = normalizedBills.reduce((sum, bill) => sum + bill.amountValue, 0)
    const totalCollected = payments
      .filter((payment) => ['verified', 'paid'].includes(payment.status))
      .reduce((sum, payment) => sum + payment.amount, 0)
    const overdueCount = normalizedBills.filter((bill) => bill.normalizedStatus === 'overdue').length
    const submittedCount = normalizedBills.filter((bill) => bill.normalizedStatus === 'submitted').length
    const publishedCount = normalizedBills.filter((bill) => bill.normalizedStatus === 'published').length
    const paidCount = normalizedBills.filter((bill) => bill.normalizedStatus === 'paid').length

    const activeTenants = tenants.filter((tenant) => String(tenant?.status || '').toLowerCase() === 'active').length
    const inactiveTenants = tenants.length - activeTenants
    const occupiedUnits = units.filter((unit) => String(unit.status || '').toLowerCase() === 'occupied').length
    const vacantUnits = units.filter((unit) => String(unit.status || '').toLowerCase() === 'vacant').length

    const meterAlerts = {
      active: meters.filter((meter) => String(meter.status || '').toLowerCase() === 'active').length,
      inactive: meters.filter((meter) => ['offline', 'inactive'].includes(String(meter.status || '').toLowerCase())).length,
      maintenance: meters.filter((meter) => String(meter.status || '').toLowerCase() === 'maintenance').length,
      unassigned: meters.filter((meter) => !String(meter.tenant || '').trim()).length,
    }

    const pendingPayments = payments.filter((payment) => payment.status === 'pending').length
    const alertCount = overdueCount + pendingPayments + meterAlerts.inactive + meterAlerts.maintenance + meterAlerts.unassigned

    return {
      totalBilled,
      totalCollected,
      activeTenants,
      inactiveTenants,
      occupiedUnits,
      vacantUnits,
      overdueCount,
      submittedCount,
      publishedCount,
      paidCount,
      pendingPayments,
      alertCount,
      meterAlerts,
    }
  }, [bills, meters, payments, tenants, units])

  const systemOverviewData = useMemo(() => {
    const weights = comparisonData.map((row) => row.electricity + row.water + row.thermal)

    return comparisonData.map((row, index) => ({
      label: row.label,
      revenue: distributeTotal(dashboardMetrics.totalBilled, weights, index),
      collections: distributeTotal(dashboardMetrics.totalCollected, weights, index),
      tenants: dashboardMetrics.activeTenants,
      consumption: toNumber(row.electricity) + toNumber(row.water) + toNumber(row.thermal),
    }))
  }, [comparisonData, dashboardMetrics])

  const summaryCards = useMemo(() => ([
    {
      title: 'Bills',
      value: bills.length,
      sub: 'System billing records',
      icon: CreditCard,
      gradient: 'from-blue-500 to-blue-600',
      glow: 'shadow-blue-500/25',
    },
    {
      title: 'Overdue',
      value: dashboardMetrics.overdueCount,
      sub: 'Bills requiring follow-up',
      icon: AlertTriangle,
      gradient: 'from-rose-500 to-rose-600',
      glow: 'shadow-rose-500/25',
    },
    {
      title: 'Tenants',
      value: dashboardMetrics.activeTenants,
      sub: 'Active tenant accounts',
      icon: Users,
      gradient: 'from-indigo-500 to-indigo-600',
      glow: 'shadow-indigo-500/25',
    },
    {
      title: 'Revenue',
      value: `PHP ${dashboardMetrics.totalCollected.toLocaleString()}`,
      sub: 'Collected from verified payments',
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-emerald-600',
      glow: 'shadow-emerald-500/25',
    },
    {
      title: 'Alerts',
      value: dashboardMetrics.alertCount,
      sub: 'Billing and meter issues',
      icon: Wrench,
      gradient: 'from-amber-500 to-orange-600',
      glow: 'shadow-orange-500/25',
    },
  ]), [bills.length, dashboardMetrics])

  const billingStatusData = useMemo(() => {
    const totals = bills.reduce((acc, bill) => {
      const status = normalizeDashboardBillStatus(bill?.status)
      const amount = toNumber(bill?.amount)

      if (status === 'paid') {
        acc.paid.value += 1
        acc.paid.estimatedCost += amount
      } else if (status === 'submitted') {
        acc.submitted.value += 1
        acc.submitted.estimatedCost += amount
      } else if (status === 'overdue') {
        acc.overdue.value += 1
        acc.overdue.estimatedCost += amount
      } else if (['published', 'pending', 'partial', 'draft'].includes(status)) {
        acc.open.value += 1
        acc.open.estimatedCost += amount
      }

      return acc
    }, {
      paid: { value: 0, estimatedCost: 0 },
      open: { value: 0, estimatedCost: 0 },
      overdue: { value: 0, estimatedCost: 0 },
      submitted: { value: 0, estimatedCost: 0 },
    })

    return [
      { label: 'Paid', value: totals.paid.value, estimatedCost: totals.paid.estimatedCost, fill: '#10b981' },
      { label: 'Unpaid', value: totals.open.value, estimatedCost: totals.open.estimatedCost, fill: '#3b82f6' },
      { label: 'Overdue', value: totals.overdue.value, estimatedCost: totals.overdue.estimatedCost, fill: '#ef4444' },
      { label: 'Submitted', value: totals.submitted.value, estimatedCost: totals.submitted.estimatedCost, fill: '#f59e0b' },
    ]
  }, [bills])

  const alertIssueData = useMemo(() => ([
    { label: 'Active / Online', value: dashboardMetrics.meterAlerts.active, fill: '#10b981' },
    { label: 'Inactive / Offline', value: dashboardMetrics.meterAlerts.inactive, fill: '#64748b' },
    { label: 'Maintenance', value: dashboardMetrics.meterAlerts.maintenance, fill: '#f59e0b' },
    { label: 'Unassigned Meters', value: dashboardMetrics.meterAlerts.unassigned, fill: '#8b5cf6' },
  ]), [dashboardMetrics])

  const occupancyData = useMemo(() => ([
    { label: 'Occupied Units', value: dashboardMetrics.occupiedUnits, fill: '#8b5cf6' },
    { label: 'Vacant Units', value: dashboardMetrics.vacantUnits, fill: '#cbd5e1' },
    { label: 'Active Tenants', value: dashboardMetrics.activeTenants, fill: '#10b981' },
    { label: 'Inactive Tenants', value: dashboardMetrics.inactiveTenants, fill: '#94a3b8' },
  ]), [dashboardMetrics])

  const handleViewBill = async (bill) => {
    const response = await fetchAdminBill(bill.id)
    return response?.data || bill
  }

  const handleDeleteBill = async (bill) => {
    if (!bill?.id) return

    try {
      await deleteAdminBill(bill.id)
      setBills((prev) => prev.filter((item) => String(item.id) !== String(bill.id)))
      addToast('Bill deleted successfully.', 'success')
    } catch (error) {
      addToast(error?.response?.data?.message || 'Failed to delete bill.', 'error')
    }
  }

  return (
    <PageSection>
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-600/10 to-indigo-600/10 px-5 py-3.5 dark:border-violet-700/40">
        <div className="flex items-center gap-3">
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
            <p className="text-xs text-violet-500 dark:text-violet-400">
              Viewing all tenants, meters, and consumption data across the entire building.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UpdatingBadge show={isRefreshing} />
          <FilterPills options={FILTER_OPTIONS} value={comparisonFilter} onChange={setComparisonFilter} />
        </div>
      </div>

      {dashboardError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800/50 dark:bg-rose-900/20 dark:text-rose-300">
          {dashboardError}
        </div>
      ) : null}

      <div>
        <h2 className="section-title mb-3">System Utility Consumption</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <UtilityCard type="electricity" {...filteredUtilityCards.electricity} loading={isInitialLoading || isComparisonRangeLoading} updating={isRefreshing} />
          <UtilityCard type="thermal" {...filteredUtilityCards.thermal} loading={isInitialLoading || isComparisonRangeLoading} updating={isRefreshing} />
          <UtilityCard type="water" {...filteredUtilityCards.water} loading={isInitialLoading || isComparisonRangeLoading} updating={isRefreshing} />
        </div>
      </div>

      <ChartCard
        title="System Overview Chart"
        exportable
        exportRows={systemOverviewData}
        subtitle="Combined view of billed revenue, collections, active tenants, and utility consumption for the selected time range"
        action={<BarChart2 className="h-4 w-4 text-violet-500" />}
        loading={isComparisonRangeLoading}
        updating={isRefreshing}
      >
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Billed Revenue', value: `PHP ${dashboardMetrics.totalBilled.toLocaleString()}`, tone: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Collections', value: `PHP ${dashboardMetrics.totalCollected.toLocaleString()}`, tone: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Active Tenants', value: dashboardMetrics.activeTenants, tone: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            { label: 'Consumption', value: `${systemOverviewData.reduce((sum, row) => sum + row.consumption, 0).toLocaleString()} units`, tone: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl px-3 py-2.5 ${item.bg}`}>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{item.label}</p>
              <LoadingValue loading={isInitialLoading || isComparisonRangeLoading} updating={isRefreshing} value={item.value} className={`mt-1 text-sm font-bold ${item.tone}`} spinnerClassName="h-4 w-4 text-slate-400" />
            </div>
          ))}
        </div>

        {systemOverviewData.length > 0 ? (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={systemOverviewData} margin={CHART_MARGIN_COMPACT}>
            <CartesianGrid {...CHART_GRID_PROPS} />
            <XAxis dataKey="label" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis yAxisId="currency" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis yAxisId="ops" orientation="right" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ThemedChartTooltip formatter={(value, name) => [formatChartNumber(value), name]} />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="currency" dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            <Bar yAxisId="currency" dataKey="collections" name="Collections" fill="#10b981" radius={[8, 8, 0, 0]} />
            <Line yAxisId="ops" type="monotone" dataKey="tenants" name="Tenants" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line yAxisId="ops" type="monotone" dataKey="consumption" name="Consumption" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
        ) : isInitialLoading ? (
          <ChartLoadingState text="Loading chart data..." className="h-[320px]" />
        ) : (
          <ChartLoadingState text="No chart data available yet." className="h-[320px]" />
        )}
      </ChartCard>

      <SummaryCardStrip cards={summaryCards.map((card) => ({ ...card, loading: isInitialLoading, updating: isRefreshing }))} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Revenue vs Collection"
          exportable
          exportRows={systemOverviewData}
          subtitle="Billed amounts versus paid collections across the selected window"
          action={<CreditCard className="h-4 w-4 text-emerald-500" />}
          loading={(isInitialLoading && systemOverviewData.length === 0) || isComparisonRangeLoading}
          updating={isRefreshing}
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={systemOverviewData} margin={CHART_MARGIN_COMPACT}>
              <defs>
                <linearGradient id="saRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="saCollections" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...CHART_GRID_PROPS} />
              <XAxis dataKey="label" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip allowEscapeViewBox={{ x: false, y: false }} reverseDirection={{ x: true, y: false }} content={<ThemedChartTooltip formatter={(value, name) => [formatChartNumber(value), name]} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="url(#saRevenue)" strokeWidth={2.2} />
              <Area type="monotone" dataKey="collections" name="Collections" stroke="#10b981" fill="url(#saCollections)" strokeWidth={2.2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          className="overflow-visible"
          title="Billing Status"
          exportable
          exportRows={billingStatusData}
          subtitle="Paid, unpaid, overdue, and submitted bills across the system"
          action={<TrendingUp className="h-4 w-4 text-blue-500" />}
          loading={(isInitialLoading && billingStatusData.every((entry) => Number(entry.value) === 0)) || isComparisonRangeLoading}
          updating={isRefreshing}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={billingStatusData} margin={CHART_MARGIN_COMPACT}>
              <CartesianGrid {...CHART_GRID_PROPS} />
              <XAxis dataKey="label" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                content={(props) => {
                  const sourceEntry = props?.payload?.[0]
                  const chartEntry = sourceEntry?.payload

                  return (
                    <ThemedChartTooltip
                      {...props}
                      constrainToViewBox
                      payload={sourceEntry ? [
                        {
                          ...sourceEntry,
                          name: 'Bills',
                          value: chartEntry?.value ?? 0,
                        },
                        {
                          ...sourceEntry,
                          name: 'Estimated Cost',
                          value: chartEntry?.estimatedCost ?? 0,
                          color: '#f59e0b',
                        },
                      ] : []}
                      formatter={(value, name) => (
                        name === 'Estimated Cost'
                          ? [formatPeso(value), name]
                          : [formatChartNumber(value), name]
                      )}
                    />
                  )
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {billingStatusData.map((entry) => (
                  <Cell key={entry.label} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Alerts / Issues"
          exportable
          exportRows={alertIssueData}
          subtitle="Meter-specific alerts and exceptions that need operational follow-up"
          action={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          loading={(isInitialLoading && alertIssueData.every((entry) => Number(entry.value) === 0)) || isComparisonRangeLoading}
          updating={isRefreshing}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={alertIssueData} layout="vertical" margin={CHART_MARGIN_COMPACT}>
              <CartesianGrid {...CHART_GRID_PROPS} />
              <XAxis type="number" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} reversed={isDesktopCharts} />
              <YAxis dataKey="label" type="category" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} width={120} orientation={isDesktopCharts ? 'right' : 'left'} />
              <Tooltip content={<ThemedChartTooltip formatter={(value, name) => [formatChartNumber(value), name]} />} />
              <Bar dataKey="value" radius={isDesktopCharts ? [8, 0, 0, 8] : [0, 8, 8, 0]}>
                {alertIssueData.map((entry) => (
                  <Cell key={entry.label} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Occupancy / Tenant Overview"
          exportable
          exportRows={occupancyData}
          subtitle="Tenant and unit coverage across the property"
          action={<Building2 className="h-4 w-4 text-violet-500" />}
          loading={(isInitialLoading && occupancyData.every((entry) => Number(entry.value) === 0)) || isComparisonRangeLoading}
          updating={isRefreshing}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={occupancyData} layout="vertical" margin={CHART_MARGIN_COMPACT}>
              <CartesianGrid {...CHART_GRID_PROPS} />
              <XAxis type="number" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis dataKey="label" type="category" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} width={120} />
              <Tooltip content={<ThemedChartTooltip formatter={(value, name) => [formatChartNumber(value), name]} />} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {occupancyData.map((entry) => (
                  <Cell key={entry.label} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(240px,1fr)]">
        <MeterOverviewPanel />

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-700/50 dark:bg-slate-900">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Current Billing Rates</h2>
            <p className="mt-1 text-xs text-slate-400">Live utility pricing used across billing calculations and dashboards</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {RATE_CARDS.map(({ type, label, panel, value }) => {
              const rate = billingRates?.[type]

              return rate ? (
                <div key={type} className={`rounded-2xl border p-4 ${panel}`}>
                  <p className="mb-1 text-xs font-mono uppercase tracking-wider text-slate-400">{label} Rate</p>
                  <LoadingValue
                    loading={isInitialLoading || ratesLoading}
                    updating={isRefreshing && !ratesLoading}
                    value={`PHP ${Number(rate.rate || 0).toFixed(2)}`}
                    className={`text-2xl font-display font-700 ${value}`}
                    spinnerClassName={`h-5 w-5 ${value}`}
                  />
                  <p className="text-xs text-slate-400">{rate.unit}</p>
                </div>
              ) : null
            })}
          </div>
        </div>
      </div>

      <BillsTable
        bills={bills}
        onView={handleViewBill}
        onDelete={handleDeleteBill}
        loading={isInitialLoading}
        updating={isRefreshing}
      />
    </PageSection>
  )
}

