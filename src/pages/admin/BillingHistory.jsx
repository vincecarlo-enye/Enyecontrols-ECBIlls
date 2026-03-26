/**
 * BillingHistory.jsx
 * Shows bills older than 1 year — auto-filtered by due date comparison.
 * Read-only (view + export only, no edit/delete).
 * Includes pagination and month-range export.
 */

import { useState, useMemo, useCallback } from 'react'
import { History, Download, Eye, FileText, FileSpreadsheet, X, AlertCircle, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useBills }       from '@/components/billing/hooks/useBills'
import { useModalState }  from '@/hooks/useModalState'
import { usePagination }  from '@/hooks/usePagination'
import { usePageLoader }  from '@/hooks/usePageLoader'
import BillViewerModal    from '@/components/billing/BillViewerModal'
import BillStatusBadge    from '@/components/billing/BillStatusBadge'
import EmptyState         from '@/components/ui/EmptyState'
import Pagination         from '@/components/ui/Pagination'
import { BillingSkeleton } from '@/components/skeletons'
import { exportBillCSV, exportAllBillsCSV } from '@/services/billingService'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const STATUS_TABS = [
  { k: 'all',  l: 'All'  },
  { k: 'paid', l: 'Paid' },
  { k: 'draft',l: 'Draft'},
  { k: 'published', l: 'Published' },
]

// ─── Export Range Modal ───────────────────────────────────────────────────────
function ExportRangeModal({ isOpen, onClose, onExport }) {
  const currentYear = new Date().getFullYear()
  const [fromMonth, setFromMonth] = useState(0)
  const [toMonth,   setToMonth]   = useState(11)
  const [fromYear,  setFromYear]  = useState(currentYear - 1)
  const [toYear,    setToYear]    = useState(currentYear - 1)
  const [error,     setError]     = useState('')

  if (!isOpen) return null

  const years = []
  for (let y = currentYear - 5; y <= currentYear; y++) years.push(y)

  const validate = () => {
    const from = new Date(fromYear, fromMonth, 1)
    const to   = new Date(toYear,   toMonth,   1)
    if (from > to) { setError('Start month must be before or equal to end month.'); return false }
    setError('')
    return true
  }

  const handleExport = (format) => {
    if (!validate()) return
    onExport({ fromMonth, toMonth, fromYear, toYear, format })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/50 overflow-hidden animate-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/50">
          <div>
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">Export History</h2>
            <p className="text-xs text-slate-400 mt-0.5">Select a month range to export</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {[
            { label: 'From', month: fromMonth, year: fromYear, setMonth: setFromMonth, setYear: setFromYear },
            { label: 'To',   month: toMonth,   year: toYear,   setMonth: setToMonth,   setYear: setToYear   },
          ].map(({ label, month, year, setMonth, setYear }) => (
            <div key={label}>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{label}</label>
              <div className="grid grid-cols-2 gap-2">
                <select value={month} onChange={e => setMonth(Number(e.target.value))}
                  className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 transition-all">
                  {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <select value={year} onChange={e => setYear(Number(e.target.value))}
                  className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 transition-all">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          ))}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-1">
            {[{ label: 'CSV', icon: FileText }, { label: 'Excel', icon: FileSpreadsheet }, { label: 'PDF', icon: FileText }].map(({ label, icon: Icon }) => (
              <button key={label} onClick={() => handleExport(label)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-all">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Per-row Export dropdown ──────────────────────────────────────────────────
function RowExport({ bill }) {
  const [open, setOpen] = useState(false)
  const ref = React.useRef(null)
  return (
    <div className="relative" ref={ref} onBlur={() => setTimeout(() => setOpen(false), 150)}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" title="Export">
        <Download className="w-4 h-4" />
        <span className={`w-3 h-3 transition-transform text-xs ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
          {['CSV','Excel','PDF'].map(f => (
            <button key={f} onClick={() => { exportBillCSV(bill); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors">
              <FileText className="w-3.5 h-3.5 text-slate-400" />{f}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
import React from 'react'

export default function BillingHistory() {
  const loading = usePageLoader(500)
  const navigate = useNavigate()
  const { bills } = useBills()
  const viewer = useModalState()
  const [filter,     setFilter]     = useState('all')
  const [exportOpen, setExportOpen] = useState(false)

  // Bills older than 1 year
  const oneYearAgo = useMemo(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 1)
    return d
  }, [])

  const historyBills = useMemo(() =>
    bills.filter(b => {
      const d = new Date(b.dueDate)
      return !isNaN(d) && d < oneYearAgo
    }).sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate)),
  [bills, oneYearAgo])

  const filtered = useMemo(() =>
    filter === 'all' ? historyBills : historyBills.filter(b => b.status === filter),
  [historyBills, filter])

  const { page, rowsPerPage, setPage, setRowsPerPage, paginated, total } = usePagination(filtered, 10)

  const handleFilter = useCallback((f) => { setFilter(f); setPage(1) }, [setPage])

  const handleRangeExport = useCallback(({ fromMonth, toMonth, fromYear, toYear }) => {
    const from = new Date(fromYear, fromMonth, 1)
    const to   = new Date(toYear, toMonth + 1, 0)
    const ranged = historyBills.filter(b => {
      const d = new Date(b.dueDate)
      return !isNaN(d) && d >= from && d <= to
    })
    exportAllBillsCSV(ranged, `BillingHistory_${MONTHS[fromMonth]}_${fromYear}_to_${MONTHS[toMonth]}_${toYear}`)
  }, [historyBills])

  // Stats
  const totalAmount   = useMemo(() => historyBills.reduce((s, b) => s + b.amount, 0), [historyBills])
  const paidCount     = useMemo(() => historyBills.filter(b => b.status === 'paid').length, [historyBills])

  if (loading) return <BillingSkeleton />

  return (
    <div className="space-y-5 sm:space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/admin/billing')}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="font-bold text-lg sm:text-xl text-slate-800 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-violet-500" />
              Billing History
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 ml-8">
            Bills older than 1 year — archived records
          </p>
        </div>
        <button
          onClick={() => setExportOpen(true)}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          <Download className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Export History</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Archived Bills', value: historyBills.length,           color: 'text-slate-800 dark:text-white',          sub: 'Over 1 year old' },
          { label: 'Total Collected', value: `₱${totalAmount.toLocaleString()}`, color: 'text-emerald-600 dark:text-emerald-400', sub: `${paidCount} paid` },
          { label: 'Archive Cutoff', value: oneYearAgo.toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }), color: 'text-violet-600 dark:text-violet-400', sub: 'Auto-archived past this date' },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-3 sm:p-4 shadow-sm">
            <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">{c.label}</p>
            <p className={`text-xl sm:text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
        <History className="w-4 h-4 text-violet-500 flex-shrink-0" />
        <p className="text-xs text-violet-700 dark:text-violet-300">
          Bills are automatically archived here when their due date exceeds 1 year ago.
          This is a <strong>read-only</strong> view — use Export to download records.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-700/50 shadow-md">
        {/* Table header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-slate-200 dark:border-slate-700/60">
          <div>
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">Archived Bills</h2>
            <p className="text-xs text-slate-400 mt-0.5">{filtered.length} records</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_TABS.map(({ k, l }) => (
              <button key={k} onClick={() => handleFilter(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  filter === k
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: '620px' }}>
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40">
                {['Tenant', 'Month', 'Billing Period', 'Amount', 'Due Date', 'Status', 'Actions'].map(col => (
                  <th key={col} className="text-left text-[10px] font-mono uppercase tracking-wider text-slate-400 px-4 sm:px-5 py-3 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title="No archived bills"
                      message={filter === 'all'
                        ? 'Bills older than 1 year will appear here automatically.'
                        : 'No archived bills match the selected filter.'}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map(bill => (
                  <tr key={bill.id}
                    className="border-b border-slate-100 dark:border-slate-700/30 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 sm:px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {bill.tenant.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 dark:text-white text-sm truncate" style={{ maxWidth: '140px' }}>
                            {bill.tenant}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">{bill.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-5 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">{bill.month}</td>
                    <td className="px-4 sm:px-5 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.billingPeriod}</td>
                    <td className="px-4 sm:px-5 py-3.5 font-semibold text-slate-800 dark:text-white whitespace-nowrap">₱{bill.amount.toLocaleString()}</td>
                    <td className="px-4 sm:px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.dueDate}</td>
                    <td className="px-4 sm:px-5 py-3.5"><BillStatusBadge status={bill.status} /></td>
                    <td className="px-4 sm:px-5 py-3.5">
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => viewer.open(bill)}
                          className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <RowExport bill={bill} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <Pagination
            total={total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPage={setPage}
            onRowsPerPage={setRowsPerPage}
          />
        )}
      </div>

      <BillViewerModal
        bill={viewer.selectedItem}
        isOpen={viewer.isOpen}
        onClose={viewer.close}
      />

      <ExportRangeModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={handleRangeExport}
      />
    </div>
  )
}
