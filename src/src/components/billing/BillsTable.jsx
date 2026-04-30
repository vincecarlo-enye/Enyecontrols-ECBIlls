import { getTenantName } from '@/utils/billing'
import { formatLongDate, formatShortPeriodDate } from '@/utils/filterUtils'
import { createPortal } from 'react-dom'
import { useState, useRef, useMemo, memo } from 'react'
import { useClientPagination } from '@/hooks/useClientPagination'
import {
  Eye,
  Trash2,
  Download,
  Printer,
} from 'lucide-react'
import BillViewerModal from './BillViewerModal'
import BillStatusBadge from './BillStatusBadge'
import ConfirmModal from '@/components/ui/ConfirmModal'
import EmptyState from '@/components/ui/EmptyState'
import PaginationBar from '@/components/common/PaginationBar'
import { useModalState } from '@/hooks/useModalState'
import { exportAllBillsCSV } from '@/services/billingService'
import { fetchAdminBills } from '@/services/adminService/adminBillingService'
import { printElement } from '@/utils/reporting'
import { TableLoadingRow, UpdatingBadge } from '@/components/common/InlineLoadingState'

const STATUS_FILTER_TABS = [
  { k: 'all', l: 'All' },
  { k: 'draft', l: 'Draft' },
  { k: 'published', l: 'Published' },
  { k: 'payment_submitted', l: 'Submitted' },
  { k: 'paid', l: 'Paid' },
]

function normalizeFilterableStatus(status) {
  const raw = String(status || '').toLowerCase().trim()

  if (raw === 'unpaid') return 'published'
  if (raw === 'submitted' || raw === 'payment_submitted' || raw === 'pending') return 'payment_submitted'
  if (raw === 'verified') return 'paid'

  return raw || 'draft'
}




function getTenantInitial(bill) {
  const name = getTenantName(bill)
  return String(name).charAt(0).toUpperCase() || '?'
}

function getUnitLabel(bill) {
  if (typeof bill?.unit === 'string') return bill.unit
  return bill?.unit?.unit_number || bill?.unit?.name || bill?.unit_name || '—'
}

function getDueDateValue(bill) {
  return bill?.dueDate || bill?.due_date || null
}

function getBillingPeriodLabel(bill) {
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

  return bill?.billingPeriod || bill?.billing_period || '—'
}


function getMonthLabel(bill) {
  if (bill?.month) return bill.month
  if (bill?.billing_month) return bill.billing_month

  const raw =
    bill?.billing_end ||
    bill?.period_end ||
    bill?.billing_start ||
    bill?.period_start

  if (!raw) return '—'

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getMonthYearKey(bill) {
  const raw =
    bill?.billing_month ||
    bill?.billingMonth ||
    bill?.billing_end ||
    bill?.period_end ||
    bill?.billing_start ||
    bill?.period_start ||
    bill?.month ||
    ''

  if (!raw) return ''

  if (/^\d{4}-\d{2}/.test(String(raw))) {
    return String(raw).slice(0, 7)
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthYearOption(value) {
  if (!value) return ''

  const [year, month] = String(value).split('-').map(Number)
  if (!year || !month) return value

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
}

function getAmountValue(bill) {
  return Number(
    bill?.grand_total ??
    bill?.total_amount ??
    bill?.amount ??
    0
  )
}

function BillsTable({ bills = [], onView, onDelete, loading = false, updating = false }) {
  const viewer = useModalState()
  const printRef = useRef(null)
  const [filter, setFilter] = useState('all')
  const [deleteId, setDeleteId] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportMonth, setExportMonth] = useState('')
  const filterRef = useRef('all')

  const filtered = useMemo(
    () => filter === 'all' ? bills : bills.filter((b) => normalizeFilterableStatus(b.status) === filter),
    [bills, filter]
  )

  const exportMonthOptions = useMemo(() => {
    const monthSet = new Set()

    bills.forEach((bill) => {
      const monthKey = getMonthYearKey(bill)
      if (monthKey) monthSet.add(monthKey)
    })

    return Array.from(monthSet)
      .sort((a, b) => b.localeCompare(a))
      .map((value) => ({
        value,
        label: formatMonthYearOption(value),
      }))
  }, [bills])

  const {
    pagedItems: pagedBills,
    meta: paginationMeta,
    page,
    perPage,
    setPage,
    setPerPage,
  } = useClientPagination(filtered, 10)

  const handleView = async (bill) => {
    const fullBill = await onView?.(bill)
    if (fullBill) viewer.open(fullBill)
  }

  const selectedDeleteBill = bills.find((b) => String(b.id) === String(deleteId))
  const activeFilterLabel = STATUS_FILTER_TABS.find(({ k }) => k === filter)?.l || 'All'

  const handleExportFiltered = async () => {
    const activeFilter = filterRef.current || 'all'

    setExporting(true)

    try {
      const fullBillsResponse = await fetchAdminBills({ page: 1, per_page: 10000 })
      const fullBills = Array.isArray(fullBillsResponse?.data) ? fullBillsResponse.data : bills
      const statusFiltered = activeFilter === 'all'
        ? fullBills
        : fullBills.filter((bill) => normalizeFilterableStatus(bill.status) === activeFilter)
      const exportRows = exportMonth
        ? statusFiltered.filter((bill) => getMonthYearKey(bill) === exportMonth)
        : statusFiltered
      const exportFilterLabel = STATUS_FILTER_TABS.find(({ k }) => k === activeFilter)?.l || 'All'
      const exportMonthLabel = formatMonthYearOption(exportMonth)

      exportAllBillsCSV(exportRows, { filterLabel: exportMonth ? `${exportFilterLabel}-${exportMonthLabel}` : exportFilterLabel })
      setShowExportModal(false)
    } finally {
      setExporting(false)
    }
  }

  const handleExportClick = () => {
    setShowExportModal(true)
  }

  const handlePrintFiltered = () => {
    printElement({
      title: 'Billing Oversight',
      subtitle: `${activeFilterLabel} bills`,
      element: printRef.current,
      mode: 'tables',
    })
  }

  return (
    <>
      <div ref={printRef} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-700/50 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-slate-200 dark:border-slate-700/60">
          <div>
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">
              Latest Bills &amp; Transactions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{filtered.length} records</p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <UpdatingBadge show={updating} />
            {STATUS_FILTER_TABS.map(({ k, l }) => (
              <button
                key={k}
                onClick={() => {
                  filterRef.current = k
                  setFilter(k)
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === k
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                {l}
              </button>
            ))}
            <button
              onClick={handlePrintFiltered}
              disabled={filtered.length === 0}
              aria-label={`Print ${activeFilterLabel} bills`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              title={`Print ${activeFilterLabel} bills`}
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleExportClick}
              disabled={filtered.length === 0 || exporting}
              aria-label={`Export ${activeFilterLabel} bills`}
              className="ml-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              title={`Export ${activeFilterLabel} bills`}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export'}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: '580px' }}>
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40">
                {['Tenant', 'Month', 'Billing Period', 'Amount', 'Due Date', 'Status', 'Actions'].map((col) => (
                  <th
                    key={col}
                    className="text-left text-[10px] font-mono uppercase tracking-wider text-slate-400 px-4 sm:px-5 py-3 whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <TableLoadingRow colSpan={7} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title="No bills found"
                      message="Try adjusting the status filter above."
                    />
                  </td>
                </tr>
              ) : (
                pagedBills.map((bill) => (
                  <tr
                    key={bill.id}
                    className="border-b border-slate-100 dark:border-slate-700/30 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 sm:px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {getTenantInitial(bill)}
                        </div>

                        <div className="min-w-0">
                          <p
                            className="font-medium text-slate-800 dark:text-white text-sm truncate"
                            style={{ maxWidth: '140px' }}
                          >
                            {getTenantName(bill)}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">
                            {getUnitLabel(bill)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 sm:px-5 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {getMonthLabel(bill)}
                    </td>

                    <td className="px-4 sm:px-5 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {getBillingPeriodLabel(bill)}
                    </td>

                    <td className="px-4 sm:px-5 py-3.5 font-semibold text-slate-800 dark:text-white whitespace-nowrap">
                      ₱{getAmountValue(bill).toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-4 sm:px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatLongDate(getDueDateValue(bill))}
                    </td>

                    <td className="px-4 sm:px-5 py-3.5">
                      <BillStatusBadge status={bill.status} />
                    </td>

                    <td className="px-4 sm:px-5 py-3.5">
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleView(bill)}
                          className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {onDelete ? (
                          <button
                            onClick={() => setDeleteId(bill.id)}
                            className="p-2 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200/70 px-4 py-4 dark:border-slate-700/50 sm:px-5">
          <PaginationBar
            meta={paginationMeta}
            page={page}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(value) => {
              setPerPage(value)
              setPage(1)
            }}
          />
        </div>
      </div>

      <BillViewerModal
        bill={viewer.selectedItem}
        isOpen={viewer.isOpen}
        onClose={viewer.close}
      />

      {showExportModal
        ? createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowExportModal(false)} />
            <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Export Bills</h3>
                <p className="mt-1 text-xs text-slate-400">{activeFilterLabel} bills</p>
              </div>

              <div className="px-5 py-4">
                <label className="mb-1.5 block text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Month / Year
                </label>
                <select
                  value={exportMonth}
                  onChange={(event) => setExportMonth(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  aria-label="Select month and year to export"
                  disabled={exportMonthOptions.length === 0}
                >
                  <option value="">All months</option>
                  {exportMonthOptions.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExportFiltered}
                  disabled={exporting}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {exporting ? 'Exporting...' : 'Export'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
        : null}

      {onDelete ? (
        <ConfirmModal
          isOpen={!!deleteId}
          title="Delete Bill?"
          message="This bill will be permanently removed and cannot be recovered."
          confirmLabel="Delete Bill"
          onConfirm={() => {
            onDelete?.(selectedDeleteBill)
            setDeleteId(null)
          }}
          onCancel={() => setDeleteId(null)}
        />
      ) : null}
    </>
  )
}

export default memo(BillsTable)
