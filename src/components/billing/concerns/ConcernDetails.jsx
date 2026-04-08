/**
 * components/billing/concerns/ConcernDetails.jsx
 * Unified detail modal for viewing a billing concern ticket.
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  UserCheck,
  XCircle,
  Info,
  Search,
  CheckCircle2,
  DollarSign,
  Send,
  RotateCcw,
} from 'lucide-react'
import TicketStatusBadge from './TicketStatusBadge'
import TicketTimeline from './TicketTimeline'

function safeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

export default function ConcernDetails({ concern, isOpen, onClose, role, onAction }) {
  const [note, setNote] = useState('')
  const [activeAction, setActiveAction] = useState(null)

  if (!isOpen || !concern) return null

  const concernId = safeText(concern?.id, '-')
  const billId = safeText(concern?.billId, '-')
  const status = safeText(concern?.status, 'pending')
  const timeline = Array.isArray(concern?.timeline) ? concern.timeline : []

  const handleAction = async (action) => {
    const result = await onAction(concern.id, action, note.trim())
    if (result === false) return

    setNote('')
    setActiveAction(null)
    onClose()
  }

  const noteLabel = {
    assignToFinance: 'Add note for Finance team (optional)',
    reject: 'Reason for rejection',
    requestInfo: 'What information is needed?',
    investigate: 'Investigation notes',
    resolve: 'Resolution summary',
    adjust: 'Adjustment details',
    respond: 'Response to tenant',
    respondToRequest: 'Provide the requested information',
    reopen: 'Reason for reopening',
  }[activeAction] || 'Add a note...'

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-700 animate-in"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">
                Ticket Details
              </h2>
              <TicketStatusBadge status={status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              {concernId} · Bill: {billId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              ['Tenant', concern?.tenantName],
              ['Company', concern?.company],
              ['Unit', concern?.unit],
              ['Email', concern?.email],
              ['Category', concern?.category],
              ['Date Submitted', concern?.dateSubmitted],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] font-mono uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5">
                  {safeText(value, '-')}
                </p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1.5">
              Concern Description
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-700/50">
              {safeText(concern?.message, 'No description provided.')}
            </div>
          </div>

          {(safeText(concern?.adminNotes) || safeText(concern?.financeNotes)) && (
            <div className="space-y-3">
              {safeText(concern?.adminNotes) && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">
                    Admin Notes
                  </p>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl px-4 py-3 text-xs text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/40">
                    {safeText(concern?.adminNotes)}
                  </div>
                </div>
              )}
              {safeText(concern?.financeNotes) &&
                safeText(concern?.financeNotes) !== safeText(concern?.adminNotes) && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">
                      Finance Notes
                    </p>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-4 py-3 text-xs text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40">
                      {safeText(concern?.financeNotes)}
                    </div>
                  </div>
                )}
            </div>
          )}

          <div>
            <p className="text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-3">
              Activity Timeline
            </p>
            <TicketTimeline timeline={timeline} />
          </div>

          {activeAction && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/40 space-y-3">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                {noteLabel}
              </p>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter your note here..."
                className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(activeAction)}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => {
                    setActiveAction(null)
                    setNote('')
                  }}
                  className="px-4 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
          {(role === 'admin' || role === 'super_admin') && !activeAction && (
            <div className="flex flex-wrap gap-2">
              {(status === 'pending' || status === 'reopened') && (
                <button
                  onClick={() => setActiveAction('assignToFinance')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Assign to Finance
                </button>
              )}
              {(status === 'pending' || status === 'reopened') && (
                <>
                  <button
                    onClick={() => setActiveAction('requestInfo')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5" /> Request Info
                  </button>
                  <button
                    onClick={() => setActiveAction('reject')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </>
              )}
            </div>
          )}

          {role === 'finance' && !activeAction && (
            <div className="flex flex-wrap gap-2">
              {(status === 'assigned' || status === 'reopened') && (
                <button
                  onClick={() => setActiveAction('investigate')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors"
                >
                  <Search className="w-3.5 h-3.5" /> Start Investigating
                </button>
              )}
              {['assigned', 'investigating', 'awaiting_tenant', 'reopened'].includes(status) && (
                <>
                  <button
                    onClick={() => setActiveAction('respond')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" /> Respond
                  </button>
                  <button
                    onClick={() => setActiveAction('resolve')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                  </button>
                  <button
                    onClick={() => setActiveAction('adjust')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors"
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Adjust Bill
                  </button>
                </>
              )}
            </div>
          )}

          {role === 'tenant' && !activeAction && (
            <div className="flex gap-2">
              {status === 'awaiting_tenant' && (
                <button
                  onClick={() => setActiveAction('respondToRequest')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Requested Info
                </button>
              )}
              {['resolved', 'adjusted', 'closed', 'rejected'].includes(status) && (
                <button
                  onClick={() => setActiveAction('reopen')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reopen Ticket
                </button>
              )}
            </div>
          )}

          {!activeAction && (
            <button
              onClick={onClose}
              className="ml-auto px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
