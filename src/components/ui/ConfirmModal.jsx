import { AlertTriangle, X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function ConfirmModal({ isOpen, title, message, confirmLabel = 'Confirm Delete', confirmClass = 'bg-red-600 hover:bg-red-700', onConfirm, onCancel }) {

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onCancel])

  if (!isOpen) return null

return createPortal(
  <div className="fixed inset-0 z-[520] flex items-center justify-center px-4">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeInBg"
      onClick={onCancel}
    />

    {/* Modal */}
    <div className="relative z-10 w-full max-w-sm glass rounded-2xl shadow-2xl shadow-black/20 overflow-hidden animate-[modalPop_0.25s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">

      {/* Icon header */}
      <div className="flex flex-col items-center px-6 pt-7 pb-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>

        <h3 className="font-display font-700 text-[17px] text-slate-800 dark:text-white mb-2">
          {title || 'Are you sure?'}
        </h3>

        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {message || 'This action cannot be undone.'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 px-6 pb-6">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          Cancel
        </button>

        <button
          onClick={onConfirm}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white shadow-lg transition-all hover:-translate-y-0.5 ${confirmClass}`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>

    <style>{`
      @keyframes fadeInBg { from { opacity: 0 } to { opacity: 1 } }
      @keyframes modalPop {
        from { opacity: 0; transform: scale(0.92) translateY(10px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
    `}</style>
  </div>,
  document.body
)
}
