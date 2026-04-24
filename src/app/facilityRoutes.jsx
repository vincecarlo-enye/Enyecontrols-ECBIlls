/**
 * facilityRoutes.jsx
 * All facility manager route definitions.
 */

import { Route } from 'react-router-dom'
import { lazy } from 'react'

import { RequireFacility } from './guards'
import AppShellLayout from '@/layouts/AppShellLayout'

// Facility pages
const FacilityDashboard   = lazy(() => import('@/pages/facility/Dashboard'))
const FacilityMonitoring  = lazy(() => import('@/pages/facility/Monitoring'))
const FacilityConsumption = lazy(() => import('@/pages/facility/Consumption'))
const FacilityMaintenance = lazy(() => import('@/pages/facility/Maintenance'))
const FacilityEquipment   = lazy(() => import('@/pages/facility/Equipment'))
const FacilityReports     = lazy(() => import('@/pages/facility/Reports'))
const FacilityAnomalies   = lazy(() => import('@/pages/facility/Anomalies'))
const NotificationsPage   = lazy(() => import('@/pages/common/Notifications'))
const ActivityLogsPage    = lazy(() => import('@/pages/common/ActivityLogs'))
const GlobalSearchPage = lazy(() => import('@/pages/common/GlobalSearch'))

export function facilityRoutes() {
  return (
    <Route
      path="/facility"
      element={
        <RequireFacility>
          <AppShellLayout />
        </RequireFacility>
      }
    >
      <Route path="dashboard"   element={<FacilityDashboard />} />
      <Route path="monitoring"  element={<FacilityMonitoring />} />
      <Route path="consumption" element={<FacilityConsumption />} />
      <Route path="maintenance" element={<FacilityMaintenance />} />
      <Route path="equipment"   element={<FacilityEquipment />} />
      <Route path="reports"     element={<FacilityReports />} />
      <Route path="anomalies"   element={<FacilityAnomalies />} />
      <Route path="activity-logs" element={<ActivityLogsPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="search" element={<GlobalSearchPage />} />
    </Route>
  )
}
