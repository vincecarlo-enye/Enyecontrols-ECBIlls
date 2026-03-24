/**
 * facilityRoutes.jsx
 * All facility manager route definitions.
 */

import { Route } from 'react-router-dom'
import { lazy } from 'react'

import { RequireFacility } from './guards'
import FacilityLayout from '@/layouts/FacilityLayout'

// Facility pages
const FacilityDashboard   = lazy(() => import('@/pages/facility/Dashboard'))
const FacilityMonitoring  = lazy(() => import('@/pages/facility/Monitoring'))
const FacilityConsumption = lazy(() => import('@/pages/facility/Consumption'))
const FacilityMaintenance = lazy(() => import('@/pages/facility/Maintenance'))
const FacilityEquipment   = lazy(() => import('@/pages/facility/Equipment'))
const FacilityReports     = lazy(() => import('@/pages/facility/Reports'))

export function facilityRoutes() {
  return (
    <Route
      path="/facility"
      element={
        <RequireFacility>
          <FacilityLayout />
        </RequireFacility>
      }
    >
      <Route path="dashboard"   element={<FacilityDashboard />} />
      <Route path="monitoring"  element={<FacilityMonitoring />} />
      <Route path="consumption" element={<FacilityConsumption />} />
      <Route path="maintenance" element={<FacilityMaintenance />} />
      <Route path="equipment"   element={<FacilityEquipment />} />
      <Route path="reports"     element={<FacilityReports />} />
    </Route>
  )
}