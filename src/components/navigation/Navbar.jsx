import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Sun,
  Moon,
  Search,
  Menu,
  ChevronDown,
  LogOut,
  AlertTriangle,
  Info,
  Building2,
  Shield,
  CheckCheck,
  ArrowRight,
  FileText,
  Users,
  Receipt,
  Wrench,
  Hash,
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useUnitFilter } from '@/context/UnitFilterContext'
import { buildSearchMeta, filterAndRankResults } from '@/utils/globalSearch'
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/services/notificationService'
import { fetchAdminBills } from '@/services/adminService/adminBillingService'
import { fetchAdminTenants } from '@/services/adminService/adminTenantService'
import { fetchAdminUnits } from '@/services/adminService/adminUnitService'
import { fetchAdminBillingConcerns } from '@/services/adminService/adminBillingConcernService'
import { fetchFinanceBills, fetchFinanceTenants } from '@/services/financeService/financeBillService'
import { fetchFinancePaymentsSearch } from '@/services/financeService/financePaymentSearchService'
import { fetchTenantBills } from '@/services/tenantService/tenantBillingService'
import { fetchFacilityMaintenanceTickets } from '@/services/facilityService/facilityMaintenanceService'

const pageTitles = {
  '/': 'Dashboard',
  '/billing': 'Billing',
  '/tenants': 'Tenants',
  '/units': 'Units',
  '/usage-reports': 'Usage Reports',
  '/settings': 'Settings',
  '/tenant-reports': 'Tenant Reports',
  '/tenant/dashboard': 'My Dashboard',
  '/tenant/bills': 'My Bills',
  '/tenant/usage': 'Usage Monitoring',
  '/tenant/profile': 'My Profile',
  '/tenant/consumption-reports': 'Consumption Reports',
  '/tenant/billing-reports': 'Billing Reports',
  '/tenant/notifications': 'Notifications',
  '/tenant/search': 'Global Search',
  '/tenant/activity-logs': 'Activity Logs',
  '/tenant/make-report': 'Make Report',
  '/admin': 'Dashboard',
  '/admin/billing': 'Billing',
  '/admin/tenants': 'Tenants',
  '/admin/units': 'Units',
  '/admin/usage-reports': 'Usage Reports',
  '/admin/reconciliation': 'Reconciliation',
  '/admin/occupancy-timeline': 'Occupancy Timeline',
  '/admin/owner-portal': 'Owner Portal',
  '/admin/system-health': 'System Health',
  '/admin/activity-logs': 'Activity Logs',
  '/admin/notifications': 'Notifications',
  '/admin/search': 'Global Search',
  '/admin/operational-exports': 'Operational Exports',
  '/super-admin': 'Dashboard',
  '/super-admin/billing': 'Billing',
  '/super-admin/tenants': 'Tenants',
  '/super-admin/units': 'Units',
  '/super-admin/usage-reports': 'Usage Reports',
  '/super-admin/tenant-reports': 'Tenant Reports',
  '/super-admin/reconciliation': 'Reconciliation',
  '/super-admin/occupancy-timeline': 'Occupancy Timeline',
  '/super-admin/owner-portal': 'Owner Portal',
  '/super-admin/system-health': 'System Health',
  '/super-admin/activity-logs': 'Activity Logs',
  '/super-admin/notifications': 'Notifications',
  '/super-admin/meters': 'Meter Management',
  '/super-admin/billing-rates': 'Billing Rates',
  '/super-admin/users': 'User Management',
  '/super-admin/announcements': 'Announcements',
  '/super-admin/search': 'Global Search',
  '/super-admin/operational-exports': 'Operational Exports',
  '/finance/dashboard': 'Dashboard',
  '/finance/billing': 'Billing Management',
  '/finance/payment-review': 'Payment Review',
  '/finance/billing-tickets': 'Billing Tickets',
  '/finance/reports': 'Financial Reports',
  '/finance/activity-logs': 'Activity Logs',
  '/finance/notifications': 'Notifications',
  '/finance/search': 'Global Search',
  '/finance/operational-exports': 'Operational Exports',
  '/facility/dashboard': 'Dashboard',
  '/facility/monitoring': 'Building Monitoring',
  '/facility/consumption': 'Utility Consumption',
  '/facility/anomalies': 'Anomaly Alerts',
  '/facility/maintenance': 'Maintenance Requests',
  '/facility/equipment': 'Equipment Status',
  '/facility/reports': 'Reports',
  '/facility/activity-logs': 'Activity Logs',
  '/facility/notifications': 'Notifications',
  '/facility/search': 'Global Search',
  '/facility/operational-exports': 'Operational Exports',
}

const DEFAULT_SUMMARY = {
  total: 0,
  unread: 0,
  read: 0,
}

const NAV_SEARCH_ITEMS = {
  admin: [
    { path: '/admin', label: 'Dashboard', keywords: ['home', 'overview'] },
    { path: '/admin/billing', label: 'Billing', keywords: ['invoice', 'soa', 'payments'] },
    { path: '/admin/tenants', label: 'Tenants', keywords: ['occupants', 'residents'] },
    { path: '/admin/units', label: 'Units', keywords: ['rooms', 'spaces'] },
    { path: '/admin/usage-reports', label: 'Usage Reports', keywords: ['consumption', 'utilities'] },
    { path: '/admin/reconciliation', label: 'Reconciliation', keywords: ['variance', 'meters'] },
    { path: '/admin/occupancy-timeline', label: 'Occupancy Timeline', keywords: ['move in', 'move out'] },
    { path: '/admin/owner-portal', label: 'Owner Portal', keywords: ['executive', 'summary'] },
    { path: '/admin/system-health', label: 'System Health', keywords: ['status', 'services'] },
    { path: '/admin/operational-exports', label: 'Operational Exports', keywords: ['csv', 'download', 'export'] },
    { path: '/admin/tenant-reports', label: 'Tenant Reports', keywords: ['tickets', 'concerns'] },
    { path: '/admin/anomalies', label: 'Anomalies', keywords: ['alerts', 'anomaly'] },
    { path: '/admin/activity-logs', label: 'Activity Logs', keywords: ['audit', 'history'] },
    { path: '/admin/notifications', label: 'Notifications', keywords: ['alerts', 'inbox'] },
    { path: '/admin/settings', label: 'Settings', keywords: ['preferences', 'config'] },
  ],
  super_admin: [
    { path: '/super-admin', label: 'Dashboard', keywords: ['home', 'overview'] },
    { path: '/super-admin/billing', label: 'Billing', keywords: ['invoice', 'soa', 'payments'] },
    { path: '/super-admin/tenants', label: 'Tenants', keywords: ['occupants', 'residents'] },
    { path: '/super-admin/units', label: 'Units', keywords: ['rooms', 'spaces'] },
    { path: '/super-admin/usage-reports', label: 'Usage Reports', keywords: ['consumption', 'utilities'] },
    { path: '/super-admin/reconciliation', label: 'Reconciliation', keywords: ['variance', 'meters'] },
    { path: '/super-admin/occupancy-timeline', label: 'Occupancy Timeline', keywords: ['move in', 'move out'] },
    { path: '/super-admin/owner-portal', label: 'Owner Portal', keywords: ['executive', 'summary'] },
    { path: '/super-admin/system-health', label: 'System Health', keywords: ['status', 'services'] },
    { path: '/super-admin/operational-exports', label: 'Operational Exports', keywords: ['csv', 'download', 'export'] },
    { path: '/super-admin/tenant-reports', label: 'Tenant Reports', keywords: ['tickets', 'concerns'] },
    { path: '/super-admin/activity-logs', label: 'Activity Logs', keywords: ['audit', 'history'] },
    { path: '/super-admin/notifications', label: 'Notifications', keywords: ['alerts', 'inbox'] },
    { path: '/super-admin/meters', label: 'Meter Management', keywords: ['watch', 'devices'] },
    { path: '/super-admin/billing-rates', label: 'Billing Rates', keywords: ['rates', 'pricing'] },
    { path: '/super-admin/users', label: 'User Management', keywords: ['accounts', 'staff'] },
    { path: '/super-admin/announcements', label: 'Announcements', keywords: ['notice', 'broadcast'] },
  ],
  tenant: [
    { path: '/tenant/dashboard', label: 'Dashboard', keywords: ['home', 'overview'] },
    { path: '/tenant/bills', label: 'My Bills', keywords: ['invoice', 'payments', 'soa'] },
    { path: '/tenant/usage', label: 'Usage Monitoring', keywords: ['consumption', 'utilities'] },
    { path: '/tenant/consumption-reports', label: 'Consumption Reports', keywords: ['history', 'monthly'] },
    { path: '/tenant/billing-reports', label: 'Billing Reports', keywords: ['tickets', 'concerns'] },
    { path: '/tenant/activity-logs', label: 'Activity Logs', keywords: ['history', 'audit'] },
    { path: '/tenant/notifications', label: 'Notifications', keywords: ['alerts', 'inbox'] },
    { path: '/tenant/profile', label: 'Profile', keywords: ['account', 'settings'] },
  ],
  finance: [
    { path: '/finance/dashboard', label: 'Dashboard', keywords: ['home', 'overview'] },
    { path: '/finance/billing', label: 'Billing Management', keywords: ['generate', 'invoice', 'soa'] },
    { path: '/finance/payment-review', label: 'Payment Review', keywords: ['verify', 'receipts'] },
    { path: '/finance/billing-tickets', label: 'Billing Tickets', keywords: ['disputes', 'concerns'] },
    { path: '/finance/reports', label: 'Financial Reports', keywords: ['finance', 'collections'] },
    { path: '/finance/operational-exports', label: 'Operational Exports', keywords: ['csv', 'download', 'export'] },
    { path: '/finance/activity-logs', label: 'Activity Logs', keywords: ['history', 'audit'] },
    { path: '/finance/notifications', label: 'Notifications', keywords: ['alerts', 'inbox'] },
  ],
  facility_manager: [
    { path: '/facility/dashboard', label: 'Dashboard', keywords: ['home', 'overview'] },
    { path: '/facility/monitoring', label: 'Building Monitoring', keywords: ['readings', 'live'] },
    { path: '/facility/consumption', label: 'Utility Consumption', keywords: ['usage', 'utilities'] },
    { path: '/facility/anomalies', label: 'Anomaly Alerts', keywords: ['alerts', 'anomaly'] },
    { path: '/facility/maintenance', label: 'Maintenance Requests', keywords: ['tickets', 'repairs'] },
    { path: '/facility/equipment', label: 'Equipment Status', keywords: ['meters', 'devices'] },
    { path: '/facility/reports', label: 'Reports', keywords: ['exports', 'history'] },
    { path: '/facility/operational-exports', label: 'Operational Exports', keywords: ['csv', 'download', 'export'] },
    { path: '/facility/activity-logs', label: 'Activity Logs', keywords: ['history', 'audit'] },
    { path: '/facility/notifications', label: 'Notifications', keywords: ['alerts', 'inbox'] },
  ],
}

function normalizeRows(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function includesQuery(parts, query) {
  const haystack = parts.filter(Boolean).join(' ').toLowerCase()
  return haystack.includes(query)
}

function buildPageResults(items, query) {
  const baseItems = items.map((item) => ({
    ...item,
    resultType: 'page',
    category: 'Pages',
    searchMeta: buildSearchMeta({
      category: 'Pages',
      label: item.label,
      description: item.keywords?.join(' � ') || item.path,
      path: item.path,
    }, {
      keywords: item.keywords,
    }),
  }))

  if (!query) {
    return baseItems.slice(0, 5)
  }

  return filterAndRankResults(baseItems, query).slice(0, 5)
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

async function fetchRoleRecordResults(role, query, getNotificationsPath) {
  if (!query || query.length < 2) return []

  if (role === 'tenant') {
    const [billsRes, notificationsRes] = await Promise.all([
      fetchTenantBills(),
      fetchNotifications({ per_page: 10, status: 'all', search: query }),
    ])

    const bills = normalizeRows(billsRes)
      .filter((bill) => includesQuery([bill.bill_number, bill.invoice_number, bill.unit_number, bill.billing_month, bill.status], query))
      .slice(0, 4)
      .map((bill) => mapBillResult(bill, '/tenant/bills'))

    const notifications = normalizeRows(notificationsRes)
      .slice(0, 3)
      .map((notification) => mapNotificationResult(notification, getNotificationsPath()))

    return filterAndRankResults([...bills, ...notifications], query).slice(0, 7)
  }

  if (role === 'finance') {
    const [billsRes, tenantsRes, paymentsRes, notificationsRes] = await Promise.all([
      fetchFinanceBills(),
      fetchFinanceTenants(),
      fetchFinancePaymentsSearch(),
      fetchNotifications({ per_page: 10, status: 'all', search: query }),
    ])

    const bills = normalizeRows(billsRes)
      .map((bill) => mapBillResult(bill, '/finance/billing'))

    const tenants = normalizeRows(tenantsRes)
      .map((tenant) => mapTenantResult(tenant, '/finance/billing'))

    const payments = normalizeRows(paymentsRes)
      .map((payment) => mapPaymentResult(payment, '/finance/payment-review'))

    const notifications = normalizeRows(notificationsRes)
      .map((notification) => mapNotificationResult(notification, getNotificationsPath()))

    return filterAndRankResults([
      ...buildPageResults(NAV_SEARCH_ITEMS[role] || [], query),
      ...bills,
      ...tenants,
      ...payments,
      ...notifications,
    ], query).slice(0, 7)
  }

  if (role === 'facility_manager') {
    const [ticketsRes, notificationsRes] = await Promise.all([
      fetchFacilityMaintenanceTickets(),
      fetchNotifications({ per_page: 10, status: 'all', search: query }),
    ])

    const tickets = normalizeRows(ticketsRes)
      .filter((ticket) => includesQuery([ticket.title, ticket.type, ticket.status, ticket.technician, ticket.id], query))
      .slice(0, 5)
      .map((ticket) => mapMaintenanceResult(ticket, '/facility/maintenance'))

    const notifications = normalizeRows(notificationsRes)
      .slice(0, 3)
      .map((notification) => mapNotificationResult(notification, getNotificationsPath()))

    return filterAndRankResults([...tickets, ...notifications], query).slice(0, 7)
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
    fetchNotifications({ per_page: 10, status: 'all', search: query }),
  ])

  const bills = normalizeRows(billsRes)
    .filter((bill) => includesQuery([bill.bill_number, bill.invoice_number, bill.tenant_name, bill.unit_number, bill.billing_month, bill.status], query))
    .slice(0, 4)
    .map((bill) => mapBillResult(bill, billingPath))

  const tenants = normalizeRows(tenantsRes)
    .filter((tenant) => includesQuery([tenant.name, tenant.email, tenant.status, tenant.unit_label], query))
    .slice(0, 3)
    .map((tenant) => mapTenantResult(tenant, tenantPath))

  const units = normalizeRows(unitsRes)
    .filter((unit) => includesQuery([unit.unit_number, unit.name, unit.floor, unit.status], query))
    .slice(0, 3)
    .map((unit) => mapUnitResult(unit, unitPath))

  const concerns = normalizeRows(concernsRes)
    .filter((concern) => includesQuery([concern.subject, concern.title, concern.status, concern.bill_no, concern.bill_number, concern.tenant_name], query))
    .slice(0, 3)
    .map((concern) => mapConcernResult(concern, concernPath))

  const notifications = normalizeRows(notificationsRes)
    .slice(0, 3)
    .map((notification) => mapNotificationResult(notification, getNotificationsPath()))

  return filterAndRankResults([...bills, ...tenants, ...units, ...concerns, ...notifications], query).slice(0, 7)
}

export default function Navbar({ onMenuClick }) {
  const { isDark, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const { selectedUnit, setSelectedUnit } = useUnitFilter()
  const location = useLocation()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifSummary, setNotifSummary] = useState(DEFAULT_SUMMARY)
  const [notifFilter, setNotifFilter] = useState('unread')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0)
  const [recordResults, setRecordResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const title = pageTitles[location.pathname] || 'ECBills'
  const notifRef = useRef(null)
  const profileRef = useRef(null)
  const searchRef = useRef(null)

  const isSuperAdmin = user?.role === 'super_admin'
  const searchItems = NAV_SEARCH_ITEMS[user?.role] || NAV_SEARCH_ITEMS.admin

  const notifTypeConfig = {
    warning: { icon: AlertTriangle, iconClass: 'text-amber-500' },
    info: { icon: Info, iconClass: 'text-blue-500' },
    notice: { icon: Bell, iconClass: 'text-indigo-500' },
  }

  const getNotificationsPath = () => {
    if (user?.role === 'super_admin') return '/super-admin/notifications'
    if (user?.role === 'tenant') return '/tenant/notifications'
    if (user?.role === 'finance') return '/finance/notifications'
    if (user?.role === 'facility_manager') return '/facility/notifications'
    return '/admin/notifications'
  }

  const getSearchPath = () => {
    if (user?.role === 'super_admin') return '/super-admin/search'
    if (user?.role === 'tenant') return '/tenant/search'
    if (user?.role === 'finance') return '/finance/search'
    if (user?.role === 'facility_manager') return '/facility/search'
    return '/admin/search'
  }
  const pageResults = useMemo(() => buildPageResults(searchItems, searchQuery.trim().toLowerCase()), [searchItems, searchQuery])
  const combinedSearchResults = useMemo(() => [...pageResults, ...recordResults].slice(0, 10), [pageResults, recordResults])

  const loadNotifications = async (status = notifFilter) => {
    try {
      setNotifLoading(true)
      const res = await fetchNotifications({ per_page: 5, status })
      setNotifications(Array.isArray(res?.data) ? res.data : [])
      setNotifSummary(res?.summary || DEFAULT_SUMMARY)
    } catch {
      setNotifications([])
      setNotifSummary(DEFAULT_SUMMARY)
    } finally {
      setNotifLoading(false)
    }
  }

  const handleLogout = async () => {
    setShowProfile(false)
    setShowNotifs(false)
    await logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchResults(false)
    }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!user) return

    let cancelled = false
    const refresh = async () => {
      try {
        setNotifLoading(true)
        const res = await fetchNotifications({ per_page: 5, status: notifFilter })
        if (cancelled) return
        setNotifications(Array.isArray(res?.data) ? res.data : [])
        setNotifSummary(res?.summary || DEFAULT_SUMMARY)
      } catch {
        if (!cancelled) {
          setNotifications([])
          setNotifSummary(DEFAULT_SUMMARY)
        }
      } finally {
        if (!cancelled) setNotifLoading(false)
      }
    }

    refresh()
    const interval = window.setInterval(refresh, 60000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [user, notifFilter])

  useEffect(() => {
    setSelectedSearchIndex(0)
  }, [searchQuery, recordResults])

  useEffect(() => {
    setShowSearchResults(false)
    setSearchQuery('')
    setRecordResults([])
  }, [location.pathname])

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!showSearchResults || query.length < 2 || !user?.role) {
      setRecordResults([])
      setSearchLoading(false)
      return
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        setSearchLoading(true)
        const results = await fetchRoleRecordResults(user.role, query, getNotificationsPath)
        if (!cancelled) setRecordResults(results)
      } catch {
        if (!cancelled) setRecordResults([])
      } finally {
        if (!cancelled) setSearchLoading(false)
      }
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [searchQuery, showSearchResults, user?.role])

  const handleNotificationClick = async (notification) => {
    if (!notification?.id) return

    if (!notification.is_read) {
      try {
        await markNotificationAsRead(notification.id)
        setNotifications((prev) => prev.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)))
        setNotifSummary((prev) => ({ ...prev, unread: Math.max(Number(prev.unread || 0) - 1, 0), read: Number(prev.read || 0) + 1 }))
      } catch {
        // ignore navbar mark-as-read failure
      }
    }

    setShowNotifs(false)
    navigate(getNotificationsPath(), { state: { selectedNotificationId: notification.id } })
  }

  const handleReadAllNotifications = async () => {
    if (notifSummary.unread === 0) return

    try {
      await markAllNotificationsAsRead()
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })))
      setNotifSummary((prev) => ({ ...prev, unread: 0, read: Number(prev.total || 0) }))
      if (notifFilter === 'unread') await loadNotifications('unread')
    } catch {
      // ignore read-all failure in navbar
    }
  }

  const openGlobalSearch = (query, focusedItem = null) => {
    const trimmed = String(query || '').trim()
    if (trimmed.length < 2) return

    const params = new URLSearchParams({ q: trimmed })
    if (focusedItem?.id) params.set('focus', focusedItem.id)

    setShowSearchResults(false)
    setRecordResults([])
    navigate(`${getSearchPath()}?${params.toString()}`)
  }

  const handleSearchNavigate = (item) => {
    if (!item) return

    if (item.resultType === 'record') {
      openGlobalSearch(searchQuery || [item.label, item.description].filter(Boolean).join(' '), item)
      return
    }

    if (!item?.path) return
    setShowSearchResults(false)
    setSearchQuery('')
    setRecordResults([])
    navigate(item.path)
  }

  const notifs = notifications || []
  const unreadCount = Number(notifSummary.unread || 0)
  const isTenantPage = location.pathname.startsWith('/tenant')
  const tenantUnits = Array.from(new Set((Array.isArray(user?.tenants) ? user.tenants : [user?.tenant]).filter(Boolean).map((tenant) => tenant?.unit?.unit_number || tenant?.unit?.name || '').filter(Boolean)))
  const showUnitFilter = isTenantPage && user?.role === 'tenant' && tenantUnits.length > 1

  const roleDisplay = user?.role === 'super_admin'
    ? 'Super Admin'
    : user?.role === 'facility_manager'
      ? 'Facility Manager'
      : user?.role === 'finance'
        ? 'Finance'
        : user?.role === 'tenant'
          ? 'Tenant'
          : 'Admin'

  return (
    <header className={`fixed top-0 left-0 right-0 lg:left-[240px] z-40 h-16 border-b flex items-center px-4 lg:px-6 gap-4 transition-colors backdrop-blur-xl ${isSuperAdmin ? 'glass border-violet-200/60 dark:border-violet-700/40' : 'glass border-slate-200/60 dark:border-slate-700/50'}`}>
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors">
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden sm:flex items-center gap-2">
        <div>
          <h1 className="font-display font-700 text-[17px] text-slate-800 dark:text-white">{title}</h1>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto lg:mx-0 lg:ml-8">
        <div ref={searchRef} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search pages, bills, tenants..."
            value={searchQuery}
            onFocus={() => setShowSearchResults(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSearchResults(true)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                if (!combinedSearchResults.length) return
                e.preventDefault()
                setSelectedSearchIndex((prev) => (prev + 1) % combinedSearchResults.length)
              }
              if (e.key === 'ArrowUp') {
                if (!combinedSearchResults.length) return
                e.preventDefault()
                setSelectedSearchIndex((prev) => (prev - 1 + combinedSearchResults.length) % combinedSearchResults.length)
              }
              if (e.key === 'Enter') {
                e.preventDefault()
                if (searchQuery.trim().length >= 2) {
                  openGlobalSearch(searchQuery, combinedSearchResults[selectedSearchIndex])
                } else {
                  handleSearchNavigate(combinedSearchResults[selectedSearchIndex])
                }
              }
              if (e.key === 'Escape') setShowSearchResults(false)
            }}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-100/80 dark:bg-slate-700/50 border border-transparent focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none transition-all"
          />
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl shadow-2xl shadow-slate-200/60 dark:shadow-black/40 border border-slate-200/60 dark:border-slate-700/50 overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
              <div className="px-3 py-2 border-b border-slate-200/60 dark:border-slate-700/50 text-[11px] text-slate-400 font-mono uppercase tracking-wider">
                {searchQuery.trim() ? 'Pages and Records' : 'Quick Access'}
              </div>

              {searchLoading && searchQuery.trim().length >= 2 && <div className="px-4 py-3 text-sm text-slate-400">Searching records...</div>}

              {!searchLoading && combinedSearchResults.length === 0 ? (
                <div className="px-4 py-4 text-sm text-slate-400">No matching pages or records found.</div>
              ) : (
                <>
                  {combinedSearchResults.map((item, index) => {
                    const Icon = item.icon || (item.resultType === 'record' ? Hash : Search)
                    return (
                      <button
                        key={`${item.resultType}-${item.id || item.path}`}
                        onClick={() => handleSearchNavigate(item)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${index === selectedSearchIndex ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</p>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{item.category}</span>
                            </div>
                            <p className="text-xs text-slate-400 truncate">{item.description || item.path}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      </button>
                    )
                  })}
                  {searchQuery.trim().length >= 2 && (
                    <button
                      onClick={() => openGlobalSearch(searchQuery, combinedSearchResults[selectedSearchIndex])}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left border-t border-slate-200/60 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">See all results for "{searchQuery}"</p>
                        <p className="text-xs text-slate-400">Open the full search results view with exact matching content.</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {showUnitFilter && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50">
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-transparent border-none outline-none cursor-pointer">
              <option value="all">All Units</option>
              {tenantUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
            </select>
          </div>
        )}

        <button onClick={toggleTheme} className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-700 dark:hover:text-slate-200 transition-all" title={isDark ? 'Light mode' : 'Dark mode'}>
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div ref={notifRef} className="relative">
          <button onClick={() => { setShowNotifs((value) => !value); setShowProfile(false) }} className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-800" />
                <span className="absolute -top-0.5 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-800">{unreadCount > 9 ? '9+' : unreadCount}</span>
              </>
            )}
          </button>

          {showNotifs && (
            <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 glass rounded-2xl shadow-2xl shadow-slate-200/60 dark:shadow-black/40 border border-slate-200/60 dark:border-slate-700/50 overflow-hidden animate-in z-50 max-h-[70vh] overflow-y-auto">
              <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/50">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-sm text-slate-800 dark:text-white">Notifications</p>
                  <span className="text-[10px] font-mono text-slate-400">{notifSummary.unread} unread � {notifSummary.total} total</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[['unread', 'Unread'], ['all', 'All']].map(([value, label]) => (
                    <button key={value} onClick={() => setNotifFilter(value)} className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${notifFilter === value ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={handleReadAllNotifications} disabled={notifSummary.unread === 0} className="mt-3 w-full px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
                  <CheckCheck className="w-4 h-4" />Read all
                </button>
              </div>
              {notifLoading ? <div className="p-4 text-xs text-slate-400">Loading notifications...</div> : notifs.length === 0 ? <div className="p-4 text-xs text-slate-400">No notifications found.</div> : notifs.map((notification) => {
                const cfg = notifTypeConfig[notification.type] || notifTypeConfig.info
                const Icon = cfg.icon
                return (
                  <button key={notification.id} onClick={() => handleNotificationClick(notification)} className={`w-full text-left flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors border-b border-slate-100 dark:border-slate-700/30 last:border-0 ${notification.is_read ? '' : 'bg-blue-50/60 dark:bg-blue-900/10'}`}>
                    <Icon className={`w-4 h-4 mt-0.5 ${cfg.iconClass}`} />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{notification.title}</p>
                        {!notification.is_read && <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-slate-400 mt-2">{notification.created_at ? new Date(notification.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</p>
                    </div>
                  </button>
                )
              })}
              <button onClick={() => { setShowNotifs(false); navigate(getNotificationsPath()) }} className="w-full px-4 py-3 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-100 dark:border-slate-700/30">View all notifications</button>
            </div>
          )}
        </div>

        <div ref={profileRef} className="relative">
          <button onClick={() => { setShowProfile((value) => !value); setShowNotifs(false) }} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow ${isSuperAdmin ? 'bg-gradient-to-br from-violet-600 to-indigo-500' : 'bg-gradient-to-br from-blue-500 to-cyan-400'}`}>{user?.initials || 'U'}</div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{user?.name || 'User'}</p>
                {isSuperAdmin && <Shield className="w-3 h-3 text-violet-500" />}
              </div>
              <p className="text-[10px] text-slate-400 capitalize">{roleDisplay}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 glass rounded-2xl shadow-2xl shadow-slate-200/60 dark:shadow-black/40 border border-slate-200/60 dark:border-slate-700/50 overflow-hidden animate-in z-50">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-sm text-slate-800 dark:text-white">{user?.name}</p>
                  {isSuperAdmin && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white leading-none">SA</span>}
                </div>
                <p className="text-xs text-slate-400">{user?.email}</p>
                {isSuperAdmin && <div className="mt-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/40"><Shield className="w-3 h-3 text-violet-500" /><span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400">Super Administrator</span></div>}
              </div>
              <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><LogOut className="w-4 h-4" />Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}








