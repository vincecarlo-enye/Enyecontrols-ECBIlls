import { memo, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '@/components/navigation/Sidebar'
import Navbar from '@/components/navigation/Navbar'
import { useAuth } from '@/context/AuthContext'
import { fetchFinanceBills, fetchFinancePayments, fetchFinanceTenants, fetchSharedRates } from '@/services/financeService/financeBillService'
import { fetchAdminBills, fetchAdminPayments } from '@/services/adminService/adminBillingService'
import { fetchAdminBillingConcerns, fetchFinanceUsers } from '@/services/adminService/adminBillingConcernService'
import { fetchAdminAnomalies } from '@/services/adminService/adminAnomalyService'
import { fetchAdminTenants } from '@/services/adminService/adminTenantService'
import { fetchAdminUnits } from '@/services/adminService/adminUnitService'
import { fetchAdminMeters } from '@/services/adminService/adminMeterService'
import { fetchAdminRates } from '@/services/adminService/adminRateService'
import { fetchUtilityDaily, fetchUtilitySummary } from '@/services/adminService/adminUtilityService'
import { fetchAdminOmniPage } from '@/services/adminService/adminUsageService'
import { fetchAdminAnnouncements } from '@/services/adminService/adminAnnouncementService'
import { fetchSuperAdminUsers } from '@/services/superAdminService/superAdminUserService'
import { fetchRateHistory } from '@/services/common/rateHistoryService'
import { fetchNotifications } from '@/services/notificationService'
import { fetchAdminReconciliation } from '@/services/adminService/adminReconciliationService'
import { fetchAdminOccupancyTimeline } from '@/services/adminService/adminOccupancyTimelineService'
import { fetchAdminOwnerPortal, fetchAdminOwnerPortalServiceStatus } from '@/services/adminService/adminOwnerPortalService'
import { fetchActivityLogs } from '@/services/activityLogService'
import { getTenantDashboard } from '@/services/tenantService/tenantDashboardService'
import { fetchTenantBills } from '@/services/tenantService/tenantBillingService'

const DEFAULT_USAGE_PAGE = 'Main (Basement)'

function getCurrentMonthValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const ShellOutlet = memo(function ShellOutlet() {
  return <Outlet />
})

export default function AppShellLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const prefetchedScopesRef = useRef(new Set())

  const desktopOffsetClass = collapsed ? 'lg:left-[72px]' : 'lg:left-[240px]'

  useEffect(() => {
    const role = user?.role
    const pathname = location.pathname
    if (!role || !pathname) return

    const scopeKey = `${role}:${pathname}`
    if (prefetchedScopesRef.current.has(scopeKey)) return
    prefetchedScopesRef.current.add(scopeKey)

    const runPrefetch = () => {
      const sharedTasks = [fetchNotifications({ per_page: 25, status: 'all' })]
      const currentMonth = getCurrentMonthValue()

      if (role === 'finance') {
        if (pathname.startsWith('/finance/billing') || pathname.startsWith('/finance/payment-review')) {
          sharedTasks.push(fetchFinanceBills(), fetchFinancePayments(), fetchFinanceTenants(), fetchSharedRates())
        } else if (pathname.startsWith('/finance/reports')) {
          sharedTasks.push(fetchFinanceBills(), fetchFinancePayments())
        } else if (pathname.startsWith('/finance/dashboard')) {
          sharedTasks.push(fetchFinanceBills(), fetchFinancePayments())
        }

        if (pathname.startsWith('/finance/activity-logs')) {
          sharedTasks.push(fetchActivityLogs({ page: 1, per_page: 10 }))
        }

        Promise.allSettled(sharedTasks)
        return
      }

      if (role === 'admin' || role === 'super_admin') {
        const adminPrefetches = [...sharedTasks]

        if (pathname === '/admin' || pathname === '/super-admin') {
          adminPrefetches.push(
            fetchAdminBills(),
            fetchAdminPayments(),
            fetchAdminTenants(),
            fetchAdminUnits(),
            fetchUtilitySummary(),
            fetchUtilityDaily(),
            fetchAdminReconciliation({ month: currentMonth }),
            fetchAdminOmniPage(DEFAULT_USAGE_PAGE)
          )
        } else if (pathname.startsWith('/admin/billing') || pathname.startsWith('/super-admin/billing')) {
          adminPrefetches.push(fetchAdminBills(), fetchAdminPayments(), fetchAdminRates())
        } else if (pathname.startsWith('/admin/tenants') || pathname.startsWith('/super-admin/tenants')) {
          adminPrefetches.push(fetchAdminTenants())
        } else if (pathname.startsWith('/admin/units') || pathname.startsWith('/super-admin/units')) {
          adminPrefetches.push(fetchAdminUnits())
        } else if (pathname.startsWith('/admin/meters') || pathname.startsWith('/super-admin/meters')) {
          adminPrefetches.push(fetchAdminMeters())
        } else if (pathname.startsWith('/admin/usage-reports') || pathname.startsWith('/super-admin/usage-reports')) {
          adminPrefetches.push(fetchAdminOmniPage(DEFAULT_USAGE_PAGE))
        } else if (pathname.startsWith('/admin/billing-concerns') || pathname.startsWith('/super-admin/billing-concerns')) {
          adminPrefetches.push(fetchAdminBillingConcerns(), fetchFinanceUsers())
        } else if (pathname.startsWith('/admin/reconciliation') || pathname.startsWith('/super-admin/reconciliation')) {
          adminPrefetches.push(fetchAdminReconciliation({ month: currentMonth }))
        } else if (pathname.startsWith('/admin/occupancy-timeline') || pathname.startsWith('/super-admin/occupancy-timeline')) {
          adminPrefetches.push(fetchAdminOccupancyTimeline({ month: currentMonth }))
        } else if (pathname.startsWith('/admin/owner-portal') || pathname.startsWith('/super-admin/owner-portal')) {
          adminPrefetches.push(fetchAdminOwnerPortal(currentMonth), fetchAdminOwnerPortalServiceStatus())
        } else if (pathname.startsWith('/admin/activity-logs') || pathname.startsWith('/super-admin/activity-logs')) {
          adminPrefetches.push(fetchActivityLogs({ page: 1, per_page: 10 }))
        } else if (pathname.startsWith('/admin/anomalies') || pathname.startsWith('/super-admin/anomalies')) {
          adminPrefetches.push(fetchAdminAnomalies())
        } else if (pathname.startsWith('/super-admin/announcements')) {
          adminPrefetches.push(fetchAdminAnnouncements())
        } else if (pathname.startsWith('/super-admin/billing-rates')) {
          adminPrefetches.push(fetchAdminRates(), fetchRateHistory())
        }

        if (role === 'super_admin') {
          if (pathname === '/super-admin' || pathname.startsWith('/super-admin/users')) {
            adminPrefetches.push(fetchSuperAdminUsers())
          }
        }

        Promise.allSettled(adminPrefetches)
      }

      if (role === 'facility_manager' || role === 'tenant') {
        const roleSharedPrefetches = [...sharedTasks]
        if (pathname.startsWith('/facility/activity-logs') || pathname.startsWith('/tenant/activity-logs')) {
          roleSharedPrefetches.push(fetchActivityLogs({ page: 1, per_page: 10 }))
        }

        Promise.allSettled(roleSharedPrefetches)
      }
    }

    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(() => runPrefetch(), { timeout: 1500 })
      return () => window.cancelIdleCallback?.(idleId)
    }

    const timeoutId = window.setTimeout(runPrefetch, 300)
    return () => window.clearTimeout(timeoutId)
  }, [location.pathname, user?.role])

  useEffect(() => {
    if (user?.role !== 'tenant') return

    const refreshTenantData = () => {
      Promise.allSettled([
        getTenantDashboard('all', { force: true }),
        fetchTenantBills(),
        fetchNotifications({ per_page: 25, status: 'all' }),
      ])
    }

    refreshTenantData()
    const interval = window.setInterval(refreshTenantData, 60000)

    return () => window.clearInterval(interval)
  }, [user?.role])

  return (
    <div className="app-shell min-h-screen mesh-bg dark:bg-slate-900">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
      />

      <div
        className={[
          'min-h-screen flex flex-col',
          collapsed ? 'lg:pl-[72px]' : 'lg:pl-[240px]',
        ].join(' ')}
      >
        <div className={`fixed top-0 left-0 right-0 z-20 ${desktopOffsetClass}`}>
          <Navbar onMenuClick={() => setMobileOpen(true)} />
        </div>
        <main className="app-shell-main flex-1 h-full min-w-0 overflow-x-hidden p-6 pt-[88px]">
          <ShellOutlet />
        </main>
      </div>
    </div>
  )
}
