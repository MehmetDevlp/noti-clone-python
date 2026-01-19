import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const API_URL = 'http://localhost:8000'

// --- VERİ ÇEKME (FETCH) ---
export const useDatabases = () => {
  return useQuery({
    queryKey: ['databases'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/databases`)
      if (!res.ok) throw new Error('Veritabanları çekilemedi')
      return res.json()
    },
  })
}

// --- VERİ EKLEME (CREATE) ---
export const useCreateDatabase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch(`${API_URL}/databases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, icon: '📁' }),
      })
      if (!res.ok) throw new Error('Oluşturulamadı')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databases'] })
    },
  })
}