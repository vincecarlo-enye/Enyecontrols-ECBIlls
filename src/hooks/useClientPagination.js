import { useEffect, useMemo, useState } from 'react'

export function useClientPagination(items, initialPerPage = 10) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(initialPerPage)

  const total = Array.isArray(items) ? items.length : 0
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(page, lastPage)

  useEffect(() => {
    if (page > lastPage) {
      setPage(lastPage)
    }
  }, [page, lastPage])

  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * perPage
    return (Array.isArray(items) ? items : []).slice(start, start + perPage)
  }, [items, perPage, safePage])

  const meta = useMemo(() => {
    const from = total === 0 ? 0 : (safePage - 1) * perPage + 1
    const to = total === 0 ? 0 : Math.min(safePage * perPage, total)

    return {
      current_page: safePage,
      per_page: perPage,
      total,
      last_page: lastPage,
      from,
      to,
    }
  }, [lastPage, perPage, safePage, total])

  return {
    page: safePage,
    perPage,
    setPage,
    setPerPage,
    pagedItems,
    meta,
  }
}
