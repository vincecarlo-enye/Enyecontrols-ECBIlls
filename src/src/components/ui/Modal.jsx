import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/**
 * Modal — always fixed to viewport center, never causes scroll/overflow.
 * Stays in DOM (never unmounts) so close animation plays cleanly.
 */
export default function Modal({ isOpen, onClose, title, subtitle, children, size = 'max-w-3xl' }) {
  useEffect(() => {
    if (!isOpen) return
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [isOpen, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
      /* sm+ = centered */
      className="sm:items-center sm:p-4"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.52)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Panel */}
      <div
        className={`relative w-full ${size} bg-white dark:bg-slate-900 m-5 flex flex-col overflow-hidden rounded-2xl sm:rounded-2xl shadow-2xl`}
        style={{
          maxHeight: '90svh',
          /* sm: scale, mobile: slide from bottom */
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          transition: 'opacity 0.22s ease, transform 0.28s cubic-bezier(0.34,1.3,0.64,1)',
        }}
      >
        {/* Mobile drag pill */}
        <div className="sm:hidden flex-shrink-0 flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 flex items-start justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="min-w-0 flex-1 pr-3">
            <h2 className="font-semibold text-[16px] sm:text-[17px] text-slate-800 dark:text-white leading-tight">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>,
     document.body
  )
}
