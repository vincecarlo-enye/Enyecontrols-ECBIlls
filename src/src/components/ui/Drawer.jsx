import { useEffect } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

export default function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  variant = 'side',
  panelClassName = '',
}) {
  useEffect(() => {
    if (!isOpen) return
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const isCentered = variant === 'center'

  return createPortal(
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`
          fixed inset-0 z-[400]
          bg-black/50 backdrop-blur-sm
          transition-opacity duration-200
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      />

      <div
        className={`
          fixed z-[410]
          ${isCentered
            ? 'inset-0 flex items-center justify-center px-4 py-6 sm:px-6 pointer-events-none'
            : `top-20 right-0 w-full max-w-[440px] max-h-[90vh] flex flex-col overflow-hidden transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`
          }
        `}
      >
        <div
          role="dialog"
          aria-modal="true"
          className={`
            ${isCentered
              ? `pointer-events-auto w-full max-w-5xl max-h-[88vh] rounded-3xl transition-all duration-200 ${isOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-[0.98] opacity-0'}`
              : ''
            }
            flex flex-col overflow-hidden
            bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-700
            shadow-[0_0_60px_rgba(0,0,0,0.25)]
            ${panelClassName}
          `}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="min-w-0 flex-1 pr-3">
              <h2 className="font-semibold text-[16px] text-slate-800 dark:text-white leading-tight truncate">
                {title}
              </h2>

              {subtitle && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl
              bg-slate-100 dark:bg-slate-800
              text-slate-500 dark:text-slate-400
              hover:bg-slate-200 dark:hover:bg-slate-700
              hover:text-slate-700 dark:hover:text-white
              transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
