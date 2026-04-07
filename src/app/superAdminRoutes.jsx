import { Route } from 'react-router-dom'
import { lazy } from 'react'
import { RequireSuperAdmin } from './guards'
import MainLayout from '@/layouts/MainLayout'

const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'))
const MeterManagement = lazy(() => import('@/pages/superadmin/MeterManagement'))
const UserManagement = lazy(() => import('@/pages/superadmin/UserManagement'))
const BillingRates = lazy(() => import('@/pages/superadmin/BillingRates'))
const SAnnouncements = lazy(() => import('@/pages/superadmin/Announcements'))
const AdminTenants = lazy(() => import('@/pages/admin/Tenants'))
const AdminUnits = lazy(() => import('@/pages/admin/Units'))
const AdminUsageReports = lazy(() => import('@/pages/admin/UsageReports'))
const AdminTenantReports = lazy(() => import('@/pages/admin/TenantReports'))
const AdminBilling = lazy(() => import('@/pages/admin/Billing'))
const AdminAnomalies = lazy(() => import('@/pages/admin/Anomalies'))
const NewBill = lazy(() => import('@/pages/admin/NewBill'))
const NotificationsPage = lazy(() => import('@/pages/common/Notifications'))
const ActivityLogsPage = lazy(() => import('@/pages/common/ActivityLogs'))

export function superAdminRoutes() {
  return (
    <Route path="/super-admin" element={<RequireSuperAdmin><MainLayout /></RequireSuperAdmin>}>
      <Route index element={<AdminDashboard />} />
      <Route path="billing" element={<AdminBilling />} />
      <Route path="billing/new" element={<NewBill />} />
      <Route path="tenants" element={<AdminTenants />} />
      <Route path="units" element={<AdminUnits />} />
      <Route path="usage-reports" element={<AdminUsageReports />} />
      <Route path="tenant-reports" element={<AdminTenantReports />} />
      <Route path="anomalies" element={<AdminAnomalies />} />
      <Route path="activity-logs" element={<ActivityLogsPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="meters" element={<MeterManagement />} />
      <Route path="billing-rates" element={<BillingRates />} />
      <Route path="users" element={<UserManagement />} />
      <Route path="announcements" element={<SAnnouncements />} />
    </Route>
  )
}
