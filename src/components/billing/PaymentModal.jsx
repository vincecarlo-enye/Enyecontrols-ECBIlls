import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, ChevronRight, FileText, Upload, X } from 'lucide-react'

const PAYMENT_METHODS = ['GCash', 'Bank Transfer', 'Cash', 'Other']

export default function PaymentModal({ bill, isOpen, onClose, onPaymentComplete }) {
  const [step, setStep] = useState(1)
  const [receipt, setReceipt] = useState(null)
  const [preview, setPreview] = useState(null)
  const [form, setForm] = useState({
    method: 'GCash',
    notes: '',
  })

  if (!isOpen || !bill) return null

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setReceipt(file)
    setPreview(file.type.startsWith('image') ? URL.createObjectURL(file) : 'pdf')
  }

  const handleSubmit = () => {
    onPaymentComplete?.({
      billId: bill.id,
      method: form.method,
      notes: form.notes,
      receipt,
    })
    setStep(2)
  }

  const handleClose = () => {
    setStep(1)
    setReceipt(null)
    setPreview(null)
    setForm({ method: 'GCash', notes: '' })
    onClose?.()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4">
          <h2 className="text-sm font-semibold text-white">
            {step === 1 ? 'Upload Payment Receipt' : 'Payment Submitted'}
          </h2>
          <button onClick={handleClose} className="text-white/80 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-5">
              <div className="rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Reference</span>
                  <span className="text-slate-700 dark:text-slate-200">{bill.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Billing Period</span>
                  <span className="text-slate-700 dark:text-slate-200">{bill.billingPeriod}</span>
                </div>
                <div className="flex justify-between font-semibold text-blue-600 dark:text-blue-400">
                  <span>Amount Due</span>
                  <span>PHP {Number(bill.amount || 0).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-slate-400">Payment Method</label>
                <select
                  value={form.method}
                  onChange={(event) => setForm((current) => ({ ...current, method: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method}>{method}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-slate-400">Upload Receipt</label>
                <label
                  className={`relative mt-2 flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 transition-all hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 ${
                    preview ? 'h-64 p-0' : 'h-32 p-6'
                  }`}
                >
                  {!preview ? (
                    <>
                      <Upload className="mb-2 h-6 w-6 text-slate-400" />
                      <span className="text-xs text-slate-500">Click to upload receipt (JPG, PNG, PDF)</span>
                    </>
                  ) : null}
                  {preview && preview !== 'pdf' ? (
                    <img src={preview} className="absolute inset-0 h-full w-full object-contain p-3" />
                  ) : null}
                  {preview === 'pdf' ? (
                    <div className="flex flex-col items-center text-slate-500">
                      <FileText className="mb-2 h-10 w-10" />
                      <span className="text-sm">PDF Uploaded</span>
                    </div>
                  ) : null}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-slate-400">Notes</label>
                <textarea
                  rows="3"
                  placeholder="Optional"
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-8 text-center">
              <div className="flex justify-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Receipt Submitted</h3>
              <p className="text-sm text-slate-500">
                Your payment is now <b>Pending Verification</b>. The admin will review your receipt shortly.
              </p>
            </div>
          )}
        </div>

        {step === 1 ? (
          <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-700">
            <button
              onClick={handleClose}
              className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              disabled={!receipt}
              onClick={handleSubmit}
              className="flex items-center gap-1 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Submit Receipt
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
