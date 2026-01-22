import { useEffect, useState } from 'react'
import type { SortingState, ColumnFiltersState, ColumnOrderState } from '@tanstack/react-table'

export function useTablePersistence(databaseId: string) {
  const storageKey = `table_state_${databaseId}`

  const [initialState, setInitialState] = useState<{
    sorting: SortingState,
    filters: ColumnFiltersState,
    columnOrder: ColumnOrderState
  }>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        // DÜZELTME BURADA: Eski veri varsa bile eksik parçaları tamamla
        return {
            sorting: parsed.sorting || [],
            filters: parsed.filters || [],
            columnOrder: parsed.columnOrder || [] // <-- Eğer undefined ise [] yap
        }
      }
    } catch (e) {
      console.error("Ayarlar yüklenemedi", e)
    }
    // Varsayılanlar
    return { sorting: [], filters: [], columnOrder: [] }
  })

  // Kaydetme Fonksiyonu
  const saveState = (sorting: SortingState, filters: ColumnFiltersState, columnOrder: ColumnOrderState) => {
    const data = JSON.stringify({ sorting, filters, columnOrder })
    localStorage.setItem(storageKey, data)
  }

  return { initialState, saveState }
}