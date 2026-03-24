/**
 * pages/superadmin/Announcements.jsx
 * Super Admin announcement management — full CRUD + system-wide toggle.
 */
import { useState } from 'react'
import { Megaphone, Plus, Globe, Shield, Search, Pencil, Trash2, Filter } from 'lucide-react'
import { useAnnouncements } from '@/context/AnnouncementContext'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { usePageLoader } from '@/hooks/usePageLoader'
import { DashboardSkeleton } from '@/components/skeletons'
import CreateAnnouncementModal from '@/components/announcements/CreateAnnouncementModal'
import AnnouncementCard from '@/components/announcements/AnnouncementCard'

const AUTHOR_LABEL = { super_admin: 'System Administration', admin: 'Building Management', facility_manager: 'Facilities Team', finance: 'Billing Department' }
const TYPE_COLORS = {
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  info:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  notice:  'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-400',
}

export default function SAnnouncements() {
  const loading = usePageLoader(600)
  const { user } = useAuth()
  const { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncements()
  const { addToast } = useApp()
  const { isSuperAdmin, canEditAnnouncement, canDeleteAnnouncement } = usePermissions()

  const [showModal, setShowModal] = useState(false)
  const [editingAnn, setEditingAnn] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  if (loading) return <DashboardSkeleton />

  const filtered = announcements.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !q || a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q)
    const matchFilter = filter === 'all' || (filter === 'system' ? (a.isSystemWide || a.createdBy === 'super_admin') : !a.isSystemWide && a.createdBy !== 'super_admin')
    return matchSearch && matchFilter
  })

  const handleSave = (formData) => {
    if (editingAnn) {
      updateAnnouncement(editingAnn.id, formData)
      addToast('Announcement updated successfully')
    } else {
      addAnnouncement({ ...formData, author: AUTHOR_LABEL[user?.role] || user?.name, createdBy: user?.role })
      addToast(formData.isSystemWide ? 'System-wide announcement posted' : 'Announcement posted successfully')
    }
    setShowModal(false); setEditingAnn(null)
  }

  const handleDelete = (id) => {
    if (confirm('Delete this announcement?')) { deleteAnnouncement(id); addToast('Announcement deleted', 'info') }
  }

  const systemCount = announcements.filter(a => a.isSystemWide || a.createdBy === 'super_admin').length
  const localCount  = announcements.length - systemCount

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-display font-700 text-2xl text-slate-800 dark:text-white">Announcements</h2>
            <span className="flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
              <Shield className="w-2.5 h-2.5 mr-1"/>Super Admin
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create system-wide and local announcements for all roles</p>
        </div>
        <button onClick={() => { setEditingAnn(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Plus className="w-4 h-4"/>New Announcement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/50">
          <div className="flex items-center gap-2 mb-2"><Globe className="w-4 h-4 text-violet-500"/><p className="text-xs text-violet-500 font-semibold uppercase tracking-wider">System-wide</p></div>
          <p className="text-2xl font-display font-700 text-slate-800 dark:text-white">{systemCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50">
          <div className="flex items-center gap-2 mb-2"><Megaphone className="w-4 h-4 text-blue-500"/><p className="text-xs text-blue-500 font-semibold uppercase tracking-wider">Local</p></div>
          <p className="text-2xl font-display font-700 text-slate-800 dark:text-white">{localCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-2 mb-2"><Filter className="w-4 h-4 text-slate-400"/><p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total</p></div>
          <p className="text-2xl font-display font-700 text-slate-800 dark:text-white">{announcements.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
          <input type="text" placeholder="Search announcements..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all"/>
        </div>
        <div className="flex gap-2">
          {[{ v: 'all', l: 'All' }, { v: 'system', l: 'System-wide' }, { v: 'local', l: 'Local' }].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${filter === f.v ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/60'}`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Megaphone className="w-12 h-12 text-slate-300 mb-4"/>
          <p className="font-semibold text-slate-500">No announcements found</p>
          <p className="text-sm text-slate-400 mt-1">Click New Announcement to post one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ann => (
            <AnnouncementCard key={ann.id} ann={ann}
              canEdit={canEditAnnouncement(ann)}
              canDelete={canDeleteAnnouncement(ann)}
              onEdit={(a) => { setEditingAnn(a); setShowModal(true) }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <CreateAnnouncementModal isOpen={showModal} onClose={() => { setShowModal(false); setEditingAnn(null) }}
        onSave={handleSave} creatorRole={user?.role} initialData={editingAnn} />
    </div>
  )
}
