/**
 * AdminTenantReports.jsx
 * Admin page for billing concern tickets.
 */

import { Ticket } from 'lucide-react'
import AdminBillingConcerns from '@/pages/admin/BillingConcerns'

export default function AdminTenantReports() {
  return (
    <div className="space-y-5 animate-in">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/30">
          <Ticket className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>

        <div>
          <h1 className="font-display font-700 text-xl text-slate-800 dark:text-white">
            Tenant Reports
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Review and manage tenant billing dispute tickets
          </p>
        </div>
      </div>

      <div className="h-px bg-slate-200 dark:bg-slate-700/50" />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 shadow-md overflow-hidden">
        <AdminBillingConcerns />
      </div>
    </div>
  )
}
