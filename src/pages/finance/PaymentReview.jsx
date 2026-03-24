/**
 * pages/finance/PaymentReview.jsx
 * Finance Payment Review — merged from PaymentReview.jsx + Payments.jsx
 *
 * Tab "Review Queue" → Pending receipts, approve / reject actions
 * Tab "Payment Ledger" → Full payment history + collection-rate bar (former Payments.jsx)
 */

import { useState } from 'react'
import {
  CreditCard, CheckCircle2, XCircle, Clock, Search,
  Eye, Calendar, TrendingUp, CalendarDays, Zap, Droplets, Flame,
  ClipboardCheck, BookOpen,
} from 'lucide-react'
import { usePageLoader }      from '@/hooks/usePageLoader'
import { BillingSkeleton }    from '@/components/skeletons'
import { useBills }           from '@/components/billing/hooks/useBills'
import PaymentReviewModal     from '@/components/billing/PaymentReviewModal'
import { useModalState }      from '@/hooks/useModalState'
import EmptyState             from '@/components/ui/EmptyState'
import BillStatusBadge        from '@/components/billing/BillStatusBadge'

export default function FinancePaymentReview() {
  const loading = usePageLoader(700)
  const { bills, approvePayment, rejectPayment, paidBills, submittedBills, totalRevenue } = useBills()
  const reviewModal = useModalState()
  const [activeTab, setActiveTab] = useState('review')

  // Review Queue state
  const [reviewSearch, setReviewSearch] = useState('')
  const [reviewTab,    setReviewTab]    = useState('pending')
  // Ledger state
  const [ledgerSearch, setLedgerSearch] = useState('')
  const [ledgerStatus, setLedgerStatus] = useState('all')

  if (loading) return <BillingSkeleton />

  const totalPending  = submittedBills.length
  const totalPaidAmt  = totalRevenue
  const totalUnpaid   = bills.filter(b => b.status === 'published').reduce((s, b) => s + b.amount, 0)
  const collectionRate = bills.length ? Math.round((paidBills.length / bills.length) * 100) : 0

  // Review queue filtered bills
  const queueBase = reviewTab === 'pending'
    ? bills.filter(b => b.status === 'payment_submitted')
    : bills.filter(b => ['payment_submitted', 'paid'].includes(b.status))
  const queueFiltered = queueBase.filter(b => {
    const q = reviewSearch.toLowerCase()
    return !q || b.tenant.toLowerCase().includes(q) || b.unit.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)
  })

  // Payment ledger filtered bills
  const ledgerBills = bills.filter(b => ['payment_submitted', 'paid'].includes(b.status))
  const ledgerFiltered = ledgerBills.filter(p => {
    const q = ledgerSearch.toLowerCase()
    return (!q || p.tenant.toLowerCase().includes(q) || p.unit.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
      && (ledgerStatus === 'all' || p.status === ledgerStatus)
  })

  return (
    <div className="space-y-5 animate-in">

      {/* Header */}
      <div>
        <h1 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-500" />
          Payment Review
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Review tenant receipts, approve or reject payments, and track the payment ledger</p>
      </div>

      {/* Summary cards — always visible */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Pending Review',   value: totalPending,                        color: 'text-amber-600 dark:text-amber-400',     sub: 'Awaiting your action',           Icon: Clock         },
          { label: 'Total Collected',  value: `₱${totalPaidAmt.toLocaleString()}`, color: 'text-emerald-600 dark:text-emerald-400', sub: `${paidBills.length} confirmed`,  Icon: CheckCircle2  },
          { label: 'Outstanding',      value: `₱${totalUnpaid.toLocaleString()}`,  color: 'text-red-600 dark:text-red-400',          sub: `${bills.filter(b=>b.status==='published').length} bills unpaid`, Icon: XCircle },
          { label: 'Collection Rate',  value: `${collectionRate}%`,               color: 'text-blue-600 dark:text-blue-400',        sub: 'of total bills paid',            Icon: TrendingUp    },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <c.Icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{c.label}</p>
              <p className={`text-xl font-bold ${c.color} truncate`}>{c.value}</p>
              <p className="text-[10px] text-slate-400">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alert banner when receipts are pending */}
      {totalPending > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>{totalPending}</strong> payment receipt{totalPending > 1 ? 's' : ''} waiting for your review.
          </p>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-1.5 shadow-sm w-fit">
        {[
          { key: 'review', label: 'Review Queue',   Icon: ClipboardCheck },
          { key: 'ledger', label: 'Payment Ledger', Icon: BookOpen       },
        ].map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}>
            <Icon className="w-4 h-4" />
            {label}
            {key === 'review' && totalPending > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold leading-none">{totalPending}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: Review Queue ───────────────────────────────────────────────── */}
      {activeTab === 'review' && (
        <>
          {/* Sub-tabs + search */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
              {[
                { key: 'pending', label: 'Pending' },
                { key: 'all',     label: 'All Submitted' },
              ].map(t => (
                <button key={t.key} onClick={() => setReviewTab(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${reviewTab === t.key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}>
                  {t.label}
                  {t.key === 'pending' && totalPending > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold">{totalPending}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={reviewSearch} onChange={e => setReviewSearch(e.target.value)} placeholder="Search tenant, unit, or bill ID..."
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all" />
            </div>
          </div>

          {/* Queue table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{queueFiltered.length} records</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Invoice','Tenant','Unit','Amount','Reference No.','Payment Date','Status','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {queueFiltered.length === 0 ? (
                    <tr><td colSpan={8}>
                      <EmptyState
                        title={reviewTab === 'pending' ? 'No payments pending' : 'No submissions found'}
                        message={reviewTab === 'pending' ? 'All payment receipts have been reviewed.' : 'Try adjusting your search.'} />
                    </td></tr>
                  ) : queueFiltered.map(bill => (
                    <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{bill.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{bill.tenant}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{bill.unit}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">₱{bill.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.receipt?.referenceNumber || '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {bill.receipt?.paymentDate
                          ? <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{bill.receipt.paymentDate}</span>
                          : '—'}
                      </td>
                      <td className="px-4 py-3"><BillStatusBadge status={bill.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => reviewModal.open(bill)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all whitespace-nowrap">
                            <Eye className="w-3 h-3" /> Review
                          </button>
                          {bill.status === 'payment_submitted' && (
                            <>
                              <button onClick={() => approvePayment(bill.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-all whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3" /> Approve
                              </button>
                              <button onClick={() => rejectPayment(bill.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 transition-all whitespace-nowrap">
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            </>
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

      {/* ── TAB: Payment Ledger ─────────────────────────────────────────────── */}
      {activeTab === 'ledger' && (
        <>
          {/* Collection rate bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Payment Collection Rate
              </p>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{collectionRate}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700" style={{ width: `${collectionRate}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{paidBills.length} paid</span>
              <span>{bills.length - paidBills.length} outstanding</span>
            </div>
          </div>

          {/* Ledger filters */}
          <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={ledgerSearch} onChange={e => setLedgerSearch(e.target.value)} placeholder="Search tenant, unit, invoice..."
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all" />
            </div>
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
              {[
                { k: 'all',               l: 'All' },
                { k: 'payment_submitted', l: 'Submitted' },
                { k: 'paid',              l: 'Paid' },
              ].map(({ k, l }) => (
                <button key={k} onClick={() => setLedgerStatus(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${ledgerStatus === k ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Ledger table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{ledgerFiltered.length} payment records</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Invoice','Tenant','Unit','Utility Breakdown','Amount','Due Date','Payment Date','Reference','Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ledgerFiltered.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-12 text-slate-400 text-sm">No payment records found</td></tr>
                  ) : ledgerFiltered.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{p.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{p.tenant}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{p.unit}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-[11px]">
                          {p.breakdown && <>
                            <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400"><Zap className="w-3 h-3" />₱{(p.breakdown.electricity||0).toLocaleString()}</span>
                            <span className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400"><Droplets className="w-3 h-3" />₱{(p.breakdown.water||0).toLocaleString()}</span>
                            <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400"><Flame className="w-3 h-3" />₱{(p.breakdown.thermal||0).toLocaleString()}</span>
                          </>}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap">₱{p.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[12px]">{p.dueDate}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                        {p.receipt?.paymentDate
                          ? <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CalendarDays className="w-3 h-3" />{p.receipt.paymentDate}</span>
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{p.receipt?.referenceNumber || '—'}</td>
                      <td className="px-4 py-3"><BillStatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-6 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              {[
                { label: 'Paid',      count: paidBills.length,                               cls: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Submitted', count: submittedBills.length,                          cls: 'text-amber-600 dark:text-amber-400'   },
                { label: 'Published', count: bills.filter(b=>b.status==='published').length, cls: 'text-blue-600 dark:text-blue-400'     },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5 text-[11px]">
                  <span className={`font-bold text-sm ${s.cls}`}>{s.count}</span>
                  <span className="text-slate-400">{s.label}</span>
                </div>
              ))}
            </div>
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
