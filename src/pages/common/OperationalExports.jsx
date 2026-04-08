import { useMemo, useState } from 'react'
import { CalendarRange, Download, FileSpreadsheet, ShieldCheck, Wrench, Wallet } from 'lucide-react'
import api from '@/lib/api'
import { usePageLoader } from '@/hooks/usePageLoader'
import { ReportsSkeleton } from '@/components/skeletons'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { fetchActivityLogs } from '@/services/activityLogService'
import { downloadCsv } from '@/utils/exportCsv'

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

async function exportActivityLogsCsv(addToast) {
  const res = await fetchActivityLogs({ page: 1, per_page: 500 })
  const rows = [
    ['When', 'User', 'Role', 'Action', 'Description', 'Entity Type', 'Entity ID', 'Method', 'Path', 'IP'],
    ...((Array.isArray(res?.data) ? res.data : []).map((item) => [
      formatDate(item.created_at),
      item.user_name || 'System',
      item.role || '',
      item.action || '',
      item.description || '',
      item.entity_type || '',
      item.entity_id || '',
      item.method || '',
      item.path || '',
      item.ip_address || '',
    ])),
  ]

  downloadCsv('activity-logs.csv', rows)
  addToast('Activity logs exported to CSV')
}

async function exportReconciliationCsv(month, addToast) {
  const res = await api.get('/api/admin/reconciliation', { params: { month } })
  const data = res?.data || {}
  const summaryRows = Object.entries(data.summary || {}).map(([utility, item]) => ([
    'Summary',
    utility,
    item?.status || '',
    item?.main_total || 0,
    item?.submeter_total || 0,
    item?.variance || 0,
    item?.variance_percent || 0,
    item?.unit || '',
  ]))
  const pageRows = (data.page_breakdown || []).map((item) => ([
    'Page Breakdown',
    item.page_name || '',
    item.scope || '',
    item.electricity || 0,
    item.water || 0,
    item.thermal || 0,
    item.unit_labels || '',
    item.meter_count || 0,
  ]))
  downloadCsv(`reconciliation-${month}.csv`, [
    ['Section', 'Label', 'Scope/Status', 'Value 1', 'Value 2', 'Value 3', 'Value 4', 'Value 5'],
    ...summaryRows,
    ...pageRows,
  ])
  addToast('Reconciliation exported to CSV')
}

async function exportOccupancyCsv(month, addToast) {
  const res = await api.get('/api/admin/occupancy-timeline', { params: { month } })
  const data = res?.data || {}
  const rows = [
    ['Section', 'Tenant', 'Email', 'Unit', 'Floor', 'Building', 'Event Type', 'Event Date', 'Move In', 'Move Out', 'Occupied Days', 'Status'],
    ...((data.timeline || []).map((item) => [
      'Timeline',
      item.tenant_name || '',
      item.email || '',
      item.unit_label || '',
      item.floor_label || '',
      item.building_name || '',
      item.event_type || '',
      item.event_date || '',
      item.move_in_date || '',
      item.move_out_date || '',
      item.occupied_days_in_period || 0,
      item.status || '',
    ])),
  ]
  downloadCsv(`occupancy-timeline-${month}.csv`, rows)
  addToast('Occupancy timeline exported to CSV')
}

async function exportFinanceBillsCsv(addToast) {
  const res = await api.get('/api/finance/bills')
  const rows = [
    ['Bill ID', 'Tenant', 'Unit', 'Billing Month', 'Amount', 'Status', 'Due Date', 'Created At'],
    ...((Array.isArray(res?.data?.data) ? res.data.data : []).map((item) => [
      item.id,
      item?.tenant?.name || '',
      item?.unit?.unit_number || '',
      item.billing_month || '',
      item.amount || 0,
      item.status || '',
      item.due_date || '',
      formatDate(item.created_at),
    ])),
  ]
  downloadCsv('finance-bills.csv', rows)
  addToast('Finance bills exported to CSV')
}

async function exportFinancePaymentsCsv(addToast) {
  const res = await api.get('/api/finance/payments')
  const rows = [
    ['Payment ID', 'Bill ID', 'Tenant', 'Amount', 'Status', 'Paid At', 'Verified At', 'Created At'],
    ...((Array.isArray(res?.data?.data) ? res.data.data : []).map((item) => [
      item.id,
      item.bill_id || item?.bill?.id || '',
      item?.tenant?.name || item?.bill?.tenant?.name || '',
      item.amount || 0,
      item.status || '',
      item.paid_at || '',
      item.verified_at || '',
      formatDate(item.created_at),
    ])),
  ]
  downloadCsv('finance-payments.csv', rows)
  addToast('Finance payments exported to CSV')
}

async function exportFacilityReportsCsv(addToast) {
  const res = await api.get('/api/facility/reports')
  const data = res?.data?.data || {}
  const latestRows = Array.isArray(data.latest_meter_readings) ? data.latest_meter_readings : []
  const rows = [
    ['Meter', 'Watch Name', 'Type', 'Page', 'Unit', 'Floor', 'Current Reading', 'Reading Unit', 'Latest Usage', 'Recorded At', 'Approval'],
    ...latestRows.map((item) => [
      item.meter_name || '',
      item.watch_name || '',
      item.type || '',
      item.page_name || '',
      item.unit_label || '',
      item.floor_label || '',
      item.current_reading ?? '',
      item.reading_unit || '',
      item.latest_usage ?? '',
      formatDate(item.recorded_at),
      item.approval_status || '',
    ]),
  ]
  downloadCsv('facility-latest-meter-readings.csv', rows)
  addToast('Facility latest meter readings exported to CSV')
}

function ExportCard({ icon: Icon, title, description, actionLabel, onExport, loading, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[15px] font-700 text-slate-800 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
      </div>

      <button
        onClick={onExport}
        disabled={loading}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Download className="h-4 w-4" />
        {loading ? 'Exporting...' : actionLabel}
      </button>
    </div>
  )
}

export default function OperationalExports() {
  const pageLoading = usePageLoader(200)
  const { user } = useAuth()
  const { addToast } = useApp()
  const [month, setMonth] = useState(currentMonth)
  const [loadingKey, setLoadingKey] = useState('')

  const role = user?.role

  const exportCards = useMemo(() => {
    const cards = [
      {
        key: 'activity_logs',
        roles: ['admin', 'super_admin', 'finance', 'facility_manager'],
        icon: FileSpreadsheet,
        title: 'Activity Logs',
        description: 'Export the latest recorded user actions, approvals, and audit activity for review.',
        actionLabel: 'Export Activity Logs',
        accent: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        handler: () => exportActivityLogsCsv(addToast),
      },
      {
        key: 'reconciliation',
        roles: ['admin', 'super_admin'],
        icon: ShieldCheck,
        title: 'Reconciliation Report',
        description: 'Download main meter versus submeter totals with variance and page breakdown.',
        actionLabel: 'Export Reconciliation',
        accent: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
        handler: () => exportReconciliationCsv(month, addToast),
      },
      {
        key: 'occupancy',
        roles: ['admin', 'super_admin'],
        icon: CalendarRange,
        title: 'Occupancy Timeline',
        description: 'Export move-ins, move-outs, and active occupancy windows for the selected month.',
        actionLabel: 'Export Occupancy Timeline',
        accent: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300',
        handler: () => exportOccupancyCsv(month, addToast),
      },
      {
        key: 'finance_bills',
        roles: ['finance'],
        icon: Wallet,
        title: 'Finance Bills',
        description: 'Download the current billing ledger for invoice review, aging, and client handoff.',
        actionLabel: 'Export Bills',
        accent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
        handler: () => exportFinanceBillsCsv(addToast),
      },
      {
        key: 'finance_payments',
        roles: ['finance'],
        icon: Wallet,
        title: 'Finance Payments',
        description: 'Export submitted and verified payments for reconciliation and collection tracking.',
        actionLabel: 'Export Payments',
        accent: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
        handler: () => exportFinancePaymentsCsv(addToast),
      },
      {
        key: 'facility_reports',
        roles: ['facility_manager'],
        icon: Wrench,
        title: 'Facility Latest Readings',
        description: 'Download latest meter readings with page, unit, approval state, and usage delta.',
        actionLabel: 'Export Latest Readings',
        accent: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300',
        handler: () => exportFacilityReportsCsv(addToast),
      },
    ]

    return cards.filter((item) => item.roles.includes(role))
  }, [addToast, month, role])

  const handleExport = async (card) => {
    try {
      setLoadingKey(card.key)
      await card.handler()
    } catch (err) {
      addToast(err?.response?.data?.message || err?.message || 'Failed to export report.')
    } finally {
      setLoadingKey('')
    }
  }

  if (pageLoading) return <ReportsSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display font-700 text-xl text-slate-800 dark:text-white">Operational Exports</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            Export audit-ready CSV files for finance, facility, and administrative operations.
          </p>
        </div>

        {['admin', 'super_admin'].includes(role) ? (
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            <CalendarRange className="h-4 w-4" />
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="bg-transparent outline-none"
            />
          </label>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {exportCards.map((card) => (
          <ExportCard
            key={card.key}
            {...card}
            loading={loadingKey === card.key}
            onExport={() => handleExport(card)}
          />
        ))}
      </div>
    </div>
  )
}
