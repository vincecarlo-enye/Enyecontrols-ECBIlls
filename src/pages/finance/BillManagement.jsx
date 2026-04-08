import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import {
  FileText, Plus, Send, Edit2, Trash2, Search,
  Eye, CheckCircle2, X, Zap, Droplets, Flame,
  LayoutList, Settings2, Filter,
} from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { BillingSkeleton } from '@/components/skeletons'
import EmptyState from '@/components/ui/EmptyState'
import BillStatusBadge from '@/components/billing/BillStatusBadge'
import { useApp } from '@/context/AppContext'
import { useModalState } from '@/hooks/useModalState'
import RateConfigCard from '@/components/common/RateConfigCard'
import BillingPeriodLockPanel from '@/components/common/BillingPeriodLockPanel'
import { useFinanceBills } from '@/hooks/financeHooks/useFinanceBills'
import { useBillingPeriodLocks } from '@/hooks/useBillingPeriodLocks'
import { useBillingPenaltyRule } from '@/hooks/useBillingPenaltyRule'

const UTIL_CLS = {
  electricity: 'text-amber-600 dark:text-amber-400',
  water: 'text-cyan-600 dark:text-cyan-400',
  thermal: 'text-rose-600 dark:text-rose-400',
}

const UTIL_ICONS = {
  electricity: Zap,
  water: Droplets,
  thermal: Flame,
}

function BillFormModal({ open, onClose, tenants, initial, onSave, saving, isMonthLocked, getMonthLock }) {
  const [tenantId, setTenantId] = useState(initial?.tenantId || '')
  const [billingMonth, setBillingMonth] = useState(initial?.billingMonth || '')

  useEffect(() => {
    if (!open) return
    setTenantId(initial?.tenantId || '')
    setBillingMonth(initial?.billingMonth || '')
  }, [open, initial])

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => String(tenant.id) === String(tenantId)),
    [tenantId, tenants]
  )
  const selectedLock = billingMonth ? getMonthLock?.(billingMonth) : null
  const monthLocked = billingMonth ? isMonthLocked?.(billingMonth) : false

  if (!open) return null

  const handleSubmit = async () => {
    if (!tenantId || !billingMonth) return

    const result = await onSave({
      tenantId: Number(tenantId),
      billingMonth,
    })

    if (result?.success) onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-[15px] text-slate-800 dark:text-white">
            {initial ? 'Regenerate Bill' : 'Generate New Bill'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-mono uppercase text-slate-400 mb-1.5 block">Tenant</label>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 transition-all"
            >
              <option value="">Select tenant...</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} {tenant.unit ? `- ${tenant.unit}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-mono uppercase text-slate-400 mb-1.5 block">Billing Month</label>
            <input
              type="month"
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 transition-all"
            />
            <p className="mt-2 text-xs text-slate-400">
              Finance can only generate bills from approved readings and active billing rates that cover the selected billing month.
            </p>
          </div>

          {monthLocked && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
              {billingMonth} is locked. {selectedLock?.reason ? `Reason: ${selectedLock.reason}` : 'Unlock the billing period first before generating or regenerating bills.'}
            </div>
          )}

          {selectedTenant && (
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-4 py-3">
                <p className="text-xs font-mono uppercase text-slate-400 mb-1">Selected Tenant</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedTenant.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Unit {selectedTenant.unit || 'N/A'}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
                Bills now use dedicated submeters only. If this unit has no dedicated approved electric, water, or thermal submeter readings, that utility will not be billed for the selected month.
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!tenantId || !billingMonth || saving || monthLocked}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {initial ? 'Regenerate Bill' : 'Generate Bill'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function BulkBillFormModal({ open, onClose, tenantCount, onSave, saving, isMonthLocked, getMonthLock }) {
  const [billingMonth, setBillingMonth] = useState('')

  useEffect(() => {
    if (!open) return
    setBillingMonth('')
  }, [open])

  if (!open) return null
  const selectedLock = billingMonth ? getMonthLock?.(billingMonth) : null
  const monthLocked = billingMonth ? isMonthLocked?.(billingMonth) : false

  const handleSubmit = async () => {
    if (!billingMonth) return
    const result = await onSave({ billingMonth })
    if (result?.success) onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-[15px] text-slate-800 dark:text-white">Generate Bills in Bulk</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-4 py-3">
            <p className="text-xs font-mono uppercase text-slate-400 mb-1">Target</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{tenantCount} active tenant records</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Existing bills for the same month will be skipped automatically.</p>
          </div>

          <div>
            <label className="text-xs font-mono uppercase text-slate-400 mb-1.5 block">Billing Month</label>
            <input
              type="month"
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 transition-all"
            />
            <p className="mt-2 text-xs text-slate-400">
              Bulk generation still requires approved readings and active rates per tenant/unit.
            </p>
          </div>

          {monthLocked && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
              {billingMonth} is locked. {selectedLock?.reason ? `Reason: ${selectedLock.reason}` : 'Unlock the billing period first before running bulk bill generation.'}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!billingMonth || saving || monthLocked}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Generate All
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function BillDetailModal({ bill, onClose }) {
  if (!bill) return null

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/70 dark:border-slate-700/50 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-semibold text-[15px] text-slate-800 dark:text-white">Bill Details</h3>
            <p className="text-[11px] text-slate-400 font-mono">{bill.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <BillStatusBadge status={bill.status} />
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{bill.tenant}</p>
              <p className="text-[11px] text-slate-400">Unit {bill.unit}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {[
              { k: 'Invoice ID', v: bill.id },
              { k: 'Month', v: bill.month },
              { k: 'Billing Period', v: bill.billingPeriod },
              { k: 'Due Date', v: bill.dueDate },
              { k: 'Total Amount', v: `PHP ${bill.amount.toLocaleString()}` },
            ].map((row) => (
              <div key={row.k} className="flex justify-between px-4 py-2.5 border-b last:border-0 border-slate-100 dark:border-slate-800 text-sm">
                <span className="text-slate-400">{row.k}</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{row.v}</span>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-3">Utility Breakdown</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(bill.breakdown || {}).map(([key, val]) => {
                const Icon = UTIL_ICONS[key]
                return (
                  <div key={key} className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                    {Icon ? <Icon className={`w-4 h-4 mx-auto mb-1 ${UTIL_CLS[key]}`} /> : null}
                    <p className="text-[10px] font-mono uppercase text-slate-400">{key}</p>
                    <p className={`text-sm font-bold ${UTIL_CLS[key]}`}>PHP {Number(val || 0).toLocaleString()}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function FinanceBillManagement() {
  const location = useLocation()
  const navigate = useNavigate()
  const pageLoading = usePageLoader(700)
  const {
    bills,
    tenants,
    rates,
    loading,
    saving,
    error,
    assistPreview,
    assistLoading,
    previewBillingAssist,
    createBill,
    generateBillsBulk,
    generateReadyBills,
    regenerateBill,
    publishBill,
    removeBill,
    draftBills,
    publishedBills,
    submittedBills,
    paidBills,
    totalRevenue,
  } = useFinanceBills()
  const { addToast } = useApp()
  const { isMonthLocked, getMonthLock } = useBillingPeriodLocks('finance')
  const [assistMonth, setAssistMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const {
    rule: penaltyRule,
    penaltyPreview,
    previewLoading: penaltyPreviewLoading,
    applyPenalties,
    previewPenalties,
  } = useBillingPenaltyRule()

  const [activeTab, setActiveTab] = useState('manage')
  const [manageSearch, setManageSearch] = useState('')
  const [manageStatus, setManageStatus] = useState('all')
  const [allSearch, setAllSearch] = useState('')
  const [allStatus, setAllStatus] = useState('all')
  const [allUtility, setAllUtility] = useState('all')
  const [penaltyAsOf, setPenaltyAsOf] = useState(() => new Date().toISOString().slice(0, 10))
  const [editBill, setEditBill] = useState(null)
  const formModal = useModalState()
  const bulkFormModal = useModalState()
  const detailModal = useModalState()

  useEffect(() => {
    const navbarSearchItem = location.state?.navbarSearchItem
    if (!navbarSearchItem?.query) return

    const query = String(navbarSearchItem.query).trim()
    if (!query) return

    setActiveTab('all-bills')
    setManageSearch(query)
    setAllSearch(query)

    navigate(location.pathname, {
      replace: true,
      state: {
        ...location.state,
        navbarSearchItem: null,
      },
    })
  }, [location.pathname, location.state, navigate])

  const loadingState = pageLoading || loading

  const manageFiltered = useMemo(
    () =>
      bills.filter((bill) => {
        const q = manageSearch.toLowerCase()
        return (
          (!q ||
            bill.tenant.toLowerCase().includes(q) ||
            bill.unit.toLowerCase().includes(q) ||
            bill.id.toLowerCase().includes(q)) &&
          (manageStatus === 'all' || bill.status === manageStatus)
        )
      }),
    [bills, manageSearch, manageStatus]
  )

  const allFiltered = useMemo(
    () =>
      bills.filter((bill) => {
        const q = allSearch.toLowerCase()
        return (
          (!q ||
            bill.tenant.toLowerCase().includes(q) ||
            bill.unit.toLowerCase().includes(q) ||
            bill.id.toLowerCase().includes(q)) &&
          (allStatus === 'all' || bill.status === allStatus) &&
          (allUtility === 'all' || Number(bill.breakdown?.[allUtility] || 0) > 0)
        )
      }),
    [bills, allSearch, allStatus, allUtility]
  )

  if (loadingState) return <BillingSkeleton />

  const openCreate = () => {
    setEditBill(null)
    formModal.open({})
  }

  const openBulkCreate = () => {
    bulkFormModal.open({})
  }

  const openEdit = (bill) => {
    setEditBill(bill)
    formModal.open(bill)
  }

  const handleSave = async (data) => {
    const result = editBill?.id ? await regenerateBill(data) : await createBill(data)

    if (!result?.success) {
      addToast(result?.message || 'Failed to save bill.', 'error')
      return result
    }

    addToast(
      editBill?.id
        ? 'Bill regenerated as draft. Publish it to show on the tenant side.'
        : 'Bill generated as draft. Publish it to show on the tenant side.',
      'success'
    )
    return result
  }

  const handlePublish = async (id) => {
    const result = await publishBill(id)
    addToast(result?.success ? 'Bill published successfully.' : result?.message || 'Failed to publish bill.', result?.success ? 'success' : 'error')
  }

  const handleDelete = async (id) => {
    const result = await removeBill(id)
    addToast(result?.success ? 'Bill deleted successfully.' : result?.message || 'Failed to delete bill.', result?.success ? 'success' : 'error')
  }

  const handleBulkSave = async ({ billingMonth }) => {
    const result = await generateBillsBulk({
      tenantIds: tenants.map((tenant) => tenant.id),
      billingMonth,
    })

    addToast(
      result?.success
        ? result?.message || 'Bulk bill generation completed.'
        : result?.message || 'Failed to generate bills in bulk.',
      result?.success ? 'success' : 'error'
    )

    return result
  }

  const handleAssistPreview = async () => {
    if (!assistMonth) {
      addToast('Select a billing month first.', 'error')
      return
    }

    const result = await previewBillingAssist({ billingMonth: assistMonth })
    addToast(
      result?.success ? 'Billing assist preview loaded.' : result?.message || 'Failed to load billing assist preview.',
      result?.success ? 'success' : 'error'
    )
  }

  const handleGenerateReady = async () => {
    if (!assistMonth) {
      addToast('Select a billing month first.', 'error')
      return
    }

    const result = await generateReadyBills({ billingMonth: assistMonth })
    addToast(
      result?.success
        ? result?.message || 'Ready bills generated successfully.'
        : result?.message || 'No bill-ready tenants found for the selected month.',
      result?.success ? 'success' : 'error'
    )
  }

  const handlePenaltyPreview = async () => {
    const result = await previewPenalties({ asOfDate: penaltyAsOf })
    addToast(
      result?.success ? 'Penalty preview loaded.' : result?.message || 'Failed to preview penalties.',
      result?.success ? 'success' : 'error'
    )
  }

  const handleApplyPenalties = async () => {
    const result = await applyPenalties({ asOfDate: penaltyAsOf })
    addToast(
      result?.success ? result?.message || 'Penalties applied successfully.' : result?.message || 'No penalties were applied.',
      result?.success ? 'success' : 'error'
    )
  }

  const STATUS_TABS = [
    { k: 'all', l: 'All' },
    { k: 'draft', l: 'Draft' },
    { k: 'published', l: 'Published' },
    { k: 'payment_submitted', l: 'Submitted' },
    { k: 'paid', l: 'Paid' },
  ]

  return (
    <div className="space-y-5 animate-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Billing Management
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Generate, publish, and monitor all tenant bills</p>
        </div>
        {activeTab === 'manage' && (
          <div className="flex items-center gap-2">
            <button
              onClick={openBulkCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-sm transition-all hover:-translate-y-0.5"
            >
              <Send className="w-4 h-4" /> Generate All
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" /> Generate Bill
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-1.5 shadow-sm w-fit">
        {[
          { key: 'manage', label: 'Manage Bills', Icon: Settings2 },
          { key: 'all-bills', label: 'All Bills', Icon: LayoutList },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {activeTab === 'manage' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Drafts', value: draftBills.length, color: 'text-slate-600 dark:text-slate-300', sub: 'Not yet published' },
              { label: 'Published', value: publishedBills.length, color: 'text-blue-600 dark:text-blue-400', sub: 'Tenants can see' },
              { label: 'Submitted', value: submittedBills.length, color: 'text-amber-600 dark:text-amber-400', sub: 'Pending review' },
              { label: 'Paid', value: paidBills.length, color: 'text-emerald-600 dark:text-emerald-400', sub: 'Completed' },
            ].map((card) => (
              <div key={card.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">Automated Monthly Billing Assist</p>
                <p className="text-xs text-slate-400 mt-1">
                  Preview which tenant records are bill-ready for a billing month, then generate only the ready ones.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="month"
                  value={assistMonth}
                  onChange={(e) => setAssistMonth(e.target.value)}
                  className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 transition-all"
                />
                <button
                  onClick={handleAssistPreview}
                  disabled={!assistMonth || assistLoading}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-50 transition-all"
                >
                  {assistLoading ? 'Checking...' : 'Preview Readiness'}
                </button>
                <button
                  onClick={handleGenerateReady}
                  disabled={!assistMonth || saving || assistLoading || !assistPreview?.readyTenantIds?.length || assistPreview?.locked}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Generate Ready Only
                </button>
              </div>
            </div>

            {assistPreview?.billingMonth === assistMonth && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Checked', value: assistPreview.summary.total, cls: 'text-slate-700 dark:text-slate-200' },
                    { label: 'Ready', value: assistPreview.summary.ready, cls: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Already Billed', value: assistPreview.summary.alreadyBilled, cls: 'text-blue-600 dark:text-blue-400' },
                    { label: 'Blocked', value: assistPreview.summary.blocked, cls: 'text-amber-600 dark:text-amber-400' },
                  ].map((card) => (
                    <div key={card.label} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{card.label}</p>
                      <p className={`text-2xl font-bold ${card.cls}`}>{card.value}</p>
                    </div>
                  ))}
                </div>

                {assistPreview.locked && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
                    {assistMonth} is locked. {assistPreview?.lock?.reason ? `Reason: ${assistPreview.lock.reason}` : 'Unlock the billing period first before generating ready bills.'}
                  </div>
                )}

                <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-sm" style={{ minWidth: '760px' }}>
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        {['Tenant', 'Unit', 'Readiness', 'Billable Usage', 'Previous Balance', 'Estimated Total', 'Notes'].map((header) => (
                          <th key={header} className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {assistPreview.rows.map((row) => (
                        <tr key={`${row.tenantId}-${row.status}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{row.tenantName}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.unitLabel}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${row.ready ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : row.status === 'already_billed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                              {row.ready ? 'Ready' : row.status === 'already_billed' ? 'Already Billed' : 'Blocked'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">PHP {row.billableTotal.toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">PHP {row.previousBalance.toLocaleString()}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">PHP {row.estimatedTotal.toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{row.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">Penalty / Surcharge Assist</p>
                <p className="text-xs text-slate-400 mt-1">
                  Review overdue bills eligible for late fees based on the current super admin rule, then apply them in one run.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date"
                  value={penaltyAsOf}
                  onChange={(e) => setPenaltyAsOf(e.target.value)}
                  className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-amber-400 transition-all"
                />
                <button
                  onClick={handlePenaltyPreview}
                  disabled={penaltyPreviewLoading}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-50 transition-all"
                >
                  {penaltyPreviewLoading ? 'Checking...' : 'Preview Penalties'}
                </button>
                <button
                  onClick={handleApplyPenalties}
                  disabled={
                    !penaltyRule?.isEnabled ||
                    penaltyPreviewLoading ||
                    !penaltyPreview?.summary?.eligible
                  }
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Apply Due Penalties
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
              {penaltyRule?.isEnabled ? (
                <>
                  Active rule: <span className="font-semibold">{penaltyRule.penaltyType === 'fixed' ? `PHP ${Number(penaltyRule.penaltyValue || 0).toFixed(2)}` : `${Number(penaltyRule.penaltyValue || 0).toFixed(2)}%`}</span>
                  {' '}after <span className="font-semibold">{penaltyRule.graceDays}</span> grace day(s).
                </>
              ) : (
                <>Penalty rules are disabled in Super Admin Billing Rates, so no surcharge can be applied yet.</>
              )}
            </div>

            {penaltyPreview && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Bills Checked', value: penaltyPreview.summary.checked, cls: 'text-slate-700 dark:text-slate-200' },
                    { label: 'Eligible', value: penaltyPreview.summary.eligible, cls: 'text-amber-600 dark:text-amber-400' },
                    { label: 'Already Penalized', value: penaltyPreview.summary.already_penalized, cls: 'text-blue-600 dark:text-blue-400' },
                    { label: 'Not Yet Due', value: penaltyPreview.summary.not_due, cls: 'text-slate-500 dark:text-slate-300' },
                  ].map((card) => (
                    <div key={card.label} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{card.label}</p>
                      <p className={`text-2xl font-bold ${card.cls}`}>{card.value}</p>
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-sm" style={{ minWidth: '780px' }}>
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        {['Tenant', 'Unit', 'Bill Month', 'Due Date', 'Outstanding', 'Penalty', 'Status', 'Notes'].map((header) => (
                          <th key={header} className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {penaltyPreview.rows.map((row) => (
                        <tr key={row.bill_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{row.tenant_name}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.unit_label}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.billing_month}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.due_date || '-'}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">PHP {Number(row.outstanding_amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">PHP {Number(row.penalty_amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${row.eligible ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : row.status === 'already_penalized' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                              {row.eligible ? 'Eligible' : row.status === 'already_penalized' ? 'Applied' : 'Skipped'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{row.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <BillingPeriodLockPanel
            scope="finance"
            title="Finance Billing Period Lock"
            description="Freeze finalized months before collections and audits so bill actions cannot be changed accidentally."
          />

          <RateConfigCard rates={rates} />

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={manageSearch}
                onChange={(e) => setManageSearch(e.target.value)}
                placeholder="Search tenant, unit, or bill ID..."
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all"
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
              {STATUS_TABS.map(({ k, l }) => (
                <button
                  key={k}
                  onClick={() => setManageStatus(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap ${manageStatus === k ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{manageFiltered.length} bills</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Invoice', 'Tenant', 'Unit', 'Month', 'Amount', 'Due Date', 'Status', 'Actions'].map((header) => (
                      <th key={header} className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {manageFiltered.length === 0 ? (
                    <tr><td colSpan={8}><EmptyState title="No bills found" message="Generate a new bill to get started." /></td></tr>
                  ) : manageFiltered.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{bill.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{bill.tenant}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{bill.unit}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.month}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">PHP {bill.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">{bill.dueDate}</td>
                      <td className="px-4 py-3"><BillStatusBadge status={bill.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {bill.status === 'draft' && (
                            <button
                              onClick={() => handlePublish(bill.id)}
                              disabled={saving}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all whitespace-nowrap"
                            >
                              <Send className="w-3 h-3" /> Publish
                            </button>
                          )}
                          {['draft', 'published'].includes(bill.status) && (
                            <button
                              onClick={() => openEdit(bill)}
                              disabled={saving}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all"
                            >
                              <Edit2 className="w-3 h-3" /> Regenerate
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
                          {['draft', 'published'].includes(bill.status) && (
                            <button
                              onClick={() => handleDelete(bill.id)}
                              disabled={saving}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"
                              title="Delete"
                            >
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

      {activeTab === 'all-bills' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Bills', value: bills.length, color: 'text-slate-800 dark:text-white', sub: 'All time' },
              { label: 'Collected', value: `PHP ${totalRevenue.toLocaleString()}`, color: 'text-emerald-600 dark:text-emerald-400', sub: `${paidBills.length} paid` },
              { label: 'Published', value: publishedBills.length, color: 'text-blue-600 dark:text-blue-400', sub: 'Awaiting tenant payment' },
              { label: 'Pending', value: submittedBills.length, color: 'text-amber-600 dark:text-amber-400', sub: 'Awaiting confirmation' },
            ].map((card) => (
              <div key={card.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-md">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-md flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={allSearch}
                onChange={(e) => setAllSearch(e.target.value)}
                placeholder="Search tenant, unit, or bill ID..."
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all"
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
              {STATUS_TABS.map(({ k, l }) => (
                <button
                  key={k}
                  onClick={() => setAllStatus(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${allStatus === k ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <select
              value={allUtility}
              onChange={(e) => setAllUtility(e.target.value)}
              className="px-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 transition-all"
            >
              <option value="all">All Utilities</option>
              <option value="electricity">Electricity</option>
              <option value="water">Water</option>
              <option value="thermal">Thermal</option>
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{allFiltered.length} bills found</p>
              <Filter className="w-4 h-4 text-slate-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Invoice ID', 'Tenant', 'Unit', 'Month', 'Due Date', 'Electricity', 'Water', 'Thermal', 'Total', 'Status', 'Action'].map((header) => (
                      <th key={header} className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allFiltered.length === 0 ? (
                    <tr><td colSpan={11}><EmptyState title="No bills match your filters" message="Try adjusting the search or status filter." /></td></tr>
                  ) : allFiltered.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{bill.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{bill.tenant}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono">{bill.unit}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.month}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.dueDate}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-amber-600 dark:text-amber-400">PHP {Number(bill.breakdown?.electricity || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-cyan-600 dark:text-cyan-400">PHP {Number(bill.breakdown?.water || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-rose-600 dark:text-rose-400">PHP {Number(bill.breakdown?.thermal || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap">PHP {bill.amount.toLocaleString()}</td>
                      <td className="px-4 py-3"><BillStatusBadge status={bill.status} /></td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => detailModal.open(bill)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-all"
                        >
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

      <BillFormModal
        open={formModal.isOpen}
        onClose={formModal.close}
        tenants={tenants}
        initial={editBill}
        onSave={handleSave}
        saving={saving}
        isMonthLocked={isMonthLocked}
        getMonthLock={getMonthLock}
      />

      <BulkBillFormModal
        open={bulkFormModal.isOpen}
        onClose={bulkFormModal.close}
        tenantCount={tenants.length}
        onSave={handleBulkSave}
        saving={saving}
        isMonthLocked={isMonthLocked}
        getMonthLock={getMonthLock}
      />

      {detailModal.isOpen && (
        <BillDetailModal bill={detailModal.selectedItem} onClose={detailModal.close} />
      )}
    </div>
  )
}




