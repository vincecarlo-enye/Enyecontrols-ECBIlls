/**
 * pages/superadmin/Announcements.jsx
 * Super Admin announcement management — full CRUD + system-wide toggle.
 */
import { useMemo, useState } from 'react'
import { Megaphone, Plus, Globe, Shield, Search, Filter } from 'lucide-react'
import { useAdminAnnouncements } from '@/hooks/adminHooks/useAdminAnnouncements'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { usePageLoader } from '@/hooks/usePageLoader'
import { DashboardSkeleton } from '@/components/skeletons'
import CreateAnnouncementModal from '@/components/announcements/CreateAnnouncementModal'
import AnnouncementCard from '@/components/announcements/AnnouncementCard'
import ConfirmModal from '@/components/ui/ConfirmModal'

export default function SAnnouncements() {
  const loading = usePageLoader(600)
  const { user } = useAuth()
  const { addToast } = useApp()
  const { isSuperAdmin, canEditAnnouncement, canDeleteAnnouncement } = usePermissions()
  const { announcements, loading: announcementsLoading, submitting, addAnnouncement, updateAnnouncement, deleteAnnouncement } = useAdminAnnouncements()

  const [showModal, setShowModal] = useState(false)
  const [editingAnn, setEditingAnn] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [deletingAnn, setDeletingAnn] = useState(null)

  if (loading || announcementsLoading) return <DashboardSkeleton />

  const filtered = announcements.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !q || a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q)
    const matchFilter = filter === 'all' || (filter === 'system' ? (a.isSystemWide || a.createdBy === 'super_admin') : !a.isSystemWide && a.createdBy !== 'super_admin')
    return matchSearch && matchFilter
  })

  const handleSave = async (formData) => {
    try {
      if (editingAnn) {
        await updateAnnouncement(editingAnn.id, formData)
        addToast('Announcement updated successfully')
      } else {
        await addAnnouncement(formData)
        addToast(formData.isSystemWide ? 'System-wide announcement posted' : 'Announcement posted successfully')
      }
      setShowModal(false)
      setEditingAnn(null)
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to save announcement', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deletingAnn) return

    try {
      await deleteAnnouncement(deletingAnn.id)
      addToast('Announcement deleted', 'info')
      setDeletingAnn(null)
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to delete announcement', 'error')
    }
  }

  const systemCount = announcements.filter(a => a.isSystemWide || a.createdBy === 'super_admin').length
  const localCount  = announcements.length - systemCount
  const activeCount = useMemo(() => announcements.filter((a) => {
    const status = String(a?.status || '').toLowerCase()
    if (status && status !== 'published') return false

    const now = Date.now()
    const startsAt = a?.starts_at ? new Date(a.starts_at).getTime() : null
    const endsAt = a?.ends_at ? new Date(a.ends_at).getTime() : null

    if (startsAt && !Number.isNaN(startsAt) && now < startsAt) return false
    if (endsAt && !Number.isNaN(endsAt) && now > endsAt) return false

    return true
  }).length, [announcements])

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
        <button onClick={() => { setEditingAnn(null); setShowModal(true) }} disabled={submitting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-60">
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
          <p className="text-2xl font-display font-700 text-slate-800 dark:text-white">{activeCount}</p>
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
              onDelete={(id) => {
                const match = announcements.find((item) => String(item.id) === String(id))
                setDeletingAnn(match || null)
              }}
            />
          ))}
        </div>
      )}

      <CreateAnnouncementModal isOpen={showModal} onClose={() => { setShowModal(false); setEditingAnn(null) }}
        onSave={handleSave} creatorRole={user?.role} initialData={editingAnn} />

      <ConfirmModal
        isOpen={!!deletingAnn}
        title="Delete Announcement?"
        message={deletingAnn ? `This will permanently remove "${deletingAnn.title}" from the announcement list.` : 'This announcement will be permanently removed.'}
        confirmLabel="Delete Announcement"
        onConfirm={handleDelete}
        onCancel={() => setDeletingAnn(null)}
      />
    </div>
  )
}
