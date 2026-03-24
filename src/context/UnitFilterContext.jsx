import { createContext, useContext, useState } from 'react'

const UnitFilterContext = createContext()

export function UnitFilterProvider({ children }) {
  const [selectedUnit, setSelectedUnit] = useState('all')

  return (
    <UnitFilterContext.Provider value={{ selectedUnit, setSelectedUnit }}>
      {children}
    </UnitFilterContext.Provider>
  )
}

export function useUnitFilter() {
  return useContext(UnitFilterContext)
}
