import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

// DÜZELTME: URL artık .env dosyasından okunuyor
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// --- VERİLERİ ÇEKME ---
export const useDatabaseData = (databaseId: string) => {
  return useQuery({
    queryKey: ['database', databaseId],
    queryFn: async () => {
      const [db, props, pages] = await Promise.all([
        fetch(`${API_URL}/databases/${databaseId}`).then(r => r.json()),
        fetch(`${API_URL}/databases/${databaseId}/properties`).then(r => r.json()),
        fetch(`${API_URL}/databases/${databaseId}/pages`).then(r => r.json())
      ])

      const vMap: any = {}
      await Promise.all(pages.map(async (page: any) => {
        const vals = await fetch(`${API_URL}/pages/${page.id}/values`).then(r => r.json())
        vMap[page.id] = {}
        vals.forEach((v: any) => {
          vMap[page.id][v.property_id] = v
        })
      }))

      return { database: db, properties: props, pages: pages, pageValues: vMap }
    },
    enabled: !!databaseId,
  })
}

// --- SAYFA EKLEME ---
export const useAddPage = (databaseId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch(`${API_URL}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, database_id: databaseId }),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['database', databaseId] })
    }
  })
}

// --- VERİ GÜNCELLEME (Hücre Değeri) ---
export const useUpdateValue = (databaseId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ pageId, propertyId, value }: { pageId: string, propertyId: string, value: any }) => {
      await fetch(`${API_URL}/values`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_id: pageId, property_id: propertyId, value }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['database', databaseId] })
    }
  })
}

// --- SAYFA BAŞLIĞI GÜNCELLEME ---
export const useUpdateTitle = (databaseId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ pageId, title }: { pageId: string, title: string }) => {
      await fetch(`${API_URL}/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['database', databaseId] })
    }
  })
}

// --- SAYFA SİLME ---
export const useDeletePage = (databaseId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (pageId: string) => {
      await fetch(`${API_URL}/pages/${pageId}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['database', databaseId] })
    }
  })
}

// --- ÖZELLİK SİLME ---
export const useDeleteProperty = (databaseId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (propertyId: string) => {
      await fetch(`${API_URL}/properties/${propertyId}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['database', databaseId] })
    }
  })
}

// --- ÖZELLİK İSMİ GÜNCELLEME ---
export const useRenameProperty = (databaseId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ propId, name }: { propId: string, name: string }) => {
      await fetch(`${API_URL}/properties/${propId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['database', databaseId] })
    }
  })
}

// --- ÖZELLİK AYARI (Select Options vb.) GÜNCELLEME ---
export const useUpdatePropertyConfig = (databaseId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ propId, options }: { propId: string, options: any[] }) => {
      await fetch(`${API_URL}/properties/${propId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { options } }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['database', databaseId] })
    }
  })
}

// --- VERİTABANI İKONU GÜNCELLEME ---
export const useUpdateDatabaseIcon = (databaseId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (newIcon: string) => {
            await fetch(`${API_URL}/databases/${databaseId}`, { 
                method: 'PATCH', 
                headers: {'Content-Type':'application/json'}, 
                body: JSON.stringify({ icon: newIcon })
            })
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['database', databaseId] })
             // Sidebar bileşenine "Ben değiştim, kendini yenile" sinyali gönder
             window.dispatchEvent(new Event('sidebar-update'))
        }
    })
}

// --- VERİTABANI BAŞLIĞI GÜNCELLEME ---
export const useUpdateDatabaseTitle = (databaseId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (newTitle: string) => {
            await fetch(`${API_URL}/databases/${databaseId}`, { 
                method: 'PATCH', 
                headers: {'Content-Type':'application/json'}, 
                body: JSON.stringify({ title: newTitle })
            })
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['database', databaseId] })
             // Sidebar bileşenine "Ben değiştim, kendini yenile" sinyali gönder
             window.dispatchEvent(new Event('sidebar-update'))
        }
    })
}

// --- SAYFA İKONU GÜNCELLEME ---
export const useUpdatePageIcon = (pageId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (newIcon: string) => {
            await fetch(`${API_URL}/pages/${pageId}`, { 
                method: 'PATCH', 
                headers: {'Content-Type':'application/json'}, 
                body: JSON.stringify({ icon: newIcon })
            })
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['page', pageId] })
             // Sidebar bileşenine "Ben değiştim, kendini yenile" sinyali gönder
             window.dispatchEvent(new Event('sidebar-update'))
        }
    })
}

// --- KAPAK RESMİ GÜNCELLEME ---
export const useUpdatePageCover = (pageId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (coverUrl: string | null) => {
            // null gönderilirse kapak kaldırılır
            await fetch(`${API_URL}/pages/${pageId}`, { 
                method: 'PATCH', 
                headers: {'Content-Type':'application/json'}, 
                body: JSON.stringify({ cover: coverUrl })
            })
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['page', pageId] })
        }
    })
}

// --- DOSYA YÜKLEME HOOK'U ---
export const useUploadFile = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData, 
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || 'Yükleme başarısız')
      }

      return await res.json() 
    }
  })
}