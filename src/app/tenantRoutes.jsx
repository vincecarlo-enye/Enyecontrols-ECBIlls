/**
 * tenantRoutes.jsx
 */

import { Route, Navigate } from "react-router-dom"
import { lazy } from "react"

import { RequireTenant } from "./guards"
import TenantLayout from "@/layouts/TenantLayout"

const TenantDashboard = lazy(() => import("@/pages/tenant/Dashboard"))
const TenantBills = lazy(() => import("@/pages/tenant/Bills"))
const TenantUsage = lazy(() => import("@/pages/tenant/Usage"))
const TenantProfile = lazy(() => import("@/pages/tenant/Profile"))
const TenantConsumptionReports = lazy(() =>
  import("@/pages/tenant/ConsumptionReports")
)
const TenantMakeReport = lazy(() => import("@/pages/tenant/MakeReport"))
const TenantBillingReports = lazy(() => import("@/pages/tenant/BillingReports"))
const NotificationsPage = lazy(() => import("@/pages/common/Notifications"))
const ActivityLogsPage = lazy(() => import("@/pages/common/ActivityLogs"))
const GlobalSearchPage = lazy(() => import("@/pages/common/GlobalSearch"))

export function tenantRoutes() {
  return (
    <Route
      path="/tenant"
      element={
        <RequireTenant>
          <TenantLayout />
        </RequireTenant>
      }
    >
      <Route index element={<Navigate to="dashboard" replace />} />

      <Route path="dashboard" element={<TenantDashboard />} />
      <Route path="bills" element={<TenantBills />} />
      <Route path="usage" element={<TenantUsage />} />
      <Route path="profile" element={<TenantProfile />} />

      <Route
        path="consumption-reports"
        element={<TenantConsumptionReports />}
      />

      <Route path="make-report" element={<TenantMakeReport />} />
      <Route path="billing-reports" element={<TenantBillingReports />} />
      <Route path="activity-logs" element={<ActivityLogsPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="search" element={<GlobalSearchPage />} />
    </Route>
  )
}
