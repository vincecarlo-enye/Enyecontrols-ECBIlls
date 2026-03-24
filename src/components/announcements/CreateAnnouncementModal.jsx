/**
 * components/announcements/CreateAnnouncementModal.jsx
 * Permission-aware announcement modal.
 * Super Admin gets system-wide toggle and full role targeting.
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Globe, Shield } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'

const EMPTY_FORM = { title: '', body: '', type: 'notice', priority: 'medium', targetRoles: ['tenant'], isSystemWide: false }

export default function CreateAnnouncementModal({ isOpen, onClose, onSave, creatorRole, initialData }) {
  const { can, getAllowedTargetRoles } = usePermissions()
  const isSuperAdmin = creatorRole === 'super_admin'
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const allowedTargets = getAllowedTargetRoles()

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({ title: initialData.title || '', body: initialData.body || '', type: initialData.type || 'notice', priority: initialData.priority || 'medium', targetRoles: initialData.targetRoles || ['tenant'], isSystemWide: initialData.isSystemWide || false })
      } else {
        const defaults = { admin: ['tenant','admin','facility_manager','finance'], facility_manager: ['tenant','admin'], finance: ['tenant','admin'], super_admin: ['tenant','admin','facility_manager','finance','super_admin'] }
        setForm({ ...EMPTY_FORM, targetRoles: defaults[creatorRole] || ['tenant'], isSystemWide: isSuperAdmin })
      }
      setErrors({})
    }
  }, [isOpen, initialData, creatorRole, isSuperAdmin])

  const toggleRole = (role) => setForm(prev => {
    const has = prev.targetRoles.includes(role)
    return { ...prev, targetRoles: has ? prev.targetRoles.filter(r => r !== role) : [...prev.targetRoles, role] }
  })

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.body.trim()) e.body = 'Message content is required'
    if (!form.isSystemWide && form.targetRoles.length === 0) e.targetRoles = 'Select at least one target role'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const targets = form.isSystemWide
      ? ['super_admin','admin','finance','facility_manager','tenant']
      : [...new Set([creatorRole, ...form.targetRoles])]
    onSave({ ...form, targetRoles: targets })
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[16px] text-slate-800 dark:text-white">{initialData ? 'Edit Announcement' : 'New Announcement'}</h3>
              {isSuperAdmin && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white"><Shield className="w-2.5 h-2.5"/>Super Admin</span>}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Post a notice or alert to selected roles</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* System-wide toggle for Super Admin */}
          {isSuperAdmin && (
            <div className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${form.isSystemWide ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'}`}
              onClick={() => setForm(p => ({ ...p, isSystemWide: !p.isSystemWide }))}>
              <div className="flex items-center gap-2">
                <Globe className={`w-4 h-4 ${form.isSystemWide ? 'text-violet-600' : 'text-slate-400'}`} />
                <div>
                  <p className={`text-sm font-semibold ${form.isSystemWide ? 'text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-300'}`}>System-wide Announcement</p>
                  <p className="text-xs text-slate-400">Visible to ALL users across all roles</p>
                </div>
              </div>
              <input type="checkbox" checked={form.isSystemWide} onChange={() => {}} className="w-4 h-4 accent-violet-600 cursor-pointer" />
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Scheduled Water Interruption"
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Message Content *</label>
            <textarea rows={4} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="Describe the announcement in detail..."
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all resize-none" />
            {errors.body && <p className="text-xs text-red-500 mt-1">{errors.body}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all">
                <option value="notice">Notice</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {!form.isSystemWide && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Target Roles *</label>
              <div className="flex flex-wrap gap-2">
                {allowedTargets.map(r => {
                  const checked = form.targetRoles.includes(r.value)
                  return (
                    <label key={r.value} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-sm font-medium transition-all select-none ${checked ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300'}`}>
                      <input type="checkbox" className="w-3.5 h-3.5 accent-blue-600" checked={checked} onChange={() => toggleRole(r.value)} />
                      {r.label}
                    </label>
                  )
                })}
              </div>
              {errors.targetRoles && <p className="text-xs text-red-500 mt-1">{errors.targetRoles}</p>}
            </div>
          )}
          {form.isSystemWide && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/50">
              <Globe className="w-4 h-4 text-violet-500 flex-shrink-0" />
              <p className="text-xs text-violet-700 dark:text-violet-300">This announcement will be visible to <strong>all users</strong> regardless of role.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">Cancel</button>
          <button onClick={handleSave} className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-all ${isSuperAdmin && form.isSystemWide ? 'bg-gradient-to-r from-violet-600 to-indigo-600' : 'bg-gradient-to-r from-blue-600 to-cyan-500'}`}>
            {initialData ? 'Update Announcement' : 'Post Announcement'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
