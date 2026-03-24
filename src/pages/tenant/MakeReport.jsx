import { usePageLoader } from '@/hooks/usePageLoader'
import { TenantDashboardSkeleton } from '@/components/skeletons'
import { MessageSquarePlus } from 'lucide-react'

export default function MakeReport() {
  const loading = usePageLoader(600)
  if (loading) return <TenantDashboardSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="font-bold text-xl text-slate-800 dark:text-white">Make a Report</h1>
        <p className="text-sm text-slate-400 mt-0.5">Submit a billing concern or maintenance request</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
          <MessageSquarePlus className="w-7 h-7 text-blue-500" />
        </div>
        <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">Report Submission</p>
        <p className="text-sm text-slate-400 max-w-xs">Use the Billing Reports tab to raise billing concerns or contact your property manager directly.</p>
      </div>
    </div>
  )
}
