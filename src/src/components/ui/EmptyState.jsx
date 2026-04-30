/**
 * EmptyState.jsx
 * Standardised empty-list display. Use when a filtered or fetched list is empty.
 *
 * Props:
 *   icon      – Lucide icon component  (default: InboxIcon)
 *   title     – headline text
 *   message   – supporting text
 *   action    – optional { label, onClick } to render a CTA button
 */

import { Inbox } from 'lucide-react'

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data found',
  message = 'There is nothing to display right now.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>

      <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-base mb-1">
        {title}
      </h3>

      <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-5">
        {message}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm shadow-blue-500/25"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
