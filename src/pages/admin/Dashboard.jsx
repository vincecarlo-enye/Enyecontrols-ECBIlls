import { memo } from 'react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { DashboardSkeleton } from '@/components/skeletons'
import UtilityCard from '@/components/common/UtilityCard'
import DailyUsageChart from '@/components/charts/DailyUsageChart'
import BillsTable from '@/components/billing/BillsTable'
import AnnouncementPanel from '@/components/common/AnnouncementPanel'
import DashboardCard from '@/components/ui/DashboardCard'
import ChartCard from '@/components/ui/ChartCard'
import { BarChart2, TrendingUp, Building2, Users, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import MeterOverviewPanel from '@/components/meters/MeterOverviewPanel'
import { useAdminDashboard } from '@/hooks/adminHooks/useAdminDashboard'
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

      {user?.role === 'super_admin' && <MeterOverviewPanel compact />}

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
