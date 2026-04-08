/**
 * financeRoutes.jsx
 * Clean Finance route definitions.
 */

import { Route } from 'react-router-dom'
import { lazy } from 'react'

import { RequireFinance } from './guards'
import FinanceLayout from '@/layouts/FinanceLayout'

const FinanceDashboard = lazy(() => import('@/pages/finance/Dashboard'))
const FinanceBillingMgmt = lazy(() => import('@/pages/finance/BillManagement'))
const FinancePaymentReview = lazy(() => import('@/pages/finance/PaymentReview'))
const FinanceReports = lazy(() => import('@/pages/finance/Reports'))
const FinanceBillingTickets = lazy(() => import('@/pages/finance/BillingTickets'))
const NotificationsPage = lazy(() => import('@/pages/common/Notifications'))
const ActivityLogsPage = lazy(() => import('@/pages/common/ActivityLogs'))
const OperationalExportsPage = lazy(() => import('@/pages/common/OperationalExports'))
const GlobalSearchPage = lazy(() => import('@/pages/common/GlobalSearch'))

export function financeRoutes() {
  return (
    <Route
      path="/finance"
      element={
        <RequireFinance>
          <FinanceLayout />
        </RequireFinance>
      }
    >
      <Route path="dashboard" element={<FinanceDashboard />} />
      <Route path="billing" element={<FinanceBillingMgmt />} />
      <Route path="payment-review" element={<FinancePaymentReview />} />
      <Route path="billing-tickets" element={<FinanceBillingTickets />} />
      <Route path="reports" element={<FinanceReports />} />
      <Route path="operational-exports" element={<OperationalExportsPage />} />
      <Route path="activity-logs" element={<ActivityLogsPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="search" element={<GlobalSearchPage />} />
    </Route>
  )
}
