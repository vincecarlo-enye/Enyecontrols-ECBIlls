import { memo, useEffect, useMemo, useState } from 'react'
import { usePageLoader } from '@/hooks/usePageLoader'
import UtilityCard from '@/components/common/UtilityCard'
import FilterPills from '@/components/common/FilterPills'
import BillsTable from '@/components/billing/BillsTable'
import ChartCard from '@/components/ui/ChartCard'
import SummaryCardStrip from '@/components/dashboard/SummaryCardStrip'
import PageSection from '@/components/layout/PageSection'
import {
  CHART_AXIS_TICK,
  CHART_GRID_PROPS,
  CHART_MARGIN_COMPACT,
  ThemedChartTooltip,
  formatChartNumber,
} from '@/components/charts/rechartsTheme.jsx'
import { BarChart2, TrendingUp, Building2, Users, AlertTriangle, Siren, ShieldAlert, CheckCircle2, Activity } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useAdminDashboard } from '@/hooks/adminHooks/useAdminDashboard'
import { useAdminAnomalies } from '@/hooks/adminHooks/useAdminAnomalies'
import { useAdminRates } from '@/hooks/adminHooks/useAdminRates'
import { UpdatingBadge } from '@/components/common/InlineLoadingState'
import {
  buildUtilityComparisonRows,
  getBillingStatusCounts,
  getPaymentReviewCounts,
} from '@/utils/dashboardCharts'
import { buildUtilityCardMetric } from '@/utils/utilityCards'
import { fetchAdminBill } from '../../services/adminService/adminBillingService'
import { useAdminUtilityDashboard } from '../../hooks/adminHooks/useAdminUtilityDashboard'
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const FILTER_OPTIONS = [
  { key: '7D', label: '7D' },
  { key: '1M', label: '1M' },
  { key: '1Y', label: '1Y' },
]

const UTILITY_META = [
  { key: 'electricity', label: 'Electricity', color: '#f59e0b' },
  { key: 'water', label: 'Water', color: '#06b6d4' },
  { key: 'thermal', label: 'Thermal', color: '#f43f5e' },
]

const MemoCharts = memo(function Charts({
  electricityDaily,
  waterDaily,
  thermalDaily,
  filter,
  setFilter,
  loading = false,
  updating = false,
}) {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const comparisonData = useMemo(
    () => buildUtilityComparisonRows(filter, electricityDaily, waterDaily, thermalDaily),
    [filter, electricityDaily, thermalDaily, waterDaily]
  )

  const pieData = useMemo(
    () =>
      UTILITY_META.map((item) => ({
        name: item.label,
        value: comparisonData.reduce((sum, row) => sum + Number(row[item.key] || 0), 0),
        color: item.color,
      })),
    [comparisonData]
  )

  const topUtility = [...pieData].sort((a, b) => b.value - a.value)[0]

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:items-stretch">
      <ChartCard
        className="lg:col-span-2"
        title="Consumption Comparison"
        exportable
        exportRows={comparisonData}
        loading={loading}
        updating={updating}
        subtitle={
          filter === '7D'
            ? 'Daily comparison across utilities'
            : filter === '1M'
              ? 'Weekly consumption view for the month'
              : 'Monthly consumption view for the year'
        }
        action={(
          <FilterPills options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
        )}
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={comparisonData} barGap={6} margin={CHART_MARGIN_COMPACT}>
            <CartesianGrid {...CHART_GRID_PROPS} />
            <XAxis dataKey="label" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip
              content={<ThemedChartTooltip isDark={isDark} formatter={(value, name) => [formatChartNumber(value), name]} />}
              formatter={(value, name) => [formatChartNumber(value), name]}
            />
            <Legend />
            {UTILITY_META.map((item) => (
              <Bar key={item.key} dataKey={item.key} name={item.label} radius={[8, 8, 0, 0]} fill={item.color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Most Use Consumption"
        exportable
        exportRows={pieData}
        loading={loading}
        updating={updating}
        subtitle="Share of usage by utility"
        badge={topUtility ? topUtility.name : 'N/A'}
        badgeCls="border border-cyan-200/90 bg-gradient-to-b from-white to-cyan-50 text-cyan-800 shadow-[0_8px_20px_rgba(34,211,238,0.14)] dark:border-cyan-400/25 dark:bg-[linear-gradient(180deg,rgba(34,211,238,0.18),rgba(34,211,238,0.08))] dark:text-cyan-200 dark:shadow-[0_0_0_1px_rgba(34,211,238,0.12),0_10px_24px_rgba(8,145,178,0.18)]"
      >
        <div className="space-y-3">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={4} stroke="transparent">
                {pieData.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip
                content={<ThemedChartTooltip isDark={isDark} formatter={(value) => formatChartNumber(value)} />}
                formatter={(value) => formatChartNumber(value)}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-1 gap-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/80 px-3 py-2 dark:border-white/6 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{formatChartNumber(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>
    </div>
  )
})

export default function Dashboard() {
  const loading = usePageLoader(700)
  const { user } = useAuth()
  const [comparisonFilter, setComparisonFilter] = useState('7D')

  const {
    loading: dashboardLoading,
    error,
    metrics,
    bills,
    payments,
  } = useAdminDashboard()
  const { rates: billingRates } = useAdminRates()

  const {
    summary: utilityStats,
    daily,
    comparison,
    loading: utilityLoading,
    comparisonLoadingRanges,
    ensureComparisonRange,
  } = useAdminUtilityDashboard()

  const {
    summary: anomalySummary,
    loading: anomalyLoading,
    error: anomalyError,
  } = useAdminAnomalies()

  const safeMetrics = {
    totalRevenue: metrics?.totalRevenue ?? 0,
    activeTenants: metrics?.activeTenants ?? 0,
    occupiedUnits: metrics?.occupiedUnits ?? 0,
    totalUnits: metrics?.totalUnits ?? 0,
    unpaidBills: metrics?.unpaidBills ?? 0,
    pendingConcerns: metrics?.pendingConcerns ?? 0,
  }

  const handleViewBill = async (bill) => {
    try {
      const response = await fetchAdminBill(bill.id)
      return response?.data || bill
    } catch {
      return bill
    }
  }

  const filteredUtilityCards = useMemo(() => {
    const activeSeries = comparison?.[comparisonFilter] || {
      electric: daily.electric,
      water: daily.water,
      thermal: daily.thermal,
    }

    const comparisonRows = buildUtilityComparisonRows(
      comparisonFilter,
      activeSeries.electric,
      activeSeries.water,
      activeSeries.thermal,
    )

    const buildCard = (summaryKey, rateKey, rowKey) => {
      const cardSummary = utilityStats?.[summaryKey] || {}
      const values = comparisonRows.map((row) => ({
        label: row.label,
        value: Number(row?.[rowKey] || 0),
      }))
      const periodConsumption = Number(cardSummary.periodConsumption ?? cardSummary.usage ?? cardSummary.value ?? 0)

      return buildUtilityCardMetric({
        type: rateKey,
        usage: periodConsumption,
        unit: cardSummary.unit || (summaryKey === 'electric' ? 'kWh' : summaryKey === 'thermal' ? 'kBTU' : 'm3'),
        trend: Number(cardSummary.trend ?? cardSummary.delta ?? 0),
        rates: billingRates,
        fallbackEstimatedCost: Number(cardSummary.estimatedCost ?? cardSummary.cost ?? 0),
        series: values,
      })
    }

    return {
      electric: buildCard('electric', 'electricity', 'electricity'),
      water: buildCard('water', 'water', 'water'),
      thermal: buildCard('thermal', 'thermal', 'thermal'),
    }
  }, [billingRates, comparison, comparisonFilter, daily.electric, daily.thermal, daily.water, utilityStats])

  const billingStatusData = useMemo(() => {
    const counts = getBillingStatusCounts(bills)

    return [
      { name: 'Paid', value: counts.paid, color: '#10b981' },
      { name: 'Unpaid', value: counts.open, color: '#3b82f6' },
      { name: 'Overdue', value: counts.overdue, color: '#f43f5e' },
      { name: 'Submitted', value: counts.submitted, color: '#f59e0b' },
    ]
  }, [bills])

  const paymentReviewData = useMemo(() => {
    const counts = getPaymentReviewCounts(Array.isArray(payments) ? payments : [])

    return [
      { name: 'Pending Review', value: counts.pending },
      { name: 'Approved', value: counts.verified },
      { name: 'Rejected', value: counts.rejected },
    ]
  }, [payments])

  const summaryCards = useMemo(() => {
    const kpi = [
      {
        title: 'Total Revenue',
        value: `PHP ${safeMetrics.totalRevenue.toLocaleString()}`,
        sub: 'Collected from paid bills',
        icon: TrendingUp,
        gradient: 'from-blue-500 to-blue-600',
        glow: 'shadow-blue-500/25',
      },
      {
        title: 'Active Tenants',
        value: safeMetrics.activeTenants,
        sub: `${safeMetrics.occupiedUnits} occupied units`,
        icon: Users,
        gradient: 'from-indigo-500 to-indigo-600',
        glow: 'shadow-indigo-500/25',
      },
      {
        title: 'Building Floors',
        value: safeMetrics.totalUnits,
        sub: 'Units managed',
        icon: Building2,
        gradient: 'from-cyan-500 to-cyan-600',
        glow: 'shadow-cyan-500/25',
      },
      {
        title: 'Unpaid Bills',
        value: safeMetrics.unpaidBills,
        sub: `${safeMetrics.pendingConcerns} requires attention`,
        icon: BarChart2,
        gradient: 'from-rose-500 to-rose-600',
        glow: 'shadow-rose-500/25',
      },
    ]

    if (user?.role !== 'super_admin') return kpi

    return [
      ...kpi,
      {
        title: 'Anomalies Today',
        value: anomalyLoading ? '-' : anomalySummary.total_today,
        sub: 'All detected anomalies',
        icon: Siren,
        gradient: 'from-amber-400 to-orange-500',
        glow: 'shadow-amber-500/20',
      },
      {
        title: 'Critical Alerts',
        value: anomalyLoading ? '-' : anomalySummary.critical_today,
        sub: 'Needs urgent review',
        icon: ShieldAlert,
        gradient: 'from-rose-500 to-red-600',
        glow: 'shadow-rose-500/20',
      },
      {
        title: 'Minor Alerts',
        value: anomalyLoading ? '-' : anomalySummary.minor_today,
        sub: 'Lower severity items',
        icon: Activity,
        gradient: 'from-sky-500 to-blue-600',
        glow: 'shadow-sky-500/20',
      },
      {
        title: 'Resolution Rate',
        value: anomalyLoading ? '-' : `${Number(anomalySummary.resolution_rate || 0).toFixed(0)}%`,
        sub: 'Resolved anomaly ratio',
        icon: CheckCircle2,
        gradient: 'from-emerald-500 to-teal-600',
        glow: 'shadow-emerald-500/20',
      },
    ]
  }, [anomalyLoading, anomalySummary, safeMetrics.activeTenants, safeMetrics.occupiedUnits, safeMetrics.pendingConcerns, safeMetrics.totalRevenue, safeMetrics.totalUnits, safeMetrics.unpaidBills, user?.role])

  useEffect(() => {
    ensureComparisonRange(comparisonFilter)
  }, [comparisonFilter, ensureComparisonRange])

  const isInitialLoading =
    (loading || dashboardLoading || utilityLoading)
    && bills.length === 0
    && Object.values(safeMetrics).every((value) => Number(value || 0) === 0)
  const isComparisonRangeLoading = comparisonLoadingRanges?.has?.(comparisonFilter)

  const isRefreshing = !isInitialLoading && (dashboardLoading || utilityLoading || anomalyLoading || isComparisonRangeLoading)

  return (
    <PageSection>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
  
  {/* Left */}
  <div>
    <h1 className="page-title">Admin Dashboard</h1>
    <p className="muted-text mt-0.5">
      Building-wide billing, utility, and tenant performance overview.
    </p>
  </div>

  {/* Right */}
  <div className="flex items-center justify-end gap-2 flex-wrap w-full md:w-auto">
    <UpdatingBadge show={isRefreshing} />
    <FilterPills
      options={FILTER_OPTIONS}
      value={comparisonFilter}
      onChange={setComparisonFilter}
    />
  </div>
</div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <UtilityCard type="electric" {...filteredUtilityCards.electric} loading={isInitialLoading || isComparisonRangeLoading} updating={isRefreshing} />
        <UtilityCard type="thermal" {...filteredUtilityCards.thermal} loading={isInitialLoading || isComparisonRangeLoading} updating={isRefreshing} />
        <UtilityCard type="water" {...filteredUtilityCards.water} loading={isInitialLoading || isComparisonRangeLoading} updating={isRefreshing} />
      </div>

      {user?.role === 'super_admin' && anomalyError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {anomalyError}
        </div>
      )}

      <SummaryCardStrip cards={summaryCards.map((card) => ({ ...card, loading: isInitialLoading || anomalyLoading, updating: isRefreshing }))} />

      <MemoCharts
        electricityDaily={(comparison?.[comparisonFilter] || {}).electric || daily.electric}
        waterDaily={(comparison?.[comparisonFilter] || {}).water || daily.water}
        thermalDaily={(comparison?.[comparisonFilter] || {}).thermal || daily.thermal}
        filter={comparisonFilter}
        setFilter={setComparisonFilter}
        loading={(isInitialLoading && !buildUtilityComparisonRows(
          comparisonFilter,
          (comparison?.[comparisonFilter] || {}).electric || daily.electric,
          (comparison?.[comparisonFilter] || {}).water || daily.water,
          (comparison?.[comparisonFilter] || {}).thermal || daily.thermal,
        ).length) || isComparisonRangeLoading}
        updating={isRefreshing}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartCard
          className="overflow-visible"
          title="Billing Status"
          exportable
          exportRows={billingStatusData}
          subtitle="Current bill distribution across the building"
          loading={(isInitialLoading && billingStatusData.every((entry) => Number(entry.value || 0) === 0)) || isComparisonRangeLoading}
          updating={isRefreshing}
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={billingStatusData}
                dataKey="value"
                nameKey="name"
                innerRadius={56}
                outerRadius={92}
                paddingAngle={4}
                stroke="transparent"
              >
                {billingStatusData.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip
                allowEscapeViewBox={{ x: false, y: false }}
                reverseDirection={{ x: true, y: false }}
                content={<ThemedChartTooltip constrainToViewBox isDark={typeof document !== 'undefined' && document.documentElement.classList.contains('dark')} formatter={(value, name) => [formatChartNumber(value), name]} />}
                formatter={(value, name) => [formatChartNumber(value), name]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Payment Review"
          exportable
          exportRows={paymentReviewData}
          subtitle="Receipt review workload and outcomes"
          loading={(isInitialLoading && paymentReviewData.every((entry) => Number(entry.value || 0) === 0)) || isComparisonRangeLoading}
          updating={isRefreshing}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={paymentReviewData} margin={CHART_MARGIN_COMPACT}>
              <CartesianGrid {...CHART_GRID_PROPS} />
              <XAxis dataKey="name" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                content={<ThemedChartTooltip isDark={typeof document !== 'undefined' && document.documentElement.classList.contains('dark')} formatter={(value, name) => [formatChartNumber(value), name]} />}
                formatter={(value, name) => [formatChartNumber(value), name]}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                <Cell fill="#f59e0b" />
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <BillsTable bills={bills} onView={handleViewBill} loading={isInitialLoading} updating={isRefreshing} />
    </PageSection>
  )
}
