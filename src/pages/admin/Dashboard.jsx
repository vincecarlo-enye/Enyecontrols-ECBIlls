import { memo } from 'react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { DashboardSkeleton } from '@/components/skeletons'
import UtilityCard from '@/components/common/UtilityCard'
import DailyUsageChart from '@/components/charts/DailyUsageChart'
import BillsTable from '@/components/billing/BillsTable'
import AnnouncementPanel from '@/components/common/AnnouncementPanel'
import DashboardCard from '@/components/ui/DashboardCard'
import ChartCard from '@/components/ui/ChartCard'
import { BarChart2, TrendingUp, Building2, Users, AlertTriangle, Siren, ShieldAlert, CheckCircle2, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import MeterOverviewPanel from '@/components/meters/MeterOverviewPanel'
import { useAdminDashboard } from '@/hooks/adminHooks/useAdminDashboard'
import { useAdminAnomalies } from '@/hooks/adminHooks/useAdminAnomalies'
import { deleteAdminBill, fetchAdminBill } from '../../services/adminService/adminBillingService'
import { useAdminUtilityDashboard } from '../../hooks/adminHooks/useAdminUtilityDashboard'

const MemoCharts = memo(function Charts({
  electricityDaily,
  waterDaily,
  thermalDaily,
  trends,
}) {
  return (
    <>
      <div>
        <h2 className="section-title mb-3">Daily Usage Trends</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <ChartCard
            title="Electricity Daily Usage"
            subtitle="kWh - last 7 days"
            accentHex="#f59e0b"
            badge={trends.electricityBadge.text}
            badgeCls={trends.electricityBadge.className}
          >
            <DailyUsageChart
              data={electricityDaily}
              dataKey="usage"
              unit="kWh"
              color="#f59e0b"
              gradientId="elecGradA"
              trend={trends.electricity}
            />
          </ChartCard>

          <ChartCard
            title="Water Daily Usage"
            subtitle="m3 - last 7 days"
            accentHex="#06b6d4"
            badge={trends.waterBadge.text}
            badgeCls={trends.waterBadge.className}
          >
            <DailyUsageChart
              data={waterDaily}
              dataKey="usage"
              unit="m3"
              color="#06b6d4"
              gradientId="waterGradA"
              trend={trends.water}
            />
          </ChartCard>

          <ChartCard
            title="Thermal Energy Daily Usage"
            subtitle="kBTU/h - last 7 days"
            accentHex="#f43f5e"
            badge={trends.thermalBadge.text}
            badgeCls={trends.thermalBadge.className}
          >
            <DailyUsageChart
              data={thermalDaily}
              dataKey="usage"
              unit="kBTU/h"
              color="#f43f5e"
              gradientId="thermalGradA"
              trend={trends.thermal}
            />
          </ChartCard>

          <AnnouncementPanel />
        </div>
      </div>
    </>
  )
})

function SuperAdminAnomalySummary({ summary, loading, error }) {
  const cards = [
    {
      title: 'Anomalies Today',
      value: summary.total_today,
      sub: 'All detected anomalies',
      icon: Siren,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800/40',
    },
    {
      title: 'Critical Alerts',
      value: summary.critical_today,
      sub: 'Needs urgent review',
      icon: ShieldAlert,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800/40',
    },
    {
      title: 'Minor Alerts',
      value: summary.minor_today,
      sub: 'Lower severity items',
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800/40',
    },
    {
      title: 'Resolution Rate',
      value: `${Number(summary.resolution_rate || 0).toFixed(0)}%`,
      sub: 'Resolved anomaly ratio',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800/40',
    },
  ]

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Anomaly Overview</h2>
          <p className="text-sm text-slate-400 mt-0.5">Executive summary for anomaly monitoring across facilities.</p>
        </div>
        <Link
          to="/super-admin/anomalies"
          className="px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Drill Down
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className={`rounded-2xl border ${card.border} ${card.bg} p-4 shadow-sm`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wide text-slate-400">{card.title}</p>
                  <p className={`text-2xl font-bold mt-1 ${card.color}`}>{loading ? '-' : card.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{card.sub}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/80 dark:bg-slate-900/40 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function Dashboard() {
  const loading = usePageLoader(700)
  const { user } = useAuth()

  const {
    loading: dashboardLoading,
    error,
    metrics,
    bills,
    refreshDashboard,
  } = useAdminDashboard()

  const {
    summary: utilityStats,
    daily,
    trends,
    loading: utilityLoading,
  } = useAdminUtilityDashboard()

  const {
    summary: anomalySummary,
    loading: anomalyLoading,
    error: anomalyError,
  } = useAdminAnomalies()

  const handleViewBill = async (bill) => {
    try {
      const response = await fetchAdminBill(bill.id)
      return response?.data || bill
    } catch {
      return bill
    }
  }

  const handleDeleteBill = async (bill) => {
    if (!bill?.id) return

    await deleteAdminBill(bill.id)
    await refreshDashboard()
  }

  if (loading || dashboardLoading || utilityLoading) {
    return <DashboardSkeleton />
  }

  const kpi = [
    {
      title: 'Total Revenue',
      value: `PHP ${metrics.totalRevenue.toLocaleString()}`,
      sub: 'Collected from paid bills',
      icon: TrendingUp,
      gradient: 'from-blue-500 to-blue-600',
      glow: 'shadow-blue-500/25',
    },
    {
      title: 'Active Tenants',
      value: metrics.activeTenants,
      sub: `${metrics.occupiedUnits} occupied units`,
      icon: Users,
      gradient: 'from-indigo-500 to-indigo-600',
      glow: 'shadow-indigo-500/25',
    },
    {
      title: 'Building Floors',
      value: metrics.totalUnits,
      sub: 'Units managed',
      icon: Building2,
      gradient: 'from-cyan-500 to-cyan-600',
      glow: 'shadow-cyan-500/25',
    },
    {
      title: 'Unpaid Bills',
      value: metrics.unpaidBills,
      sub: `${metrics.pendingConcerns} requires attention`,
      icon: BarChart2,
      gradient: 'from-rose-500 to-rose-600',
      glow: 'shadow-rose-500/25',
    },
  ]

  return (
    <div className="section-gap animate-in">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpi.map((card, i) => (
          <DashboardCard
            key={card.title}
            icon={card.icon}
            title={card.title}
            value={card.value}
            sub={card.sub}
            gradient={card.gradient}
            glow={card.glow}
            className={`stagger-${i + 1} animate-in`}
          />
        ))}
      </div>

      {user?.role === 'super_admin' && (
        <>
          <SuperAdminAnomalySummary
            summary={anomalySummary}
            loading={anomalyLoading}
            error={anomalyError}
          />
          <MeterOverviewPanel compact />
        </>
      )}

      <div>
        <h2 className="section-title mb-3">Utility Consumption</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <UtilityCard type="electric" {...utilityStats.electric} />
          <UtilityCard type="thermal" {...utilityStats.thermal} />
          <UtilityCard type="water" {...utilityStats.water} />
        </div>
      </div>

      <MemoCharts
        electricityDaily={daily.electric}
        waterDaily={daily.water}
        thermalDaily={daily.thermal}
        trends={{
          electricity: trends.electric,
          water: trends.water,
          thermal: trends.thermal,
          electricityBadge: trends.electricBadge,
          waterBadge: trends.waterBadge,
          thermalBadge: trends.thermalBadge,
        }}
      />

      <BillsTable
        bills={bills}
        onView={handleViewBill}
        onDelete={handleDeleteBill}
      />
    </div>
  )
}
