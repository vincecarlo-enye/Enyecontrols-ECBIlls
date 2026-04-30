/**
 * useModalState.js
 * Generic reusable hook for managing modal open/close state and the
 * currently selected item (e.g. the bill being viewed or paid).
 *
 * Usage:
 *   const viewer = useModalState()
 *   viewer.open(bill)        → sets selectedItem + isOpen = true
 *   viewer.close()           → isOpen = false, clears item after animation
 *   viewer.isOpen            → boolean
 *   viewer.selectedItem      → the item passed to open()
 */

import { useState, useRef, useCallback } from 'react'

export function useModalState() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  // Keep last item in a ref so content doesn't disappear mid-close animation
  const lastItemRef = useRef(null)

  const open = useCallback((item = null) => {
    if (item !== null) {
      lastItemRef.current = item
      setSelectedItem(item)
    }
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    // Delay clearing so close animation can finish
    setTimeout(() => setSelectedItem(null), 300)
  }, [])

  const update = useCallback((item) => {
    lastItemRef.current = item
    setSelectedItem(item)
  }, [])

  // Exposed item: prefer live selectedItem, fall back to lastItemRef during close
  const item = selectedItem ?? lastItemRef.current

  return {
    isOpen,
    selectedItem: item,
    open,
    close,
    update,
  }
}
