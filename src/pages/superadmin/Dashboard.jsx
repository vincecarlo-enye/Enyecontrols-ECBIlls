import { memo, useEffect } from 'react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { DashboardSkeleton } from '@/components/skeletons'
import UtilityCard from '@/components/common/UtilityCard'
import DailyUsageChart from '@/components/charts/DailyUsageChart'
import BillsTable from '@/components/billing/BillsTable'
import BillViewerModal from '@/components/billing/BillViewerModal'
import ChartCard from '@/components/ui/ChartCard'
import SummaryCardStrip from '@/components/dashboard/SummaryCardStrip'
import PageSection, { PageHeader } from '@/components/layout/PageSection'
import MeterOverviewPanel from '@/components/meters/MeterOverviewPanel'
import { useBills } from '@/components/billing/hooks/useBills'
import { useModalState } from '@/hooks/useModalState'
import { useAuth } from '@/context/AuthContext'
import { useAdminTenants } from '@/hooks/adminHooks/useAdminTenants'
import { useAdminRates } from '@/hooks/adminHooks/useAdminRates'
import { useMeterOverviewData } from '@/hooks/adminHooks/useMeterOverviewData'
import { useAdminUtilityDashboard } from '@/hooks/adminHooks/useAdminUtilityDashboard'
import { DASHBOARD_READ_REFRESH_MS } from '@/constants/liveData'
import {
  BarChart2,
  TrendingUp,
  Building2,
  Users,
  Gauge,
  Shield,
  Globe,
} from 'lucide-react'

const MemoCharts = memo(function Charts({ meterOverview, daily, trends }) {
  return (
    <div className="min-w-0">
      <h2 className="section-title mb-3">System-wide Daily Usage Trends</h2>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 min-w-0">
        <ChartCard
          title="Electricity Daily Usage"
          subtitle="kWh · last 7 days"
          accentHex="#f59e0b"
          badge={trends.electricBadge.text}
          badgeCls={trends.electricBadge.className}
        >
          <DailyUsageChart
            data={daily.electric}
            dataKey="usage"
            unit="kWh"
            color="#f59e0b"
            gradientId="elecGradSA"
            trend={trends.electric}
          />
        </ChartCard>

        <ChartCard
          title="Water Daily Usage"
          subtitle="m3 · last 7 days"
          accentHex="#06b6d4"
          badge={trends.waterBadge.text}
          badgeCls={trends.waterBadge.className}
        >
          <DailyUsageChart
            data={daily.water}
            dataKey="usage"
            unit="m3"
            color="#06b6d4"
            gradientId="waterGradSA"
            trend={trends.water}
          />
        </ChartCard>

        <ChartCard
          title="Thermal Energy Daily Usage"
          subtitle="kBTU/h · last 7 days"
          accentHex="#f43f5e"
          badge={trends.thermalBadge.text}
          badgeCls={trends.thermalBadge.className}
        >
          <DailyUsageChart
            data={daily.thermal}
            dataKey="usage"
            unit="kBTU/h"
            color="#f43f5e"
            gradientId="thermalGradSA"
            trend={trends.thermal}
          />
        </ChartCard>

        <MeterOverviewPanel data={meterOverview} />
      </div>
    </div>
  )
})

function buildUtilityBars(rows = []) {
  return (Array.isArray(rows) ? rows : []).slice(-7).map((row, index) => ({
    label: row?.day || `D${index + 1}`,
    value: Number(row?.usage ?? 0),
  }))
}

export default function SuperAdminDashboard() {
  const loading = usePageLoader(700)
  const { bills, refreshBills } = useBills()
  const { users } = useAuth()
  const { tenants, loading: tenantsLoading, loadTenants } = useAdminTenants()
  const { rates: billingRates, loading: ratesLoading, loadRates } = useAdminRates()
  const meterOverview = useMeterOverviewData()
  const {
    summary: utilityStats,
    daily,
    trends,
    loading: utilityLoading,
    refreshUtilities,
  } = useAdminUtilityDashboard()
  const viewer = useModalState()
  const { loadMeterOverview } = meterOverview

  useEffect(() => {
    const timer = window.setInterval(() => {
      refreshBills({ silent: true })
      loadTenants({ silent: true })
      loadRates({ silent: true })
      loadMeterOverview({ silent: true })
      refreshUtilities({ silent: true })
    }, DASHBOARD_READ_REFRESH_MS)

    return () => window.clearInterval(timer)
  }, [refreshBills, loadTenants, loadRates, loadMeterOverview, refreshUtilities])

  if (loading || tenantsLoading || ratesLoading || meterOverview.loading || utilityLoading) {
    return <DashboardSkeleton />
  }

  const totalRevenue = bills
    .filter((bill) => bill.status === 'paid')
    .reduce((sum, bill) => sum + bill.amount, 0)
  const unpaidCount = bills.filter((bill) => ['published', 'overdue'].includes(bill.status)).length
  const activeTenants = tenants.filter((tenant) => tenant.status === 'active').length
  const totalUsers = users?.length || 0

  const kpi = [
    {
      title: 'Total Revenue',
      value: `PHP ${totalRevenue.toLocaleString()}`,
      sub: 'All paid bills',
      icon: TrendingUp,
      gradient: 'from-blue-500 to-blue-600',
      glow: 'shadow-blue-500/25',
    },
    {
      title: 'Active Tenants',
      value: activeTenants,
      sub: 'Of all occupied units',
      icon: Users,
      gradient: 'from-indigo-500 to-indigo-600',
      glow: 'shadow-indigo-500/25',
    },
    {
      title: 'Active Meters',
      value: meterOverview.active,
      sub: 'Across all units',
      icon: Gauge,
      gradient: 'from-violet-500 to-violet-600',
      glow: 'shadow-violet-500/25',
    },
    {
      title: 'Unpaid Bills',
      value: unpaidCount,
      sub: 'Requires attention',
      icon: BarChart2,
      gradient: 'from-rose-500 to-rose-600',
      glow: 'shadow-rose-500/25',
    },
    {
      title: 'System Users',
      value: totalUsers,
      sub: 'All roles',
      icon: Shield,
      gradient: 'from-emerald-500 to-emerald-600',
      glow: 'shadow-emerald-500/25',
    },
    {
      title: 'Building Floors',
      value: '15',
      sub: 'Floors managed',
      icon: Building2,
      gradient: 'from-cyan-500 to-cyan-600',
      glow: 'shadow-cyan-500/25',
    },
  ]

  return (
    <div className="section-gap animate-in min-w-0">
      <PageSection>
        <PageHeader
          title="System Overview"
          subtitle="Viewing all tenants, meters, and consumption data across the entire building."
          icon={Shield}
          actions={(
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
              <Globe className="w-3 h-3" />
              System-wide
            </span>
          )}
        />
      </PageSection>

      <SummaryCardStrip
        stretch
        cards={kpi.map((card) => ({
          title: card.title,
          value: card.value,
          sub: card.sub,
          icon: card.icon,
          gradient: card.gradient,
          glow: card.glow,
        }))}
      />

      <PageSection>
        <div className="min-w-0">
          <h2 className="section-title mb-3">Current Billing Rates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {['electricity', 'water', 'thermal'].map((type) => {
              const rate = billingRates?.[type]
              const tones = {
                electricity: 'border-amber-200 bg-amber-50 dark:border-amber-700/50 dark:bg-amber-900/20',
                water: 'border-cyan-200 bg-cyan-50 dark:border-cyan-700/50 dark:bg-cyan-900/20',
                thermal: 'border-rose-200 bg-rose-50 dark:border-rose-700/50 dark:bg-rose-900/20',
              }

              return rate ? (
                <div key={type} className={`p-4 rounded-2xl border ${tones[type]}`}>
                  <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">{type} Rate</p>
                  <p className="text-2xl font-display font-700 text-slate-800 dark:text-white">
                    PHP {Number(rate.rate || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400">{rate.unit}</p>
                </div>
              ) : null
            })}
          </div>
        </div>
      </PageSection>

      <PageSection>
        <div className="min-w-0">
          <h2 className="section-title mb-3">System Utility Consumption</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <UtilityCard type="electricity" {...utilityStats.electric} bars={buildUtilityBars(daily.electric)} />
            <UtilityCard type="thermal" {...utilityStats.thermal} bars={buildUtilityBars(daily.thermal)} />
            <UtilityCard type="water" {...utilityStats.water} bars={buildUtilityBars(daily.water)} />
          </div>
        </div>
      </PageSection>

      <PageSection>
        <MemoCharts meterOverview={meterOverview} daily={daily} trends={trends} />
      </PageSection>

      <PageSection padded={false}>
        <BillsTable onView={(bill) => viewer.open(bill)} />
      </PageSection>

      <BillViewerModal bill={viewer.selectedItem} isOpen={viewer.isOpen} onClose={viewer.close} />
    </div>
  )
}

