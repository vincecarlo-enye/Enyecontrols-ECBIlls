import { useState } from 'react'
import { X, Upload, FileImage, FileText, CheckCircle2, ChevronRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { createPortal } from 'react-dom'

const PAYMENT_METHODS = ['GCash', 'Bank Transfer', 'Cash', 'Other']

export default function PaymentModal({ bill, isOpen, onClose, onPaymentComplete }) {
  const { user } = useAuth()

  const [step, setStep] = useState(1)
  const [receipt, setReceipt] = useState(null)
  const [preview, setPreview] = useState(null)

  const [form, setForm] = useState({
    method: 'GCash',
    notes: ''
  })

  if (!isOpen || !bill) return null

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setReceipt(file)

    if (file.type.startsWith('image')) {
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview('pdf')
    }
  }

  const handleSubmit = () => {
    const paymentData = {
      billId: bill.id,
      method: form.method,
      notes: form.notes,
      receipt
    }

    if (onPaymentComplete) {
      onPaymentComplete(paymentData)
    }

    setStep(2)
  }

  const handleClose = () => {
    setStep(1)
    setReceipt(null)
    setPreview(null)
    setForm({ method: 'GCash', notes: '' })
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-600 to-cyan-500">
          <h2 className="text-white font-semibold text-sm">
            {step === 1 ? 'Upload Payment Receipt' : 'Payment Submitted'}
          </h2>

          <button onClick={handleClose} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-5">

              {/* BILL INFO */}
              <div className="bg-slate-50 text-white dark:bg-slate-800 rounded-xl p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Reference</span>
                  <span>{bill.id}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Billing Period</span>
                  <span>{bill.billingPeriod}</span>
                </div>

                <div className="flex justify-between font-semibold text-blue-600">
                  <span>Amount Due</span>
                  <span>₱{bill.amount.toLocaleString()}</span>
                </div>
              </div>

              {/* PAYMENT METHOD */}
              <div>
                <label className="text-xs font-mono uppercase text-slate-400">
                  Payment Method
                </label>

                <select
                  value={form.method}
                  onChange={(e) => setForm(p => ({ ...p, method: e.target.value }))}
                  className="w-full mt-1 px-4 py-2 text-white rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* RECEIPT UPLOAD */}
              <div>
                <label className="text-xs font-mono uppercase text-slate-400">
                  Upload Receipt
                </label>

                <label
                  className={`
                    relative flex flex-col items-center justify-center mt-2 border-2 border-dashed
                    border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer
                    hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 overflow-hidden
                    
                    ${preview ? "h-64 p-0" : "h-32 p-6"}
                  `}
                >

                  {/* DEFAULT STATE */}
                  {!preview && (
                    <>
                      <Upload className="w-6 h-6 text-slate-400 mb-2" />
                      <span className="text-xs text-slate-500">
                        Click to upload receipt (JPG, PNG, PDF)
                      </span>
                    </>
                  )}

                  {/* IMAGE PREVIEW */}
                  {preview && preview !== "pdf" && (
                    <img
                      src={preview}
                      className="absolute inset-0 w-full h-full object-contain p-3"
                    />
                  )}

                  {/* PDF PREVIEW */}
                  {preview === "pdf" && (
                    <div className="flex flex-col items-center text-slate-500">
                      <FileText className="w-10 h-10 mb-2" />
                      <span className="text-sm">PDF Uploaded</span>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                </label>
              </div>

              {/* NOTES */}
              <div>
                <label className="text-xs font-mono uppercase text-slate-400">
                  Notes
                </label>

                <textarea
                  rows="3"
                  placeholder="Optional"
                  value={form.notes}
                  onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full mt-1 px-4 py-2 text-white rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none"
                />
              </div>

            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="text-center py-8 space-y-3">

              <div className="flex justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>

              <h3 className="font-semibold text-white text-lg">
                Receipt Submitted
              </h3>

              <p className="text-sm text-slate-500">
                Your payment is now <b>Pending Verification</b>.
                The admin will review your receipt shortly.
              </p>

            </div>
          )}

        </div>

        {/* FOOTER */}
        {step === 1 && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">

            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-white text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              disabled={!receipt}
              onClick={handleSubmit}
              className="flex items-center gap-1 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              Submit Receipt
              <ChevronRight className="w-4 h-4" />
            </button>

          </div>
        )}

      </div>
    </div>,
    document.body
  )
}