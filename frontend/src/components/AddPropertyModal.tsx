import { useState } from 'react'
import { X, Type, List, CheckSquare, Calendar, Tag, AlertCircle, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query' // <-- 1. EKLENDİ

const TYPE_ICONS = {
  text: <Type size={16} />,
  select: <List size={16} />,
  multi_select: <Tag size={16} />,
  status: <CheckSquare size={16} />,
  date: <Calendar size={16} />,
  checkbox: <CheckSquare size={16} />,
  priority: <BarChart3 size={16} />,
}

const PROPERTY_TYPES = [
  { type: 'text', name: 'Metin', description: 'Açıklama, notlar vb.' },
  { type: 'status', name: 'Durum', description: 'İlerleme durumu (To-do, Done)' },
  { type: 'priority', name: 'Öncelik (Akıllı)', description: 'Sıralı 5 seviye (Çok Düşük -> Çok Yüksek)' },
  { type: 'select', name: 'Seçim', description: 'Kategori, Departman gibi tekli seçimler' },
  { type: 'multi_select', name: '#Etiket (Çoklu)', description: 'Birden fazla etiket (Örn: #iş, #acil)' },
  { type: 'date', name: 'Tarih', description: 'Bitiş tarihi destekli takvim' },
  { type: 'checkbox', name: 'Onay Kutusu', description: 'Basit evet/hayır' },
]

interface AddPropertyModalProps {
  databaseId: string
  onClose: () => void
  onSuccess: (newProperty: any) => void
}

export default function AddPropertyModal({ databaseId, onClose, onSuccess }: AddPropertyModalProps) {
  const [name, setName] = useState('')
  const [selectedType, setSelectedType] = useState('status') 
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const queryClient = useQueryClient() // <-- 2. HOOK ÇAĞRILDI

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
       setError("Lütfen bir özellik ismi giriniz.")
       return
    }

    setIsLoading(true)
    setError(null)

    let initialConfig = {}

    if (selectedType === 'status') {
        initialConfig = {
            options: [
                { id: crypto.randomUUID(), name: 'Başlanmadı', color: 'gray', group: 'To-do' },
                { id: crypto.randomUUID(), name: 'Devam Ediyor', color: 'blue', group: 'In Progress' },
                { id: crypto.randomUUID(), name: 'Tamamlandı', color: 'green', group: 'Complete' }
            ]
        }
    }
    else if (selectedType === 'priority') {
        initialConfig = {
            options: [
                { id: crypto.randomUUID(), name: 'Çok Yüksek', color: 'red' },
                { id: crypto.randomUUID(), name: 'Yüksek', color: 'orange' },
                { id: crypto.randomUUID(), name: 'Orta', color: 'yellow' },
                { id: crypto.randomUUID(), name: 'Düşük', color: 'blue' },
                { id: crypto.randomUUID(), name: 'Çok Düşük', color: 'gray' }
            ]
        }
    }

    try {
      const response = await fetch('http://localhost:8000/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database_id: databaseId,
          name: name,
          type: selectedType,
          config: initialConfig
        })
      })

      if (!response.ok) throw new Error('Sunucu hatası')
      
      const data = await response.json()
      
      // <-- 3. KRİTİK GÜNCELLEME: VERİTABANINI YENİLE -->
      queryClient.invalidateQueries({ queryKey: ['database', databaseId] })
      
      toast.success(`${name} özelliği eklendi`)
      onSuccess(data)
      onClose()
    } catch (err: any) {
      setError("Bir hata oluştu: " + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value)
      if (error) setError(null)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-[400px] bg-[#202020] border border-[#373737] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#373737] flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-300">Yeni Özellik Ekle</span>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Özellik İsmi</label>
            <input 
              autoFocus
              type="text" 
              value={name}
              onChange={handleNameChange}
              className={`w-full bg-[#151515] border rounded p-2 text-white text-sm outline-none transition-colors ${error ? 'border-red-500 focus:border-red-500' : 'border-[#373737] focus:border-blue-500'}`}
              placeholder="Örn: Durum, Öncelik..."
            />
            {error && (
                <div className="flex items-center gap-1 mt-1 text-red-400 text-xs animate-in slide-in-from-top-1">
                    <AlertCircle size={12} />
                    <span>{error}</span>
                </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Tür</label>
            <div className="grid grid-cols-1 gap-1 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
              {PROPERTY_TYPES.map((pt) => (
                <div 
                  key={pt.type}
                  onClick={() => setSelectedType(pt.type)}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${selectedType === pt.type ? 'bg-blue-500/20 border border-blue-500/50' : 'hover:bg-[#2C2C2C] border border-transparent'}`}
                >
                  <div className={`p-1.5 rounded ${selectedType === pt.type ? 'text-blue-400' : 'text-gray-400'}`}>
                    {TYPE_ICONS[pt.type as keyof typeof TYPE_ICONS]}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${selectedType === pt.type ? 'text-blue-100' : 'text-gray-300'}`}>{pt.name}</div>
                    <div className="text-[10px] text-gray-500">{pt.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="mt-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? 'Oluşturuluyor...' : 'Oluştur'}
          </button>
        </form>
      </div>
    </div>
  )
}