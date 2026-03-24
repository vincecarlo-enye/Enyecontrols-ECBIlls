/**
 * pages/admin/Billing.jsx
 * Admin Billing — single page replacing both Billing.jsx + BillingOversight.jsx.
 *
 * Tab "Manage"    → Create bills (modal), view/delete/export per bill, SOA preview,
 *                   rate configuration card. (was Billing.jsx)
 * Tab "Oversight" → Full-status audit table, approve/reject submitted payments,
 *                   pending alert banner. (was BillingOversight.jsx)
 */

import { useState, useRef } from 'react'
import {
  Receipt, Plus, Download, ChevronDown, FileText, FileSpreadsheet,
  ShieldCheck, Search, Eye, CheckCircle2, XCircle, Clock,
  Save, X, Zap, Droplets, Flame, Settings2, LayoutList,
} from 'lucide-react'
import { usePageLoader }       from '@/hooks/usePageLoader'
import { BillingSkeleton }     from '@/components/skeletons'
import BillsTable              from '@/components/billing/BillsTable'
import RateConfigCard          from '@/components/common/RateConfigCard'
import utilitiesData           from '@/data/mock/utilities.json'
import { useBills }            from '@/components/billing/hooks/useBills'
import { useModalState }       from '@/hooks/useModalState'
import { exportAllBillsCSV }   from '@/services/billingService'
import PaymentReviewModal      from '@/components/billing/PaymentReviewModal'
import EmptyState              from '@/components/ui/EmptyState'
import BillStatusBadge         from '@/components/billing/BillStatusBadge'
import { useNavigate } from 'react-router-dom'

// rateConfig from context now

// ─── Oversight status filter tabs ────────────────────────────────────────────
const OVERSIGHT_TABS = [
  { key: 'all',               label: 'All Bills'      },
  { key: 'draft',             label: 'Draft'          },
  { key: 'published',         label: 'Published'      },
  { key: 'payment_submitted', label: 'Pending Review' },
  { key: 'paid',              label: 'Paid'           },
  { key: 'overdue',           label: 'Overdue'        },
]

// ─── Export all bills dropdown ────────────────────────────────────────────────
function ExportAllDropdown({ bills, onExported }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const close = () => setTimeout(() => setOpen(false), 150)
  const opts = [
    { label: 'CSV',   icon: FileText,        fn: () => { exportAllBillsCSV(bills); onExported?.('CSV')   } },
    { label: 'Excel', icon: FileSpreadsheet, fn: () => { exportAllBillsCSV(bills); onExported?.('Excel') } },
    { label: 'PDF',   icon: FileText,        fn: () => { exportAllBillsCSV(bills); onExported?.('PDF')   } },
  ]
  return (
    <div className="relative" ref={ref} onBlur={close}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
        <Download className="w-4 h-4 flex-shrink-0" />
        <span className="hidden sm:inline">Export</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
          {opts.map(({ label, icon: Icon, fn }) => (
            <button key={label} onClick={() => { fn(); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors">
              <Icon className="w-3.5 h-3.5 text-slate-400" />{label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Create Bill modal (inline, no separate page needed) ─────────────────────
const DEFAULT_FORM = {
  tenant: '', unit: '',
  month: 'March 2026', billingPeriod: 'Feb 1 – Feb 28', dueDate: 'March 15, 2026',
  electricity: '', water: '', thermal: '',
}



// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminBilling() {
  const loading = usePageLoader(700)
  const navigate = useNavigate()
  const detailModal = useModalState()
  const {
    bills, addToast,
    paidBills, publishedBills, submittedBills, draftBills, overdueBills, totalRevenue,
    approvePayment, rejectPayment, createBill,
  } = useBills()

  const [activeTab,   setActiveTab]   = useState('manage')
  const [previewBill, setPreviewBill] = useState(null)
  const reviewModal = useModalState()

  // Oversight tab state
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  if (loading) return <BillingSkeleton />

  const oversightFiltered = bills.filter(b => {
    const q = search.toLowerCase()
    return (!q || b.tenant.toLowerCase().includes(q) || b.unit.toLowerCase().includes(q) || b.id.toLowerCase().includes(q))
      && (statusFilter === 'all' || b.status === statusFilter)
  })

  return (
    <div className="space-y-5 sm:space-y-6 animate-in">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-bold text-lg sm:text-xl text-slate-800 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-500" />
            Billing
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {activeTab === 'manage' ? 'Create, track, and export tenant utility bills' : 'Monitor all bills, audit transactions, and manage payment approvals'}
          </p>
        </div>
        {activeTab === 'manage' && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <ExportAllDropdown bills={bills} onExported={fmt => addToast(`Bills exported as ${fmt}`)} />
            <button
              onClick={() => navigate('/admin/billing/new')}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">New Bill</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Tab switcher ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-1.5 shadow-sm w-fit">
        {[
          { key: 'manage',    label: 'Manage',    Icon: Settings2   },
          { key: 'oversight', label: 'Oversight', Icon: ShieldCheck },
        ].map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}>
            <Icon className="w-4 h-4" />
            {label}
            {key === 'oversight' && submittedBills.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold leading-none">{submittedBills.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══ TAB: MANAGE ═════════════════════════════════════════════════════ */}
      {activeTab === 'manage' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Total Bills', value: bills.length,                       color: 'text-slate-800 dark:text-white',         sub: 'March 2026' },
              { label: 'Collected',   value: `₱${totalRevenue.toLocaleString()}`, color: 'text-emerald-600 dark:text-emerald-400', sub: `${paidBills.length} paid` },
              { label: 'Published',   value: publishedBills.length,              color: 'text-blue-600 dark:text-blue-400',        sub: 'Awaiting payment' },
              { label: 'Pending',     value: submittedBills.length,              color: 'text-amber-600 dark:text-amber-400',      sub: 'Awaiting review' },
            ].map(c => (
              <div key={c.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-3 sm:p-4 shadow-sm">
                <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">{c.label}</p>
                <p className={`text-xl sm:text-2xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Bills table (view/delete/export per row) */}
          <BillsTable onView={setPreviewBill} />

          {/* Rate configuration */}
          <RateConfigCard />

        </>
      )}

      {/* ══ TAB: OVERSIGHT ══════════════════════════════════════════════════ */}
      {activeTab === 'oversight' && (
        <>
          {/* Stats — 5-col grid with overdue */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Total Bills', value: bills.length,           color: 'text-slate-800 dark:text-white',        sub: 'All time' },
              { label: 'Draft',       value: draftBills.length,      color: 'text-slate-500 dark:text-slate-400',     sub: 'Unpublished' },
              { label: 'Pending',     value: submittedBills.length,  color: 'text-amber-600 dark:text-amber-400',     sub: 'Needs action' },
              { label: 'Paid',        value: paidBills.length,       color: 'text-emerald-600 dark:text-emerald-400', sub: `₱${(totalRevenue/1000).toFixed(0)}k collected` },
              { label: 'Published',   value: publishedBills.length,  color: 'text-blue-600 dark:text-blue-400',       sub: 'Awaiting payment' },
            ].map(c => (
              <div key={c.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{c.label}</p>
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Pending alert */}
          {submittedBills.length > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>{submittedBills.length}</strong> payment receipt{submittedBills.length > 1 ? 's' : ''} pending review. Approve or reject each one below.
              </p>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tenant, unit, or bill ID..."
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {OVERSIGHT_TABS.map(tab => (
                <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${statusFilter === tab.key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  {tab.label}
                  {tab.key === 'payment_submitted' && submittedBills.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold">{submittedBills.length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Audit table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{oversightFiltered.length} records</p>
              <p className="text-xs text-slate-400 font-mono">Admin — Full Audit View</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Invoice','Tenant','Unit','Month','Amount','Due Date','Receipt Ref','Status','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {oversightFiltered.length === 0 ? (
                    <tr><td colSpan={9}><EmptyState title="No bills found" message="Try adjusting your search or status filter." /></td></tr>
                  ) : oversightFiltered.map(bill => (
                    <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{bill.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{bill.tenant}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{bill.unit}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.month}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">₱{bill.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">{bill.dueDate}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {bill.receipt?.referenceNumber || <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3"><BillStatusBadge status={bill.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {bill.status === 'payment_submitted' ? (
                            <>
                              <button onClick={() => reviewModal.open(bill)}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all whitespace-nowrap">
                                <Eye className="w-3 h-3" /> Review
                              </button>
                              <button onClick={() => approvePayment(bill.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-all"
                                title="Approve">
                                <CheckCircle2 className="w-3 h-3" />
                              </button>
                              <button onClick={() => rejectPayment(bill.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 transition-all"
                                title="Reject">
                                <XCircle className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 px-2">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Shared modals ──────────────────────────────────────────────────── */}
      

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
