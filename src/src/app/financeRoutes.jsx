/**
 * financeRoutes.jsx
 * Clean Finance route definitions — no redundant pages.
 *
 * Finance portal structure:
 *   /finance/dashboard        → Finance Dashboard
 *   /finance/billing          → Billing Management (create/edit/publish + all-bills view)
 *   /finance/payment-review   → Payment Review (review queue + payment ledger)
 *   /finance/billing-tickets  → Billing Concern Tickets
 *   /finance/reports          → Financial Reports
 */

import { Route } from 'react-router-dom'
import { lazy }  from 'react'

import { RequireFinance } from './guards'
import AppShellLayout from '@/layouts/AppShellLayout'

const FinanceDashboard       = lazy(() => import('@/pages/finance/Dashboard'))
const FinanceBillingMgmt     = lazy(() => import('@/pages/finance/BillManagement'))
const FinancePaymentReview   = lazy(() => import('@/pages/finance/PaymentReview'))
const FinanceReports         = lazy(() => import('@/pages/finance/Reports'))
const FinanceBillingTickets  = lazy(() => import('@/pages/finance/BillingTickets'))
const NotificationsPage      = lazy(() => import('@/pages/common/Notifications'))
const ActivityLogsPage       = lazy(() => import('@/pages/common/ActivityLogs'))
const GlobalSearchPage       = lazy(() => import('@/pages/common/GlobalSearch'))
const BillAdjustmentsPage    = lazy(() => import('@/pages/common/BillAdjustments'))

export function financeRoutes() {
  return (
    <Route
      path="/finance"
      element={
        <RequireFinance>
          <AppShellLayout />
        </RequireFinance>
      }
    >
      <Route path="dashboard"       element={<FinanceDashboard />} />
      <Route path="billing"         element={<FinanceBillingMgmt />} />
      <Route path="bill-adjustments" element={<BillAdjustmentsPage />} />
      <Route path="payment-review"  element={<FinancePaymentReview />} />
      <Route path="billing-tickets" element={<FinanceBillingTickets />} />
      <Route path="reports"         element={<FinanceReports />} />
      <Route path="activity-logs"   element={<ActivityLogsPage />} />
      <Route path="notifications"   element={<NotificationsPage />} />
      <Route path="search"          element={<GlobalSearchPage />} />
    </Route>
  )
}
