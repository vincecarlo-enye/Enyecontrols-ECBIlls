import { useState, useRef, memo } from 'react'
import { Eye, Trash2, Download, ChevronDown, FileText, FileSpreadsheet } from 'lucide-react'
import BillViewerModal from './BillViewerModal'
import BillStatusBadge from './BillStatusBadge'
import ConfirmModal from '@/components/ui/ConfirmModal'
import EmptyState from '@/components/ui/EmptyState'
import { useModalState } from '@/hooks/useModalState'
import { exportBillCSV } from '@/services/billingService'

const STATUS_FILTER_TABS = [
  { k: 'all', l: 'All' },
  { k: 'draft', l: 'Draft' },
  { k: 'published', l: 'Published' },
  { k: 'payment_submitted', l: 'Submitted' },
  { k: 'paid', l: 'Paid' },
]

function ExportDropdown({ bill }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)




  const handleBlur = () => setTimeout(() => setOpen(false), 150)

  const options = [
    {
      label: 'CSV',
      icon: FileText,
      onClick: () => { exportBillCSV(bill); setOpen(false) },
    },
    {
      label: 'Excel',
      icon: FileSpreadsheet,
      onClick: () => { exportBillCSV(bill); setOpen(false) },
    },
    {
      label: 'PDF',
      icon: FileText,
      onClick: () => { exportBillCSV(bill); setOpen(false) },
    },
  ]

  function getTenantName(bill) {
    if (typeof bill?.tenant === 'string') return bill.tenant
    return bill?.tenant?.name || bill?.tenant_name || 'Unknown Tenant'
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
    return bill?.billingPeriod || bill?.billing_period || '—'
  }

  function getMonthLabel(bill) {
    return bill?.month || bill?.billing_month || '—'
  }


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
  const [filter, setFilter] = useState('all')
  const [deleteId, setDeleteId] = useState(null)

  const filtered = filter === 'all' ? bills : bills.filter((b) => b.status === filter)

  const handleView = async (bill) => {
    const fullBill = await onView?.(bill)
    if (fullBill) viewer.open(fullBill)
  }


  const formatLongDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const selectedDeleteBill = bills.find((b) => String(b.id) === String(deleteId))

  const getTenantName = (bill) => {
    if (typeof bill?.tenant === 'string') return bill.tenant
    return bill?.tenant?.name || bill?.tenant_name || 'Unknown Tenant'
  }

  const getTenantInitial = (bill) => {
    const name = getTenantName(bill)
    return String(name).charAt(0).toUpperCase() || '?'
  }

  const getUnitLabel = (bill) => {
    if (typeof bill?.unit === 'string') return bill.unit
    return bill?.unit?.unit_number || bill?.unit?.name || bill?.unit_name || '—'
  }

  const getDueDateValue = (bill) => {
    return bill?.dueDate || bill?.due_date || null
  }

  const getBillingPeriodLabel = (bill) => {
    return bill?.billingPeriod || bill?.billing_period || '—'
  }

  const getMonthLabel = (bill) => {
    return bill?.month || bill?.billing_month || '—'
  }


  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-700/50 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-slate-200 dark:border-slate-700/60">
          <div>
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">Latest Bills &amp; Transactions</h2>
            <p className="text-xs text-slate-400 mt-0.5">{filtered.length} records</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_FILTER_TABS.map(({ k, l }) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === k
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: '580px' }}>
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40">
                {['Tenant', 'Month', 'Billing Period', 'Amount', 'Due Date', 'Status', 'Actions'].map((col) => (
                  <th key={col} className="text-left text-[10px] font-mono uppercase tracking-wider text-slate-400 px-4 sm:px-5 py-3 whitespace-nowrap">
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
                filtered.map((bill) => (
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
                      ₱{Number(bill.amount || bill.total_amount || 0).toLocaleString()}
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

                        <button
                          onClick={() => setDeleteId(bill.id)}
                          className="p-2 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </div>

      <BillViewerModal
        bill={viewer.selectedItem}
        isOpen={viewer.isOpen}
        onClose={viewer.close}
      />

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
    </>
  )
}

export default memo(BillsTable)
