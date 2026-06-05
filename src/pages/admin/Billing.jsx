import { getTenantName, getBillingPeriod } from '@/utils/billing'
import { formatLongDate, formatShortPeriodDate } from '@/utils/filterUtils'
/**
 * pages/admin/Billing.jsx
 * Admin Billing - single page replacing both Billing.jsx + BillingOversight.jsx.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  Receipt,
  Plus,
  ShieldCheck,
  Search,
  Eye,
  Clock,
  Settings2,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePageLoader } from '@/hooks/usePageLoader'
import BillsTable from '@/components/billing/BillsTable'
import RateConfigCard from '@/components/common/RateConfigCard'
import PaginationBar from '@/components/common/PaginationBar'
import { useModalState } from '@/hooks/useModalState'
import PaymentReviewModal from '@/components/billing/PaymentReviewModal'
import EmptyState from '@/components/ui/EmptyState'
import BillStatusBadge from '@/components/billing/BillStatusBadge'
import AdjustmentStatusBadge from '@/components/billing/adjustments/AdjustmentStatusBadge'
import Modal from '@/components/ui/Modal'
import { useApp } from '@/context/AppContext'
import { addLocalActivityLog } from '@/services/activityLogService'
import { useAdminBills } from '../../hooks/adminHooks/useAdminBills'
import { useAdminRates } from '../../hooks/adminHooks/useAdminRates'
import { useAuth } from '@/context/AuthContext'
import { applyAdjustment, approveAdjustment, rejectAdjustment } from '@/services/financeService/financeAdjustmentService'
import { addLocalNotification } from '@/services/notificationService'
import { LoadingValue, UpdatingBadge } from '@/components/common/InlineLoadingState'

const OVERSIGHT_TABS = [
  { key: 'all', label: 'All Bills' },
  { key: 'draft', label: 'Draft' },
  { key: 'published', label: 'Published' },
  { key: 'payment_submitted', label: 'Pending Review' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
]




function getUnitName(bill) {
  if (typeof bill?.unit === 'string') return bill.unit
  return bill?.unit?.unit_number || bill?.unit?.name || bill?.unit_name || '-'
}


function getBillAmount(bill) {
  return Number(
    bill?.grand_total ??
    bill?.total_amount ??
    bill?.amount ??
    0
  )
}

function getDueDate(bill) {
  return formatLongDate(bill?.due_date || bill?.dueDate || null)
}

function getReceiptReference(bill) {
  return (
    bill?.receipt?.referenceNumber ||
    bill?.receipt?.reference_number ||
    bill?.reference_number ||
    '-'
  )
}

export default function AdminBilling() {
  const pageLoading = usePageLoader(300)
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { addToast } = useApp()
  const reviewModal = useModalState()
  const adjustmentReviewModal = useModalState()
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewAction, setReviewAction] = useState('approve')

  const {
    bills = [],
    loading,
    error,
    meta,
    page,
    perPage,
    setPage,
    setPerPage,
    paidBills = [],
    publishedBills = [],
    submittedBills = [],
    draftBills = [],
    overdueBills = [],
    totalRevenue = 0,
    adjustments = [],
    adjustmentsLoading,
    adjustmentMetrics,
    ensureAdjustmentsLoaded,
    loadBillDetail,
    loadBills,
    loadPaymentReviewBill,
  } = useAdminBills({ loadAdjustmentsOnInit: false })

  const {
    rates,
    saveRate,
    saveAllRates,
  } = useAdminRates()

  const [activeTab, setActiveTab] = useState('manage')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const billingBasePath =
    user?.role === 'super_admin' || location.pathname.startsWith('/super-admin')
      ? '/super-admin/billing'
      : '/admin/billing'
  const isInitialLoading = (pageLoading || loading) && bills.length === 0
  const isRefreshing = !isInitialLoading && (loading || adjustmentsLoading)

  useEffect(() => {
    if (activeTab === 'oversight') {
      ensureAdjustmentsLoaded()
    }
  }, [activeTab, ensureAdjustmentsLoaded])

  const oversightFiltered = useMemo(() => {
    return bills.filter((bill) => {
      const q = search.trim().toLowerCase()

      const tenantName = getTenantName(bill).toLowerCase()
      const unitName = getUnitName(bill).toLowerCase()
      const invoiceId = String(bill?.id || '').toLowerCase()
      const billingPeriod = getBillingPeriod(bill).toLowerCase()

      const matchesQuery =
        !q ||
        tenantName.includes(q) ||
        unitName.includes(q) ||
        invoiceId.includes(q) ||
        billingPeriod.includes(q)

      const matchesStatus =
        statusFilter === 'all' || bill.status === statusFilter

      return matchesQuery && matchesStatus
    })
  }, [bills, search, statusFilter])

  const pendingAdjustments = useMemo(
    () => adjustments.filter((item) => item.status === 'pending_approval'),
    [adjustments]
  )

  const handleOpenPaymentReview = async (bill) => {
    const reviewBill = await loadPaymentReviewBill(bill.id)

    if (!reviewBill) {
      addToast?.('Payment review details could not be loaded.', 'error')
      return
    }

    reviewModal.open(reviewBill)
  }

  const reviewAdjustmentRequest = async () => {
    const target = adjustmentReviewModal.selectedItem
    if (!target) return

    if (reviewAction === 'approve') {
      const approved = await approveAdjustment(target.id, { notes: reviewNotes })
      await applyAdjustment(approved.id)
      await addLocalActivityLog({
        action: 'bill_adjustment_approved',
        description: `Approved and applied adjustment ${target.id} for Bill ${target.billId}.`,
        entity_type: 'bill_adjustment',
        entity_id: target.id,
        method: 'PATCH',
        path: `/api/adjustments/${target.id}/approve`,
      })
      addToast?.('Adjustment approved and applied.')
      addLocalNotification({
        title: 'Your bill adjustment request was approved',
        message: `Adjustment ${target.id} was approved and applied to Bill ${target.billId}.`,
        created_by: 'Admin',
        target_roles: ['finance'],
        entity_type: 'bill_adjustment',
        entity_id: target.id,
      })
    } else {
      await rejectAdjustment(target.id, { reason: reviewNotes })
      await addLocalActivityLog({
        action: 'bill_adjustment_rejected',
        description: `Rejected adjustment ${target.id} for Bill ${target.billId}.${reviewNotes ? ` Reason: ${reviewNotes}` : ''}`,
        entity_type: 'bill_adjustment',
        entity_id: target.id,
        method: 'PATCH',
        path: `/api/adjustments/${target.id}/reject`,
      })
      addToast?.('Adjustment request rejected.')
      addLocalNotification({
        title: 'Bill adjustment request rejected',
        message: `Adjustment ${target.id} for Bill ${target.billId} was rejected.${reviewNotes ? ` Reason: ${reviewNotes}` : ''}`,
        created_by: 'Admin',
        target_roles: ['finance'],
        entity_type: 'bill_adjustment',
        entity_id: target.id,
      })
    }

    setReviewNotes('')
    adjustmentReviewModal.close()
    await loadBills(page, perPage)
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-5 sm:space-y-6 animate-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-bold text-lg sm:text-xl text-slate-800 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-500" />
            Billing Oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {activeTab === 'manage'
              ? 'Review current billing records, exports, and rate snapshots'
              : 'Audit bills, payment submissions, and approval queues'}
          </p>
        </div>

        {activeTab === 'manage' && (
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            <UpdatingBadge show={isRefreshing} />
            <button
              onClick={() => navigate(`${billingBasePath}/new`)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">New Bill</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-1.5 shadow-sm w-fit">
        {[
          { key: 'manage', label: 'Records', Icon: Settings2 },
          { key: 'oversight', label: 'Audit Queue', Icon: ShieldCheck },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {key === 'oversight' && submittedBills.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold leading-none">
                {submittedBills.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'manage' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                label: 'Total Bills',
                value: meta?.total || bills.length,
                color: 'text-slate-800 dark:text-white',
                sub: 'Current records',
              },
              {
                label: 'Collected',
                value: `PHP ${Number(totalRevenue || 0).toLocaleString()}`,
                color: 'text-emerald-600 dark:text-emerald-400',
                sub: `${paidBills.length} paid`,
              },
              {
                label: 'Published',
                value: publishedBills.length,
                color: 'text-blue-600 dark:text-blue-400',
                sub: 'Awaiting payment',
              },
              {
                label: 'Pending',
                value: submittedBills.length,
                color: 'text-amber-600 dark:text-amber-400',
                sub: 'Awaiting review',
              },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-3 sm:p-4 shadow-sm"
              >
                <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                  {card.label}
                </p>
                <LoadingValue loading={isInitialLoading} updating={isRefreshing} value={card.value} className={`text-xl sm:text-2xl font-bold ${card.color}`} spinnerClassName="h-5 w-5 text-slate-400" />
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                  {card.sub}
                </p>
              </div>
            ))}
          </div>

          <BillsTable
            bills={bills}
            loading={isInitialLoading}
            updating={isRefreshing}
            onView={async (bill) => {
              const fullBill = await loadBillDetail(bill.id)
              return fullBill
            }}
          />

          <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900">
            <PaginationBar
              meta={meta}
              page={page}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(value) => {
                setPerPage(value)
                setPage(1)
              }}
            />
          </div>

          <RateConfigCard
            rates={rates}
            onSaveRate={async (type, newRate) => {
              const result = await saveRate(type, { rate: newRate, unit: rates?.[type]?.unit })
              addToast?.(result?.message || 'Rate updated')
              return result
            }}
            onSaveAllRates={async (nextRates) => {
              const result = await saveAllRates(nextRates)
              addToast?.(result?.message || 'Rates updated')
              return result
            }}
          />
        </>
      )}

      {activeTab === 'oversight' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              {
                label: 'Total Bills',
                value: meta?.total || bills.length,
                color: 'text-slate-800 dark:text-white',
                sub: 'All time',
              },
              {
                label: 'Draft',
                value: draftBills.length,
                color: 'text-slate-500 dark:text-slate-400',
                sub: 'Unpublished',
              },
              {
                label: 'Pending',
                value: submittedBills.length,
                color: 'text-amber-600 dark:text-amber-400',
                sub: 'Needs action',
              },
              {
                label: 'Paid',
                value: paidBills.length,
                color: 'text-emerald-600 dark:text-emerald-400',
                sub: `PHP ${(Number(totalRevenue || 0) / 1000).toFixed(0)}k collected`,
              },
              {
                label: 'Published',
                value: publishedBills.length,
                color: 'text-blue-600 dark:text-blue-400',
                sub: 'Awaiting payment',
              },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm"
              >
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  {card.label}
                </p>
                <LoadingValue loading={isInitialLoading} updating={isRefreshing} value={card.value} className={`text-2xl font-bold ${card.color}`} spinnerClassName="h-5 w-5 text-slate-400" />
                <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          {submittedBills.length > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>{submittedBills.length}</strong> payment receipt
                {submittedBills.length > 1 ? 's' : ''} awaiting finance review. Admin can view receipt details here.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Pending Adjustments', value: adjustmentMetrics.pending, color: 'text-orange-600 dark:text-orange-400', sub: 'Needs approval' },
              { label: 'Applied Adjustments', value: adjustmentMetrics.applied, color: 'text-cyan-600 dark:text-cyan-400', sub: 'Already reflected on bills' },
              { label: 'Rejected Requests', value: adjustmentMetrics.rejected, color: 'text-rose-600 dark:text-rose-400', sub: 'Needs Finance follow-up' },
              { label: 'Net Adjustment', value: `PHP ${Number(adjustmentMetrics.totalAdjustmentAmount || 0).toLocaleString()}`, color: 'text-slate-800 dark:text-white', sub: 'Applied total impact' },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{card.label}</p>
                <LoadingValue loading={isInitialLoading} updating={isRefreshing} value={card.value} className={`mt-1 text-2xl font-bold ${card.color}`} spinnerClassName="h-5 w-5 text-slate-400" />
                <p className="mt-1 text-[10px] text-slate-400">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Adjustment Approval Queue</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {adjustmentsLoading ? 'Loading adjustments...' : `${pendingAdjustments.length} pending approvals`}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Date', 'Bill ID', 'Type', 'Old Total', 'New Total', 'Difference', 'Created By', 'Status', 'Action'].map((header) => (
                      <th key={header} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingAdjustments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-400">No pending adjustment approvals.</td>
                    </tr>
                  ) : (
                    pendingAdjustments.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatLongDate(item.createdAt)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">{item.billId}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{item.adjustmentType?.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">PHP {Number(item?.originalSnapshot?.grandTotal || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">PHP {Number(item?.adjustedSnapshot?.grandTotal || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap">PHP {Number(item?.diffSnapshot?.totalAdjustmentAmount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{item?.adjustedBy?.name || 'Finance'}</td>
                        <td className="px-4 py-3"><AdjustmentStatusBadge status={item.status} /></td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setReviewNotes('')
                              setReviewAction('approve')
                              adjustmentReviewModal.open(item)
                            }}
                            className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-medium text-blue-600 transition-all hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300"
                          >
                            <Eye className="w-3 h-3" /> Review
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tenant, unit, bill ID, or billing period..."
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {OVERSIGHT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    statusFilter === tab.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                  {tab.key === 'payment_submitted' && submittedBills.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                      {submittedBills.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {oversightFiltered.length} records on this page
              </p>
              <p className="text-xs text-slate-400 font-mono">Oversight Audit View</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {[
                      'Invoice',
                      'Tenant',
                      'Unit',
                      'Billing Period',
                      'Amount',
                      'Due Date',
                      'Receipt Ref',
                      'Status',
                      'Actions',
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {oversightFiltered.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <EmptyState
                          title="No bills found"
                          message="Try adjusting your search or status filter."
                        />
                      </td>
                    </tr>
                  ) : (
                    oversightFiltered.map((bill) => (
                      <tr
                        key={bill.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {bill.id}
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          {getTenantName(bill)}
                        </td>

                        <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {getUnitName(bill)}
                        </td>

                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                          {getBillingPeriod(bill)}
                        </td>

                        <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          PHP {getBillAmount(bill).toLocaleString('en-PH', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                          {getDueDate(bill)}
                        </td>

                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {getReceiptReference(bill) === '-' ? (
                            <span className="text-slate-300 dark:text-slate-600">-</span>
                          ) : (
                            getReceiptReference(bill)
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <BillStatusBadge status={bill.status} />
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {bill.status === 'payment_submitted' ? (
                              <button
                                onClick={() => handleOpenPaymentReview(bill)}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all whitespace-nowrap"
                              >
                                <Eye className="w-3 h-3" />
                                Review
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 px-2">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900">
            <PaginationBar
              meta={meta}
              page={page}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(value) => {
                setPerPage(value)
                setPage(1)
              }}
            />
          </div>
        </>
      )}

      <PaymentReviewModal
        bill={reviewModal.selectedItem}
        isOpen={reviewModal.isOpen}
        onClose={reviewModal.close}
        readOnly
        readOnlyMessage="Admin can review the submitted receipt here, but only Finance can approve or reject tenant payments."
      />

      <Modal
        isOpen={adjustmentReviewModal.isOpen}
        onClose={() => {
          setReviewNotes('')
          adjustmentReviewModal.close()
        }}
        title="Review Adjustment Request"
        subtitle={adjustmentReviewModal.selectedItem ? `Adjustment ${adjustmentReviewModal.selectedItem.id}` : ''}
      >
        {adjustmentReviewModal.selectedItem ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ['Bill ID', adjustmentReviewModal.selectedItem.billId],
                ['Type', adjustmentReviewModal.selectedItem.adjustmentType?.replace(/_/g, ' ')],
                ['Old Total', `PHP ${Number(adjustmentReviewModal.selectedItem?.originalSnapshot?.grandTotal || 0).toLocaleString()}`],
                ['New Total', `PHP ${Number(adjustmentReviewModal.selectedItem?.adjustedSnapshot?.grandTotal || 0).toLocaleString()}`],
                ['Difference', `PHP ${Number(adjustmentReviewModal.selectedItem?.diffSnapshot?.totalAdjustmentAmount || 0).toLocaleString()}`],
                ['Requested By', adjustmentReviewModal.selectedItem?.adjustedBy?.name || 'Finance'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                  <p className="text-[10px] font-mono uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
              <p className="text-[10px] font-mono uppercase tracking-wide text-slate-400">Reason</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                {adjustmentReviewModal.selectedItem.otherReason || adjustmentReviewModal.selectedItem.reason || '-'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-wide text-slate-400">Decision</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setReviewAction('approve')}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition-all ${reviewAction === 'approve' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
                >
                  Approve and Apply
                </button>
                <button
                  onClick={() => setReviewAction('reject')}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition-all ${reviewAction === 'reject' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
                >
                  Reject
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-mono uppercase tracking-wide text-slate-400">
                {reviewAction === 'approve' ? 'Approval Notes' : 'Rejection Reason'}
              </label>
              <textarea
                rows={4}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setReviewNotes('')
                  adjustmentReviewModal.close()
                }}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={reviewAdjustmentRequest}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all ${reviewAction === 'approve' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'}`}
              >
                {reviewAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
