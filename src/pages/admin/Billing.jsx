/**
 * pages/admin/Billing.jsx
 * Admin Billing - single page replacing both Billing.jsx + BillingOversight.jsx.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Receipt,
  Plus,
  Download,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  ShieldCheck,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Settings2,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePageLoader } from '@/hooks/usePageLoader'
import { BillingSkeleton } from '@/components/skeletons'
import BillsTable from '@/components/billing/BillsTable'
import RateConfigCard from '@/components/common/RateConfigCard'
import PaginationBar from '@/components/common/PaginationBar'
import { useModalState } from '@/hooks/useModalState'
import { exportAllBillsCSV } from '@/services/billingService'
import PaymentReviewModal from '@/components/billing/PaymentReviewModal'
import EmptyState from '@/components/ui/EmptyState'
import BillStatusBadge from '@/components/billing/BillStatusBadge'
import { useAdminBills } from '../../hooks/adminHooks/useAdminBills'
import { useAdminRates } from '../../hooks/adminHooks/useAdminRates'
import { useAuth } from '@/context/AuthContext'

const OVERSIGHT_TABS = [
  { key: 'all', label: 'All Bills' },
  { key: 'draft', label: 'Draft' },
  { key: 'published', label: 'Published' },
  { key: 'payment_submitted', label: 'Pending Review' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
]

function formatLongDate(value) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function formatShortPeriodDate(value) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function getTenantName(bill) {
  if (typeof bill?.tenant === 'string') return bill.tenant
  return bill?.tenant?.name || bill?.tenant_name || '-'
}

function getUnitName(bill) {
  if (typeof bill?.unit === 'string') return bill.unit
  return bill?.unit?.unit_number || bill?.unit?.name || bill?.unit_name || '-'
}

function getBillingPeriod(bill) {
  const billingStart =
    bill?.billing_start ||
    bill?.period_start ||
    bill?.billingStart ||
    null

  const billingEnd =
    bill?.billing_end ||
    bill?.period_end ||
    bill?.billingEnd ||
    null

  if (billingStart && billingEnd) {
    return `${formatShortPeriodDate(billingStart)} - ${formatShortPeriodDate(billingEnd)}`
  }

  if (billingEnd) {
    return formatShortPeriodDate(billingEnd)
  }

  if (bill?.billing_period) {
    return bill.billing_period
  }

  if (bill?.month) {
    return bill.month
  }

  return '-'
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

function ExportAllDropdown({ bills, onExported }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const close = () => setTimeout(() => setOpen(false), 150)

  const options = [
    {
      label: 'CSV',
      icon: FileText,
      fn: () => {
        exportAllBillsCSV(bills)
        onExported?.('CSV')
      },
    },
    {
      label: 'Excel',
      icon: FileSpreadsheet,
      fn: () => {
        exportAllBillsCSV(bills)
        onExported?.('Excel')
      },
    },
    {
      label: 'PDF',
      icon: FileText,
      fn: () => {
        exportAllBillsCSV(bills)
        onExported?.('PDF')
      },
    },
  ]

  return (
    <div className="relative" ref={ref} onBlur={close}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
      >
        <Download className="w-4 h-4 flex-shrink-0" />
        <span className="hidden sm:inline">Export</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
          {options.map(({ label, icon: Icon, fn }) => (
            <button
              key={label}
              onClick={() => {
                fn()
                setOpen(false)
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
            >
              <Icon className="w-3.5 h-3.5 text-slate-400" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminBilling() {
  const pageLoading = usePageLoader(300)
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const reviewModal = useModalState()

  const {
    bills = [],
    loading,
    error,
    addToast,
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
    approvePayment,
    rejectPayment,
    loadBillDetail,
  } = useAdminBills()

  const {
    rates,
    loading: ratesLoading,
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

  useEffect(() => {
    const navbarSearchItem = location.state?.navbarSearchItem
    if (!navbarSearchItem?.query) return

    const query = String(navbarSearchItem.query).trim()
    if (!query) return

    setActiveTab('manage')
    setSearch(query)

    navigate(location.pathname, {
      replace: true,
      state: {
        ...location.state,
        navbarSearchItem: null,
      },
    })
  }, [location.pathname, location.state, navigate])

  const oversightFiltered = useMemo(() => {
    return bills.filter((bill) => {
      const q = search.toLowerCase()

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

  if (pageLoading || loading || ratesLoading) {
    return <BillingSkeleton />
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
            Billing
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {activeTab === 'manage'
              ? 'Create, track, and export tenant utility bills'
              : 'Monitor all bills, audit transactions, and manage payment approvals'}
          </p>
        </div>

        {activeTab === 'manage' && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <ExportAllDropdown
              bills={bills}
              onExported={(format) => addToast?.(`Bills exported as ${format}`)}
            />

            {/* <button
              onClick={() => navigate(`${billingBasePath}/new`)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">New Bill</span>
            </button> */}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-1.5 shadow-sm w-fit">
        {[
          { key: 'manage', label: 'Manage', Icon: Settings2 },
          { key: 'oversight', label: 'Oversight', Icon: ShieldCheck },
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
                <p className={`text-xl sm:text-2xl font-bold ${card.color}`}>
                  {card.value}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                  {card.sub}
                </p>
              </div>
            ))}
          </div>

          <BillsTable
            bills={bills}
            onView={async (bill) => {
              const fullBill = await loadBillDetail(bill.id)
              return fullBill
            }}
            onDelete={(bill) => {
              addToast?.(`Delete function for bill #${bill?.id} is not connected yet`)
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
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          {submittedBills.length > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>{submittedBills.length}</strong> payment receipt
                {submittedBills.length > 1 ? 's' : ''} pending review. Approve or reject each one below.
              </p>
            </div>
          )}

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
              <p className="text-xs text-slate-400 font-mono">Admin - Full Audit View</p>
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
                              <>
                                <button
                                  onClick={() => reviewModal.open(bill)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all whitespace-nowrap"
                                >
                                  <Eye className="w-3 h-3" />
                                  Review
                                </button>

                                <button
                                  onClick={() => approvePayment(bill.id)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-all"
                                  title="Approve"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                </button>

                                <button
                                  onClick={() => rejectPayment(bill.id)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 transition-all"
                                  title="Reject"
                                >
                                  <XCircle className="w-3 h-3" />
                                </button>
                              </>
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
        onApprove={approvePayment}
        onReject={rejectPayment}
      />
    </div>
  )
}
