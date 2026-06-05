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
    bill?.billing_start || bill?.period_start || bill?.billingStart || null
  const billingEnd =
    bill?.billing_end || bill?.period_end || bill?.billingEnd || null
  if (billingStart && billingEnd) {
    return `${formatShortPeriodDate(billingStart)} - ${formatShortPeriodDate(billingEnd)}`
  }
  if (billingEnd) return formatShortPeriodDate(billingEnd)
  return bill?.billingPeriod || bill?.billing_period || '—'
}

function getMonthLabel(bill) {
  if (bill?.month) return bill.month
  if (bill?.billing_month) return bill.billing_month
  const raw =
    bill?.billing_end || bill?.period_end || bill?.billing_start || bill?.period_start
  if (!raw) return '—'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
}

function getMonthYearKey(bill) {
  const raw =
    bill?.billing_month || bill?.billingMonth || bill?.billing_end ||
    bill?.period_end || bill?.billing_start || bill?.period_start ||
    bill?.month || ''
  if (!raw) return ''
  if (/^\d{4}-\d{2}/.test(String(raw))) return String(raw).slice(0, 7)
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthYearOption(value) {
  if (!value) return ''
  const [year, month] = String(value).split('-').map(Number)
  if (!year || !month) return value
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
}

function getAmountValue(bill) {
  return Number(bill?.grand_total ?? bill?.total_amount ?? bill?.amount ?? 0)
}

// ─── Mobile Bill Card ────────────────────────────────────────────────────────

function BillCard({ bill, onView, onDelete }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-4 shadow-sm">
      {/* Top row: avatar + name + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getTenantInitial(bill)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 dark:text-white text-sm leading-tight truncate max-w-[160px]">
              {getTenantName(bill)}
            </p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{getUnitLabel(bill)}</p>
          </div>
        </div>
        <BillStatusBadge status={bill.status} />
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-0.5">Month</span>
          <span className="text-slate-700 dark:text-slate-300">{getMonthLabel(bill)}</span>
        </div>
        <div>
          <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-0.5">Amount</span>
          <span className="font-semibold text-slate-800 dark:text-white">
            ₱{getAmountValue(bill).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-0.5">Billing Period</span>
          <span className="font-mono text-slate-500 dark:text-slate-400">{getBillingPeriodLabel(bill)}</span>
        </div>
        <div>
          <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-0.5">Due Date</span>
          <span className="text-slate-500 dark:text-slate-400">{formatLongDate(getDueDateValue(bill))}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => onView?.(bill)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/40"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(bill)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

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
      .map((value) => ({ value, label: formatMonthYearOption(value) }))
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

  const handleDelete = (bill) => setDeleteId(bill.id)

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
      exportAllBillsCSV(exportRows, {
        filterLabel: exportMonth ? `${exportFilterLabel}-${exportMonthLabel}` : exportFilterLabel,
      })
      setShowExportModal(false)
    } finally {
      setExporting(false)
    }
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

        {/* ── Header ── */}
        <div className="px-4 sm:px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 space-y-3">
          {/* Title row + action buttons */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white leading-tight">
                Latest Bills &amp; Transactions
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{filtered.length} records</p>
            </div>

            {/* Action buttons — always top-right */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handlePrintFiltered}
                disabled={filtered.length === 0}
                aria-label={`Print ${activeFilterLabel} bills`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Printer className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Print</span>
              </button>

              <button
                onClick={() => setShowExportModal(true)}
                disabled={filtered.length === 0 || exporting}
                aria-label={`Export ${activeFilterLabel} bills`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{exporting ? 'Exporting…' : 'Export'}</span>
              </button>
            </div>
          </div>

          {/* Filter tabs — scrollable row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 -mb-0.5 scrollbar-none">
            <UpdatingBadge show={updating} />
            {STATUS_FILTER_TABS.map(({ k, l }) => (
              <button
                key={k}
                onClick={() => {
                  filterRef.current = k
                  setFilter(k)
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap flex-shrink-0 ${
                  filter === k
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* ── Mobile card list (hidden on md+) ── */}
        <div className="md:hidden">
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No bills found" message="Try adjusting the status filter above." />
          ) : (
            <div className="p-3 space-y-3">
              {pagedBills.map((bill) => (
                <BillCard
                  key={bill.id}
                  bill={bill}
                  onView={handleView}
                  onDelete={onDelete ? handleDelete : null}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Desktop table (hidden below md) ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: '640px' }}>
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40">
                {['Tenant', 'Month', 'Billing Period', 'Amount', 'Due Date', 'Status', 'Actions'].map((col) => (
                  <th
                    key={col}
                    className="text-left text-[10px] font-mono uppercase tracking-wider text-slate-400 px-4 lg:px-5 py-3 whitespace-nowrap"
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
                    <EmptyState title="No bills found" message="Try adjusting the status filter above." />
                  </td>
                </tr>
              ) : (
                pagedBills.map((bill) => (
                  <tr
                    key={bill.id}
                    className="border-b border-slate-100 dark:border-slate-700/30 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 lg:px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {getTenantInitial(bill)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 dark:text-white text-sm truncate max-w-[140px]">
                            {getTenantName(bill)}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">{getUnitLabel(bill)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 lg:px-5 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {getMonthLabel(bill)}
                    </td>

                    <td className="px-4 lg:px-5 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {getBillingPeriodLabel(bill)}
                    </td>

                    <td className="px-4 lg:px-5 py-3.5 font-semibold text-slate-800 dark:text-white whitespace-nowrap">
                      ₱{getAmountValue(bill).toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-4 lg:px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatLongDate(getDueDateValue(bill))}
                    </td>

                    <td className="px-4 lg:px-5 py-3.5">
                      <BillStatusBadge status={bill.status} />
                    </td>

                    <td className="px-4 lg:px-5 py-3.5">
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleView(bill)}
                          className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {onDelete && (
                          <button
                            onClick={() => setDeleteId(bill.id)}
                            className="p-2 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="border-t border-slate-200/70 dark:border-slate-700/50 px-4 py-4 sm:px-5">
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

      {/* ── Modals ── */}
      <BillViewerModal
        bill={viewer.selectedItem}
        isOpen={viewer.isOpen}
        onClose={viewer.close}
      />

      {showExportModal
        ? createPortal(
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowExportModal(false)}
            />
            <div className="relative w-full sm:max-w-sm overflow-hidden rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Export Bills</h3>
                <p className="mt-1 text-xs text-slate-400">{activeFilterLabel} bills</p>
              </div>

              <div className="px-5 py-4">
                <label className="mb-1.5 block text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Month / Year
                </label>
                <select
                  value={exportMonth}
                  onChange={(e) => setExportMonth(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Select month and year to export"
                  disabled={exportMonthOptions.length === 0}
                >
                  <option value="">All months</option>
                  {exportMonthOptions.map((month) => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 border-t border-slate-100 dark:border-slate-800 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExportFiltered}
                  disabled={exporting}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {exporting ? 'Exporting…' : 'Export'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
        : null}

      {onDelete && (
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
      )}
    </>
  )
}

export default memo(BillsTable)