import { createPortal } from 'react-dom'
import { X, CheckCircle2, XCircle, Calendar, Hash, FileImage, User, Building2, Zap, Droplets, Flame } from 'lucide-react'
import BillStatusBadge from './BillStatusBadge'

export default function PaymentReviewModal({ bill, isOpen, onClose, onApprove, onReject }) {
  if (!isOpen || !bill) return null

  const receipt = bill.receipt
  if (!receipt) return null

  const UTILITY_CLS = {
    electricity: 'text-amber-600 dark:text-amber-400',
    water: 'text-cyan-600 dark:text-cyan-400',
    thermal: 'text-rose-600 dark:text-rose-400',
  }
  const UTILITY_ICONS = { electricity: Zap, water: Droplets, thermal: Flame }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 dark:border-slate-700 overflow-hidden" style={{ maxHeight: '90svh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-600 to-blue-500">
          <div>
            <h2 className="text-white font-semibold text-sm">Payment Review</h2>
            <p className="text-white/70 text-xs font-mono">{bill.id}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90svh - 140px)' }}>
          <div className="p-6 space-y-5">

            {/* Tenant & Bill Info */}
            <div className="flex items-start gap-3 flex-wrap">
              <BillStatusBadge status={bill.status} />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{bill.tenant}</p>
                <p className="text-xs text-slate-400">Unit {bill.unit} · {bill.month}</p>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              {[
                { k: 'Invoice ID', v: bill.id, icon: null },
                { k: 'Billing Period', v: bill.billingPeriod, icon: null },
                { k: 'Due Date', v: bill.dueDate, icon: Calendar },
                { k: 'Total Amount', v: `₱${bill.amount.toLocaleString()}`, bold: true },
              ].map(row => (
                <div key={row.k} className="flex justify-between px-4 py-2.5 border-b last:border-0 border-slate-100 dark:border-slate-800 text-sm">
                  <span className="text-slate-400">{row.k}</span>
                  <span className={`text-slate-700 dark:text-slate-200 ${row.bold ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'font-medium'}`}>{row.v}</span>
                </div>
              ))}
            </div>

            {/* Utility Breakdown */}
            {bill.breakdown && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">Utility Breakdown</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(bill.breakdown).map(([key, val]) => {
                    const UIcon = UTILITY_ICONS[key]
                    return (
                      <div key={key} className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                        {UIcon && <UIcon className={`w-4 h-4 mx-auto mb-1 ${UTILITY_CLS[key]}`} />}
                        <p className="text-[10px] font-mono uppercase text-slate-400 capitalize">{key}</p>
                        <p className={`text-sm font-bold ${UTILITY_CLS[key]}`}>₱{val.toLocaleString()}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Receipt Details */}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">Payment Receipt Details</p>
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="flex justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 text-sm">
                  <span className="text-slate-400 flex items-center gap-1"><Hash className="w-3 h-3" /> Reference No.</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-200">{receipt.referenceNumber}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 text-sm">
                  <span className="text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> Payment Date</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{receipt.paymentDate}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 text-sm">
                  <span className="text-slate-400 flex items-center gap-1"><User className="w-3 h-3" /> Submitted By</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200 capitalize">{receipt.submittedBy}</span>
                </div>
                {receipt.note && (
                  <div className="px-4 py-2.5 text-sm">
                    <span className="text-slate-400 block mb-1">Note</span>
                    <span className="text-slate-600 dark:text-slate-300 text-xs">{receipt.note}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Receipt Image */}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                <FileImage className="w-3 h-3" /> Receipt Image
              </p>
              {receipt.receiptImage && receipt.receiptImage !== 'pdf' ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800">
                  <img src={receipt.receiptImage} alt="Payment receipt" className="w-full max-h-64 object-contain p-2" />
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
                  <FileImage className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs text-slate-400">
                    {receipt.receiptImage === 'pdf' ? 'PDF receipt uploaded' : 'No image provided'}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={() => { onReject(bill.id); onClose() }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 transition-all"
          >
            <XCircle className="w-4 h-4" /> Reject Payment
          </button>
          <button
            onClick={() => { onApprove(bill.id); onClose() }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" /> Approve Payment
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
