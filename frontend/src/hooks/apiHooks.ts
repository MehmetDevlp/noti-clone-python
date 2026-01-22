import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast' // <-- 1. TOAST IMPORT EDİLDİ

const API_URL = 'http://localhost:8000'

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

// --- SAYFA EKLEME (Toast yok, DatabasePage yönetiyor) ---
export const useAddPage = (databaseId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (title: string = '') => {
      const res = await fetch(`${API_URL}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database_id: databaseId, title })
      })
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['database', databaseId] })
  })
}

// --- DEĞER GÜNCELLEME (Hücre değişimi - Toast yok, çok sık çalışır) ---
export const useUpdateValue = (databaseId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ pageId, propertyId, value }: any) => {
      await fetch(`${API_URL}/values`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_id: pageId, property_id: propertyId, value })
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['database', databaseId] })
  })
}

// --- BAŞLIK GÜNCELLEME (Toast yok, yazarken rahatsız etmesin) ---
export const useUpdateTitle = (databaseId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ pageId, title }: { pageId: string, title: string }) => {
      await fetch(`${API_URL}/pages/${pageId}`, {
         method: 'PATCH', 
         headers: { 'Content-Type': 'application/json' }, 
         body: JSON.stringify({ title }) 
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['database', databaseId] })
  })
}

// --- SİLME İŞLEMLERİ ---
export const useDeletePage = (databaseId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (pageId: string) => {
            await fetch(`${API_URL}/pages/${pageId}`, { method: 'DELETE' })
        },
        // DatabasePage.tsx içinde zaten toast.success veriyoruz, buraya eklemiyoruz.
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['database', databaseId] })
    })
}

// --- BURADAN SONRASINA TOAST EKLENDİ ---

export const useDeleteProperty = (databaseId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (propId: string) => {
            await fetch(`${API_URL}/properties/${propId}`, { method: 'DELETE' })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['database', databaseId] })
            toast.success('Özellik silindi') // <-- EKLENDİ
        }
    })
}

// --- ÖZELLİK GÜNCELLEME ---
export const useRenameProperty = (databaseId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ propId, name }: { propId: string, name: string }) => {
            await fetch(`${API_URL}/properties/${propId}`, { 
                method: 'PATCH', 
                headers: {'Content-Type':'application/json'}, 
                body: JSON.stringify({ name })
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['database', databaseId] })
            toast.success('Özellik yeniden adlandırıldı') // <-- EKLENDİ
        }
    })
}

export const useUpdatePropertyConfig = (databaseId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ propId, options }: { propId: string, options: any[] }) => {
            await fetch(`${API_URL}/properties/${propId}`, { 
                method: 'PATCH', 
                headers: {'Content-Type':'application/json'}, 
                body: JSON.stringify({ config: { options } })
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['database', databaseId] })
            toast.success('Özellik ayarları güncellendi') // <-- EKLENDİ
        }
    })
}

// --- VERİTABANI İKONU GÜNCELLEME ---
export const useUpdateDatabaseIcon = (databaseId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (icon: string) => {
            await fetch(`${API_URL}/databases/${databaseId}`, { 
                method: 'PATCH', 
                headers: {'Content-Type':'application/json'}, 
                body: JSON.stringify({ icon })
            })
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['database', databaseId] })
             queryClient.invalidateQueries({ queryKey: ['databases'] }) 
             toast.success('İkon güncellendi') // <-- EKLENDİ
        }
    })
}

// --- SAYFA İKONU GÜNCELLEME ---
export const useUpdatePageIcon = (pageId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (icon: string) => {
            await fetch(`${API_URL}/pages/${pageId}`, { 
                method: 'PATCH', 
                headers: {'Content-Type':'application/json'}, 
                body: JSON.stringify({ icon })
            })
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['page', pageId] })
             queryClient.invalidateQueries({ queryKey: ['pages'] }) 
             queryClient.invalidateQueries({ queryKey: ['databases'] }) 
             toast.success('Sayfa ikonu güncellendi') // <-- EKLENDİ
        }
    })
}
// --- EKLENEN KISIM: VERİTABANI BAŞLIĞI GÜNCELLEME ---
export const useUpdateDatabaseTitle = (databaseId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (title: string) => {
            await fetch(`${API_URL}/databases/${databaseId}`, { 
                method: 'PATCH', 
                headers: {'Content-Type':'application/json'}, 
                body: JSON.stringify({ title })
            })
        },
        onSuccess: () => {
             // 1. Veritabanı içindeki verileri tazele
             queryClient.invalidateQueries({ queryKey: ['database', databaseId] })
             // 2. Sidebar listesini tazele
             queryClient.invalidateQueries({ queryKey: ['databases'] }) 
             // 3. Sidebar bileşenine "Ben değiştim, kendini yenile" sinyali gönder
             window.dispatchEvent(new Event('sidebar-update'))
        }
    })
}