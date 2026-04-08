import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Search,
  ArrowRight,
  Bell,
  Building2,
  Eye,
  FileText,
  Hash,
  Receipt,
  Users,
  Wrench,
} from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { useAuth } from '@/context/AuthContext'
import EmptyState from '@/components/ui/EmptyState'
import { fetchNotifications } from '@/services/notificationService'
import { fetchAdminBills } from '@/services/adminService/adminBillingService'
import { fetchAdminTenants } from '@/services/adminService/adminTenantService'
import { fetchAdminUnits } from '@/services/adminService/adminUnitService'
import { fetchAdminBillingConcerns } from '@/services/adminService/adminBillingConcernService'
import { fetchFinanceBills, fetchFinanceTenants } from '@/services/financeService/financeBillService'
import { fetchFinancePaymentsSearch } from '@/services/financeService/financePaymentSearchService'
import { fetchTenantBills } from '@/services/tenantService/tenantBillingService'
import { fetchFacilityMaintenanceTickets } from '@/services/facilityService/facilityMaintenanceService'
import { buildSearchMeta, filterAndRankResults } from '@/utils/globalSearch'

const NAV_SEARCH_ITEMS = {
  admin: [
    { path: '/admin/billing', label: 'Billing', keywords: ['invoice', 'soa', 'payments'] },
    { path: '/admin/tenants', label: 'Tenants', keywords: ['occupants', 'residents'] },
    { path: '/admin/units', label: 'Units', keywords: ['rooms', 'spaces'] },
    { path: '/admin/usage-reports', label: 'Usage Reports', keywords: ['consumption', 'utilities'] },
    { path: '/admin/tenant-reports', label: 'Tenant Reports', keywords: ['tickets', 'concerns'] },
    { path: '/admin/notifications', label: 'Notifications', keywords: ['alerts', 'inbox'] },
  ],
  super_admin: [
    { path: '/super-admin/billing', label: 'Billing', keywords: ['invoice', 'soa', 'payments'] },
    { path: '/super-admin/tenants', label: 'Tenants', keywords: ['occupants', 'residents'] },
    { path: '/super-admin/units', label: 'Units', keywords: ['rooms', 'spaces'] },
    { path: '/super-admin/tenant-reports', label: 'Tenant Reports', keywords: ['tickets', 'concerns'] },
    { path: '/super-admin/notifications', label: 'Notifications', keywords: ['alerts', 'inbox'] },
    { path: '/super-admin/announcements', label: 'Announcements', keywords: ['notice', 'broadcast'] },
  ],
  tenant: [
    { path: '/tenant/bills', label: 'My Bills', keywords: ['invoice', 'payments', 'soa'] },
    { path: '/tenant/usage', label: 'Usage Monitoring', keywords: ['consumption', 'utilities'] },
    { path: '/tenant/consumption-reports', label: 'Consumption Reports', keywords: ['history', 'monthly'] },
    { path: '/tenant/billing-reports', label: 'Billing Reports', keywords: ['tickets', 'concerns'] },
    { path: '/tenant/notifications', label: 'Notifications', keywords: ['alerts', 'inbox'] },
  ],
  finance: [
    { path: '/finance/billing', label: 'Billing Management', keywords: ['generate', 'invoice', 'soa'] },
    { path: '/finance/payment-review', label: 'Payment Review', keywords: ['verify', 'receipts'] },
    { path: '/finance/billing-tickets', label: 'Billing Tickets', keywords: ['disputes', 'concerns'] },
    { path: '/finance/notifications', label: 'Notifications', keywords: ['alerts', 'inbox'] },
  ],
  facility_manager: [
    { path: '/facility/monitoring', label: 'Building Monitoring', keywords: ['readings', 'live'] },
    { path: '/facility/consumption', label: 'Utility Consumption', keywords: ['usage', 'utilities'] },
    { path: '/facility/maintenance', label: 'Maintenance Requests', keywords: ['tickets', 'repairs'] },
    { path: '/facility/anomalies', label: 'Anomaly Alerts', keywords: ['alerts', 'anomaly'] },
    { path: '/facility/notifications', label: 'Notifications', keywords: ['alerts', 'inbox'] },
  ],
}

function normalizeRows(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function groupByCategory(results) {
  return results.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightText(text, query) {
  const source = String(text || '')
  const trimmed = String(query || '').trim()
  if (!trimmed) return source

  const tokens = Array.from(new Set(trimmed.toLowerCase().split(/\s+/).filter(Boolean)))
  if (!tokens.length) return source

  const matcher = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'ig')
  const parts = source.split(matcher)

  return parts.map((part, index) => {
    if (tokens.some((token) => part.toLowerCase() === token)) {
      return <mark key={`${part}-${index}`} className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-0.5 rounded">{part}</mark>
    }
    return <span key={`${part}-${index}`}>{part}</span>
  })
}

function buildPageMatches(role) {
  return (NAV_SEARCH_ITEMS[role] || []).map((item) => {
    const description = item.keywords?.join(' � ') || item.path
    return {
      id: `page-${item.path}`,
      path: item.path,
      resultType: 'page',
      category: 'Pages',
      icon: Search,
      label: item.label,
      description,
      searchMeta: buildSearchMeta({
        category: 'Pages',
        label: item.label,
        description,
        path: item.path,
      }, {
        keywords: item.keywords,
      }),
    }
  })
}

function mapBillResult(bill, path) {
  const label = bill.bill_number || bill.invoice_number || `Bill #${bill.id}`
  const description = [
    bill.tenant_name || bill.tenant?.name,
    bill.unit_number || bill.unit?.unit_number || bill.unit?.name,
    bill.billing_month || bill.billing_period,
    bill.status,
  ].filter(Boolean).join(' � ')

  return {
    id: `bill-${bill.id}`,
    path,
    resultType: 'record',
    category: 'Bills',
    icon: Receipt,
    label,
    description,
    searchMeta: buildSearchMeta({ category: 'Bills', label, description, path }, {
      status: bill.status,
      timestamp: bill.updated_at || bill.created_at || bill.due_date || bill.dueDate || bill.billing_month,
      keywords: [bill.tenant_name, bill.unit_number, bill.billing_month, bill.billing_period, bill.status],
    }),
  }
}

function mapPaymentResult(payment, path) {
  const label = payment.reference_no || payment.referenceNumber || `Transaction #${payment.id}`
  const description = [
    payment.tenant?.name || payment.tenant_name,
    payment.bill?.unit?.unit_number || payment.unit_number,
    payment.status,
    payment.amount != null ? `PHP ${Number(payment.amount).toLocaleString()}` : null,
  ].filter(Boolean).join(' � ')

  return {
    id: `payment-${payment.id}`,
    path,
    resultType: 'record',
    category: 'Transactions',
    icon: Receipt,
    label,
    description,
    searchMeta: buildSearchMeta({ category: 'Transactions', label, description, path }, {
      status: payment.status,
      timestamp: payment.updated_at || payment.created_at || payment.paid_at,
      keywords: [
        payment.reference_no,
        payment.referenceNumber,
        payment.tenant?.name,
        payment.tenant_name,
        payment.bill?.unit?.unit_number,
        payment.unit_number,
        payment.status,
        payment.payment_method,
        payment.amount,
      ],
    }),
  }
}
function mapTenantResult(tenant, path) {
  const label = tenant.name || tenant.user?.name || `Tenant #${tenant.id}`
  const description = [tenant.email, tenant.unit_label, tenant.status].filter(Boolean).join(' � ')

  return {
    id: `tenant-${tenant.id}`,
    path,
    resultType: 'record',
    category: 'Tenants',
    icon: Users,
    label,
    description,
    searchMeta: buildSearchMeta({ category: 'Tenants', label, description, path }, {
      status: tenant.status,
      timestamp: tenant.updated_at || tenant.created_at,
      keywords: [tenant.name, tenant.email, tenant.unit_label, tenant.status],
    }),
  }
}

function mapUnitResult(unit, path) {
  const label = unit.unit_number || unit.name || `Unit #${unit.id}`
  const description = [unit.floor, unit.status, unit.type].filter(Boolean).join(' � ')

  return {
    id: `unit-${unit.id}`,
    path,
    resultType: 'record',
    category: 'Units',
    icon: Building2,
    label,
    description,
    searchMeta: buildSearchMeta({ category: 'Units', label, description, path }, {
      status: unit.status,
      timestamp: unit.updated_at || unit.created_at,
      keywords: [unit.unit_number, unit.name, unit.floor, unit.status, unit.type],
    }),
  }
}

function mapConcernResult(concern, path) {
  const label = concern.subject || concern.title || `Concern #${concern.id}`
  const description = [concern.status, concern.bill_no || concern.bill_number, concern.tenant_name].filter(Boolean).join(' � ')

  return {
    id: `concern-${concern.id}`,
    path,
    resultType: 'record',
    category: 'Billing Tickets',
    icon: FileText,
    label,
    description,
    searchMeta: buildSearchMeta({ category: 'Billing Tickets', label, description, path }, {
      status: concern.status,
      timestamp: concern.updated_at || concern.created_at,
      keywords: [concern.subject, concern.title, concern.bill_no, concern.bill_number, concern.tenant_name, concern.status],
    }),
  }
}

function mapNotificationResult(notification, path) {
  const label = notification.title || `Notification #${notification.id}`
  const description = [notification.message, notification.type].filter(Boolean).join(' � ')

  return {
    id: `notification-${notification.id}`,
    path,
    resultType: 'record',
    category: 'Notifications',
    icon: Bell,
    label,
    description,
    searchMeta: buildSearchMeta({ category: 'Notifications', label, description, path }, {
      status: notification.is_read ? 'read' : 'unread',
      timestamp: notification.created_at || notification.updated_at,
      keywords: [notification.title, notification.message, notification.type, notification.is_read ? 'read' : 'unread'],
    }),
  }
}

function mapMaintenanceResult(ticket, path) {
  const label = ticket.title || `Ticket #${ticket.ticket_id || ticket.id}`
  const description = [ticket.type, ticket.status, ticket.technician].filter(Boolean).join(' � ')

  return {
    id: `ticket-${ticket.ticket_id || ticket.id}`,
    path,
    resultType: 'record',
    category: 'Maintenance',
    icon: Wrench,
    label,
    description,
    searchMeta: buildSearchMeta({ category: 'Maintenance', label, description, path }, {
      status: ticket.status,
      timestamp: ticket.updated_at || ticket.created_at,
      keywords: [ticket.title, ticket.type, ticket.status, ticket.technician],
    }),
  }
}

function getNotificationsPath(role) {
  if (role === 'super_admin') return '/super-admin/notifications'
  if (role === 'tenant') return '/tenant/notifications'
  if (role === 'finance') return '/finance/notifications'
  if (role === 'facility_manager') return '/facility/notifications'
  return '/admin/notifications'
}

async function fetchRoleSearchResults(role, query) {
  if (!query || query.length < 2) return []

  const notificationPath = getNotificationsPath(role)

  if (role === 'tenant') {
    const [billsRes, notificationsRes] = await Promise.all([
      fetchTenantBills(),
      fetchNotifications({ per_page: 25, status: 'all', search: query }),
    ])

    const results = [
      ...buildPageMatches(role),
      ...normalizeRows(billsRes).map((bill) => mapBillResult(bill, '/tenant/bills')),
      ...normalizeRows(notificationsRes).map((notification) => mapNotificationResult(notification, notificationPath)),
    ]

    return filterAndRankResults(results, query)
  }

  if (role === 'finance') {
    const [billsRes, tenantsRes, paymentsRes, notificationsRes] = await Promise.all([
      fetchFinanceBills(),
      fetchFinanceTenants(),
      fetchFinancePaymentsSearch(),
      fetchNotifications({ per_page: 25, status: 'all', search: query }),
    ])

    const results = [
      ...buildPageMatches(role),
      ...normalizeRows(billsRes).map((bill) => mapBillResult(bill, '/finance/billing')),
      ...normalizeRows(tenantsRes).map((tenant) => mapTenantResult(tenant, '/finance/billing')),
      ...normalizeRows(paymentsRes).map((payment) => mapPaymentResult(payment, '/finance/payment-review')),
      ...normalizeRows(notificationsRes).map((notification) => mapNotificationResult(notification, notificationPath)),
    ]

    return filterAndRankResults(results, query)
  }

  if (role === 'facility_manager') {
    const [ticketsRes, notificationsRes] = await Promise.all([
      fetchFacilityMaintenanceTickets(),
      fetchNotifications({ per_page: 25, status: 'all', search: query }),
    ])

    const results = [
      ...buildPageMatches(role),
      ...normalizeRows(ticketsRes).map((ticket) => mapMaintenanceResult(ticket, '/facility/maintenance')),
      ...normalizeRows(notificationsRes).map((notification) => mapNotificationResult(notification, notificationPath)),
    ]

    return filterAndRankResults(results, query)
  }

  const billingPath = role === 'super_admin' ? '/super-admin/billing' : '/admin/billing'
  const tenantPath = role === 'super_admin' ? '/super-admin/tenants' : '/admin/tenants'
  const unitPath = role === 'super_admin' ? '/super-admin/units' : '/admin/units'
  const concernPath = role === 'super_admin' ? '/super-admin/tenant-reports' : '/admin/tenant-reports'

  const [billsRes, tenantsRes, unitsRes, concernsRes, notificationsRes] = await Promise.all([
    fetchAdminBills({ paginate: 0 }),
    fetchAdminTenants(),
    fetchAdminUnits(),
    fetchAdminBillingConcerns(),
    fetchNotifications({ per_page: 25, status: 'all', search: query }),
  ])

  const results = [
    ...buildPageMatches(role),
    ...normalizeRows(billsRes).map((bill) => mapBillResult(bill, billingPath)),
    ...normalizeRows(tenantsRes).map((tenant) => mapTenantResult(tenant, tenantPath)),
    ...normalizeRows(unitsRes).map((unit) => mapUnitResult(unit, unitPath)),
    ...normalizeRows(concernsRes).map((concern) => mapConcernResult(concern, concernPath)),
    ...normalizeRows(notificationsRes).map((notification) => mapNotificationResult(notification, notificationPath)),
  ]

  return filterAndRankResults(results, query)
}

export default function GlobalSearch() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const initialQuery = params.get('q') || ''
  const focusId = params.get('focus') || ''

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [previewItem, setPreviewItem] = useState(null)

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    const normalizedQuery = initialQuery.trim().toLowerCase()
    if (!normalizedQuery || normalizedQuery.length < 2 || !user?.role) {
      setResults([])
      setLoading(false)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        const nextResults = await fetchRoleSearchResults(user.role, normalizedQuery)
        if (!cancelled) setResults(nextResults)
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [initialQuery, user?.role])

  const groupedResults = useMemo(() => groupByCategory(results), [results])
  const categories = useMemo(() => ['All', ...Object.keys(groupedResults)], [groupedResults])
  const filteredGroups = useMemo(() => {
    if (activeCategory === 'All') return groupedResults
    return groupedResults[activeCategory] ? { [activeCategory]: groupedResults[activeCategory] } : {}
  }, [activeCategory, groupedResults])

  useEffect(() => {
    if (activeCategory !== 'All' && !groupedResults[activeCategory]) {
      setActiveCategory('All')
    }
  }, [activeCategory, groupedResults])

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (trimmed.length < 2) return
    navigate(`${location.pathname}?q=${encodeURIComponent(trimmed)}`, { replace: true })
  }

  const openModule = (item) => {
    navigate(item.path, {
      state: item.resultType === 'record'
        ? {
            navbarSearchItem: {
              id: item.id,
              label: item.label,
              category: item.category,
              query: [item.label, item.description].filter(Boolean).join(' '),
            },
          }
        : undefined,
    })
  }

  return (
    <div className="space-y-5 animate-in">
      <div>
        <h1 className="font-bold text-xl text-slate-800 dark:text-white">Global Search</h1>
        <p className="text-sm text-slate-400 mt-0.5">Search exact records, tickets, bills, notifications, and other role-based content.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search bills, tenants, units, tickets, notifications..."
            className="w-full pl-9 pr-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all"
          />
        </div>
      </form>

      {!!results.length && (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const count = category === 'All' ? results.length : (groupedResults[category]?.length || 0)
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeCategory === category
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {category} ({count})
              </button>
            )
          })}
        </div>
      )}

      {!initialQuery.trim() || initialQuery.trim().length < 2 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm">
          <EmptyState
            title="Start typing to search"
            message="Use at least 2 characters so the system can search actual content across your accessible modules."
          />
        </div>
      ) : loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm text-sm text-slate-400">
          Searching live content...
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm">
          <EmptyState
            title="No exact matches found"
            message="Try a bill ID, tenant name, unit number, ticket title, billing month, or notification keyword."
          />
        </div>
      ) : (
        Object.entries(filteredGroups).map(([category, items]) => (
          <div key={category} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{category}</p>
              <p className="text-xs text-slate-400 mt-0.5">{items.length} matching result{items.length > 1 ? 's' : ''}</p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item) => {
                const Icon = item.icon || Hash
                const focused = focusId && item.id === focusId
                return (
                  <div
                    key={item.id}
                    className={`px-5 py-4 flex items-start justify-between gap-4 ${focused ? 'bg-blue-50/70 dark:bg-blue-900/10' : ''}`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">{highlightText(item.label, initialQuery)}</p>
                          {focused && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              Best Match
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">{highlightText(item.description || item.path, initialQuery)}</p>
                        <p className="text-[11px] text-slate-400 mt-2 font-mono">{item.path}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewItem(item)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>
                      <button
                        onClick={() => openModule(item)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all whitespace-nowrap"
                      >
                        Open Module
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      <Modal isOpen={!!previewItem} onClose={() => setPreviewItem(null)} title="Search Result Preview">
        {previewItem ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                {(() => {
                  const Icon = previewItem.icon || Hash
                  return <Icon className="w-4 h-4 text-slate-500" />
                })()}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{highlightText(previewItem.label, initialQuery)}</p>
                <p className="text-xs text-slate-400 mt-1">{previewItem.category}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Matched Content</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 break-words">{highlightText(previewItem.description || previewItem.path, initialQuery)}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Target Module</p>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{previewItem.path}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const item = previewItem
                  setPreviewItem(null)
                  openModule(item)
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all"
              >
                Open Module
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}


