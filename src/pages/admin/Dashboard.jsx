/**
 * pages/admin/Dashboard.jsx
 * Refactored – uses useModalState for modal management, React.memo on heavy components.
 */

import { memo }              from 'react'
import { usePageLoader }     from '@/hooks/usePageLoader'
import { DashboardSkeleton } from '@/components/skeletons'
import UtilityCard           from '@/components/common/UtilityCard'
import DailyUsageChart       from '@/components/charts/DailyUsageChart'
import BillsTable            from '@/components/billing/BillsTable'
import BillViewerModal       from '@/components/billing/BillViewerModal'
import AnnouncementPanel     from '@/components/common/AnnouncementPanel'
import DashboardCard         from '@/components/ui/DashboardCard'
import ChartCard             from '@/components/ui/ChartCard'
import utilitiesData         from '@/data/mock/utilities.json'
import { useBills }          from '@/components/billing/hooks/useBills'
import { useModalState }     from '@/hooks/useModalState'
import { useApp }            from '@/context/AppContext'
import { BarChart2, TrendingUp, Building2, Users } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import MeterOverviewPanel from '@/components/meters/MeterOverviewPanel'

const { stats: utilityStats, electricityDaily, waterDaily, thermalDaily } = utilitiesData

// Memoised heavy sub-trees
const MemoCharts = memo(function Charts() {
  return (
    <>
      <div>
        <h2 className="section-title mb-3">Daily Usage Trends</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <ChartCard title="Electricity Daily Usage" subtitle="kWh · last 7 days" accentHex="#f59e0b" badge="+4.2%" badgeCls="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 font-mono text-[10px]">
            <DailyUsageChart data={electricityDaily} dataKey="usage" unit="kWh"    color="#f59e0b" gradientId="elecGradA"   trend={+4.2} />
          </ChartCard>
          <ChartCard title="Water Daily Usage" subtitle="m³ · last 7 days" accentHex="#06b6d4" badge="-2.1%" badgeCls="bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400 font-mono text-[10px]">
            <DailyUsageChart data={waterDaily}       dataKey="usage" unit="m³"     color="#06b6d4" gradientId="waterGradA"  trend={-2.1} />
          </ChartCard>
          <ChartCard title="Thermal Energy Daily Usage" subtitle="kBTU/h · last 7 days" accentHex="#f43f5e" badge="+3.4%" badgeCls="bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 font-mono text-[10px]">
        <DailyUsageChart data={thermalDaily} dataKey="usage" unit="kBTU/h" color="#f43f5e" gradientId="thermalGradA" trend={+3.4} />
      </ChartCard>
    <AnnouncementPanel/>
        </div>
      </div>
      
    </>
  )
})

export default function Dashboard() {
  const loading      = usePageLoader(700)
  const { bills }    = useBills()
  const { tenants }  = useApp()
  const viewer       = useModalState()
  const { user }     = useAuth()

  if (loading) return <DashboardSkeleton />

  const totalRevenue  = bills.filter((b) => b.status === 'paid').reduce((s, b) => s + b.amount, 0)
  const unpaidCount   = bills.filter((b) => ['published','overdue'].includes(b.status)).length
  const activeTenants = tenants.filter((t) => t.status === 'active').length

  const kpi = [
    { title: 'Total Revenue',   value: `₱${totalRevenue.toLocaleString()}`, sub: 'This month',          icon: TrendingUp, gradient: 'from-blue-500 to-blue-600',    glow: 'shadow-blue-500/25' },
    { title: 'Active Tenants',  value: activeTenants,                        sub: 'of 8 units occupied', icon: Users,      gradient: 'from-indigo-500 to-indigo-600', glow: 'shadow-indigo-500/25' },
    { title: 'Building Floors', value: '15',                                 sub: 'Floors managed',       icon: Building2,  gradient: 'from-cyan-500 to-cyan-600',     glow: 'shadow-cyan-500/25' },
    { title: 'Unpaid Bills',    value: unpaidCount,                          sub: 'Requires attention',   icon: BarChart2,  gradient: 'from-rose-500 to-rose-600',     glow: 'shadow-rose-500/25' },
  ]

  return (
    <div className="section-gap animate-in">
      {/* KPI cards – responsive grid */}
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

      {/* Utility Cards */}
      <div>
        <h2 className="section-title mb-3">Utility Consumption</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <UtilityCard type="electricity" {...utilityStats.electricity} />
          <UtilityCard type="thermal"     {...utilityStats.thermal} />
          <UtilityCard type="water"       {...utilityStats.water} />
        </div>
      </div>

      {/* Daily Charts – memoised */}
      <MemoCharts />

      {/* Bills table */}
      <BillsTable onView={(bill) => viewer.open(bill)} />


      {/* Modal managed by useModalState */}
      <BillViewerModal
        bill={viewer.selectedItem}
        isOpen={viewer.isOpen}
        onClose={viewer.close}
      />
    </div>
  )
}
