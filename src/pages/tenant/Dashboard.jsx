import { useMemo, useState } from 'react'
import {
  Zap,
  Droplets,
  Flame,
  Receipt,
  CalendarClock,
  Upload,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { useUnitFilter } from '@/context/UnitFilterContext'
import { usePageLoader } from '@/hooks/usePageLoader'
import { TenantDashboardSkeleton } from '@/components/skeletons'
import AnnouncementPanel from '@/components/common/AnnouncementPanel'
import BillViewerModal from '@/components/billing/BillViewerModal'
import ReceiptUploadModal from '@/components/billing/ReceiptUploadModal'
import BillStatusBadge from '@/components/billing/BillStatusBadge'
import UnitFilterBar from '@/components/common/UnitFilterBar'
import TenantUtilityRates from '@/pages/tenant/UtilityRates'
import DashboardCard from '@/components/ui/DashboardCard'
import { useBills } from '@/components/billing/hooks/useBills'
import useTenantDashboard from '@/hooks/tenantHooks/useTenantDashboard'

function formatPeso(value) {
  const amount = Number(value || 0)
  return `₱${amount.toLocaleString()}`
}

function formatReadableDate(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function getVisibleBills(rows = []) {
  const visible = ['published', 'submitted', 'paid', 'overdue']
  return rows.filter((bill) => visible.includes(bill.status))
}

function getBillingPeriod(bill) {
  const raw = bill?.raw ?? {}

  if (raw?.billing_start && raw?.billing_end) {
    return `${formatReadableDate(raw.billing_start)} to ${formatReadableDate(raw.billing_end)}`
  }

  if (raw?.billing_end) {
    return formatReadableDate(raw.billing_end)
  }

  return bill?.billingPeriod || bill?.dueDate || '—'
}

function getBillForViewer(bill) {
  if (!bill) return null

  return {
    ...(bill.raw || {}),
    ...bill,
    unit:
      bill?.raw?.unit ||
      bill?.unit ||
      '—',
    amount: Number(bill?.amount || 0),
    due_date: bill?.raw?.due_date || bill?.dueDate,
    dueDate: bill?.dueDate,
    billing_month: bill?.raw?.billing_month || bill?.month,
    items: bill?.raw?.items || bill?.raw?.bill_items || [],
    breakdown: bill?.breakdown || {},
  }
}

export default function TenantDashboard() {
  const pageLoading = usePageLoader(700)
  const { user } = useAuth()
  const { addToast } = useApp()
  const { selectedUnit } = useUnitFilter()
  const { dashboard, loading: dashboardLoading, error: dashboardError } = useTenantDashboard()
  const {
    bills,
    loading: billsLoading,
    submitPaymentReceipt,
  } = useBills()

  const [viewBill, setViewBill] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [payBill, setPayBill] = useState(null)
  const [payModalOpen, setPayModalOpen] = useState(false)

  const visibleBills = useMemo(() => getVisibleBills(bills), [bills])

  const unitBills = useMemo(() => {
    if (selectedUnit === 'all') return visibleBills
    return visibleBills.filter((bill) => String(bill.unit) === String(selectedUnit))
  }, [selectedUnit, visibleBills])

  const recentBills = useMemo(() => {
    return [...unitBills]
      .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
      .slice(0, 7)
  }, [unitBills])

  const currentBill = useMemo(() => {
    return unitBills.find((bill) => bill.status === 'published') || unitBills[0] || null
  }, [unitBills])

  if (pageLoading || dashboardLoading || billsLoading) {
    return <TenantDashboardSkeleton />
  }

  const utilitySummary = dashboard?.utilities || {}
  const electric = utilitySummary?.electric || {}
  const water = utilitySummary?.water || {}
  const thermal = utilitySummary?.thermal || {}

  const unitLabel = selectedUnit === 'all' ? 'All Units' : `Unit ${selectedUnit}`

  const stats = [
    {
      label: 'Current Bill',
      value: currentBill ? formatPeso(currentBill.amount) : '—',
      sub: currentBill ? `Due ${currentBill.dueDate}` : '',
      icon: Receipt,
      grad: 'from-blue-500 to-blue-600',
      glow: 'shadow-blue-500/20',
    },
    {
      label: 'Electricity',
      value: `${Number(electric.consumption || 0).toLocaleString()} ${electric.unit || 'kWh'}`,
      sub: 'This billing period',
      icon: Zap,
      grad: 'from-amber-500 to-amber-600',
      glow: 'shadow-amber-500/20',
    },
    {
      label: 'Water',
      value: `${Number(water.consumption || 0).toLocaleString()} ${water.unit || 'm³'}`,
      sub: 'This billing period',
      icon: Droplets,
      grad: 'from-cyan-500 to-cyan-600',
      glow: 'shadow-cyan-500/20',
    },
    {
      label: 'Thermal',
      value: `${Number(thermal.consumption || 0).toLocaleString()} ${thermal.unit || 'BTU'}`,
      sub: 'This billing period',
      icon: Flame,
      grad: 'from-rose-500 to-rose-600',
      glow: 'shadow-rose-500/20',
    },
    {
      label: 'Due Date',
      value: currentBill?.dueDate || '—',
      sub: currentBill?.status === 'published' ? 'Payment due' : 'Latest bill status',
      icon: CalendarClock,
      grad: 'from-indigo-500 to-indigo-600',
      glow: 'shadow-indigo-500/20',
    },
  ]

  const openBill = (bill) => {
    setViewBill(getBillForViewer(bill))
    setModalOpen(true)
  }

  const openPayModal = (bill) => {
    setPayBill(bill)
    setPayModalOpen(true)
  }

  const handleReceiptSubmit = async (billId, receiptData) => {
    try {
      await submitPaymentReceipt(billId, {
        amount: payBill?.amount ?? 0,
        payment_method: 'bank_transfer',
        reference_no: receiptData.referenceNumber,
        notes: receiptData.note,
        proof_image: receiptData.proofImageFile,
      })
      addToast('Payment receipt submitted! Awaiting Finance review.', 'success')
      setPayModalOpen(false)
      setPayBill(null)
    } catch (err) {
      addToast(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to submit payment receipt.',
        'error'
      )
    }
  }

  return (
    <div className="section-gap animate-in">
      <div>
        <h1 className="page-title">
          Welcome back, {user?.name?.split(' ')[0] || 'Tenant'}
        </h1>
        <p className="muted-text mt-0.5">
          {user?.tenant?.unit?.building_name || user?.company || 'Your account'} · Here's your billing summary · {unitLabel}
        </p>
      </div>

      {dashboardError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {dashboardError}
        </div>
      )}

      <UnitFilterBar />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((item, index) => (
          <DashboardCard
            key={item.label}
            icon={item.icon}
            title={item.label}
            value={item.value}
            sub={item.sub}
            gradient={item.grad}
            glow={item.glow}
            className={`stagger-${index + 1} animate-in`}
          />
        ))}
      </div>

      <TenantUtilityRates />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-700/50 shadow-md">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">
              My Recent Bills
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{unitLabel} billing history</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '480px' }}>
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40">
                  {['Unit', 'Month', 'Period', 'Amount', 'Status', ''].map((col) => (
                    <th
                      key={col}
                      className="text-left text-[10px] font-mono uppercase tracking-wider text-slate-400 px-4 py-3 whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                      No recent bills found.
                    </td>
                  </tr>
                ) : (
                  recentBills.map((bill) => (
                    <tr
                      key={bill.id}
                      className="border-b border-slate-100 dark:border-slate-700/30 last:border-0 table-row-hover"
                    >
                      <td className="px-4 py-3.5 text-xs font-mono text-blue-600 dark:text-blue-400">
                        {bill.unit}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-white whitespace-nowrap">
                        {bill.month}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {getBillingPeriod(bill)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-white whitespace-nowrap">
                        {formatPeso(bill.amount)}
                      </td>
                      <td className="px-4 py-3.5">
                        <BillStatusBadge status={bill.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openBill(bill)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="View Bill"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                          {bill.status === 'published' && (
                            <button
                              onClick={() => openPayModal(bill)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-all"
                              title="Upload Receipt"
                            >
                              <Upload className="w-3 h-3" /> Pay
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
        </div>

        <div className="lg:col-span-2">
          <AnnouncementPanel />
        </div>
      </div>

      <BillViewerModal
        bill={viewBill}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
      <ReceiptUploadModal
        bill={payBill}
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        onSubmit={handleReceiptSubmit}
      />
    </div>
  )
}
