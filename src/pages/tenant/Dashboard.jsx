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
import UtilityCard from '@/components/common/UtilityCard'
import TenantUtilityRates from '@/pages/tenant/UtilityRates'
import SummaryCardStrip from '@/components/dashboard/SummaryCardStrip'
import { useBills } from '@/components/billing/hooks/useBills'

function formatPeso(value) {
  const amount = Number(value || 0)
  return `PHP ${amount.toLocaleString()}`
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

function getBreakdownTotals(bill) {
  if (!bill) {
    return { electricity: 0, water: 0, thermal: 0 }
  }

  const breakdown = bill.breakdown || {}

  return {
    electricity: Number(breakdown.electricity ?? breakdown.electric ?? 0),
    water: Number(breakdown.water ?? 0),
    thermal: Number(breakdown.thermal ?? 0),
  }
}

function average(values = []) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length
}

function getBillingPeriod(bill) {
  const raw = bill?.raw ?? {}

  if (raw?.billing_start && raw?.billing_end) {
    return `${formatReadableDate(raw.billing_start)} to ${formatReadableDate(raw.billing_end)}`
  }

  if (raw?.billing_end) {
    return formatReadableDate(raw.billing_end)
  }

  return bill?.billingPeriod || bill?.dueDate || 'No billing period yet'
}

function getBillForViewer(bill) {
  if (!bill) return null

  return {
    ...(bill.raw || {}),
    ...bill,
    unit:
      bill?.raw?.unit ||
      bill?.unit ||
      'No unit assigned',
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
  const {
    bills,
    loading: billsLoading,
    submitPaymentReceipt,
  } = useBills()

  const [viewBill, setViewBill] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [payBill, setPayBill] = useState(null)
  const [payModalOpen, setPayModalOpen] = useState(false)

  const tenantUnits = useMemo(() => {
    return Array.from(
      new Set(
        (Array.isArray(user?.tenants) ? user.tenants : [user?.tenant])
          .filter(Boolean)
          .map((tenant) => tenant?.unit?.unit_number || tenant?.unit?.name || '')
          .filter(Boolean),
      ),
    )
  }, [user])

  const visibleBills = useMemo(() => getVisibleBills(bills), [bills])

  const unitBills = useMemo(() => {
    if (selectedUnit === 'all') {
      return tenantUnits.length > 0
        ? visibleBills.filter((bill) => tenantUnits.includes(String(bill.unit)))
        : visibleBills
    }

    return visibleBills.filter((bill) => String(bill.unit) === String(selectedUnit))
  }, [selectedUnit, tenantUnits, visibleBills])

  const latestBillsByUnit = useMemo(() => {
    const seen = new Set()

    return unitBills.filter((bill) => {
      const key = String(bill.unit || '')
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [unitBills])

  const recentBills = useMemo(() => {
    return [...unitBills]
      .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
      .slice(0, 7)
  }, [unitBills])

  const currentBill = useMemo(() => {
    return unitBills.find((bill) => bill.status === 'published') || unitBills[0] || null
  }, [unitBills])

  const selectedSummary = useMemo(() => {
    const sourceBills = selectedUnit === 'all' ? latestBillsByUnit : currentBill ? [currentBill] : []

    return sourceBills.reduce((acc, bill) => {
      const totals = getBreakdownTotals(bill)
      acc.electric.consumption += totals.electricity
      acc.water.consumption += totals.water
      acc.thermal.consumption += totals.thermal
      return acc
    }, {
      electric: { consumption: 0, unit: 'kWh' },
      water: { consumption: 0, unit: 'm3' },
      thermal: { consumption: 0, unit: 'kBTU' },
    })
  }, [currentBill, latestBillsByUnit, selectedUnit])

  const currentBillValue = useMemo(() => {
    if (selectedUnit === 'all') {
      return latestBillsByUnit.reduce((sum, bill) => sum + Number(bill.amount || 0), 0)
    }

    return Number(currentBill?.amount || 0)
  }, [currentBill, latestBillsByUnit, selectedUnit])

  const currentDueLabel = useMemo(() => {
    if (selectedUnit !== 'all') {
      return currentBill?.dueDate || ''
    }

    const dueDates = latestBillsByUnit
      .map((bill) => bill?.dueDate)
      .filter(Boolean)

    return dueDates[0] || ''
  }, [currentBill, latestBillsByUnit, selectedUnit])

  const prediction = useMemo(() => {
    const history = [...unitBills]
      .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
      .slice(0, 3)

    if (history.length === 0) {
      return {
        nextBill: 0,
        nextElectric: 0,
        nextWater: 0,
        nextThermal: 0,
      }
    }

    const totals = history.map((bill) => getBreakdownTotals(bill))

    return {
      nextBill: Number(average(history.map((bill) => bill.amount)).toFixed(2)),
      nextElectric: Number(average(totals.map((row) => row.electricity)).toFixed(2)),
      nextWater: Number(average(totals.map((row) => row.water)).toFixed(2)),
      nextThermal: Number(average(totals.map((row) => row.thermal)).toFixed(2)),
    }
  }, [unitBills])

  if ((pageLoading && bills.length === 0) || (billsLoading && bills.length === 0)) {
    return <TenantDashboardSkeleton />
  }

  const electric = selectedSummary?.electric || {}
  const water = selectedSummary?.water || {}
  const thermal = selectedSummary?.thermal || {}

  const unitLabel = selectedUnit === 'all'
    ? tenantUnits.length > 1
      ? 'All Assigned Units'
      : tenantUnits[0]
        ? `Unit ${tenantUnits[0]}`
        : 'Assigned Unit'
    : `Unit ${selectedUnit}`

  const stats = [
    {
      label: 'Current Bill',
      value: currentBillValue > 0 ? formatPeso(currentBillValue) : 'No current bill',
      sub: currentDueLabel ? `Due ${currentDueLabel}` : 'No published bill yet',
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
      value: `${Number(water.consumption || 0).toLocaleString()} ${water.unit || 'm3'}`,
      sub: 'This billing period',
      icon: Droplets,
      grad: 'from-cyan-500 to-cyan-600',
      glow: 'shadow-cyan-500/20',
    },
    {
      label: 'Thermal',
      value: `${Number(thermal.consumption || 0).toLocaleString()} ${thermal.unit || 'kBTU'}`,
      sub: 'This billing period',
      icon: Flame,
      grad: 'from-rose-500 to-rose-600',
      glow: 'shadow-rose-500/20',
    },
    {
      label: 'Due Date',
      value: currentBill?.dueDate || 'No due date yet',
      sub: currentBill?.status === 'published' ? 'Payment due' : 'Latest bill status',
      icon: CalendarClock,
      grad: 'from-indigo-500 to-indigo-600',
      glow: 'shadow-indigo-500/20',
    },
  ]

  const utilityMeters = {
    electric: {
      usage: Number(electric.consumption || 0),
      unit: electric.unit || 'kWh',
      estimatedCost: Number(currentBill?.breakdown?.electricity ?? 0),
      trend: prediction.nextElectric > Number(electric.consumption || 0) ? 4.1 : -2.4,
    },
    water: {
      usage: Number(water.consumption || 0),
      unit: water.unit || 'm3',
      estimatedCost: Number(currentBill?.breakdown?.water ?? 0),
      trend: prediction.nextWater > Number(water.consumption || 0) ? 2.8 : -1.9,
    },
    thermal: {
      usage: Number(thermal.consumption || 0),
      unit: thermal.unit || 'BTU',
      estimatedCost: Number(currentBill?.breakdown?.thermal ?? 0),
      trend: prediction.nextThermal > Number(thermal.consumption || 0) ? 3.5 : -1.4,
    },
  }

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
        'error',
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
          {user?.tenant?.unit?.building_name || user?.company || 'Your account'} · Here&apos;s your billing summary · {unitLabel}
        </p>
      </div>

      <UnitFilterBar />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <UtilityCard type="electric" {...utilityMeters.electric} />
        <UtilityCard type="thermal" {...utilityMeters.thermal} />
        <UtilityCard type="water" {...utilityMeters.water} />
      </div>

      <SummaryCardStrip
        stretch
        stretchGridClassName="grid-cols-1 md:grid-cols-2 xl:grid-cols-5"
        cards={stats.map((item) => ({
          label: item.label,
          value: item.value,
          sub: item.sub,
          icon: item.icon,
          gradient: item.grad,
          shadow: item.glow,
        }))}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Predicted Next Bill',
            value: prediction.nextBill > 0 ? formatPeso(prediction.nextBill) : '-',
            sub: `Estimate based on recent ${unitLabel.toLowerCase()} bills`,
            icon: Receipt,
            tone: 'from-violet-500 to-indigo-600',
          },
          {
            label: 'Expected Next Electric Usage',
            value: `${prediction.nextElectric.toLocaleString()} kWh`,
            sub: 'Average recent billed electric consumption',
            icon: Zap,
            tone: 'from-amber-500 to-orange-600',
          },
          {
            label: "Expected Next Month's Water",
            value: `${prediction.nextWater.toLocaleString()} m3`,
            sub: 'Average recent billed water consumption',
            icon: Droplets,
            tone: 'from-cyan-500 to-blue-600',
          },
          {
            label: 'Expected Next Thermal Usage',
            value: `${prediction.nextThermal.toLocaleString()} kBTU`,
            sub: 'Average recent billed thermal consumption',
            icon: Flame,
            tone: 'from-rose-500 to-pink-600',
          },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-md dark:border-slate-700/50 dark:bg-slate-900"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.tone}`} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-white">
                    {item.value}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {item.sub}
                  </p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.tone} shadow-lg`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <TenantUtilityRates />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-md dark:border-slate-700/50 dark:bg-slate-900 lg:col-span-3">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <h2 className="text-[15px] font-semibold text-slate-800 dark:text-white">
              My Recent Bills
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">{unitLabel} billing history</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '480px' }}>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700/60 dark:bg-slate-800/40">
                  {['Unit', 'Month', 'Period', 'Amount', 'Status', ''].map((col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-400"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                      No recent bills found.
                    </td>
                  </tr>
                ) : (
                  recentBills.map((bill) => (
                    <tr
                      key={bill.id}
                      className="table-row-hover border-b border-slate-100 last:border-0 dark:border-slate-700/30"
                    >
                      <td className="px-4 py-3.5 text-xs font-mono text-blue-600 dark:text-blue-400">
                        {bill.unit}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-medium text-slate-800 dark:text-white">
                        {bill.month}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-slate-500">
                        {getBillingPeriod(bill)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-800 dark:text-white">
                        {formatPeso(bill.amount)}
                      </td>
                      <td className="px-4 py-3.5">
                        <BillStatusBadge status={bill.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openBill(bill)}
                            className="rounded-lg p-1.5 text-blue-500 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="View Bill"
                          >
                            <Receipt className="h-4 w-4" />
                          </button>
                          {bill.status === 'published' && (
                            <button
                              onClick={() => openPayModal(bill)}
                              className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-2 py-1 text-xs font-semibold text-white transition-all hover:opacity-90"
                              title="Upload Receipt"
                            >
                              <Upload className="h-3 w-3" /> Pay
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
