import { createContext, useContext, useState } from 'react'
import initialConcerns from '@/data/mock/billingConcerns.json'

const BillingConcernContext = createContext()

export function BillingConcernProvider({ children }) {
  const [concerns, setConcerns] = useState(initialConcerns)

  const formatToday = () =>
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const patchConcern = (id, mutate) => {
    setConcerns((prev) => prev.map((concern) => (concern.id === id ? mutate(concern) : concern)))
  }

  const submitConcern = ({ billId, category, message, attachment, user }) => {
    const today = formatToday()
    const newConcern = {
      id: `BC-${Date.now()}`,
      billId,
      tenantId: user?.tenantId || 'T-001',
      tenantName: user?.name || 'Tenant',
      company: user?.company || '',
      unit: user?.unit || '',
      email: user?.email || '',
      category,
      message,
      attachment: attachment || null,
      status: 'pending',
      assignedTo: null,
      priority: 'medium',
      dateSubmitted: today,
      dateUpdated: today,
      adminNotes: '',
      financeNotes: '',
      timeline: [
        {
          id: `t-${Date.now()}`,
          action: 'Ticket submitted',
          by: user?.name || 'Tenant',
          role: 'tenant',
          date: today,
          note: `${message}`.slice(0, 80) + (message.length > 80 ? '...' : ''),
        },
      ],
    }

    setConcerns((prev) => [newConcern, ...prev])
    return newConcern
  }

  const assignToFinance = (id, adminNote = '') => {
    patchConcern(id, (concern) => ({
      ...concern,
      status: 'assigned',
      assignedTo: 'finance',
      adminNotes: adminNote,
      dateUpdated: formatToday(),
      timeline: [
        ...concern.timeline,
        {
          id: `t-${Date.now()}`,
          action: 'Assigned to Finance',
          by: 'Admin Enye',
          role: 'admin',
          date: formatToday(),
          note: adminNote,
        },
      ],
    }))
  }

  const rejectTicket = (id, adminNote = '') => {
    patchConcern(id, (concern) => ({
      ...concern,
      status: 'rejected',
      adminNotes: adminNote,
      dateUpdated: formatToday(),
      timeline: [
        ...concern.timeline,
        {
          id: `t-${Date.now()}`,
          action: 'Ticket rejected by admin',
          by: 'Admin Enye',
          role: 'admin',
          date: formatToday(),
          note: adminNote,
        },
      ],
    }))
  }

  const requestMoreInfo = (id, adminNote = '') => {
    patchConcern(id, (concern) => ({
      ...concern,
      status: 'pending',
      adminNotes: adminNote,
      dateUpdated: formatToday(),
      timeline: [
        ...concern.timeline,
        {
          id: `t-${Date.now()}`,
          action: 'More information requested',
          by: 'Admin Enye',
          role: 'admin',
          date: formatToday(),
          note: adminNote,
        },
      ],
    }))
  }

  const updateTicketStatus = (id, status, financeNote = '') => {
    patchConcern(id, (concern) => ({
      ...concern,
      status,
      financeNotes: financeNote,
      dateUpdated: formatToday(),
      timeline: [
        ...concern.timeline,
        {
          id: `t-${Date.now()}`,
          action: {
            investigating: 'Started investigation',
            resolved: 'Ticket resolved',
            adjusted: 'Bill adjusted',
            closed: 'Ticket closed',
          }[status] || `Status changed to ${status}`,
          by: 'Finance Officer',
          role: 'finance',
          date: formatToday(),
          note: financeNote,
        },
      ],
    }))
  }

  const respondToTenant = (id, financeNote) => {
    patchConcern(id, (concern) => ({
      ...concern,
      financeNotes: financeNote,
      dateUpdated: formatToday(),
      timeline: [
        ...concern.timeline,
        {
          id: `t-${Date.now()}`,
          action: 'Response sent to tenant',
          by: 'Finance Officer',
          role: 'finance',
          date: formatToday(),
          note: financeNote,
        },
      ],
    }))
  }

  const reopenTicket = (id, note = '') => {
    patchConcern(id, (concern) => ({
      ...concern,
      status: 'reopened',
      dateUpdated: formatToday(),
      timeline: [
        ...concern.timeline,
        {
          id: `t-${Date.now()}`,
          action: 'Ticket reopened by tenant',
          by: 'Tenant',
          role: 'tenant',
          date: formatToday(),
          note,
        },
      ],
    }))
  }

  return (
    <BillingConcernContext.Provider
      value={{
        concerns,
        submitConcern,
        assignToFinance,
        rejectTicket,
        requestMoreInfo,
        updateTicketStatus,
        respondToTenant,
        reopenTicket,
      }}
    >
      {children}
    </BillingConcernContext.Provider>
  )
}

export function useBillingConcerns() {
  return useContext(BillingConcernContext)
}
