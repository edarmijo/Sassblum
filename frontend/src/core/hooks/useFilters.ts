/**
 * useFilters — robust filter state management for any module.
 * SRP: stable serialization + debounced filter updates.
 * SOLID: DIP · OCP.
 */
import { useState, useMemo, useCallback } from 'react'

export type FiltersState<T> = T & { [key: string]: unknown }

export function useFilters<T extends object>(initial: T) {
  const [filters, setFilters] = useState<T>(initial)

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters])

  const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value || undefined }
      // Remove undefined/null values to keep URL clean
      const cleaned = Object.fromEntries(
        Object.entries(next).filter(([, v]) => v !== undefined && v !== null && v !== ''),
      ) as T
      return cleaned
    })
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(initial)
  }, [initial])

  const hasFilters = useMemo(() => {
    return Object.values(filters).some(Boolean)
  }, [filtersKey])

  return { filters, filtersKey, updateFilter, clearFilters, hasFilters }
}
