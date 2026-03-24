/**
 * pages/finance/BillManagement.jsx
 * Finance Billing Management — merges the former Bills.jsx (read-only overview)
 * into a second tab so Finance has one coherent billing page instead of two.
 *
 * Tab "Manage"    → Create / Edit / Publish / Delete bills
 * Tab "All Bills" → Read-only overview with utility drill-down (former Bills.jsx)
 */

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  FileText, Plus, Send, Edit2, Trash2, Search,
  Eye, CheckCircle2, X, Zap, Droplets, Flame, Save,
  LayoutList, Settings2, Filter,
} from 'lucide-react'
import { usePageLoader }  from '@/hooks/usePageLoader'
import { BillingSkeleton } from '@/components/skeletons'
import { useBills }       from '@/components/billing/hooks/useBills'
import { useModalState }  from '@/hooks/useModalState'
import EmptyState         from '@/components/ui/EmptyState'
import BillStatusBadge    from '@/components/billing/BillStatusBadge'
import { useApp }         from '@/context/AppContext'
import RateConfigCard from '@/components/common/RateConfigCard'

// ─── Utility constants ────────────────────────────────────────────────────────
const UTIL_CLS   = { electricity: 'text-amber-600 dark:text-amber-400', water: 'text-cyan-600 dark:text-cyan-400', thermal: 'text-rose-600 dark:text-rose-400' }
const UTIL_ICONS = { electricity: Zap, water: Droplets, thermal: Flame }
const DEFAULT_FORM = {
  tenant: '', unit: '',
  month: 'March 2026', billingPeriod: 'Feb 1 – Feb 28', dueDate: 'March 15, 2026',
  electricity: '', water: '', thermal: '',
}

// ─── Bill Form Modal ──────────────────────────────────────────────────────────
function BillFormModal({ bill, onSave, onClose }) {
  const isEdit = !!bill?.id
  const [form, setForm] = useState(
    isEdit ? {
      tenant: bill.tenant, unit: bill.unit, month: bill.month,
      billingPeriod: bill.billingPeriod, dueDate: bill.dueDate,
      electricity: bill.breakdown?.electricity ?? '',
      water:       bill.breakdown?.water       ?? '',
      thermal:     bill.breakdown?.thermal     ?? '',
    } : DEFAULT_FORM
  )

  const e = Number(form.electricity) || 0
  const w = Number(form.water)       || 0
  const t = Number(form.thermal)     || 0
  const total = e + w + t

  const handleSubmit = () => {
    if (!form.tenant || !form.unit || total === 0) return
    onSave({
      ...(isEdit ? bill : {}),
      tenant: form.tenant, unit: form.unit, month: form.month,
      billingPeriod: form.billingPeriod, dueDate: form.dueDate,
      amount: total,
      status:       isEdit ? bill.status : 'draft',
      publishedBy:  'finance',
      receipt:      isEdit ? bill.receipt  : null,
      tenantId:     isEdit ? bill.tenantId : 'TNT-001',
      breakdown: { electricity: e, water: w, thermal: t },
    })
    onClose()
  }

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="text-xs font-mono uppercase text-slate-400 mb-1.5 block">{label}</label>
      <input type={type} placeholder={placeholder} value={form[key]}
        onChange={ev => setForm(p => ({ ...p, [key]: ev.target.value }))}
        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all" />
    </div>
  )

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden" style={{ maxHeight: '90svh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-[15px] text-slate-800 dark:text-white">
            {isEdit ? 'Edit Bill' : 'Create New Bill'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90svh - 130px)' }}>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {field('Tenant / Company', 'tenant', 'text', 'e.g. ABC Corporation')}
              {field('Unit',             'unit',   'text', 'e.g. 12F-A')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field('Billing Month', 'month',   'text', 'e.g. March 2026')}
              {field('Due Date',      'dueDate', 'text', 'e.g. March 15, 2026')}
            </div>
            {field('Billing Period', 'billingPeriod', 'text', 'e.g. Feb 1 – Feb 28')}
            <div>
              <p className="text-xs font-mono uppercase text-slate-400 mb-2">Utility Breakdown</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'electricity', label: 'Electricity', Icon: Zap,      cls: 'text-amber-500' },
                  { key: 'water',       label: 'Water',       Icon: Droplets, cls: 'text-cyan-500'  },
                  { key: 'thermal',     label: 'Thermal',     Icon: Flame,    cls: 'text-rose-500'  },
                ].map(({ key, label, Icon, cls }) => (
                  <div key={key}>
                    <label className="text-xs font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                      <Icon className={`w-3 h-3 ${cls}`} />{label}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₱</span>
                      <input type="number" placeholder="0" value={form[key]}
                        onChange={ev => setForm(p => ({ ...p, [key]: ev.target.value }))}
                        className="w-full pl-6 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
              {total > 0 && (
                <div className="mt-3 flex justify-between items-center px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-mono uppercase">Total</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">₱{total.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.tenant || !form.unit || total === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <Save className="w-4 h-4" />{isEdit ? 'Save Changes' : 'Create Bill'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Bill Detail Modal (All Bills tab) ───────────────────────────────────────
function BillDetailModal({ bill, onClose }) {
  if (!bill) return null
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/70 dark:border-slate-700/50 overflow-hidden" style={{ maxHeight: '88svh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-semibold text-[15px] text-slate-800 dark:text-white">Bill Details</h3>
            <p className="text-[11px] text-slate-400 font-mono">{bill.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto space-y-5" style={{ maxHeight: 'calc(88svh - 68px)' }}>
          <div className="flex items-center gap-3 flex-wrap">
            <BillStatusBadge status={bill.status} />
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{bill.tenant}</p>
              <p className="text-[11px] text-slate-400">Unit {bill.unit}</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {[
              { k: 'Invoice ID',     v: bill.id },
              { k: 'Month',          v: bill.month },
              { k: 'Billing Period', v: bill.billingPeriod },
              { k: 'Due Date',       v: bill.dueDate },
              { k: 'Total Amount',   v: `₱${bill.amount.toLocaleString()}` },
            ].map(row => (
              <div key={row.k} className="flex justify-between px-4 py-2.5 border-b last:border-0 border-slate-100 dark:border-slate-800 text-sm">
                <span className="text-slate-400">{row.k}</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{row.v}</span>
              </div>
            ))}
          </div>
          {bill.breakdown && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-3">Utility Breakdown</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(bill.breakdown).map(([key, val]) => {
                  const UIcon = UTIL_ICONS[key]
                  return (
                    <div key={key} className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                      {UIcon && <UIcon className={`w-4 h-4 mx-auto mb-1 ${UTIL_CLS[key]}`} />}
                      <p className="text-[10px] font-mono uppercase text-slate-400">{key}</p>
                      <p className={`text-sm font-bold ${UTIL_CLS[key]}`}>₱{val.toLocaleString()}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {bill.receipt && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">Payment Receipt</p>
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                {[
                  { k: 'Reference No.', v: bill.receipt.referenceNumber },
                  { k: 'Payment Date',  v: bill.receipt.paymentDate },
                  { k: 'Submitted By',  v: bill.receipt.submittedBy },
                ].map(row => (
                  <div key={row.k} className="flex justify-between px-4 py-2.5 border-b last:border-0 border-slate-100 dark:border-slate-800 text-sm">
                    <span className="text-slate-400">{row.k}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200 capitalize">{row.v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FinanceBillManagement() {
  const loading = usePageLoader(700)
  const {
    bills, createBill, updateBill, removeBill, publishBill,
    draftBills, publishedBills, submittedBills, paidBills, totalRevenue,
  } = useBills()
  const { addToast } = useApp()

  const [activeTab,    setActiveTab]    = useState('manage')
  const [editBill,     setEditBill]     = useState(null)
  const formModal = useModalState()
  const detailModal = useModalState()
  const close = () => {
  setIsOpen(false)
  setSelectedItem(null)
}

  // Manage-tab state
  const [manageSearch, setManageSearch]         = useState('')
  const [manageStatus, setManageStatus]         = useState('all')
  // All-bills tab state
  const [allSearch,    setAllSearch]            = useState('')
  const [allStatus,    setAllStatus]            = useState('all')
  const [allUtility,   setAllUtility]           = useState('all')

  if (loading) return <BillingSkeleton />

  const openCreate = () => { setEditBill(null); formModal.open({}) }
  const openEdit   = (bill) => { setEditBill(bill); formModal.open(bill) }
  const handleSave = (data) => { editBill?.id ? updateBill(editBill.id, data) : createBill(data) }
  const handlePublish = (id) => { publishBill(id); addToast('Bill published — tenant can now see it.', 'success') }

  const manageFiltered = bills.filter(b => {
    const q = manageSearch.toLowerCase()
    return (!q || b.tenant.toLowerCase().includes(q) || b.unit.toLowerCase().includes(q) || b.id.toLowerCase().includes(q))
      && (manageStatus === 'all' || b.status === manageStatus)
  })

  const allFiltered = bills.filter(b => {
    const q = allSearch.toLowerCase()
    return (!q || b.tenant.toLowerCase().includes(q) || b.unit.toLowerCase().includes(q) || b.id.toLowerCase().includes(q))
      && (allStatus  === 'all' || b.status === allStatus)
      && (allUtility === 'all' || (b.breakdown && b.breakdown[allUtility] > 0))
  })

  const STATUS_TABS = [
    { k: 'all',               l: 'All' },
    { k: 'draft',             l: 'Draft' },
    { k: 'published',         l: 'Published' },
    { k: 'payment_submitted', l: 'Submitted' },
    { k: 'paid',              l: 'Paid' },
  ]

  return (
    <div className="space-y-5 animate-in">

      {/* Page header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Billing Management
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Create, edit, publish, and monitor all tenant bills</p>
        </div>
        {activeTab === 'manage' && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0">
            <Plus className="w-4 h-4" /> Create Bill
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-1.5 shadow-sm w-fit">
        {[
          { key: 'manage',    label: 'Manage Bills', Icon: Settings2  },
          { key: 'all-bills', label: 'All Bills',    Icon: LayoutList },
        ].map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── TAB: Manage ────────────────────────────────────────────────────── */}
      {activeTab === 'manage' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Drafts',    value: draftBills.length,     color: 'text-slate-600 dark:text-slate-300',       sub: 'Not yet published' },
              { label: 'Published', value: publishedBills.length, color: 'text-blue-600 dark:text-blue-400',          sub: 'Tenants can see' },
              { label: 'Submitted', value: submittedBills.length, color: 'text-amber-600 dark:text-amber-400',        sub: 'Pending review' },
              { label: 'Paid',      value: paidBills.length,      color: 'text-emerald-600 dark:text-emerald-400',    sub: 'Completed' },
            ].map(c => (
              <div key={c.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{c.label}</p>
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>

          <RateConfigCard />


          {/* Filters */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={manageSearch} onChange={e => setManageSearch(e.target.value)} placeholder="Search tenant, unit, or bill ID..."
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all" />
            </div>
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
              {STATUS_TABS.map(({ k, l }) => (
                <button key={k} onClick={() => setManageStatus(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap ${manageStatus === k ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{manageFiltered.length} bills</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Invoice','Tenant','Unit','Month','Amount','Due Date','Status','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {manageFiltered.length === 0 ? (
                    <tr><td colSpan={8}><EmptyState title="No bills found" message="Create a new bill to get started." /></td></tr>
                  ) : manageFiltered.map(bill => (
                    <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{bill.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{bill.tenant}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{bill.unit}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.month}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">₱{bill.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">{bill.dueDate}</td>
                      <td className="px-4 py-3"><BillStatusBadge status={bill.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {bill.status === 'draft' && (
                            <button onClick={() => handlePublish(bill.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all whitespace-nowrap">
                              <Send className="w-3 h-3" /> Publish
                            </button>
                          )}
                          {['draft','published'].includes(bill.status) && (
                            <button onClick={() => openEdit(bill)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all">
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                          )}
                          {bill.status === 'payment_submitted' && (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3" /> Needs Review
                            </span>
                          )}
                          {bill.status === 'paid' && (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3" /> Complete
                            </span>
                          )}
                          {['draft','published'].includes(bill.status) && (
                            <button onClick={() => removeBill(bill.id)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      {/* ── TAB: All Bills ─────────────────────────────────────────────────── */}
      {activeTab === 'all-bills' && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Bills', value: bills.length,                       color: 'text-slate-800 dark:text-white',        sub: 'All time' },
              { label: 'Collected',   value: `₱${totalRevenue.toLocaleString()}`, color: 'text-emerald-600 dark:text-emerald-400', sub: `${paidBills.length} paid` },
              { label: 'Published',   value: publishedBills.length,              color: 'text-blue-600 dark:text-blue-400',       sub: 'Awaiting tenant payment' },
              { label: 'Pending',     value: submittedBills.length,              color: 'text-amber-600 dark:text-amber-400',     sub: 'Awaiting confirmation' },
            ].map(c => (
              <div key={c.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-md">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{c.label}</p>
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-md flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={allSearch} onChange={e => setAllSearch(e.target.value)} placeholder="Search tenant, unit, or bill ID..."
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all" />
            </div>
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
              {STATUS_TABS.map(({ k, l }) => (
                <button key={k} onClick={() => setAllStatus(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${allStatus === k ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}>
                  {l}
                </button>
              ))}
            </div>
            <select value={allUtility} onChange={e => setAllUtility(e.target.value)}
              className="px-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 transition-all">
              <option value="all">All Utilities</option>
              <option value="electricity">Electricity</option>
              <option value="water">Water</option>
              <option value="thermal">Thermal</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{allFiltered.length} bill{allFiltered.length !== 1 ? 's' : ''} found</p>
              <Filter className="w-4 h-4 text-slate-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Invoice ID','Tenant','Unit','Month','Due Date','Electricity','Water','Thermal','Total','Status','Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allFiltered.length === 0 ? (
                    <tr><td colSpan={11}><EmptyState title="No bills match your filters" message="Try adjusting the search or status filter." /></td></tr>
                  ) : allFiltered.map(bill => (
                    <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{bill.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{bill.tenant}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono">{bill.unit}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.month}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.dueDate}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-amber-600 dark:text-amber-400">₱{(bill.breakdown?.electricity ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-cyan-600 dark:text-cyan-400">₱{(bill.breakdown?.water ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-rose-600 dark:text-rose-400">₱{(bill.breakdown?.thermal ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap">₱{bill.amount.toLocaleString()}</td>
                      <td className="px-4 py-3"><BillStatusBadge status={bill.status} /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => detailModal.open(bill)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-all">
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Shared modals */}
      {formModal.isOpen && (
        <BillFormModal bill={editBill} onSave={handleSave} onClose={formModal.close} />
      )}
      {detailModal.isOpen && (
  <BillDetailModal 
    bill={detailModal.selectedItem} 
    onClose={detailModal.close} 
  />
)}
    </div>
  )
}
