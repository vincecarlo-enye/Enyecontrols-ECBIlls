import { useState } from 'react'
import { Plus, Globe } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { usePermissions } from '@/hooks/usePermissions'
import { useAdminAnnouncements } from '@/hooks/adminHooks/useAdminAnnouncements'
import AnnouncementCard from '@/components/announcements/AnnouncementCard'
import CreateAnnouncementModal from '@/components/announcements/CreateAnnouncementModal'

const AUTHOR_LABEL = {
  super_admin: 'System Administration',
  admin: 'Building Management',
  facility_manager: 'Facilities Team',
  finance: 'Billing Department',
}

export default function AnnouncementPanel() {
  const { user } = useAuth()
  const { addToast } = useApp()
  const { can, canEditAnnouncement, canDeleteAnnouncement } = usePermissions()
  const {
    getAnnouncementsForRole,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    error,
  } = useAdminAnnouncements()

  const [showModal, setShowModal] = useState(false)
  const [editingAnn, setEditingAnn] = useState(null)

  const role = user?.role
  const canCreate = can('announcements:create')
  const isTenantView = role === 'tenant'
  const visibleAnnouncements = getAnnouncementsForRole(role)
  const systemWideCount = visibleAnnouncements.filter(
    (a) => a.isSystemWide || a.createdBy === 'super_admin'
  ).length

  const handleSave = async (formData) => {
    try {
      if (editingAnn) {
        await updateAnnouncement(editingAnn.id, formData)
        addToast('Announcement updated successfully')
      } else {
        await addAnnouncement({
          ...formData,
          author: AUTHOR_LABEL[role] || user?.name || 'Management',
          createdBy: role,
        })
        addToast('Announcement posted successfully')
      }

      setShowModal(false)
      setEditingAnn(null)
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to save announcement', 'error')
    }
  }

  const handleEdit = (ann) => {
    setEditingAnn(ann)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this announcement?')) {
      try {
        await deleteAnnouncement(id)
        addToast('Announcement deleted', 'info')
      } catch (err) {
        addToast(err?.response?.data?.message || 'Failed to delete announcement', 'error')
      }
    }
  }

  return (
    <>
      <div className="glass rounded-2xl p-5 shadow-lg animate-in h-[440px] flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
  {/* Left */}
  <div>
    <h2 className="font-display font-700 text-[16px] sm:text-[16px] text-slate-800 dark:text-white">
      Announcements
    </h2>
    <p className="text-xs text-slate-400 mt-0.5">
      Building notices &amp; alerts
    </p>
  </div>

  {/* Right */}
  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2">
    {systemWideCount > 0 && (
      <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[10px] font-bold">
        <Globe className="w-2.5 h-2.5" />
        {systemWideCount} system
      </span>
    )}

    <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-lg">
      {visibleAnnouncements.length} active
    </span>

    {canCreate && (
      <button
        onClick={() => {
          setEditingAnn(null)
          setShowModal(true)
        }}
        className="
  ml-auto sm:ml-0
  flex items-center gap-1.5
  px-2.5 py-1.5 sm:px-3 sm:py-1.5
  rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500
  text-white text-xs font-semibold shadow-sm
  hover:opacity-90 transition-all
  whitespace-nowrap
"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Add</span>
      </button>
    )}
  </div>
</div>

        {isTenantView && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            You can view announcements here, but only management roles can create or edit them.
          </div>
        )}

        {error && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-3 overflow-y-auto pr-1 flex-1">
          {visibleAnnouncements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <p className="text-sm text-slate-400">No announcements at this time.</p>
              {canCreate && (
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
                  Click <strong>Add</strong> to post one.
                </p>
              )}
            </div>
          ) : (
            visibleAnnouncements.map((ann) => (
              <AnnouncementCard
                key={ann.id}
                ann={ann}
                canEdit={canEditAnnouncement(ann)}
                canDelete={canDeleteAnnouncement(ann)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>

      <CreateAnnouncementModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingAnn(null)
        }}
        onSave={handleSave}
        creatorRole={role}
        initialData={editingAnn}
      />
    </>
  )
}
