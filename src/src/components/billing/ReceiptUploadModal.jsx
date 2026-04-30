import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Upload, FileImage, CheckCircle2, ChevronRight, Calendar, Hash, FileText } from 'lucide-react'

function peso(value) {
  return Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function getPenaltyAmount(bill) {
  const penalties = Array.isArray(bill?.penalties)
    ? bill.penalties
    : Array.isArray(bill?.bill_penalties)
      ? bill.bill_penalties
      : Array.isArray(bill?.raw?.penalties)
        ? bill.raw.penalties
        : Array.isArray(bill?.raw?.bill_penalties)
          ? bill.raw.bill_penalties
          : []
  const explicit = Number(
    bill?.penaltyAmount ??
      bill?.penalty_amount ??
      bill?.late_fee ??
      bill?.lateFee ??
      bill?.raw?.penalty_amount ??
      bill?.raw?.late_fee ??
      bill?.raw?.lateFee ??
      0
  )

  return penalties.reduce(
    (sum, penalty) => sum + Number(penalty?.penalty_amount ?? penalty?.amount ?? 0),
    explicit
  )
}

export default function ReceiptUploadModal({ bill, isOpen, onClose, onSubmit }) {
  const [step, setStep] = useState(1)
  const [receiptFile, setReceiptFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [form, setForm] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    note: '',
  })

  if (!isOpen || !bill) return null
  const penaltyAmount = getPenaltyAmount(bill)
  const subtotal = Number(bill?.raw?.subtotal ?? bill?.subtotal ?? 0)
  const rawPreviousBalance = Number(bill?.raw?.previous_balance ?? bill?.previous_balance ?? 0)
  const previousBalance = Math.max(0, rawPreviousBalance - penaltyAmount)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setReceiptFile(file)
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl('pdf')
    }
  }

  const handleSubmit = async () => {
    const receiptData = {
      proofImageFile: receiptFile,
      receiptImage: previewUrl,
      paymentDate: form.paymentDate,
      referenceNumber: form.referenceNumber,
      note: form.note,
      submittedBy: 'tenant',
    }
    await onSubmit(bill.id, receiptData)
    setStep(2)
  }

  const handleClose = () => {
    setStep(1)
    setReceiptFile(null)
    setPreviewUrl(null)
    setForm({ paymentDate: new Date().toISOString().split('T')[0], referenceNumber: '', note: '' })
    onClose()
  }

  const isValid = receiptFile && form.paymentDate && form.referenceNumber.trim()

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={step === 1 ? handleClose : undefined} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-600 to-cyan-500">
          <h2 className="text-white font-semibold text-sm">
            {step === 1 ? 'Upload Payment Receipt' : 'Receipt Submitted'}
          </h2>
          <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              {/* Bill Info */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Bill ID</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200">{bill.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unit</span>
                  <span className="text-slate-700 dark:text-slate-200">{bill.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Billing Period</span>
                  <span className="text-slate-700 dark:text-slate-200">{bill.billingPeriod}</span>
                </div>
                {subtotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-slate-700 dark:text-slate-200">₱{peso(subtotal)}</span>
                  </div>
                )}
                {previousBalance > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Previous Balance</span>
                    <span className="text-slate-700 dark:text-slate-200">₱{peso(previousBalance)}</span>
                  </div>
                )}
                {penaltyAmount > 0 && (
                  <div className="flex justify-between rounded-lg bg-amber-50 px-2 py-1 dark:bg-amber-900/20">
                    <span className="font-medium text-amber-700 dark:text-amber-300">Late Payment Penalty</span>
                    <span className="font-semibold text-amber-700 dark:text-amber-300">₱{peso(penaltyAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">Amount Due</span>
                  <span className="text-blue-600 dark:text-blue-400">₱{peso(bill.amount)}</span>
                </div>
              </div>

              {/* Receipt Upload */}
              <div>
                <label className="text-xs font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                  <FileImage className="w-3 h-3" /> Upload Receipt Image *
                </label>
                <label className={`relative flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all overflow-hidden ${previewUrl ? 'h-44 p-0' : 'h-28 p-4'}`}>
                  {!previewUrl && (
                    <>
                      <Upload className="w-5 h-5 text-slate-400 mb-1.5" />
                      <span className="text-xs text-slate-500">Click to upload (JPG, PNG)</span>
                    </>
                  )}
                  {previewUrl && previewUrl !== 'pdf' && (
                    <img src={previewUrl} className="absolute inset-0 w-full h-full object-contain p-2" alt="Receipt preview" />
                  )}
                  {previewUrl === 'pdf' && (
                    <div className="flex flex-col items-center text-slate-500">
                      <FileText className="w-8 h-8 mb-1" />
                      <span className="text-xs">PDF uploaded: {receiptFile?.name}</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
                {receiptFile && (
                  <p className="text-[10px] text-slate-400 mt-1 truncate">{receiptFile.name}</p>
                )}
              </div>

              {/* Payment Date */}
              <div>
                <label className="text-xs font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Payment Date *
                </label>
                <input
                  type="date"
                  value={form.paymentDate}
                  onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
                />
              </div>

              {/* Reference Number */}
              <div>
                <label className="text-xs font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Reference Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. GCASH-928374"
                  value={form.referenceNumber}
                  onChange={e => setForm(p => ({ ...p, referenceNumber: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400"
                />
              </div>

              {/* Note */}
              <div>
                <label className="text-xs font-mono uppercase text-slate-400 mb-1.5 block">Note (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Any additional information..."
                  value={form.note}
                  onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 resize-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-8 space-y-3">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-white text-lg">Receipt Submitted!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Your payment receipt is now <strong>pending verification</strong>. Finance will review and confirm your payment shortly.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-left space-y-1 mt-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Reference</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200">{form.referenceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Date</span>
                  <span className="text-slate-700 dark:text-slate-200">{form.paymentDate}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          {step === 1 ? (
            <>
              <button onClick={handleClose} className="px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                Cancel
              </button>
              <button
                disabled={!isValid}
                onClick={handleSubmit}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Submit Receipt <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button onClick={handleClose} className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
              Close
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
