/**
 * adminRoutes.jsx - Admin + Super Admin routes
 */
import { Route } from 'react-router-dom'
import { lazy } from 'react'
import { RequireAdmin, RequireSuperAdmin } from './guards'
import MainLayout from '@/layouts/MainLayout'
import { useAuth } from '@/context/AuthContext'

const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'))
const SADashboard = lazy(() => import('@/pages/superadmin/Dashboard'))
const AdminBilling = lazy(() => import('@/pages/admin/Billing'))
const AdminTenants = lazy(() => import('@/pages/admin/Tenants'))
const AdminUnits = lazy(() => import('@/pages/admin/Units'))
const AdminUsageReports = lazy(() => import('@/pages/admin/UsageReports'))
const AdminReconciliation = lazy(() => import('@/pages/admin/Reconciliation'))
const AdminOccupancyTimeline = lazy(() => import('@/pages/admin/OccupancyTimeline'))
const AdminOwnerPortal = lazy(() => import('@/pages/admin/OwnerPortal'))
const AdminSystemHealth = lazy(() => import('@/pages/admin/SystemHealth'))
const AdminSettings = lazy(() => import('@/pages/admin/Settings'))
const AdminTenantReports = lazy(() => import('@/pages/admin/TenantReports'))
const AdminAnomalies = lazy(() => import('@/pages/admin/Anomalies'))
const NewBill = lazy(() => import('@/pages/admin/NewBill'))
const NotificationsPage = lazy(() => import('@/pages/common/Notifications'))
const ActivityLogsPage = lazy(() => import('@/pages/common/ActivityLogs'))
const OperationalExportsPage = lazy(() => import('@/pages/common/OperationalExports'))
const GlobalSearchPage = lazy(() => import('@/pages/common/GlobalSearch'))
const BillAdjustmentsPage = lazy(() => import('@/pages/common/BillAdjustments'))
const MeterManagement = lazy(() => import('@/pages/superadmin/MeterManagement'))
const UserManagement = lazy(() => import('@/pages/superadmin/UserManagement'))
const BillingRates = lazy(() => import('@/pages/superadmin/BillingRates'))
const SAnnouncements = lazy(() => import('@/pages/superadmin/Announcements'))

function RoleDashboard() {
  const { user } = useAuth()
  if (user?.role === 'super_admin') return <SADashboard />
  return <AdminDashboard />
}

export function adminRoutes() {
  return (
    <Route path="/admin" element={<RequireAdmin><MainLayout /></RequireAdmin>}>
      <Route index element={<RoleDashboard />} />
      <Route path="billing" element={<AdminBilling />} />
      <Route path="tenants" element={<AdminTenants />} />
      <Route path="units" element={<AdminUnits />} />
      <Route path="usage-reports" element={<AdminUsageReports />} />
      <Route path="reconciliation" element={<AdminReconciliation />} />
      <Route path="occupancy-timeline" element={<AdminOccupancyTimeline />} />
      <Route path="owner-portal" element={<AdminOwnerPortal />} />
      <Route path="system-health" element={<AdminSystemHealth />} />
      <Route path="operational-exports" element={<OperationalExportsPage />} />
      <Route path="bill-adjustments" element={<BillAdjustmentsPage />} />
      <Route path="settings" element={<AdminSettings />} />
      <Route path="tenant-reports" element={<AdminTenantReports />} />
      <Route path="anomalies" element={<AdminAnomalies />} />
      <Route path="activity-logs" element={<ActivityLogsPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="search" element={<GlobalSearchPage />} />
      <Route path="billing/new" element={<NewBill />} />
      <Route path="meters" element={<RequireSuperAdmin><MeterManagement /></RequireSuperAdmin>} />
      <Route path="users" element={<RequireSuperAdmin><UserManagement /></RequireSuperAdmin>} />
      <Route path="billing-rates" element={<RequireSuperAdmin><BillingRates /></RequireSuperAdmin>} />
      <Route path="announcements" element={<RequireSuperAdmin><SAnnouncements /></RequireSuperAdmin>} />
    </Route>
  )
}
