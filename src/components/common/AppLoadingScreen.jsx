export default function AppLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-5 py-4 shadow-sm">
        <span className="inline-flex h-3 w-3 rounded-full bg-violet-500 animate-pulse" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Loading...
        </p>
      </div>
    </div>
  )
}
