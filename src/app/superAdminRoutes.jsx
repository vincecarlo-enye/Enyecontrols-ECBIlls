import { Route } from 'react-router-dom'
import { lazy } from 'react'
import { RequireSuperAdmin } from './guards'
import AppShellLayout from '@/layouts/AppShellLayout'

const SuperAdminDashboard = lazy(() => import('@/pages/superadmin/Dashboard'))
const MeterManagement = lazy(() => import('@/pages/superadmin/MeterManagement'))
const UserManagement = lazy(() => import('@/pages/superadmin/UserManagement'))
const BillingRates = lazy(() => import('@/pages/superadmin/BillingRates'))
const SAnnouncements = lazy(() => import('@/pages/superadmin/Announcements'))
const AdminTenants = lazy(() => import('@/pages/admin/Tenants'))
const AdminUnits = lazy(() => import('@/pages/admin/Units'))
const AdminUsageReports = lazy(() => import('@/pages/admin/UsageReports'))
const AdminReconciliation = lazy(() => import('@/pages/admin/Reconciliation'))
const AdminOccupancyTimeline = lazy(() => import('@/pages/admin/OccupancyTimeline'))
const AdminOwnerPortal = lazy(() => import('@/pages/admin/OwnerPortal'))
const AdminSystemHealth = lazy(() => import('@/pages/admin/SystemHealth'))
const AdminBillingConcerns = lazy(() => import('@/pages/admin/BillingConcerns'))
const AdminBilling = lazy(() => import('@/pages/admin/Billing'))
const AdminAnomalies = lazy(() => import('@/pages/admin/Anomalies'))
const NewBill = lazy(() => import('@/pages/admin/NewBill'))
const NotificationsPage = lazy(() => import('@/pages/common/Notifications'))
const ActivityLogsPage = lazy(() => import('@/pages/common/ActivityLogs'))
const GlobalSearchPage = lazy(() => import('@/pages/common/GlobalSearch'))
const BillAdjustmentsPage = lazy(() => import('@/pages/common/BillAdjustments'))

export function superAdminRoutes() {
  return (
    <Route path="/super-admin" element={<RequireSuperAdmin><AppShellLayout /></RequireSuperAdmin>}>
      <Route index element={<SuperAdminDashboard />} />
      <Route path="billing" element={<AdminBilling />} />
      <Route path="bill-adjustments" element={<BillAdjustmentsPage />} />
      <Route path="billing/new" element={<NewBill />} />
      <Route path="tenants" element={<AdminTenants />} />
      <Route path="units" element={<AdminUnits />} />
      <Route path="usage-reports" element={<AdminUsageReports />} />
      <Route path="reconciliation" element={<AdminReconciliation />} />
      <Route path="occupancy-timeline" element={<AdminOccupancyTimeline />} />
      <Route path="owner-portal" element={<AdminOwnerPortal />} />
      <Route path="system-health" element={<AdminSystemHealth />} />
      <Route path="billing-concerns" element={<AdminBillingConcerns />} />
      <Route path="anomalies" element={<AdminAnomalies />} />
      <Route path="activity-logs" element={<ActivityLogsPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="search" element={<GlobalSearchPage />} />
      <Route path="meters" element={<MeterManagement />} />
      <Route path="billing-rates" element={<BillingRates />} />
      <Route path="users" element={<UserManagement />} />
      <Route path="announcements" element={<SAnnouncements />} />
    </Route>
  )
}
