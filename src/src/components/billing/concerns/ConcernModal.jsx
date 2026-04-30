/**
 * components/billing/concerns/ConcernModal.jsx
 * Modal form for tenants to submit a billing concern.
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertCircle, Paperclip, Send } from 'lucide-react'

const CATEGORIES = [
  'Incorrect Amount',
  'Payment Not Reflected',
  'Meter Reading Issue',
  'Billing Breakdown Question',
  'Duplicate Charge',
  'Other',
]

export default function ConcernModal({ bill, isOpen, onClose, onSubmit }) {
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  if (!isOpen || !bill) return null

  const validate = () => {
    const e = {}
    if (!category) e.category = 'Please select a category.'
    if (!message.trim()) e.message = 'Please describe your concern.'
    else if (message.trim().length < 20) e.message = 'Please provide more detail (min 20 characters).'
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSubmitting(true)
    setTimeout(() => {
      onSubmit({ billId: bill.id, category, message: message.trim(), attachment })
      setCategory('')
      setMessage('')
      setAttachment(null)
      setErrors({})
      setSubmitting(false)
      onClose()
    }, 600)
  }

  const handleClose = () => {
    setCategory('')
    setMessage('')
    setAttachment(null)
    setErrors({})
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 animate-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">Report Billing Concern</h2>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{bill.id} · {bill.month}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Bill info summary */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 grid grid-cols-2 gap-3">
            {[
              ['Bill ID', bill.id],
              ['Unit', bill.unit],
              ['Month', bill.month],
              ['Amount', `₱${bill.amount?.toLocaleString()}`],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-[10px] font-mono uppercase tracking-wide text-slate-400">{label}</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5">{val}</p>
              </div>
            ))}
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide block mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setErrors((p) => ({ ...p, category: '' })) }}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border border-transparent text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 transition-all"
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide block mb-1.5">
              Message / Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => { setMessage(e.target.value); setErrors((p) => ({ ...p, message: '' })) }}
              placeholder="Describe your billing concern in detail…"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border border-transparent text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all resize-none"
            />
            {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
            <p className="text-[10px] text-slate-400 mt-1">{message.length} / 500 characters</p>
          </div>

          {/* Attachment */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide block mb-1.5">
              Attachment <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <label className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 cursor-pointer hover:border-blue-400 transition-colors group">
              <Paperclip className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
              <span className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors">
                {attachment ? attachment.name : 'Click to attach a file…'}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf,.xlsx,.csv"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
              />
            </label>
            <p className="text-[10px] text-slate-400 mt-1">Accepted: JPG, PNG, PDF, Excel, CSV</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-all disabled:opacity-60"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? 'Submitting…' : 'Submit Concern'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
