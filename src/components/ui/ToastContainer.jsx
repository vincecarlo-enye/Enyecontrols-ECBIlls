import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import { useApp } from '@/context/AppContext'

const iconMap = {
  success: { icon: CheckCircle2, classes: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700/50', text: 'text-emerald-700 dark:text-emerald-300', icon_c: 'text-emerald-500' },
  info:    { icon: Info,          classes: 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700/50',       text: 'text-blue-700 dark:text-blue-300',     icon_c: 'text-blue-500' },
  warning: { icon: AlertTriangle, classes: 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700/50',  text: 'text-amber-700 dark:text-amber-300',   icon_c: 'text-amber-500' },
  error:   { icon: AlertTriangle, classes: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700/50',          text: 'text-red-700 dark:text-red-300',       icon_c: 'text-red-500' },
}

export default function ToastContainer() {
  const { toasts, removeToast } = useApp()

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => {
        const cfg = iconMap[toast.type] || iconMap.success
        const Icon = cfg.icon
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl shadow-black/10 backdrop-blur-xl text-sm font-medium min-w-[280px] max-w-[360px] ${cfg.classes} ${cfg.text}`}
            style={{ animation: 'slideInRight 0.3s ease-out forwards' }}
          >
            <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.icon_c}`} />
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
