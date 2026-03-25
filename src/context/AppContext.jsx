import { createContext, useContext, useState, useCallback } from 'react'
import initialBills from '@/data/mock/bills.json'
import initialPayments from '@/data/mock/payments.json'
import initialTenants from '@/data/mock/tenants.json'
import initialUnits from '@/data/mock/units.json'
import utilitiesData from '@/data/mock/utilities.json'

const AppContext = createContext()

function enrichBills(bills) {
  return bills.map(b => ({
    ...b,
    status: b.status === 'unpaid' ? 'published' : b.status === 'pending' ? 'payment_submitted' : b.status,
    tenantId: b.tenantId || 'TNT-001',
    publishedBy: b.publishedBy || 'finance',
    receipt: b.receipt || null,
    breakdown: b.breakdown || { electricity: 0, water: 0, thermal: 0 },
  }))
}

function seedMeters(units) {
  const meters = []
  units.forEach(u => {
    if (u.meterElec) meters.push({ id: `MTR-E-${u.id}`, type: 'electric', meterName: u.meterElec, customMeterType: '', unit: u.unit, unitId: u.id, tenant: u.tenant || null, status: 'active' })
    if (u.meterWater) meters.push({ id: `MTR-W-${u.id}`, type: 'water', meterName: u.meterWater, customMeterType: '', unit: u.unit, unitId: u.id, tenant: u.tenant || null, status: 'active' })
  })
  return meters
}

const INITIAL_RATES = utilitiesData.rateConfig || {
  electricity: { rate: 10.99, unit: 'per kWh',    completeness: 85  },
  water:       { rate: 30.00, unit: 'per m³',     completeness: 100 },
  thermal:     { rate: 11.00, unit: 'per kBTU/h', completeness: 70  },
}

export function AppProvider({ children }) {
  const [bills, setBills]       = useState(() => enrichBills(initialBills))
  const [payments, setPayments] = useState(initialPayments)
  const [tenants, setTenants]   = useState(initialTenants)
  const [units, setUnits]       = useState(initialUnits)
  const [meters, setMeters]     = useState(() => seedMeters(initialUnits))
  const [toasts, setToasts]     = useState([])
  // ── Billing Rates (Super Admin managed, globally shared) ────────────────
  const [billingRates, setBillingRates] = useState(INITIAL_RATES)

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  // ── VAT Rate (Super Admin managed) ────────────────
  const [vatRate, setVatRate] = useState(0.12) // default 12%
  const updateVatRate = useCallback((newRate) => {
    setVatRate(newRate)
    addToast(`VAT rate updated to ${(newRate*100).toFixed(2)}%`)
  }, [addToast])

  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  // ── Billing Rates CRUD (Super Admin only — enforced in UI + here) ────────
  const updateBillingRate = useCallback((type, rateData) => {
    setBillingRates(prev => ({ ...prev, [type]: { ...prev[type], ...rateData } }))
    addToast(`${type.charAt(0).toUpperCase() + type.slice(1)} rate updated successfully`)
  }, [addToast])

  const updateAllRates = useCallback((rates) => {
    setBillingRates(rates)
    addToast('All billing rates saved successfully')
  }, [addToast])

  // ── Bills ────────────────────────────────────────────────────────────────
  const updateBillStatus = useCallback((id, status) => {
    setBills(prev => prev.map(b => b.id === id ? { ...b, status } : b))
    addToast(`Bill status updated to ${status}`)
  }, [addToast])

  const submitPaymentReceipt = useCallback((billId, receiptData) => {
    const receipt = { id: `RCP-${Date.now()}`, billId, receiptImage: receiptData.receiptImage || null, paymentDate: receiptData.paymentDate, referenceNumber: receiptData.referenceNumber, note: receiptData.note || '', submittedBy: receiptData.submittedBy || 'tenant', submittedAt: new Date().toISOString() }
    setPayments(prev => [...prev, receipt])
    setBills(prev => prev.map(b => b.id === billId ? { ...b, status: 'payment_submitted', receipt } : b))
    addToast('Payment receipt submitted! Awaiting Finance review.', 'success')
    return receipt
  }, [addToast])

  const approvePayment = useCallback((billId) => {
    setBills(prev => prev.map(b => b.id === billId ? { ...b, status: 'paid' } : b))
    addToast('Payment approved. Bill marked as paid.', 'success')
  }, [addToast])

  const rejectPayment = useCallback((billId) => {
    setBills(prev => prev.map(b => b.id === billId ? { ...b, status: 'published', receipt: null } : b))
    setPayments(prev => prev.filter(p => p.billId !== billId))
    addToast('Payment rejected. Tenant must resubmit.', 'error')
  }, [addToast])

  const deleteBill = useCallback((id) => { setBills(prev => prev.filter(b => b.id !== id)); addToast('Bill deleted successfully', 'info') }, [addToast])

  const addBill = useCallback((bill) => {
    const newBill = { ...bill, id: `BL-2026-${String(Date.now()).slice(-3)}` }
    setBills(prev => [newBill, ...prev]); addToast('New bill created successfully')
  }, [addToast])

  const updateBill = useCallback((id, data) => { setBills(prev => prev.map(b => b.id === id ? { ...b, ...data } : b)); addToast('Bill updated successfully') }, [addToast])

  // ── Tenants ──────────────────────────────────────────────────────────────
  const addTenant = useCallback((tenant) => {
    const tenantUnits = Array.isArray(tenant.units) ? tenant.units.filter(Boolean) : []
    const newTenant = { ...tenant, id: `T-${String(Date.now()).slice(-3)}`, units: tenantUnits }
    setTenants(prev => [...prev, newTenant])
    if (tenantUnits.length > 0) {
      setUnits(prev => prev.map(u => tenantUnits.includes(u.unit) ? { ...u, tenant: newTenant.name, status: 'occupied' } : u))
      setMeters(prev => prev.map(m => tenantUnits.includes(m.unit) ? { ...m, tenant: newTenant.name } : m))
    }
    addToast(`${tenant.name} added successfully`)
  }, [addToast])

  const updateTenant = useCallback((id, data) => {
    setTenants(prev => {
      const old = prev.find(t => t.id === id)
      const oldUnits = old?.units || []
      const newUnits = Array.isArray(data.units) ? data.units.filter(Boolean) : []
      const removedUnits = oldUnits.filter(u => !newUnits.includes(u))
      const addedUnits = newUnits.filter(u => !oldUnits.includes(u))
      setUnits(up => up.map(u => {
        if (removedUnits.includes(u.unit)) return { ...u, tenant: null, status: 'vacant' }
        if (addedUnits.includes(u.unit)) return { ...u, tenant: data.name || old?.name, status: 'occupied' }
        if (newUnits.includes(u.unit) && data.name && u.tenant === old?.name) return { ...u, tenant: data.name }
        return u
      }))
      setMeters(mp => mp.map(m => {
        if (removedUnits.includes(m.unit)) return { ...m, tenant: null }
        if (addedUnits.includes(m.unit)) return { ...m, tenant: data.name || old?.name }
        if (newUnits.includes(m.unit) && data.name && m.tenant === old?.name) return { ...m, tenant: data.name }
        return m
      }))
      return prev.map(t => t.id === id ? { ...t, ...data, units: newUnits } : t)
    })
    addToast('Tenant updated successfully')
  }, [addToast])

  const deleteTenant = useCallback((id) => {
    setTenants(prev => {
      const tenant = prev.find(t => t.id === id)
      if (tenant?.units?.length) {
        setUnits(up => up.map(u => tenant.units.includes(u.unit) ? { ...u, tenant: null, status: 'vacant' } : u))
        setMeters(mp => mp.map(m => tenant.units.includes(m.unit) ? { ...m, tenant: null } : m))
      }
      return prev.filter(t => t.id !== id)
    })
    addToast('Tenant removed', 'info')
  }, [addToast])

  // ── Units ────────────────────────────────────────────────────────────────
  const addUnit = useCallback((unit) => { const nu = { ...unit, id: `U-${String(Date.now()).slice(-3)}` }; setUnits(prev => [...prev, nu]); addToast(`Unit ${unit.unit} added successfully`) }, [addToast])
  const updateUnit = useCallback((id, data) => { setUnits(prev => prev.map(u => u.id === id ? { ...u, ...data } : u)); addToast('Unit updated successfully') }, [addToast])
  const deleteUnit = useCallback((id) => { setUnits(prev => prev.filter(u => u.id !== id)); setMeters(prev => prev.filter(m => m.unitId !== id)); addToast('Unit removed', 'info') }, [addToast])

  // ── Meters (Super Admin only) ────────────────────────────────────────────
  const addMeter = useCallback((meter) => {
    const newMeter = { ...meter, id: `MTR-${String(Date.now()).slice(-6)}`, status: 'active' }
    setMeters(prev => [...prev, newMeter]); addToast(`Meter ${meter.meterName} added successfully`); return newMeter
  }, [addToast])
  const updateMeter = useCallback((id, data) => { setMeters(prev => prev.map(m => m.id === id ? { ...m, ...data } : m)); addToast('Meter updated successfully') }, [addToast])
  const deleteMeter = useCallback((id) => { setMeters(prev => prev.filter(m => m.id !== id)); addToast('Meter removed', 'info') }, [addToast])

  return (
    <AppContext.Provider value={{
  bills, tenants, units, payments, meters,
  billingRates, updateBillingRate, updateAllRates,
  vatRate, updateVatRate,  // <-- add these
  updateBillStatus, deleteBill, addBill, updateBill,
  submitPaymentReceipt, approvePayment, rejectPayment,
  addTenant, updateTenant, deleteTenant,
  addUnit, updateUnit, deleteUnit,
  addMeter, updateMeter, deleteMeter,
  toasts, addToast, removeToast,
}}>
  {children}
</AppContext.Provider>
  )
}

export function useApp() { return useContext(AppContext) }
