import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { usePageLoader } from '@/hooks/usePageLoader'
import { UpdatingBadge } from '@/components/common/InlineLoadingState'
import api from '@/lib/api'
import { ArrowLeft, CalendarRange, Building2, Info, Zap, Droplets, Flame } from 'lucide-react'
import { generateAdminBill } from '../../services/adminService/adminBillingService'
import { fetchAdminTenants } from '../../services/adminService/adminTenantService'
import { fetchSharedRates } from '../../services/financeService/financeBillService'
import { useAuth } from '@/context/AuthContext'

const EMPTY = {
  tenantId: '',
  billingMonth: '2026-02',
}

const field = (err) =>
  `w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${err ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
  } text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-all`

const RATE_META = {
  electricity: {
    icon: Zap,
    color: 'text-amber-500',
    label: 'Electricity',
    unit: 'kWh',
  },
  water: {
    icon: Droplets,
    color: 'text-cyan-500',
    label: 'Water',
    unit: 'm³',
  },
  thermal: {
    icon: Flame,
    color: 'text-rose-500',
    label: 'Thermal',
    unit: 'kBTU',
  },
}

function normalizeRateType(type) {
  if (type === 'electric') return 'electricity'
  if (type === 'water') return 'water'
  if (type === 'thermal') return 'thermal'
  return null
}

export default function NewBillPage() {
  const loading = usePageLoader(600)
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { addToast } = useApp()

  const [form, setForm] = useState(EMPTY)
  const [errs, setErrs] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const [tenants, setTenants] = useState([])
  const [loadingTenants, setLoadingTenants] = useState(true)

  const [rates, setRates] = useState([])
  const [loadingRates, setLoadingRates] = useState(true)
  const isRefreshing = loadingTenants || loadingRates
  const billingBasePath =
    user?.role === 'super_admin' || location.pathname.startsWith('/super-admin')
      ? '/super-admin/billing'
      : '/admin/billing'

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingTenants(true)
        setLoadingRates(true)

        const [tenantData, rateData] = await Promise.all([
          fetchAdminTenants(),
          fetchSharedRates(),
        ])

        const tenantRows = Array.isArray(tenantData?.data) ? tenantData.data : []
        const rateRows = Array.isArray(rateData)
          ? rateData
          : Array.isArray(rateData?.data)
            ? rateData.data
            : []

        setTenants(tenantRows)
        setRates(rateRows)
      } catch (error) {
        addToast?.(error?.response?.data?.message || 'Failed to load form data.')
      } finally {
        setLoadingTenants(false)
        setLoadingRates(false)
      }
    }

    fetchInitialData()
  }, [addToast])

  const activeRates = useMemo(() => {
    const grouped = {
      electricity: null,
      water: null,
      thermal: null,
    }

    for (const rate of rates) {
      const key = normalizeRateType(rate?.type)
      if (!key || !rate?.is_active) continue
      if (!grouped[key]) {
        grouped[key] = rate
      }
    }

    return grouped
  }, [rates])

  const billingReadyTenants = useMemo(
    () => tenants.filter((tenant) => tenant?.is_billing_ready),
    [tenants]
  )

  const pendingSetupTenants = useMemo(
    () => tenants.filter((tenant) => !tenant?.is_billing_ready),
    [tenants]
  )

  const validate = () => {
    const e = {}

    if (!String(form.tenantId).trim()) {
      e.tenantId = 'Tenant is required'
    }

    if (!String(form.billingMonth).trim()) {
      e.billingMonth = 'Billing month is required'
    }

    setErrs(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async () => {
    if (!validate() || submitting) return

    const payload = {
      tenant_id: Number(form.tenantId),
      billing_month: form.billingMonth,
    }


    try {
      setSubmitting(true)
      setErrs({})

      const res = await generateAdminBill(payload)

      addToast?.(res?.message || 'Bill generated successfully')
      navigate(billingBasePath)
    } catch (error) {
      const validationErrors = error?.response?.data?.errors || {}
      const message = error?.response?.data?.message || 'Failed to generate bill.'

      setErrs((prev) => ({
        ...prev,
        tenantId: validationErrors.tenant_id?.[0] || prev.tenantId,
        billingMonth: validationErrors.billing_month?.[0] || prev.billingMonth,
      }))

      addToast?.(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(billingBasePath)}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div>
          <h1 className="font-bold text-xl text-slate-800 dark:text-white">
            Generate Bill
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Select a tenant and billing month to generate a bill automatically
          </p>
        </div>
        </div>
        <UpdatingBadge show={isRefreshing} />
      </div>

      <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            The system will automatically compute each tenant's occupied billing period, usage totals, active rates, previous balance, bill items, subtotal, total amount, and due date.
          </p>
        </div>

        {pendingSetupTenants.length > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
            {pendingSetupTenants.length} tenant account(s) need profile completion before they can be billed.
          </div>
        ) : null}

        <div className="grid sm:grid-cols-3 gap-3">
          {Object.entries(RATE_META).map(([type, meta]) => {
            const rate = activeRates[type]
            const Icon = meta.icon

            return (
              <div
                key={type}
                className="rounded-xl bg-white/80 dark:bg-slate-900/40 border border-blue-100 dark:border-slate-700 p-3"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`w-4 h-4 ${meta.color}`} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {meta.label}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {rate
                    ? `₱${rate.price_per_unit}/${meta.unit}`
                    : 'No active rate'}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Tenant *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={form.tenantId}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    tenantId: e.target.value,
                  }))
                }
                className={`${field(errs.tenantId)} pl-9`}
              >
                <option value="">— Select tenant —</option>
                 {billingReadyTenants.map((tenant) => (
                   <option key={tenant.id} value={tenant.id}>
                     {tenant.name}
                     {Array.isArray(tenant.units) && tenant.units.length > 0
                      ? ` — ${tenant.units.map((unit) => unit?.unit_number || `Unit #${unit?.id}`).filter(Boolean).join(', ')}`
                      : tenant.unit
                      ? ` — ${tenant.unit.name || tenant.unit.unit_number || `Unit #${tenant.unit.id}`}`
                      : ''}
                </option>
                 ))}
              </select>
            </div>
            {errs.tenantId && (
              <p className="text-xs text-red-500 mt-1">{errs.tenantId}</p>
            )}
            {billingReadyTenants.length === 0 ? (
              <p className="text-xs text-amber-600 mt-1">No billing-ready tenants found. Complete tenant setup in the Tenants page first.</p>
            ) : null}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Billing Month *
            </label>
            <div className="relative">
              <CalendarRange className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="month"
                value={form.billingMonth}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    billingMonth: e.target.value,
                  }))
                }
                className={`${field(errs.billingMonth)} pl-9`}
              />
            </div>
            {errs.billingMonth && (
              <p className="text-xs text-red-500 mt-1">{errs.billingMonth}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => navigate(billingBasePath)}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {submitting ? 'Generating...' : 'Generate Bill'}
          </button>
        </div>
      </div>
    </div>
  )
}
