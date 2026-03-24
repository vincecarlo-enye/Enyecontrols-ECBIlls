/**
 * useBills.js
 * Custom hook that exposes billing data + workflow actions from AppContext.
 */

import { useApp } from '@/context/AppContext'

// Bill statuses: draft | published | payment_submitted | paid | overdue
export const BILL_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  PAYMENT_SUBMITTED: 'payment_submitted',
  PAID: 'paid',
  OVERDUE: 'overdue',
}

export function useBills() {
  const {
    bills,
    payments,
    updateBillStatus,
    updateBill,
    deleteBill,
    addBill,
    submitPaymentReceipt,
    approvePayment,
    rejectPayment,
    addToast,
  } = useApp()

  // ── Derived stats ──────────────────────────────────────────────────────────
  const draftBills     = bills.filter(b => b.status === 'draft')
  const publishedBills = bills.filter(b => b.status === 'published')
  const submittedBills = bills.filter(b => b.status === 'payment_submitted')
  const paidBills      = bills.filter(b => b.status === 'paid')
  const overdueBills   = bills.filter(b => b.status === 'overdue')
  const unpaidBills    = bills.filter(b => ['published', 'overdue'].includes(b.status))
  const pendingBills   = submittedBills // alias for legacy compat
  const totalRevenue   = paidBills.reduce((s, b) => s + b.amount, 0)

  // ── Actions ────────────────────────────────────────────────────────────────
  const publishBill = (id) => updateBillStatus(id, 'published')
  const markPaid    = (id) => updateBillStatus(id, 'paid')
  const markDraft   = (id) => updateBillStatus(id, 'draft')
  const markPending = (id) => updateBillStatus(id, 'payment_submitted')
  const removeBill  = (id) => deleteBill(id)
  const createBill  = (data) => addBill(data)

  return {
    // data
    bills,
    payments,
    draftBills,
    publishedBills,
    submittedBills,
    paidBills,
    overdueBills,
    unpaidBills,
    pendingBills,
    totalRevenue,
    // actions
    updateBillStatus,
    updateBill,
    publishBill,
    markPaid,
    markDraft,
    markPending,
    removeBill,
    createBill,
    submitPaymentReceipt,
    approvePayment,
    rejectPayment,
    addToast,
  }
}
