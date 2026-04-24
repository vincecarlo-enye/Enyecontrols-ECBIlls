import { formatDate } from '@/utils/filterUtils'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CreditCard, CheckCircle2, XCircle, Clock, Search,
  Eye, Calendar, TrendingUp, CalendarDays, Zap, Droplets, Flame,
  ClipboardCheck, BookOpen,
} from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { BillingSkeleton } from '@/components/skeletons'
import PaymentReviewModal from '@/components/billing/PaymentReviewModal'
import { useModalState } from '@/hooks/useModalState'
import EmptyState from '@/components/ui/EmptyState'
import BillStatusBadge from '@/components/billing/BillStatusBadge'
import { useApp } from '@/context/AppContext'
import PaginationBar from '@/components/common/PaginationBar'
import { useClientPagination } from '@/hooks/useClientPagination'
import PageActionBar from '@/components/common/PageActionBar'
import { exportTableCsv, printElement } from '@/utils/reporting'
import { resolveStorageAssetUrl } from '@/utils/billing'
import { fetchFinanceBills, fetchFinancePayments, rejectFinancePayment, verifyFinancePayment } from '@/services/financeService/financeBillService'


function formatMonth(value) {
  if (!value) return ''
  if (/^\d{4}-\d{2}$/.test(String(value))) {
    const [year, month] = String(value).split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
  }
  return String(value)
}

function buildBreakdown(items = []) {
  const totals = { electricity: 0, water: 0, thermal: 0 }
  items.forEach((item) => {
    const type = String(item?.type || '').toLowerCase()
    const amount = Number(item?.amount ?? 0)
    if (type === 'electric' || type === 'electricity') totals.electricity += amount
    if (type === 'water') totals.water += amount
    if (type === 'thermal') totals.thermal += amount
  })
  return totals
}

function normalizePayment(row = {}) {
  const bill = row?.bill || {}
  const tenant = row?.tenant || bill?.tenant || {}
  const unit = bill?.unit || tenant?.unit || {}
  const proofImage = resolveStorageAssetUrl(row?.proof_image)

  return {
    id: String(bill?.id ?? row?.bill_id ?? row?.id ?? ''),
    paymentId: row?.id,
    tenant: tenant?.name || 'Unknown Tenant',
    unit: unit?.unit_number || unit?.name || 'N/A',
    month: formatMonth(bill?.billing_month || ''),
    billingPeriod:
      bill?.billing_start && bill?.billing_end
        ? `${formatDate(bill.billing_start)} - ${formatDate(bill.billing_end)}`
        : formatDate(bill?.billing_end || ''),
    dueDate: formatDate(bill?.due_date || ''),
    amount: Number(row?.amount ?? bill?.amount ?? 0),
    status: row?.status || 'pending',
    billStatus: bill?.status || 'unpaid',
    breakdown: buildBreakdown(Array.isArray(bill?.items) ? bill.items : []),
    receipt: {
      referenceNumber: row?.reference_no || '—',
      paymentDate: formatDate(row?.paid_at || ''),
      submittedBy: tenant?.name || 'Tenant',
      note: row?.notes || '',
      receiptImage: proofImage || '',
      paymentMethod: row?.payment_method || '',
    },
    raw: row,
  }
}

function normalizeBill(row = {}) {
  return {
    id: String(row?.id ?? ''),
    tenant: row?.tenant?.name || 'Unknown Tenant',
    unit: row?.unit?.unit_number || row?.unit?.name || 'N/A',
    amount: Number(row?.amount ?? 0),
    status: row?.status || 'unpaid',
  }
}

export default function FinancePaymentReview() {
  const pageLoading = usePageLoader(700)
  const printRef = useRef(null)
  const { addToast } = useApp()
  const reviewModal = useModalState()
  const [activeTab, setActiveTab] = useState('review')
  const [reviewSearch, setReviewSearch] = useState('')
  const [reviewTab, setReviewTab] = useState('pending')
  const [ledgerSearch, setLedgerSearch] = useState('')
  const [ledgerStatus, setLedgerStatus] = useState('all')
  const [payments, setPayments] = useState([])
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const [paymentsRes, billsRes] = await Promise.all([
        fetchFinancePayments(),
        fetchFinanceBills(),
      ])

      setPayments((Array.isArray(paymentsRes?.data) ? paymentsRes.data : []).map(normalizePayment))
      setBills((Array.isArray(billsRes?.data) ? billsRes.data : []).map(normalizeBill))
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load payment review data.')
      setPayments([])
      setBills([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const approvePayment = async (paymentId) => {
    try {
      setActing(true)
      await verifyFinancePayment(paymentId)
      addToast('Payment verified successfully.', 'success')
      await loadData()
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to verify payment.'
      setError(message)
      addToast(message, 'error')
      return { success: false, message }
    } finally {
      setActing(false)
    }
  }

  const rejectPayment = async (paymentId) => {
    try {
      setActing(true)
      await rejectFinancePayment(paymentId, { notes: '' })
      addToast('Payment rejected successfully.', 'info')
      await loadData()
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to reject payment.'
      setError(message)
      addToast(message, 'error')
      return { success: false, message }
    } finally {
      setActing(false)
    }
  }

  const loadingState = (pageLoading && payments.length === 0 && bills.length === 0) || (loading && payments.length === 0 && bills.length === 0 && !error)
  const pendingPayments = payments.filter((payment) => payment.status === 'pending')
  const verifiedPayments = payments.filter((payment) => payment.status === 'verified')
  const totalPending = pendingPayments.length
  const totalPaidAmt = verifiedPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const totalUnpaid = bills.filter((bill) => ['published', 'unpaid', 'overdue'].includes(bill.status)).reduce((sum, bill) => sum + bill.amount, 0)
  const paidBills = bills.filter((bill) => bill.status === 'paid')
  const collectionRate = bills.length ? Math.round((paidBills.length / bills.length) * 100) : 0

  const queueBase = reviewTab === 'pending' ? pendingPayments : payments
  const queueFiltered = useMemo(() => queueBase.filter((payment) => {
    const q = reviewSearch.trim().toLowerCase()
    return !q || payment.tenant.toLowerCase().includes(q) || payment.unit.toLowerCase().includes(q) || payment.id.toLowerCase().includes(q)
  }), [queueBase, reviewSearch])

  const ledgerFiltered = useMemo(() => payments.filter((payment) => {
    const q = ledgerSearch.trim().toLowerCase()
    return (!q || payment.tenant.toLowerCase().includes(q) || payment.unit.toLowerCase().includes(q) || payment.id.toLowerCase().includes(q))
      && (ledgerStatus === 'all' || payment.status === ledgerStatus)
  }), [payments, ledgerSearch, ledgerStatus])

  const queuePagination = useClientPagination(queueFiltered, 10)
  const ledgerPagination = useClientPagination(ledgerFiltered, 10)

  useEffect(() => {
    queuePagination.setPage(1)
  }, [reviewSearch, reviewTab])

  useEffect(() => {
    ledgerPagination.setPage(1)
  }, [ledgerSearch, ledgerStatus])

  if (loadingState) return <BillingSkeleton />

  const handleExport = () => {
    const rows = (activeTab === 'review' ? queueFiltered : ledgerFiltered).map((payment) => ({
      invoice_id: payment.id,
      tenant: payment.tenant,
      unit: payment.unit,
      month: payment.month,
      amount: payment.amount,
      status: payment.status,
      payment_date: payment.receipt?.paymentDate || '',
      reference_number: payment.receipt?.referenceNumber || '',
      electricity: Number(payment.breakdown?.electricity || 0),
      water: Number(payment.breakdown?.water || 0),
      thermal: Number(payment.breakdown?.thermal || 0),
    }))

    exportTableCsv(`finance-payment-${activeTab}.csv`, rows)
  }

  const handlePrint = () => {
    printElement({
      title: 'Payment Review',
      subtitle: activeTab === 'review' ? 'Review queue' : 'Payment ledger',
      element: printRef.current,
    })
  }

  return (
    <div className="space-y-5 animate-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-500" />
            Payment Review
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Review tenant receipts, approve or reject payments, and track the payment ledger</p>
        </div>
        <PageActionBar
          onExport={handleExport}
          onPrint={handlePrint}
          exportLabel={activeTab === 'review' ? 'Export Queue' : 'Export Ledger'}
          printLabel={activeTab === 'review' ? 'Print Queue' : 'Print Ledger'}
          iconOnly
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Pending Review', value: totalPending, color: 'text-amber-600 dark:text-amber-400', sub: 'Awaiting your action', Icon: Clock },
          { label: 'Total Collected', value: `PHP ${totalPaidAmt.toLocaleString()}`, color: 'text-emerald-600 dark:text-emerald-400', sub: `${verifiedPayments.length} verified`, Icon: CheckCircle2 },
          { label: 'Outstanding', value: `PHP ${totalUnpaid.toLocaleString()}`, color: 'text-red-600 dark:text-red-400', sub: `${bills.filter((bill) => ['published', 'unpaid', 'overdue'].includes(bill.status)).length} bills unpaid`, Icon: XCircle },
          { label: 'Collection Rate', value: `${collectionRate}%`, color: 'text-blue-600 dark:text-blue-400', sub: 'of total bills paid', Icon: TrendingUp },
        ].map((card) => (
          <div key={card.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <card.Icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{card.label}</p>
              <p className={`text-xl font-bold ${card.color} truncate`}>{card.value}</p>
              <p className="text-[10px] text-slate-400">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {totalPending > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>{totalPending}</strong> payment receipt{totalPending > 1 ? 's' : ''} waiting for your review.
          </p>
        </div>
      )}

      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-1.5 shadow-sm w-fit">
        {[
          { key: 'review', label: 'Review Queue', Icon: ClipboardCheck },
          { key: 'ledger', label: 'Payment Ledger', Icon: BookOpen },
        ].map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <Icon className="w-4 h-4" />
            {label}
            {key === 'review' && totalPending > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold leading-none">{totalPending}</span>
            )}
          </button>
        ))}
      </div>

      <div ref={printRef}>
      {activeTab === 'review' && (
        <>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
              {[
                { key: 'pending', label: 'Pending' },
                { key: 'all', label: 'All Receipts' },
              ].map((tab) => (
                <button key={tab.key} onClick={() => setReviewTab(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${reviewTab === tab.key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}>
                  {tab.label}
                  {tab.key === 'pending' && totalPending > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold">{totalPending}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={reviewSearch} onChange={(e) => setReviewSearch(e.target.value)} placeholder="Search tenant, unit, or bill ID..."
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{queueFiltered.length} records</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Invoice', 'Tenant', 'Unit', 'Amount', 'Reference No.', 'Payment Date', 'Status', 'Actions'].map((header) => (
                      <th key={header} className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {queueFiltered.length === 0 ? (
                    <tr><td colSpan={8}><EmptyState title={reviewTab === 'pending' ? 'No payments pending' : 'No submissions found'} message={reviewTab === 'pending' ? 'All payment receipts have been reviewed.' : 'Try adjusting your search.'} /></td></tr>
                  ) : queuePagination.pagedItems.map((payment) => (
                    <tr key={payment.paymentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{payment.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{payment.tenant}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{payment.unit}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">PHP {payment.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{payment.receipt?.referenceNumber || '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {payment.receipt?.paymentDate ? <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{payment.receipt.paymentDate}</span> : '—'}
                      </td>
                      <td className="px-4 py-3"><BillStatusBadge status={payment.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => reviewModal.open(payment)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all whitespace-nowrap">
                            <Eye className="w-3 h-3" /> Review
                          </button>
                          {payment.status === 'pending' && (
                            <>
                              <button onClick={() => approvePayment(payment.paymentId)} disabled={acting}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-all whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3" /> Approve
                              </button>
                              <button onClick={() => rejectPayment(payment.paymentId)} disabled={acting}
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
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
              <PaginationBar
                meta={queuePagination.meta}
                page={queuePagination.page}
                perPage={queuePagination.perPage}
                onPageChange={queuePagination.setPage}
                onPerPageChange={(value) => {
                  queuePagination.setPerPage(value)
                  queuePagination.setPage(1)
                }}
              />
            </div>
          </div>
        </>
      )}

      {activeTab === 'ledger' && (
        <>
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

          <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={ledgerSearch} onChange={(e) => setLedgerSearch(e.target.value)} placeholder="Search tenant, unit, invoice..."
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all" />
            </div>
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
              {[
                { k: 'all', l: 'All' },
                { k: 'pending', l: 'Pending' },
                { k: 'verified', l: 'Verified' },
                { k: 'rejected', l: 'Rejected' },
              ].map(({ k, l }) => (
                <button key={k} onClick={() => setLedgerStatus(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${ledgerStatus === k ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{ledgerFiltered.length} payment records</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Invoice', 'Tenant', 'Unit', 'Utility Breakdown', 'Amount', 'Due Date', 'Payment Date', 'Reference', 'Status'].map((header) => (
                      <th key={header} className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ledgerFiltered.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-12 text-slate-400 text-sm">No payment records found</td></tr>
                  ) : ledgerPagination.pagedItems.map((payment) => (
                    <tr key={payment.paymentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{payment.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{payment.tenant}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{payment.unit}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400"><Zap className="w-3 h-3" />PHP {(payment.breakdown.electricity || 0).toLocaleString()}</span>
                          <span className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400"><Droplets className="w-3 h-3" />PHP {(payment.breakdown.water || 0).toLocaleString()}</span>
                          <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400"><Flame className="w-3 h-3" />PHP {(payment.breakdown.thermal || 0).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap">PHP {payment.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[12px]">{payment.dueDate}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                        {payment.receipt?.paymentDate ? <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CalendarDays className="w-3 h-3" />{payment.receipt.paymentDate}</span> : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{payment.receipt?.referenceNumber || '—'}</td>
                      <td className="px-4 py-3"><BillStatusBadge status={payment.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
              <PaginationBar
                meta={ledgerPagination.meta}
                page={ledgerPagination.page}
                perPage={ledgerPagination.perPage}
                onPageChange={ledgerPagination.setPage}
                onPerPageChange={(value) => {
                  ledgerPagination.setPerPage(value)
                  ledgerPagination.setPage(1)
                }}
              />
            </div>
            <div className="flex items-center gap-6 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              {[
                { label: 'Verified', count: payments.filter((payment) => payment.status === 'verified').length, cls: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Pending', count: payments.filter((payment) => payment.status === 'pending').length, cls: 'text-amber-600 dark:text-amber-400' },
                { label: 'Rejected', count: payments.filter((payment) => payment.status === 'rejected').length, cls: 'text-rose-600 dark:text-rose-400' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-1.5 text-[11px]">
                  <span className={`font-bold text-sm ${stat.cls}`}>{stat.count}</span>
                  <span className="text-slate-400">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      </div>

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
