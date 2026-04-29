import { formatPeso } from '@/utils/filterUtils'
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
import {
  TENANT_TIME_RANGE_OPTIONS,
  isDateWithinTenantTimeRange,
  useUnitFilter,
} from '@/context/UnitFilterContext'
import { usePageLoader } from '@/hooks/usePageLoader'
import AnnouncementPanel from '@/components/common/AnnouncementPanel'
import BillViewerModal from '@/components/billing/BillViewerModal'
import ReceiptUploadModal from '@/components/billing/ReceiptUploadModal'
import BillStatusBadge from '@/components/billing/BillStatusBadge'
import UnitFilterBar from '@/components/common/UnitFilterBar'
import UtilityCard from '@/components/common/UtilityCard'
import TenantUtilityRates from '@/pages/tenant/UtilityRates'
import SummaryCardStrip from '@/components/dashboard/SummaryCardStrip'
import { useBills } from '@/components/billing/hooks/useBills'
import { useTenantDashboardData } from '@/hooks/tenantHooks/useTenantDashboardData'
import useTenantRates from '@/hooks/tenantHooks/useTenantRates'
import { LoadingValue, TableLoadingRow, UpdatingBadge } from '@/components/common/InlineLoadingState'


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

function getBillTimelineDate(bill) {
  const raw = bill?.raw ?? {}
  const value = raw?.billing_end || raw?.due_date || raw?.created_at || bill?.dueDate || null
  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
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

function getRateValue(billingRates, type) {
  if (!billingRates) return 0
  if (type === 'electricity') return Number(billingRates?.electricity?.rate ?? billingRates?.electric?.rate ?? 0)
  if (type === 'water') return Number(billingRates?.water?.rate ?? 0)
  if (type === 'thermal') return Number(billingRates?.thermal?.rate ?? 0)
  return 0
}

function getUtilityKey(value) {
  const type = String(value || '').toLowerCase()
  if (type.includes('electric') || type.includes('power')) return 'electricity'
  if (type.includes('water')) return 'water'
  if (type.includes('thermal') || type.includes('btu')) return 'thermal'
  return null
}

function getBillUtilityMetrics(bill, billingRates) {
  const metrics = {
    electricity: { usage: 0, amount: 0 },
    water: { usage: 0, amount: 0 },
    thermal: { usage: 0, amount: 0 },
  }

  if (!bill) return metrics

  const raw = bill?.raw || {}
  const items = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.bill_items)
      ? raw.bill_items
      : Array.isArray(bill?.items)
        ? bill.items
        : []

  if (items.length > 0) {
    items.forEach((item) => {
      const key = getUtilityKey(
        item?.rate?.type ||
        item?.meter?.type ||
        item?.utility_type ||
        item?.type ||
        item?.name,
      )
      if (!key) return

      const explicitRate = Number(
        item?.rate?.price_per_unit ??
        item?.rate_value ??
        item?.rate_amount ??
        item?.unit_price ??
        0,
      )
      const currentRate = getRateValue(billingRates, key)
      const appliedRate = explicitRate > 0 ? explicitRate : currentRate
      const amount = Number(item?.amount ?? item?.total ?? item?.charge_amount ?? 0)
      const explicitUsage = Number(item?.consumption ?? item?.usage ?? item?.quantity ?? 0)
      const usage = explicitUsage > 0
        ? explicitUsage
        : appliedRate > 0 && amount > 0
          ? amount / appliedRate
          : 0

      metrics[key].usage += usage
      metrics[key].amount += amount > 0 ? amount : usage * appliedRate
    })

    return metrics
  }

  const breakdown = getBreakdownTotals(bill)
  ;[
    ['electricity', breakdown.electricity],
    ['water', breakdown.water],
    ['thermal', breakdown.thermal],
  ].forEach(([key, amount]) => {
    const numericAmount = Number(amount || 0)
    const currentRate = getRateValue(billingRates, key)
    metrics[key].amount += numericAmount
    metrics[key].usage += currentRate > 0 ? numericAmount / currentRate : 0
  })

  return metrics
}

function average(values = []) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length
}

function computeTrendFromValues(values = []) {
  if (!Array.isArray(values) || values.length < 2) return 0
  const last = Number(values[values.length - 1] || 0)
  const prev = Number(values[values.length - 2] || 0)

  if (prev === 0) {
    if (last === 0) return 0
    return 100
  }

  return Number((((last - prev) / prev) * 100).toFixed(1))
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
  const { selectedUnit, selectedTimeRange } = useUnitFilter()
  const { rates: billingRates } = useTenantRates()
  const { rawSnapshots, utilities, dailyConsumption } = useTenantDashboardData(selectedUnit)
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

  const rangeBills = useMemo(() => {
    return unitBills.filter((bill) => {
      const billDate = getBillTimelineDate(bill)
      return billDate ? isDateWithinTenantTimeRange(billDate, selectedTimeRange) : false
    })
  }, [selectedTimeRange, unitBills])

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
    return [...rangeBills]
      .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
      .slice(0, 7)
  }, [rangeBills])

  const currentBill = useMemo(() => {
    return unitBills.find((bill) => bill.status === 'published') || unitBills[0] || null
  }, [unitBills])

  const selectedSummary = useMemo(() => {
    if (utilities) {
      return {
        electric: { consumption: Number(utilities.electric?.consumption || 0), unit: utilities.electric?.unit || 'kWh' },
        water: { consumption: Number(utilities.water?.consumption || 0), unit: utilities.water?.unit || 'm3' },
        thermal: { consumption: Number(utilities.thermal?.consumption || 0), unit: utilities.thermal?.unit || 'kBTU' },
      }
    }

    return rangeBills.reduce((acc, bill) => {
      const metrics = getBillUtilityMetrics(bill, billingRates)
      acc.electric.consumption += metrics.electricity.usage
      acc.water.consumption += metrics.water.usage
      acc.thermal.consumption += metrics.thermal.usage
      return acc
    }, {
      electric: { consumption: 0, unit: 'kWh' },
      water: { consumption: 0, unit: 'm3' },
      thermal: { consumption: 0, unit: 'kBTU' },
    })
  }, [billingRates, rangeBills, utilities])

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
    const history = [...rangeBills]
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

    const totals = history.map((bill) => getBillUtilityMetrics(bill, billingRates))

    return {
      nextBill: Number(average(history.map((bill) => bill.amount)).toFixed(2)),
      nextElectric: Number(average(totals.map((row) => row.electricity.usage)).toFixed(2)),
      nextWater: Number(average(totals.map((row) => row.water.usage)).toFixed(2)),
      nextThermal: Number(average(totals.map((row) => row.thermal.usage)).toFixed(2)),
    }
  }, [billingRates, rangeBills])

  const liveSnapshotSummary = useMemo(() => {
    const current = rawSnapshots?.current || {}
    const snapshots = [
      current.electric?.captured_at,
      current.water?.captured_at,
      current.thermal?.captured_at,
    ].filter(Boolean)

    if (!rawSnapshots?.available || snapshots.length === 0) {
      return null
    }

    const latest = [...snapshots].sort().at(-1)
    const formattedLatest = latest ? formatReadableDate(latest) : 'recently'
    return rawSnapshots?.message || `Live meter snapshots updated ${formattedLatest}.`
  }, [rawSnapshots])

  const electric = selectedSummary?.electric || {}
  const water = selectedSummary?.water || {}
  const thermal = selectedSummary?.thermal || {}
  const todayConsumption = useMemo(() => {
    if (!dailyConsumption) return null
    const today = new Date().toISOString().split('T')[0]
    return {
      electric: dailyConsumption.electric?.find(d => d.date === today) || null,
      water: dailyConsumption.water?.find(d => d.date === today) || null,
      thermal: dailyConsumption.thermal?.find(d => d.date === today) || null,
    }
  }, [dailyConsumption])

  const unitLabel = selectedUnit === 'all'
    ? tenantUnits.length > 1
      ? 'All Assigned Units'
      : tenantUnits[0]
        ? `Unit ${tenantUnits[0]}`
        : 'Assigned Unit'
    : `Unit ${selectedUnit}`
  const selectedRangeLabel =
    TENANT_TIME_RANGE_OPTIONS.find((option) => option.value === selectedTimeRange)?.label || '1M'

  const stats = [
    {
      label: 'Today\'s Electric Usage',
      value: todayConsumption?.electric
        ? `${Number(todayConsumption.electric.consumption || 0).toLocaleString()} ${todayConsumption.electric.unit || 'kWh'}`
        : (Number(electric.consumption || 0).toLocaleString() + ` ${electric.unit || 'kWh'}`),
      sub: todayConsumption?.electric
        ? `Today · ${formatPeso(todayConsumption.electric.cost || 0)}`
        : `${selectedRangeLabel} consumption`,
      icon: Zap,
      grad: 'from-amber-500 to-amber-600',
      glow: 'shadow-amber-500/20',
    },
    {
      label: 'Today\'s Water Usage',
      value: todayConsumption?.water
        ? `${Number(todayConsumption.water.consumption || 0).toLocaleString()} ${todayConsumption.water.unit || 'm3'}`
        : (Number(water.consumption || 0).toLocaleString() + ` ${water.unit || 'm3'}`),
      sub: todayConsumption?.water
        ? `Today · ${formatPeso(todayConsumption.water.cost || 0)}`
        : `${selectedRangeLabel} consumption`,
      icon: Droplets,
      grad: 'from-cyan-500 to-cyan-600',
      glow: 'shadow-cyan-500/20',
    },
    {
      label: 'Today\'s Thermal Usage',
      value: todayConsumption?.thermal
        ? `${Number(todayConsumption.thermal.consumption || 0).toLocaleString()} ${todayConsumption.thermal.unit || 'kBTU'}`
        : (Number(thermal.consumption || 0).toLocaleString() + ` ${thermal.unit || 'kBTU'}`),
      sub: todayConsumption?.thermal
        ? `Today · ${formatPeso(todayConsumption.thermal.cost || 0)}`
        : `${selectedRangeLabel} consumption`,
      icon: Flame,
      grad: 'from-rose-500 to-rose-600',
      glow: 'shadow-rose-500/20',
    },
    {
      label: 'Current Bill',
      value: currentBillValue > 0 ? formatPeso(currentBillValue) : 'No current bill',
      sub: currentDueLabel ? `Due ${currentDueLabel}` : 'No published bill yet',
      icon: Receipt,
      grad: 'from-blue-500 to-blue-600',
      glow: 'shadow-blue-500/20',
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

  const utilityMeters = useMemo(() => {
    const buildMeter = (type, summary, rates, bills, computeTrend) => ({
      usage: Number(summary.consumption || 0),
      unit: summary.unit || (type === 'electric' ? 'kWh' : type === 'water' ? 'm3' : 'kBTU'),
      estimatedCost: utilities
        ? Number(utilities[type]?.cost || 0)
        : Number((Number(summary.consumption || 0) * getRateValue(rates, type === 'electric' ? 'electricity' : type)).toFixed(2)),
      trend: computeTrend(bills.map((bill) => Number(getBillUtilityMetrics(bill, rates)[type === 'electric' ? 'electricity' : type].usage || 0))),
    })

    return {
      electric: buildMeter('electric', electric, billingRates, rangeBills, computeTrendFromValues),
      water: buildMeter('water', water, billingRates, rangeBills, computeTrendFromValues),
      thermal: buildMeter('thermal', thermal, billingRates, rangeBills, computeTrendFromValues),
    }
  }, [electric, water, thermal, billingRates, rangeBills, utilities])
  const isInitialLoading = (pageLoading || billsLoading) && bills.length === 0
  const isRefreshing = !isInitialLoading && billsLoading

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
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0] || 'Tenant'}</h1>
          <p className="muted-text mt-0.5">
          {user?.tenant?.unit?.building_name || user?.company || 'Your account'} · Here&apos;s your billing summary · {unitLabel}
          </p>
        </div>
        <UpdatingBadge show={isRefreshing} />
      </div>

      <UnitFilterBar showTimeRange />

      {liveSnapshotSummary ? (
        <div className="rounded-2xl border border-cyan-200/70 bg-cyan-50/80 px-4 py-3 text-sm text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/20 dark:text-cyan-200">
          {liveSnapshotSummary}
        </div>
      ) : null}


      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <UtilityCard type="electric" {...utilityMeters.electric} loading={isInitialLoading} updating={isRefreshing} />
        <UtilityCard type="thermal" {...utilityMeters.thermal} loading={isInitialLoading} updating={isRefreshing} />
        <UtilityCard type="water" {...utilityMeters.water} loading={isInitialLoading} updating={isRefreshing} />
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
          loading: isInitialLoading,
          updating: isRefreshing,
        }))}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Predicted Next Bill',
            value: prediction.nextBill > 0 ? formatPeso(prediction.nextBill) : '-',
            sub: `Estimate based on ${selectedRangeLabel.toLowerCase()} ${unitLabel.toLowerCase()} bills`,
            icon: Receipt,
            tone: 'from-violet-500 to-indigo-600',
          },
          {
            label: 'Expected Next Electric Usage',
            value: `${prediction.nextElectric.toLocaleString()} kWh`,
            sub: `Average billed electric use across ${selectedRangeLabel.toLowerCase()}`,
            icon: Zap,
            tone: 'from-amber-500 to-orange-600',
          },
          {
            label: "Expected Next Month's Water",
            value: `${prediction.nextWater.toLocaleString()} m3`,
            sub: `Average billed water use across ${selectedRangeLabel.toLowerCase()}`,
            icon: Droplets,
            tone: 'from-cyan-500 to-blue-600',
          },
          {
            label: 'Expected Next Thermal Usage',
            value: `${prediction.nextThermal.toLocaleString()} kBTU`,
            sub: `Average billed thermal use across ${selectedRangeLabel.toLowerCase()}`,
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
                  <LoadingValue
                    loading={isInitialLoading}
                    updating={isRefreshing}
                    value={item.value}
                    className="mt-2 text-2xl font-bold text-slate-800 dark:text-white"
                    spinnerClassName="h-5 w-5 text-slate-400"
                  />
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
            <p className="mt-0.5 text-xs text-slate-400">{unitLabel} billing history · {selectedRangeLabel}</p>
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
                {isInitialLoading ? (
                  <TableLoadingRow colSpan={6} />
                ) : recentBills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                      No recent bills found for {selectedRangeLabel}.
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
