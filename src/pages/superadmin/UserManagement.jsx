/**
 * pages/superadmin/UserManagement.jsx
 * Full user & role management - Super Admin only.
 */
import { useEffect, useMemo, useState } from 'react'
import { Users, Plus, Pencil, Trash2, Shield, Lock, RefreshCw, UserX, UserCheck, X, Search } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { usePermissions } from '@/hooks/usePermissions'
import { usePageLoader } from '@/hooks/usePageLoader'
import { TableLoadingRow, UpdatingBadge } from '@/components/common/InlineLoadingState'
import ConfirmModal from '@/components/ui/ConfirmModal'
import PaginationBar from '@/components/common/PaginationBar'
import { useSuperAdminUsers } from '@/hooks/superAdminHooks/useSuperAdminUsers'
import { TenantAvatar } from '@/components/common/AvatarPicker'

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin', color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' },
  { value: 'admin', label: 'Admin', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  { value: 'finance', label: 'Finance', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
  { value: 'facility_manager', label: 'Facility Manager', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  { value: 'tenant', label: 'Tenant', color: 'bg-slate-100 dark:bg-slate-700/40 text-slate-600 dark:text-slate-400' },
]

function getRoleBadge(role) {
  return ROLE_OPTIONS.find((r) => r.value === role) || ROLE_OPTIONS[4]
}

function PresenceBadge({ status }) {
  const isOnline = status === 'online'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isOnline
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isOnline ? 'bg-emerald-500' : 'bg-slate-400'
        }`}
      />
      {isOnline ? 'Online' : 'Offline'}
    </span>
  )
}

const EMPTY_FORM = { name: '', email: '', role: 'tenant', title: '' }

function UserFormModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!open) return
    setForm(initial ? { ...initial } : EMPTY_FORM)
    setErrors({})
  }, [open, initial])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Valid email is required'
    if (!form.role) e.role = 'Role is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    const result = await onSave(form)
    if (result?.success) onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md glass rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/50 overflow-hidden animate-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/50">
          <h2 className="font-display font-700 text-[15px] text-slate-800 dark:text-white">{initial ? 'Edit User' : 'Add New User'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {[{ k: 'name', label: 'Full Name', placeholder: 'e.g. John Doe' }, { k: 'email', label: 'Email Address', placeholder: 'user@enye.com' }, { k: 'title', label: 'Title / Position', placeholder: 'e.g. Finance Officer' }].map(({ k, label, placeholder }) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>
              <input type={k === 'email' ? 'email' : 'text'} value={form[k]} onChange={(e) => set(k, e.target.value)} placeholder={placeholder}
                className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none transition-all ${errors[k] ? 'border-red-400' : 'border-slate-200 dark:border-slate-600 focus:border-blue-400'}`} />
              {errors[k] && <p className="text-xs text-red-500 mt-1">{errors[k]}</p>}
            </div>
          ))}

          {!initial && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300">
              A temporary password will be generated automatically and sent to this email address. The user will be required to change it on first login.
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map((r) => (
                <button key={r.value} onClick={() => set('role', r.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${form.role === r.value ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-violet-300'}`}>
                  {r.label}
                </button>
              ))}
            </div>
            {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
            {form.role === 'tenant' && (
              <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300">
                Saving this user will automatically create a matching tenant record. Complete unit assignments and occupancy details in the Tenants page after the account is created.
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 text-sm rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
            {initial ? 'Save Changes' : 'Add User'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ResetPasswordModal({ open, onClose, onSave, userName, saving }) {
  if (!open) return null

  const handleSave = async () => {
    const result = await onSave()
    if (!result?.success) return
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm glass rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/50 overflow-hidden animate-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/50">
          <div>
            <h2 className="font-display font-700 text-[15px] text-slate-800 dark:text-white">Reset Password</h2>
            <p className="text-xs text-slate-400 mt-0.5">For: {userName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-300">
            A temporary password will be emailed to this user. They will be forced to create a new private password the next time they sign in.
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all disabled:opacity-60">Send Temporary Password</button>
        </div>
      </div>
    </div>
  )
}

export default function UserManagement() {
  const loading = usePageLoader(700)
  const { user: currentUser } = useAuth()
  const { addToast } = useApp()
  const { isSuperAdmin } = usePermissions()
  const {
    users,
    loading: usersLoading,
    saving,
    error,
    meta,
    page,
    perPage,
    setPage,
    setPerPage,
    createUser,
    updateUser,
    toggleUserStatus,
    removeUser,
    resetPassword,
  } = useSuperAdminUsers()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmSuspend, setConfirmSuspend] = useState(null)

  const filtered = useMemo(() => (users || []).filter((u) => {
    const q = search.toLowerCase().trim()
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  }), [users, search, roleFilter])
  const isInitialLoading = (loading || usersLoading) && users.length === 0 && !error
  const isRefreshing = !isInitialLoading && usersLoading

  if (!isSuperAdmin) return (
    <div className="flex flex-col items-center justify-center py-24">
      <Lock className="w-12 h-12 text-slate-300 mb-4" />
      <p className="text-lg font-semibold text-slate-500">Access Denied</p>
      <p className="text-sm text-slate-400 mt-1">User Management is only available to Super Admins.</p>
    </div>
  )

  const handleAdd = async (data) => {
    const res = await createUser(data)
    if (!res.success) {
      addToast(res.message || 'Failed to add user.', 'error')
      return res
    }
    addToast(`Temporary password sent to ${data.email}`, 'success')
    return res
  }

  const handleEdit = (u) => { setEditingUser(u); setShowForm(true) }
  const handleSaveEdit = async (data) => {
    const payload = { ...data }
    delete payload.password

    const res = await updateUser(editingUser.id, payload)
    if (!res.success) {
      addToast(res.message || 'Failed to update user.', 'error')
      return res
    }
    addToast(`${data.name || editingUser.name} updated`, 'success')
    setEditingUser(null)
    return res
  }

  const handleDelete = async () => {
    const res = await removeUser(confirmDelete.id)
    if (!res.success) {
      addToast(res.message || 'Failed to delete user.', 'error')
      return
    }
    addToast(`${confirmDelete.name} removed`, 'info')
    setConfirmDelete(null)
  }

  const handleSuspend = async () => {
    const res = await toggleUserStatus(confirmSuspend)
    if (!res.success) {
      addToast(res.message || 'Failed to update user status.', 'error')
      return
    }
    addToast(`${confirmSuspend.name} ${confirmSuspend.status === 'suspended' ? 'reactivated' : 'suspended'}`, 'success')
    setConfirmSuspend(null)
  }

  const handleResetPassword = async () => {
    const res = await resetPassword(resetTarget.id)
    if (!res.success) {
      addToast(res.message || 'Failed to reset password.', 'error')
      return
    }
    addToast(`Temporary password sent to ${resetTarget.name}`, 'success')
    return res
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-display font-700 text-2xl text-slate-800 dark:text-white">User Management</h2>
            <span className="flex justify-center items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white tracking-wider uppercase shadow">
              <Shield className="w-2.5 h-2.5 mr-1" />Super Admin
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage all system users, roles, and access</p>
        </div>
        <div className="flex items-center gap-3">
          <UpdatingBadge show={isRefreshing} />
          <button onClick={() => { setEditingUser(null); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Plus className="w-4 h-4" />Add User
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ value: 'all', label: 'All' }, ...ROLE_OPTIONS.map((r) => ({ value: r.value, label: r.label }))].map((f) => (
            <button key={f.value} onClick={() => { setRoleFilter(f.value); setPage(1) }}
              className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${roleFilter === f.value ? 'bg-violet-600 text-white border-violet-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/60'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-700/50">
                {['User', 'Email', 'Role', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {isInitialLoading ? (
                <TableLoadingRow colSpan={5} />
              ) : filtered.map((u) => {
                const badge = getRoleBadge(u.role)
                const isSelf = String(u.id) === String(currentUser?.id)
                const isSA = u.role === 'super_admin'
                const modifiable = !isSA || isSelf
                const presenceStatus = isSelf ? 'online' : u.presenceStatus
                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <TenantAvatar src={u.avatar} name={u.name || u.initials} size="sm" className="rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{u.name} {isSelf && <span className="text-[10px] text-slate-400">(you)</span>}</p>
                          <p className="text-xs text-slate-400">{u.title || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.color}`}>{badge.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <PresenceBadge status={presenceStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(u)} title="Edit user" disabled={saving}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setResetTarget(u)} title="Reset password" disabled={saving}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        {!isSelf && modifiable && (
                          <>
                            <button onClick={() => setConfirmSuspend(u)} title={u.status === 'suspended' ? 'Reactivate' : 'Suspend'} disabled={saving}
                              className={`p-1.5 rounded-lg transition-colors ${u.status === 'suspended' ? 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}>
                              {u.status === 'suspended' ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setConfirmDelete(u)} title="Delete user" disabled={saving}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {isSA && !isSelf && (
                          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-violet-100 dark:bg-violet-900/20 text-violet-500 font-semibold flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />Protected
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!isInitialLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Users className="w-10 h-10 text-slate-300 mb-3" />
              <p className="font-semibold text-slate-500">No users found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="border-t border-slate-200/60 px-4 py-4 dark:border-slate-700/50">
            <PaginationBar
              meta={meta}
              page={page}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(value) => {
                setPerPage(value)
                setPage(1)
              }}
            />
          </div>
        )}
      </div>

      <UserFormModal open={showForm} onClose={() => { setShowForm(false); setEditingUser(null) }}
        onSave={editingUser ? handleSaveEdit : handleAdd} initial={editingUser} />
      <ResetPasswordModal open={!!resetTarget} onClose={() => setResetTarget(null)}
        onSave={handleResetPassword} userName={resetTarget?.name} saving={saving} />
      <ConfirmModal isOpen={!!confirmDelete} title="Delete User"
        message={`Are you sure you want to permanently delete ${confirmDelete?.name}? This action cannot be undone.`}
        confirmLabel="Delete" confirmClass="bg-red-500 hover:bg-red-600 text-white"
        onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      <ConfirmModal isOpen={!!confirmSuspend}
        title={confirmSuspend?.status === 'suspended' ? 'Reactivate User' : 'Suspend User'}
        message={`Are you sure you want to ${confirmSuspend?.status === 'suspended' ? 'reactivate' : 'suspend'} ${confirmSuspend?.name}?`}
        confirmLabel={confirmSuspend?.status === 'suspended' ? 'Reactivate' : 'Suspend'}
        confirmClass={confirmSuspend?.status === 'suspended' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}
        onConfirm={handleSuspend} onCancel={() => setConfirmSuspend(null)} />
    </div>
  )
}
