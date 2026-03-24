/**
 * pages/superadmin/UserManagement.jsx
 * Full user & role management — Super Admin only.
 */
import { useState } from 'react'
import { Users, Plus, Pencil, Trash2, Shield, Lock, RefreshCw, UserX, UserCheck, X, Eye, EyeOff, Search } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { usePermissions } from '@/hooks/usePermissions'
import { usePageLoader } from '@/hooks/usePageLoader'
import { DashboardSkeleton } from '@/components/skeletons'
import ConfirmModal from '@/components/ui/ConfirmModal'

const ROLE_OPTIONS = [
  { value: 'super_admin',      label: 'Super Admin',      color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' },
  { value: 'admin',            label: 'Admin',            color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  { value: 'finance',          label: 'Finance',          color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
  { value: 'facility_manager', label: 'Facility Manager', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  { value: 'tenant',           label: 'Tenant',           color: 'bg-slate-100 dark:bg-slate-700/40 text-slate-600 dark:text-slate-400' },
]

function getRoleBadge(role) {
  return ROLE_OPTIONS.find(r => r.value === role) || ROLE_OPTIONS[4]
}

const EMPTY_FORM = { name: '', email: '', password: '', role: 'tenant', title: '' }

function UserFormModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)

  useState(() => { setForm(initial || EMPTY_FORM); setErrors({}) }, [open])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Valid email is required'
    if (!initial && !form.password.trim()) e.password = 'Password is required'
    if (!form.role) e.role = 'Role is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => { if (!validate()) return; onSave(form); onClose() }
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md glass rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/50 overflow-hidden animate-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/50">
          <h2 className="font-display font-700 text-[15px] text-slate-800 dark:text-white">{initial ? 'Edit User' : 'Add New User'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-400 transition-colors"><X className="w-4 h-4"/></button>
        </div>
        <div className="p-6 space-y-4">
          {[{ k: 'name', label: 'Full Name', placeholder: 'e.g. John Doe' }, { k: 'email', label: 'Email Address', placeholder: 'user@enye.com' }, { k: 'title', label: 'Title / Position', placeholder: 'e.g. Finance Officer' }].map(({ k, label, placeholder }) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>
              <input type={k === 'email' ? 'email' : 'text'} value={form[k]} onChange={e => set(k, e.target.value)} placeholder={placeholder}
                className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none transition-all ${errors[k] ? 'border-red-400' : 'border-slate-200 dark:border-slate-600 focus:border-blue-400'}`} />
              {errors[k] && <p className="text-xs text-red-500 mt-1">{errors[k]}</p>}
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{initial ? 'Password (leave blank to keep)' : 'Password *'}</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={form.password || ''} onChange={e => set('password', e.target.value)} placeholder="Enter password"
                className={`w-full px-3 py-2 pr-10 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none transition-all ${errors.password ? 'border-red-400' : 'border-slate-200 dark:border-slate-600 focus:border-blue-400'}`} />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map(r => (
                <button key={r.value} onClick={() => set('role', r.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${form.role === r.value ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-violet-300'}`}>
                  {r.label}
                </button>
              ))}
            </div>
            {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
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

function ResetPasswordModal({ open, onClose, onSave, userName }) {
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [err, setErr] = useState('')
  if (!open) return null

  const handleSave = () => {
    if (!pw.trim()) return setErr('Password is required')
    if (pw !== confirm) return setErr('Passwords do not match')
    if (pw.length < 6) return setErr('Minimum 6 characters')
    onSave(pw); onClose(); setPw(''); setConfirm(''); setErr('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm glass rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/50 overflow-hidden animate-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/50">
          <div>
            <h2 className="font-display font-700 text-[15px] text-slate-800 dark:text-white">Reset Password</h2>
            <p className="text-xs text-slate-400 mt-0.5">For: {userName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-400 transition-colors"><X className="w-4 h-4"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">New Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 pr-10 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-400 transition-all" />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm new password"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-400 transition-all" />
          </div>
          {err && <p className="text-xs text-red-500">{err}</p>}
        </div>
        <div className="flex justify-end gap-2 px-6 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all">Reset Password</button>
        </div>
      </div>
    </div>
  )
}

export default function UserManagement() {
  const loading = usePageLoader(700)
  const { user: currentUser, users, addUser, editUser, deleteUser, suspendUser, resetPassword } = useAuth()
  const { addToast } = useApp()
  const { isSuperAdmin } = usePermissions()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmSuspend, setConfirmSuspend] = useState(null)

  if (loading) return <DashboardSkeleton />
  if (!isSuperAdmin) return (
    <div className="flex flex-col items-center justify-center py-24">
      <Lock className="w-12 h-12 text-slate-300 mb-4"/>
      <p className="text-lg font-semibold text-slate-500">Access Denied</p>
      <p className="text-sm text-slate-400 mt-1">User Management is only available to Super Admins.</p>
    </div>
  )

  const filtered = (users || []).filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const handleAdd = (data) => {
    const res = addUser(currentUser.role, data)
    if (res.error) addToast(res.error, 'error')
    else addToast(`${data.name} added successfully`)
  }

  const handleEdit = (u) => { setEditingUser(u); setShowForm(true) }
  const handleSaveEdit = (data) => {
    const res = editUser(currentUser.role, editingUser.id, data)
    if (res.error) addToast(res.error, 'error')
    else addToast(`${data.name || editingUser.name} updated`)
    setEditingUser(null)
  }

  const handleDelete = () => {
    const res = deleteUser(currentUser.role, confirmDelete.id)
    if (res.error) addToast(res.error, 'error')
    else addToast(`${confirmDelete.name} removed`, 'info')
    setConfirmDelete(null)
  }

  const handleSuspend = () => {
    const res = suspendUser(currentUser.role, confirmSuspend.id)
    if (res.error) addToast(res.error, 'error')
    else addToast(`${confirmSuspend.name} ${confirmSuspend.status === 'suspended' ? 'reactivated' : 'suspended'}`)
    setConfirmSuspend(null)
  }

  const handleResetPassword = (newPw) => {
    const res = resetPassword(currentUser.role, resetTarget.id, newPw)
    if (res.error) addToast(res.error, 'error')
    else addToast(`Password reset for ${resetTarget.name}`)
    setResetTarget(null)
  }

  const canModify = (targetUser) => targetUser.id !== currentUser.id && (currentUser.role === 'super_admin' && targetUser.role !== 'super_admin' || targetUser.id === currentUser.id)
  const canModifyStrict = (targetUser) => currentUser.role === 'super_admin' && (targetUser.role !== 'super_admin' || targetUser.id === currentUser.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-display font-700 text-2xl text-slate-800 dark:text-white">User Management</h2>
            <span className="flex justify-center items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white tracking-wider uppercase shadow">
              <Shield className="w-2.5 h-2.5 mr-1"/>Super Admin
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage all system users, roles, and access</p>
        </div>
        <button onClick={() => { setEditingUser(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Plus className="w-4 h-4"/>Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
          <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all"/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ value: 'all', label: 'All' }, ...ROLE_OPTIONS.map(r => ({ value: r.value, label: r.label }))].map(f => (
            <button key={f.value} onClick={() => setRoleFilter(f.value)}
              className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${roleFilter === f.value ? 'bg-violet-600 text-white border-violet-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/60'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="glass rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-700/50">
                {['User', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filtered.map(u => {
                const badge = getRoleBadge(u.role)
                const isSelf = u.id === currentUser.id
                const isSA = u.role === 'super_admin'
                const modifiable = !isSA || isSelf
                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{u.initials}</div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{u.name} {isSelf && <span className="text-[10px] text-slate-400">(you)</span>}</p>
                          <p className="text-xs text-slate-400">{u.title || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.color}`}>{badge.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.status === 'suspended' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'}`}>
                        {u.status === 'suspended' ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(u)} title="Edit user"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <Pencil className="w-4 h-4"/>
                        </button>
                        <button onClick={() => setResetTarget(u)} title="Reset password"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                          <RefreshCw className="w-4 h-4"/>
                        </button>
                        {!isSelf && modifiable && (
                          <>
                            <button onClick={() => setConfirmSuspend(u)} title={u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                              className={`p-1.5 rounded-lg transition-colors ${u.status === 'suspended' ? 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}>
                              {u.status === 'suspended' ? <UserCheck className="w-4 h-4"/> : <UserX className="w-4 h-4"/>}
                            </button>
                            <button onClick={() => setConfirmDelete(u)} title="Delete user"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                              <Trash2 className="w-4 h-4"/>
                            </button>
                          </>
                        )}
                        {isSA && !isSelf && (
                          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-violet-100 dark:bg-violet-900/20 text-violet-500 font-semibold flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5"/>Protected
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Users className="w-10 h-10 text-slate-300 mb-3"/>
              <p className="font-semibold text-slate-500">No users found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      <UserFormModal open={showForm} onClose={() => { setShowForm(false); setEditingUser(null) }}
        onSave={editingUser ? handleSaveEdit : handleAdd} initial={editingUser} />
      <ResetPasswordModal open={!!resetTarget} onClose={() => setResetTarget(null)}
        onSave={handleResetPassword} userName={resetTarget?.name} />
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
