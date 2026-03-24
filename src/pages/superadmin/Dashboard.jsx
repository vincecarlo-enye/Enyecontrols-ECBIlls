/**
 * pages/superadmin/Dashboard.jsx
 * Full system-wide Super Admin dashboard.
 */
import { memo } from 'react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { DashboardSkeleton } from '@/components/skeletons'
import UtilityCard from '@/components/common/UtilityCard'
import DailyUsageChart from '@/components/charts/DailyUsageChart'
import BillsTable from '@/components/billing/BillsTable'
import BillViewerModal from '@/components/billing/BillViewerModal'
import AnnouncementPanel from '@/components/common/AnnouncementPanel'
import DashboardCard from '@/components/ui/DashboardCard'
import ChartCard from '@/components/ui/ChartCard'
import MeterOverviewPanel from '@/components/meters/MeterOverviewPanel'
import utilitiesData from '@/data/mock/utilities.json'
import { useBills } from '@/components/billing/hooks/useBills'
import { useModalState } from '@/hooks/useModalState'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { BarChart2, TrendingUp, Building2, Users, Gauge, Shield, Globe, Zap, Droplets, Flame } from 'lucide-react'

const { stats: utilityStats, electricityDaily, waterDaily, thermalDaily } = utilitiesData

const MemoCharts = memo(function Charts() {
  return (
    <>
      <div>
        <h2 className="section-title mb-3">System-wide Daily Usage Trends</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <ChartCard title="Electricity Daily Usage" subtitle="kWh · last 7 days" accentHex="#f59e0b" badge="+4.2%" badgeCls="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 font-mono text-[10px]">
            <DailyUsageChart data={electricityDaily} dataKey="usage" unit="kWh" color="#f59e0b" gradientId="elecGradSA" trend={+4.2} />
          </ChartCard>
          <ChartCard title="Water Daily Usage" subtitle="m³ · last 7 days" accentHex="#06b6d4" badge="-2.1%" badgeCls="bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400 font-mono text-[10px]">
            <DailyUsageChart data={waterDaily} dataKey="usage" unit="m³" color="#06b6d4" gradientId="waterGradSA" trend={-2.1} />
          </ChartCard>
          <ChartCard title="Thermal Energy Daily Usage" subtitle="kBTU/h · last 7 days" accentHex="#f43f5e" badge="+3.4%" badgeCls="bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 font-mono text-[10px]">
        <DailyUsageChart data={thermalDaily} dataKey="usage" unit="kBTU/h" color="#f43f5e" gradientId="thermalGradSA" trend={+3.4} />
      </ChartCard>
      {/* Meters overview */}
      <MeterOverviewPanel />
        </div>
      </div>
      
    </>
  )
})

export default function SuperAdminDashboard() {
  const loading = usePageLoader(700)
  const { bills } = useBills()
  const { tenants, meters, billingRates } = useApp()
  const { users } = useAuth()
  const viewer = useModalState()

  if (loading) return <DashboardSkeleton />

  const totalRevenue  = bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.amount, 0)
  const unpaidCount   = bills.filter(b => ['published','overdue'].includes(b.status)).length
  const activeTenants = tenants.filter(t => t.status === 'active').length
  const activeMeters  = meters.filter(m => m.status === 'active').length
  const totalUsers    = users?.length || 0

  const kpi = [
    { title: 'Total Revenue',    value: `₱${totalRevenue.toLocaleString()}`, sub: 'All paid bills',         icon: TrendingUp, gradient: 'from-blue-500 to-blue-600',       glow: 'shadow-blue-500/25'    },
    { title: 'Active Tenants',   value: activeTenants,                        sub: 'of all units occupied', icon: Users,      gradient: 'from-indigo-500 to-indigo-600',   glow: 'shadow-indigo-500/25'  },
    { title: 'Active Meters',    value: activeMeters,                         sub: 'across all units',      icon: Gauge,      gradient: 'from-violet-500 to-violet-600',   glow: 'shadow-violet-500/25'  },
    { title: 'Unpaid Bills',     value: unpaidCount,                          sub: 'Requires attention',    icon: BarChart2,  gradient: 'from-rose-500 to-rose-600',       glow: 'shadow-rose-500/25'    },
    { title: 'System Users',     value: totalUsers,                           sub: 'All roles',             icon: Shield,     gradient: 'from-emerald-500 to-emerald-600', glow: 'shadow-emerald-500/25' },
    { title: 'Building Floors',  value: '15',                                 sub: 'Floors managed',        icon: Building2,  gradient: 'from-cyan-500 to-cyan-600',       glow: 'shadow-cyan-500/25'    },
  ]

  return (
    <div className="section-gap animate-in">
      {/* Super Admin banner */}
      <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border border-violet-200 dark:border-violet-700/40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
          <Shield className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display font-700 text-[15px] text-violet-700 dark:text-violet-300">System Overview</p>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white"><Globe className="w-2.5 h-2.5"/>System-wide</span>
          </div>
          <p className="text-xs text-violet-500 dark:text-violet-400">Viewing all tenants, meters, and consumption data across the entire building.</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {kpi.map((card, i) => (
          <DashboardCard key={card.title} icon={card.icon} title={card.title} value={card.value} sub={card.sub} gradient={card.gradient} glow={card.glow} className={`stagger-${i + 1} animate-in`} />
        ))}
      </div>

      {/* Billing Rates live preview */}
      <div>
        <h2 className="section-title mb-3">Current Billing Rates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {['electricity','water','thermal'].map(type => {
            const r = billingRates?.[type]
            const colors = { electricity: 'amber', water: 'cyan', thermal: 'rose' }
            const icons = { electricity: Zap, water: Droplets, thermal: Flame }
            const color = colors[type]
            return r ? (
              <div key={type} className={`p-4 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 border border-${color}-200 dark:border-${color}-700/50`}>
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">{type} Rate</p>
                <p className="text-2xl font-display font-700 text-slate-800 dark:text-white">₱{r.rate?.toFixed(2)}</p>
                <p className="text-xs text-slate-400">{r.unit}</p>
              </div>
            ) : null
          })}
        </div>
      </div>

      {/* Utility Cards */}
      <div>
        <h2 className="section-title mb-3">System Utility Consumption</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <UtilityCard type="electricity" {...utilityStats.electricity} />
          <UtilityCard type="thermal"     {...utilityStats.thermal} />
          <UtilityCard type="water"       {...utilityStats.water} />
        </div>
      </div>
      
      <MemoCharts />
        

      {/* Bills */}
      <BillsTable onView={(bill) => viewer.open(bill)} />

      {/* <AnnouncementPanel /> */}

      <BillViewerModal bill={viewer.selectedItem} isOpen={viewer.isOpen} onClose={viewer.close} />
    </div>
  )
}
