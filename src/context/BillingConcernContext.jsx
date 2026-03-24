/**
 * BillingConcernContext.jsx
 * Shared state for Billing Concern / Dispute Ticket System.
 * Simulates interaction between Tenant, Admin, and Finance roles.
 */

import { createContext, useContext, useState } from 'react'
import initialConcerns from '@/data/mock/billingConcerns.json'

const BillingConcernContext = createContext()

export function BillingConcernProvider({ children }) {
  const [concerns, setConcerns] = useState(initialConcerns)

  /** Tenant submits a new billing concern */
  const submitConcern = ({ billId, category, message, attachment, user }) => {
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
      dateSubmitted: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      dateUpdated: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      adminNotes: '',
      financeNotes: '',
      timeline: [
        {
          id: `t-${Date.now()}`,
          action: 'Ticket submitted',
          by: user?.name || 'Tenant',
          role: 'tenant',
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          note: message.slice(0, 80) + (message.length > 80 ? '…' : ''),
        },
      ],
    }
    setConcerns((prev) => [newConcern, ...prev])
    return newConcern
  }

  /** Admin assigns ticket to Finance */
  const assignToFinance = (id, adminNote = '') => {
    setConcerns((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const timelineEntry = {
          id: `t-${Date.now()}`,
          action: 'Assigned to Finance',
          by: 'Admin Enye',
          role: 'admin',
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          note: adminNote,
        }
        return {
          ...c,
          status: 'assigned',
          assignedTo: 'finance',
          adminNotes: adminNote,
          dateUpdated: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          timeline: [...c.timeline, timelineEntry],
        }
      })
    )
  }

  /** Admin rejects a ticket */
  const rejectTicket = (id, adminNote = '') => {
    setConcerns((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const timelineEntry = {
          id: `t-${Date.now()}`,
          action: 'Ticket rejected by admin',
          by: 'Admin Enye',
          role: 'admin',
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          note: adminNote,
        }
        return {
          ...c,
          status: 'rejected',
          adminNotes: adminNote,
          dateUpdated: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          timeline: [...c.timeline, timelineEntry],
        }
      })
    )
  }

  /** Admin requests more information */
  const requestMoreInfo = (id, adminNote = '') => {
    setConcerns((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const timelineEntry = {
          id: `t-${Date.now()}`,
          action: 'More information requested',
          by: 'Admin Enye',
          role: 'admin',
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          note: adminNote,
        }
        return {
          ...c,
          status: 'pending',
          adminNotes: adminNote,
          dateUpdated: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          timeline: [...c.timeline, timelineEntry],
        }
      })
    )
  }

  /** Finance updates ticket status */
  const updateTicketStatus = (id, status, financeNote = '') => {
    setConcerns((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const actionLabel = {
          investigating: 'Started investigation',
          resolved: 'Ticket resolved',
          adjusted: 'Bill adjusted',
          closed: 'Ticket closed',
        }[status] || `Status changed to ${status}`
        const timelineEntry = {
          id: `t-${Date.now()}`,
          action: actionLabel,
          by: 'Finance Officer',
          role: 'finance',
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          note: financeNote,
        }
        return {
          ...c,
          status,
          financeNotes: financeNote,
          dateUpdated: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          timeline: [...c.timeline, timelineEntry],
        }
      })
    )
  }

  /** Finance responds to tenant */
  const respondToTenant = (id, financeNote) => {
    setConcerns((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const timelineEntry = {
          id: `t-${Date.now()}`,
          action: 'Response sent to tenant',
          by: 'Finance Officer',
          role: 'finance',
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          note: financeNote,
        }
        return {
          ...c,
          financeNotes: financeNote,
          dateUpdated: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          timeline: [...c.timeline, timelineEntry],
        }
      })
    )
  }

  /** Tenant reopens a resolved/closed ticket */
  const reopenTicket = (id, note = '') => {
    setConcerns((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const timelineEntry = {
          id: `t-${Date.now()}`,
          action: 'Ticket reopened by tenant',
          by: 'Tenant',
          role: 'tenant',
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          note,
        }
        return {
          ...c,
          status: 'reopened',
          dateUpdated: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          timeline: [...c.timeline, timelineEntry],
        }
      })
    )
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
