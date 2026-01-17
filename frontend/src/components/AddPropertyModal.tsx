import { useState } from 'react'
import { X } from 'lucide-react'

interface AddPropertyModalProps {
  databaseId: string
  onClose: () => void
  onSuccess: (property: any) => void
}

const PROPERTY_TYPES = [
  { id: 'text', name: 'Text', icon: '📝', description: 'Düz metin' },
  { id: 'number', name: 'Number', icon: '🔢', description: 'Sayısal değer' },
  { id: 'select', name: 'Select', icon: '🏷️', description: 'Tekli seçim listesi' },
  { id: 'multi_select', name: 'Multi-select', icon: '🏷️', description: 'Çoklu etiketler' },
  { id: 'date', name: 'Date', icon: '📅', description: 'Tarih veya aralık' },
  { id: 'checkbox', name: 'Checkbox', icon: '☑️', description: 'Doğru veya yanlış' },
  { id: 'status', name: 'Status', icon: '📊', description: 'Gruplandırılmış durumlar' },
]

const SELECT_COLORS = ['gray', 'blue', 'green', 'red', 'yellow', 'purple', 'pink', 'orange', 'brown']

// Options tipini güncelledik: "group" alanı eklendi (Status için şart)
interface Option {
  id: string
  name: string
  color: string
  group?: string 
}

export default function AddPropertyModal({ databaseId, onClose, onSuccess }: AddPropertyModalProps) {
  const [step, setStep] = useState<'type' | 'config'>('type')
  const [selectedType, setSelectedType] = useState('')
  const [propertyName, setPropertyName] = useState('')
  const [options, setOptions] = useState<Option[]>([])

  const handleTypeSelect = (type: string) => {
    setSelectedType(type)
    
    // Select ve multi_select için varsayılanlar
    if (type === 'select' || type === 'multi_select') {
      setOptions([
        { id: crypto.randomUUID(), name: 'Seçenek 1', color: 'gray' },
        { id: crypto.randomUUID(), name: 'Seçenek 2', color: 'blue' },
      ])
      setStep('config')
    } 
    // --- BURASI DEĞİŞTİ: Status için Gruplu Varsayılanlar ---
    else if (type === 'status') {
      setOptions([
        // Grup: To-do
        { id: crypto.randomUUID(), name: 'Not Started', color: 'gray', group: 'To-do' },
        
        // Grup: In Progress
        { id: crypto.randomUUID(), name: 'In Progress', color: 'blue', group: 'In Progress' },
        
        // Grup: Complete
        { id: crypto.randomUUID(), name: 'Done', color: 'green', group: 'Complete' }
      ])
      setStep('config')
    }
    // Diğerleri (Text, number vb.)
    else {
      setStep('config')
    }
  }

  const handleCreate = async () => {
    if (!propertyName.trim()) {
      alert('Lütfen özellik ismini giriniz!')
      return
    }

    const config: any = {}
    
    // Status veya Select ise options'ı config içine gömüyoruz
    if (selectedType === 'select' || selectedType === 'multi_select' || selectedType === 'status') {
      config.options = options
    }

    try {
      const response = await fetch('http://localhost:8000/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database_id: databaseId,
          name: propertyName,
          type: selectedType,
          config: config,
          order_index: 999,
          visible: true,
        })
      })

      if (response.ok) {
        const newProperty = await response.json()
        onSuccess(newProperty)
        onClose()
      }
    } catch (err) {
      console.error('Özellik oluşturulamadı:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#202020] border border-[#373737] rounded-lg w-[600px] max-h-[80vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#373737]">
          <h2 className="text-lg font-semibold text-white">
            {step === 'type' ? 'Özellik Türü Seç' : 'Özelliği Yapılandır'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {step === 'type' ? (
            // Type Selection Grid
            <div className="grid grid-cols-2 gap-3">
              {PROPERTY_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className="p-4 bg-[#2C2C2C] border border-[#373737] rounded-lg hover:bg-[#373737] transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{type.icon}</span>
                    <span className="font-medium text-white group-hover:text-blue-400 transition-colors">{type.name}</span>
                  </div>
                  <p className="text-sm text-gray-400">{type.description}</p>
                </button>
              ))}
            </div>
          ) : (
            // Config Step
            <div className="space-y-6">
              {/* Property Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Özellik İsmi
                </label>
                <input
                  type="text"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="Örn: Durum, Öncelik, Bitiş Tarihi"
                  className="w-full px-3 py-2 bg-[#2C2C2C] border border-[#373737] rounded text-white outline-none focus:border-blue-500 transition-colors"
                  autoFocus
                />
              </div>

              {/* Options Editor (Select/Multi-select/Status) */}
              {(selectedType === 'select' || selectedType === 'multi_select' || selectedType === 'status') && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Seçenekler
                  </label>
                  
                  {/* Status ise Bilgi Notu */}
                  {selectedType === 'status' && (
                    <div className="mb-3 text-xs text-blue-400 bg-blue-400/10 p-2 rounded border border-blue-400/20">
                      ℹ️ Status seçenekleri otomatik olarak "Yapılacaklar", "Devam Ediyor" ve "Tamamlandı" gruplarına aittir.
                    </div>
                  )}

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {/* Option Name */}
                        <input
                          type="text"
                          value={opt.name}
                          onChange={(e) => {
                            const newOpts = [...options]
                            newOpts[idx].name = e.target.value
                            setOptions(newOpts)
                          }}
                          className="flex-1 px-3 py-2 bg-[#2C2C2C] border border-[#373737] rounded text-white outline-none focus:border-blue-500"
                        />
                        
                        {/* Color Picker */}
                        <select
                          value={opt.color}
                          onChange={(e) => {
                            const newOpts = [...options]
                            newOpts[idx].color = e.target.value
                            setOptions(newOpts)
                          }}
                          className="px-2 py-2 bg-[#2C2C2C] border border-[#373737] rounded text-white outline-none cursor-pointer"
                          style={{ color: opt.color === 'gray' ? 'white' : opt.color }}
                        >
                          {SELECT_COLORS.map(color => (
                            <option key={color} value={color} className={`text-${color}-400`}>
                              {color.charAt(0).toUpperCase() + color.slice(1)}
                            </option>
                          ))}
                        </select>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                          title="Sil"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => setOptions([...options, { 
                        id: crypto.randomUUID(), 
                        name: `Yeni Seçenek ${options.length + 1}`, 
                        color: 'gray',
                        group: selectedType === 'status' ? 'Yapılacaklar' : undefined // Yeni eklenirse varsayılan grup
                      }])}
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2"
                    >
                      <span>+</span> Seçenek Ekle
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-[#373737]">
                <button
                  onClick={() => setStep('type')}
                  className="px-4 py-2 bg-[#2C2C2C] border border-[#373737] rounded hover:bg-[#373737] transition-colors text-white"
                >
                  Geri
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-white font-medium shadow-lg shadow-blue-900/20"
                >
                  Oluştur
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}