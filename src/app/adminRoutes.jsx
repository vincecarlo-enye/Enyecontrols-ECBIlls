/**
 * adminRoutes.jsx — Admin + Super Admin routes
 */
import { Route } from 'react-router-dom'
import { lazy } from 'react'
import { RequireAdmin, RequireSuperAdmin } from './guards'
import MainLayout from '@/layouts/MainLayout'
import { useAuth } from '@/context/AuthContext'

const AdminDashboard     = lazy(() => import('@/pages/admin/Dashboard'))
const SADashboard        = lazy(() => import('@/pages/superadmin/Dashboard'))
const AdminBilling       = lazy(() => import('@/pages/admin/Billing'))
const AdminTenants       = lazy(() => import('@/pages/admin/Tenants'))
const AdminUnits         = lazy(() => import('@/pages/admin/Units'))
const AdminUsageReports  = lazy(() => import('@/pages/admin/UsageReports'))
const AdminSettings      = lazy(() => import('@/pages/admin/Settings'))
const AdminTenantReports = lazy(() => import('@/pages/admin/TenantReports'))
const NewBill            = lazy(() => import('@/pages/admin/NewBill'))
const MeterManagement    = lazy(() => import('@/pages/superadmin/MeterManagement'))
const UserManagement     = lazy(() => import('@/pages/superadmin/UserManagement'))
const BillingRates       = lazy(() => import('@/pages/superadmin/BillingRates'))
const SAnnouncements     = lazy(() => import('@/pages/superadmin/Announcements'))

function RoleDashboard() {
  const { user } = useAuth()
  if (user?.role === 'super_admin') return <SADashboard/>
  return <AdminDashboard/>
}

export function adminRoutes() {
  return (
    <Route path="/admin" element={<RequireAdmin><MainLayout/></RequireAdmin>}>
      <Route index            element={<RoleDashboard/>} />
      <Route path="billing"   element={<AdminBilling/>} />
      <Route path="tenants"   element={<AdminTenants/>} />
      <Route path="units"     element={<AdminUnits/>} />
      <Route path="usage-reports"   element={<AdminUsageReports/>} />
      <Route path="settings"        element={<AdminSettings/>} />
      <Route path="tenant-reports"  element={<AdminTenantReports/>} />
      <Route path="billing/new"     element={<NewBill/>} />
      {/* Super Admin only */}
      <Route path="meters"        element={<RequireSuperAdmin><MeterManagement/></RequireSuperAdmin>} />
      <Route path="users"         element={<RequireSuperAdmin><UserManagement/></RequireSuperAdmin>} />
      <Route path="billing-rates" element={<RequireSuperAdmin><BillingRates/></RequireSuperAdmin>} />
      <Route path="announcements" element={<RequireSuperAdmin><SAnnouncements/></RequireSuperAdmin>} />
    </Route>
  )
}
