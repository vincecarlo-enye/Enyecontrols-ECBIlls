/**
 * pages/tenant/BillingReports.jsx
 * Tenant's "My Billing Reports" page — shows their submitted concerns.
 */

import { useState } from 'react'
import { AlertCircle, Plus, X } from 'lucide-react'
import { useBillingConcerns } from '@/context/BillingConcernContext'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { usePageLoader } from '@/hooks/usePageLoader'
import { useBills } from '@/components/billing/hooks/useBills'
import TicketCard from '@/components/billing/concerns/TicketCard'
import TicketStatusBadge from '@/components/billing/concerns/TicketStatusBadge'
import ConcernModal from '@/components/billing/concerns/ConcernModal'
import ConcernDetails from '@/components/billing/concerns/ConcernDetails'

const FILTERS = ['all', 'pending', 'assigned', 'investigating', 'resolved', 'adjusted', 'closed', 'rejected', 'reopened']

export default function TenantBillingReports() {
  const loading = usePageLoader(600)
  const { concerns, submitConcern, reopenTicket } = useBillingConcerns()
  const { user } = useAuth()
  const { addToast } = useApp()
  const { bills } = useBills()

  const [filter, setFilter] = useState('all')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [concernBill, setConcernBill] = useState(null)
  const [concernOpen, setConcernOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedConcern, setSelectedConcern] = useState(null)

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-48" />
      {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-700 rounded-2xl" />)}
    </div>
  )

  const tenantUnit = user?.unit
  const myConcerns = concerns.filter(c => c.unit === tenantUnit || c.tenantId === user?.tenantId)
  const filtered = filter === 'all' ? myConcerns : myConcerns.filter(c => c.status === filter)
  const myBills = bills.filter(b => b.unit === tenantUnit)

  const handlePickBill = (bill) => {
    setConcernBill(bill)
    setPickerOpen(false)
    setConcernOpen(true)
  }

  const handleSubmit = (data) => {
    submitConcern({ ...data, user })
    addToast('Billing concern submitted successfully!', 'success')
    setConcernOpen(false)
    setConcernBill(null)
  }

  const handleAction = (id, action, note) => {
    if (action === 'reopen') {
      reopenTicket(id, note)
      addToast('Ticket reopened.', 'info')
    }
  }

  const openDetail = (concern) => { setSelectedConcern(concern); setDetailOpen(true) }

  const counts = {
    total:    myConcerns.length,
    pending:  myConcerns.filter(c => ['pending', 'reopened'].includes(c.status)).length,
    active:   myConcerns.filter(c => ['assigned', 'investigating'].includes(c.status)).length,
    resolved: myConcerns.filter(c => ['resolved', 'adjusted', 'closed'].includes(c.status)).length,
  }

  return (
    <div className="space-y-5 animate-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-700 text-xl text-slate-800 dark:text-white">My Billing Reports</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track your submitted billing concerns</p>
        </div>
        <button
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" /> Report Concern
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Tickets',   value: counts.total,    cls: 'text-blue-600 dark:text-blue-400' },
          { label: 'Needs Attention', value: counts.pending,  cls: 'text-amber-600 dark:text-amber-400' },
          { label: 'In Progress',     value: counts.active,   cls: 'text-purple-600 dark:text-purple-400' },
          { label: 'Resolved',        value: counts.resolved, cls: 'text-emerald-600 dark:text-emerald-400' },
        ].map((c) => (
          <div key={c.label} className="glass rounded-2xl p-4 shadow-md">
            <p className="text-xs text-slate-400 font-mono uppercase tracking-wide">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.cls}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              filter === f ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No billing concerns found</p>
          <p className="text-xs text-slate-400 mt-1">
            {filter === 'all' ? "You haven't submitted any concerns yet." : `No tickets with status "${filter}".`}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setPickerOpen(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Submit Your First Concern
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((concern) => (
            <TicketCard key={concern.id} concern={concern} onView={openDetail} />
          ))}
        </div>
      )}

      {/* Bill Picker Modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPickerOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-800 dark:text-white">Select Bill to Report</h3>
              <button onClick={() => setPickerOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-400 mb-3">Choose the bill you want to raise a concern about.</p>
              {myBills.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No bills found for your unit.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {myBills.map((bill) => (
                    <button
                      key={bill.id}
                      onClick={() => handlePickBill(bill)}
                      className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-slate-400">{bill.id}</span>
                        <TicketStatusBadge status={bill.status} size="xs" />
                      </div>
                      <div className="font-medium text-sm text-slate-700 dark:text-slate-200 mt-0.5">{bill.month}</div>
                      <div className="text-xs text-slate-500 mt-0.5">₱{bill.amount?.toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConcernModal
        bill={concernBill}
        isOpen={concernOpen}
        onClose={() => { setConcernOpen(false); setConcernBill(null) }}
        onSubmit={handleSubmit}
      />

      <ConcernDetails
        concern={selectedConcern}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        role="tenant"
        onAction={handleAction}
      />
    </div>
  )
}
