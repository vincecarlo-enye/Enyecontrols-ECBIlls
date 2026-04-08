import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import initialTenants from '@/data/mock/tenants.json'
import initialUnits from '@/data/mock/units.json'
import utilitiesData from '@/data/mock/utilities.json'

const AppContext = createContext()

function seedMeters(units) {
  const meters = []

  units.forEach((unit) => {
    if (unit.meterElec) {
      meters.push({
        id: `MTR-E-${unit.id}`,
        type: 'electric',
        meterName: unit.meterElec,
        customMeterType: '',
        unit: unit.unit,
        unitId: unit.id,
        tenant: unit.tenant || null,
        status: 'active',
      })
    }

    if (unit.meterWater) {
      meters.push({
        id: `MTR-W-${unit.id}`,
        type: 'water',
        meterName: unit.meterWater,
        customMeterType: '',
        unit: unit.unit,
        unitId: unit.id,
        tenant: unit.tenant || null,
        status: 'active',
      })
    }
  })

  return meters
}

const BILLING_RATES = utilitiesData.rateConfig || {
  electricity: { rate: 10.99, unit: 'per kWh', completeness: 85 },
  water: { rate: 30.0, unit: 'per m3', completeness: 100 },
  thermal: { rate: 11.0, unit: 'per kBTU/h', completeness: 70 },
}

const DASHBOARD_TENANTS = initialTenants
const DASHBOARD_METERS = seedMeters(initialUnits)

export function AppProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 3500)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const value = useMemo(() => ({
    tenants: DASHBOARD_TENANTS,
    meters: DASHBOARD_METERS,
    billingRates: BILLING_RATES,
    toasts,
    addToast,
    removeToast,
  }), [addToast, removeToast, toasts])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
