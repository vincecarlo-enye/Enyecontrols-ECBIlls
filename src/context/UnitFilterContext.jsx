import { createContext, useContext, useState } from 'react'

const UnitFilterContext = createContext()
export const TENANT_TIME_RANGE_OPTIONS = [
  { value: '7d', label: '7D' },
  { value: '1m', label: '1M' },
  { value: '1y', label: '1Y' },
]

function getRangeStart(range, now = new Date()) {
  const current = new Date(now)

  if (range === '7d') {
    current.setDate(current.getDate() - 6)
    current.setHours(0, 0, 0, 0)
    return current
  }

  if (range === '1m') {
    return new Date(current.getFullYear(), current.getMonth(), 1)
  }

  if (range === '1y') {
    return new Date(current.getFullYear(), current.getMonth() - 11, 1)
  }

  return null
}

export function isDateWithinTenantTimeRange(value, range) {
  if (!range) return true

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return false

  const start = getRangeStart(range)
  if (!start) return true

  return date >= start
}

export function UnitFilterProvider({ children }) {
  const [selectedUnit, setSelectedUnit] = useState('all')
  const [selectedTimeRange, setSelectedTimeRange] = useState('1m')

  return (
    <UnitFilterContext.Provider
      value={{
        selectedUnit,
        setSelectedUnit,
        selectedTimeRange,
        setSelectedTimeRange,
      }}
    >
      {children}
    </UnitFilterContext.Provider>
  )
}

export function useUnitFilter() {
  return useContext(UnitFilterContext)
}
