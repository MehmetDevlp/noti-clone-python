import { useEffect, useState } from 'react'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'

export function useTablePersistence(databaseId: string) {
  // LocalStorage anahtarı (Her veritabanı için benzersiz: table_state_123...)
  const storageKey = `table_state_${databaseId}`

  // Başlangıç değerlerini LocalStorage'dan okuyarak belirle
  const [initialState, setInitialState] = useState<{
    sorting: SortingState,
    filters: ColumnFiltersState
  }>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error("Ayarlar yüklenemedi", e)
    }
    // Kayıt yoksa varsayılan boş döndür
    return { sorting: [], filters: [] }
  })

  // Değişiklikleri Kaydetme Fonksiyonu
  const saveState = (sorting: SortingState, filters: ColumnFiltersState) => {
    // Sadece doluysa veya değiştiyse kaydetmek mantıklı ama
    // boşaltıldıysa da (temizlendiyse) kaydetmeliyiz.
    const data = JSON.stringify({ sorting, filters })
    localStorage.setItem(storageKey, data)
  }

  return { initialState, saveState }
}