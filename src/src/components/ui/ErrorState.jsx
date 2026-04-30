/**
 * ErrorState.jsx
 * Standardised error display. Use when a data-fetch or action fails.
 *
 * Props:
 *   title    – short error headline  (default: 'Something went wrong')
 *   message  – descriptive text
 *   onRetry  – optional callback; renders a Retry button when provided
 */

import { AlertTriangle } from 'lucide-react'

export default function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-red-500" />
      </div>

      <h3 className="font-semibold text-slate-800 dark:text-white text-base mb-1">
        {title}
      </h3>

      <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-5">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm shadow-blue-500/25"
        >
          Try Again
        </button>
      )}
    </div>
  )
}
