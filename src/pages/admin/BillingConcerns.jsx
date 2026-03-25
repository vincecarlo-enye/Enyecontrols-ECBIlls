import { useEffect, useMemo, useState } from 'react'
import { assignBillingConcern, fetchAdminBillingConcerns, fetchFinanceUsers, updateAdminBillingConcernStatus } from '../../services/adminService/adminBillingConcernService'


const statusBadgeMap = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_review: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

export default function AdminBillingConcerns() {
  const [concerns, setConcerns] = useState([])
  const [financeUsers, setFinanceUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedConcern, setSelectedConcern] = useState(null)
  const [assignUserId, setAssignUserId] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [concernsRes, financeRes] = await Promise.all([
        fetchAdminBillingConcerns(),
        fetchFinanceUsers(),
      ])

      setConcerns(Array.isArray(concernsRes?.data) ? concernsRes.data : [])
      setFinanceUsers(Array.isArray(financeRes?.data) ? financeRes.data : [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load billing concerns.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredConcerns = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return concerns

    return concerns.filter((item) => {
      const tenantName = item?.tenant?.name || ''
      const unitNumber = item?.tenant?.unit?.unit_number || ''
      const subject = item?.subject || ''
      const status = item?.status || ''

      return (
        tenantName.toLowerCase().includes(q) ||
        unitNumber.toLowerCase().includes(q) ||
        subject.toLowerCase().includes(q) ||
        status.toLowerCase().includes(q)
      )
    })
  }, [concerns, search])

  const handleAssign = async (concernId) => {
    if (!assignUserId) return

    try {
      setSubmitting(true)
      const res = await assignBillingConcern(concernId, {
        assigned_to: Number(assignUserId),
        status: 'assigned',
      })

      const updated = res?.data
      if (updated) {
        setConcerns((prev) =>
          prev.map((item) => (String(item.id) === String(concernId) ? updated : item))
        )
      } else {
        await loadData()
      }

      setSelectedConcern(null)
      setAssignUserId('')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to assign concern.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (concernId, status) => {
    try {
      setSubmitting(true)
      const res = await updateAdminBillingConcernStatus(concernId, { status })
      const updated = res?.data

      if (updated) {
        setConcerns((prev) =>
          prev.map((item) => (String(item.id) === String(concernId) ? updated : item))
        )
      } else {
        await loadData()
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update status.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-400">Loading billing concerns...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tenant, unit, subject, status..."
          className="w-full sm:w-80 px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-all"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-slate-700/50">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              {['Tenant', 'Unit', 'Subject', 'Priority', 'Status', 'Assigned To', 'Actions'].map((col) => (
                <th
                  key={col}
                  className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredConcerns.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  No billing concerns found.
                </td>
              </tr>
            ) : (
              filteredConcerns.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {item?.tenant?.name || 'Unknown tenant'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item?.tenant?.email || '—'}
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                    {item?.tenant?.unit?.unit_number || '—'}
                  </td>

                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-200">
                        {item?.subject || 'No subject'}
                      </p>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {item?.description || '—'}
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-4 capitalize text-slate-600 dark:text-slate-300">
                    {item?.priority || 'normal'}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                        statusBadgeMap[item?.status] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {String(item?.status || 'pending').replace('_', ' ')}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                    {item?.assignee?.name || 'Unassigned'}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setSelectedConcern(item)
                          setAssignUserId(item?.assigned_to ? String(item.assigned_to) : '')
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                      >
                        Assign
                      </button>

                      <select
                        value={item?.status || 'pending'}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        disabled={submitting}
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                      >
                        <option value="pending">Pending</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_review">In Review</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedConcern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-5">
            <h3 className="font-display font-700 text-lg text-slate-800 dark:text-white mb-1">
              Assign Finance
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Assign this billing concern to a finance user.
            </p>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400 mb-1">Concern</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {selectedConcern.subject}
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Finance User
                </label>
                <select
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-all"
                >
                  <option value="">— Select finance user —</option>
                  {financeUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedConcern(null)
                    setAssignUserId('')
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>

                <button
                  onClick={() => handleAssign(selectedConcern.id)}
                  disabled={!assignUserId || submitting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white transition-all"
                >
                  {submitting ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
