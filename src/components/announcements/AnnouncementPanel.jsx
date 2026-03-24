/**
 * components/announcements/AnnouncementPanel.jsx
 * Role-aware announcement panel using centralized permissions.
 */
import { useState } from 'react'
import { Plus, Globe } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useAnnouncements } from '@/context/AnnouncementContext'
import { useApp } from '@/context/AppContext'
import { usePermissions } from '@/hooks/usePermissions'
import AnnouncementCard from './AnnouncementCard'
import CreateAnnouncementModal from './CreateAnnouncementModal'

const AUTHOR_LABEL = {
  super_admin:      'System Administration',
  admin:            'Building Management',
  facility_manager: 'Facilities Team',
  finance:          'Billing Department',
}

export default function AnnouncementPanel() {
  const { user } = useAuth()
  const { getAnnouncementsForRole, addAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncements()
  const { addToast } = useApp()
  const { can, canEditAnnouncement, canDeleteAnnouncement } = usePermissions()

  const [showModal, setShowModal] = useState(false)
  const [editingAnn, setEditingAnn] = useState(null)

  const role = user?.role
  const canCreate = can('announcements:create')
  const visibleAnnouncements = getAnnouncementsForRole(role)
  const systemWideCount = visibleAnnouncements.filter(a => a.isSystemWide || a.createdBy === 'super_admin').length

  const handleSave = (formData) => {
    if (editingAnn) {
      updateAnnouncement(editingAnn.id, formData)
      addToast('Announcement updated successfully')
    } else {
      addAnnouncement({ ...formData, author: AUTHOR_LABEL[role] || user?.name || 'Management', createdBy: role })
      addToast('Announcement posted successfully')
    }
    setShowModal(false); setEditingAnn(null)
  }

  const handleEdit = (ann) => { setEditingAnn(ann); setShowModal(true) }
  const handleDelete = (id) => {
    if (confirm('Delete this announcement?')) { deleteAnnouncement(id); addToast('Announcement deleted', 'info') }
  }

  return (
    <>
      <div className="glass rounded-2xl p-5 shadow-lg animate-in h-[440px] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-700 text-[16px] text-slate-800 dark:text-white">Announcements</h2>
            <p className="text-xs text-slate-400 mt-0.5">Building notices &amp; alerts</p>
          </div>
          <div className="flex items-center gap-2">
            {systemWideCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[10px] font-bold">
                <Globe className="w-2.5 h-2.5"/>{systemWideCount} system
              </span>
            )}
            <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-lg">{visibleAnnouncements.length} active</span>
           {canCreate && (
            <button
              onClick={() => { setEditingAnn(null); setShowModal(true) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl 
              bg-gradient-to-r from-blue-600 to-cyan-500 text-white 
              text-xs font-semibold shadow-sm hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              
              {/* Hide text on mobile, show on small screens and up */}
              <span className="hidden sm:inline">Add</span>
            </button>
          )}
          </div>
        </div>

        <div className="space-y-3 overflow-y-auto pr-1 flex-1">
          {visibleAnnouncements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <p className="text-sm text-slate-400">No announcements at this time.</p>
              {canCreate && <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Click <strong>Add</strong> to post one.</p>}
            </div>
          ) : (
            visibleAnnouncements.map(ann => (
              <AnnouncementCard
                key={ann.id} ann={ann}
                canEdit={canEditAnnouncement(ann)}
                canDelete={canDeleteAnnouncement(ann)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
      <CreateAnnouncementModal isOpen={showModal} onClose={() => { setShowModal(false); setEditingAnn(null) }}
        onSave={handleSave} creatorRole={role} initialData={editingAnn} />
    </>
  )
}
