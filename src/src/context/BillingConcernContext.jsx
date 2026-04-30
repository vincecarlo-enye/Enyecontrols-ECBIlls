/**
 * BillingConcernContext — API-backed replacement for the previous mock version.
 *
 * All concern state is now owned by the individual page-level hooks that call
 * adminBillingConcernService / financeBillingConcernService directly.
 *
 * This context is kept as a thin pass-through so any future imports don't break,
 * but it no longer seeds state from a static JSON file.
 *
 * Usage: the context is intentionally empty – pages should use the service
 * functions directly (adminBillingConcernService, financeBillingConcernService).
 */
import { createContext, useContext } from 'react'

const BillingConcernContext = createContext({})

/**
 * Provider is a no-op wrapper retained for structural compatibility.
 * No JSON seed data is loaded.
 */
export function BillingConcernProvider({ children }) {
  return (
    <BillingConcernContext.Provider value={{}}>
      {children}
    </BillingConcernContext.Provider>
  )
}

export function useBillingConcerns() {
  return useContext(BillingConcernContext)
}
