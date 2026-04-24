import { getTenantName } from '@/utils/billing'
import { formatLongDate, formatShortPeriodDate } from '@/utils/filterUtils'
import { useState, useRef, useMemo, memo } from 'react'
import { useClientPagination } from '@/hooks/useClientPagination'
import {
  Eye,
  Trash2,
  Download,
  Printer,
  ChevronDown,
  FileText,
  FileSpreadsheet,
} from 'lucide-react'
import BillViewerModal from './BillViewerModal'
import BillStatusBadge from './BillStatusBadge'
import ConfirmModal from '@/components/ui/ConfirmModal'
import EmptyState from '@/components/ui/EmptyState'
import PaginationBar from '@/components/common/PaginationBar'
import { useModalState } from '@/hooks/useModalState'
import { exportAllBillsCSV, exportBillCSV } from '@/services/billingService'
import { fetchAdminBills } from '@/services/adminService/adminBillingService'
import { printElement } from '@/utils/reporting'

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

function getAmountValue(bill) {
  return Number(
    bill?.grand_total ??
    bill?.total_amount ??
    bill?.amount ??
    0
  )
}

function ExportDropdown({ bill }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const handleBlur = () => setTimeout(() => setOpen(false), 150)

  const options = [
    {
      label: 'CSV',
      icon: FileText,
      onClick: () => {
        exportBillCSV(bill)
        setOpen(false)
      },
    },
    {
      label: 'Excel',
      icon: FileSpreadsheet,
      onClick: () => {
        exportBillCSV(bill)
        setOpen(false)
      },
    },
    {
      label: 'PDF',
      icon: FileText,
      onClick: () => {
        exportBillCSV(bill)
        setOpen(false)
      },
    },
  ]

  return (
    <div className="relative" ref={ref} onBlur={handleBlur}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        title="Export"
      >
        <Download className="w-4 h-4" />
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
          {options.map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              onClick={onClick}
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

function BillsTable({ bills = [], onView, onDelete }) {
  const viewer = useModalState()
  const printRef = useRef(null)
  const [filter, setFilter] = useState('all')
  const [deleteId, setDeleteId] = useState(null)
  const [exporting, setExporting] = useState(false)
  const filterRef = useRef('all')

  const filtered = useMemo(
    () => filter === 'all' ? bills : bills.filter((b) => normalizeFilterableStatus(b.status) === filter),
    [bills, filter]
  )

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
      const exportRows = activeFilter === 'all'
        ? fullBills
        : fullBills.filter((bill) => normalizeFilterableStatus(bill.status) === activeFilter)
    const exportFilterLabel = STATUS_FILTER_TABS.find(({ k }) => k === activeFilter)?.l || 'All'

      exportAllBillsCSV(exportRows, { filterLabel: exportFilterLabel })
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-slate-200 dark:border-slate-700/60">
          <div>
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">
              Latest Bills &amp; Transactions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{filtered.length} records</p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
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
              onClick={handleExportFiltered}
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
              {filtered.length === 0 ? (
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

                        <ExportDropdown bill={bill} />

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
