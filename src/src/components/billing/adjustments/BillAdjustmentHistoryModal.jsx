import { formatDate } from '@/utils/filterUtils'
import Modal from '@/components/ui/Modal'
import AdjustmentStatusBadge from './AdjustmentStatusBadge'

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}


export default function BillAdjustmentHistoryModal({ bill, history = [], isOpen, onClose }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjustment History"
      subtitle={bill ? `Bill ${bill.id}` : ''}
      size="max-w-5xl"
    >
      {history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800/50">
          No adjustments recorded for this bill yet.
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-800 dark:text-white">{entry.id}</p>
                    <AdjustmentStatusBadge status={entry.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {entry.adjustmentType?.replace(/_/g, ' ')} by {entry?.adjustedBy?.name || 'Finance'} on {formatDate(entry.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono uppercase tracking-wide text-slate-400">Net Difference</p>
                  <p className={`text-lg font-bold ${Number(entry?.diffSnapshot?.totalAdjustmentAmount || 0) >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {Number(entry?.diffSnapshot?.totalAdjustmentAmount || 0) >= 0 ? '+' : ''}
                    PHP {formatCurrency(entry?.diffSnapshot?.totalAdjustmentAmount)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                {[
                  ['Old Total', entry?.originalSnapshot?.grandTotal],
                  ['New Total', entry?.adjustedSnapshot?.grandTotal],
                  ['Remaining Balance', entry?.adjustedSnapshot?.remainingBalance],
                  ['Credit / Overpayment', entry?.adjustedSnapshot?.creditAmount],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800/60">
                    <p className="text-[10px] font-mono uppercase tracking-wide text-slate-400">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">PHP {formatCurrency(value)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Changed Line Items</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60">
                          {['Item', 'Original', 'Adjustment', 'New'].map((header) => (
                            <th key={header} className="px-4 py-2 text-left text-[10px] font-mono uppercase tracking-wide text-slate-400">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(entry?.diffSnapshot?.lineItems || []).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-xs text-slate-400">
                              No line-item changes captured.
                            </td>
                          </tr>
                        ) : (
                          entry.diffSnapshot.lineItems.map((item) => (
                            <tr key={item.key} className="border-t border-slate-100 dark:border-slate-800">
                              <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{item.label}</td>
                              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">PHP {formatCurrency(item.originalAmount)}</td>
                              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">PHP {formatCurrency(item.adjustmentAmount)}</td>
                              <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">PHP {formatCurrency(item.adjustedAmount)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                    <p className="text-[10px] font-mono uppercase tracking-wide text-slate-400">Reason</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{entry.otherReason || entry.reason || '-'}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                    <p className="text-[10px] font-mono uppercase tracking-wide text-slate-400">Internal Notes</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{entry.notes || '-'}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                    <p className="text-[10px] font-mono uppercase tracking-wide text-slate-400">Approval</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                      {entry?.approvedBy?.name
                        ? `${entry.approvedBy.name} (${entry.approvedBy.role})`
                        : entry.status === 'rejected'
                          ? `Rejected by ${entry?.rejectedBy?.name || 'Approver'}`
                          : 'Not yet approved'}
                    </p>
                    {entry.rejectionReason ? (
                      <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{entry.rejectionReason}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
