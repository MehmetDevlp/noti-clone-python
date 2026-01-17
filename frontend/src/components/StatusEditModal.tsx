import { useState, useEffect } from 'react'
import { Check, X, Plus, Search } from 'lucide-react'

// Renk stilleri
const getColorStyle = (color: string) => {
  const map: Record<string, string> = {
    gray: 'bg-gray-500/20 text-gray-300',
    blue: 'bg-blue-500/20 text-blue-300',
    green: 'bg-green-500/20 text-green-300',
    red: 'bg-red-500/20 text-red-300',
    yellow: 'bg-yellow-500/20 text-yellow-300',
    purple: 'bg-purple-500/20 text-purple-300',
    pink: 'bg-pink-500/20 text-pink-300',
    orange: 'bg-orange-500/20 text-orange-300',
  }
  return map[color] || map.gray
}

// Sabit Gruplar
const STATUS_GROUPS = ['To-do', 'In Progress', 'Complete']

interface Option {
  id: string
  name: string
  color: string
  group?: string 
}

interface StatusEditModalProps {
  isOpen: boolean
  onClose: () => void
  currentValue: any 
  options: Option[]
  onChange: (value: any) => void 
  onCreate: (name: string, group: string) => void
  onDelete: (optionId: string) => void
  multiple?: boolean 
}

export default function StatusEditModal({ 
  isOpen, 
  onClose, 
  currentValue, 
  options, 
  onChange, 
  onCreate, 
  onDelete,
  multiple = false
}: StatusEditModalProps) {
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (isOpen) setSearch('')
  }, [isOpen])

  if (!isOpen) return null

  // Filtreleme
  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(search.toLowerCase())
  )
  
  // Gruplama
  const groupedOptions = {
    'Seçenekler': filteredOptions.filter(opt => !opt.group || !STATUS_GROUPS.includes(opt.group)),
    'To-do': filteredOptions.filter(opt => opt.group === 'To-do'),
    'In Progress': filteredOptions.filter(opt => opt.group === 'In Progress'),
    'Complete': filteredOptions.filter(opt => opt.group === 'Complete')
  }

  const isSelected = (optId: string) => {
    if (multiple && Array.isArray(currentValue)) {
      return currentValue.some((opt: Option) => opt.id === optId)
    }
    return currentValue?.id === optId
  }

  const handleOptionClick = (opt: Option) => {
    if (multiple) {
      const currentIds = Array.isArray(currentValue) ? currentValue.map((o: Option) => o.id) : []
      const isAlreadySelected = currentIds.includes(opt.id)
      let newIds
      if (isAlreadySelected) {
        newIds = currentIds.filter((id: string) => id !== opt.id)
      } else {
        newIds = [...currentIds, opt.id]
      }
      onChange(newIds)
    } else {
      onChange(opt.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      
      <div 
        className="w-[400px] bg-[#202020] border border-[#373737] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Başlık */}
        <div className="p-3 border-b border-[#373737]">
            <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {multiple ? 'Etiketleri Seç' : 'Durum Seç'}
                </span>
                <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={16}/></button>
            </div>
            <div className="flex items-center gap-2 bg-[#151515] px-3 py-2 rounded-lg border border-[#373737] focus-within:border-blue-500 transition-colors">
              <Search size={16} className="text-gray-500" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ara..."
                className="bg-transparent text-sm text-white outline-none w-full placeholder:text-gray-600"
                autoFocus
              />
            </div>
        </div>

        {/* Liste */}
        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
            {Object.entries(groupedOptions).map(([groupName, groupOpts]) => {
              if (groupOpts.length === 0 && !search) return null
              if (groupName === 'Seçenekler' && groupOpts.length === 0) return null

              return (
                <div key={groupName}>
                  {(groupName !== 'Seçenekler' || Object.keys(groupedOptions).length > 1) && (
                     <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-2">
                       {groupName}
                     </div>
                  )}

                  {groupOpts.map(opt => (
                    <div 
                      key={opt.id}
                      className="group flex items-center justify-between px-3 py-2 rounded-md hover:bg-[#2C2C2C] cursor-pointer transition-colors"
                      onClick={() => handleOptionClick(opt)}
                    >
                      <div className="flex items-center gap-3">
                         <div className="w-4 flex justify-center">
                           {isSelected(opt.id) && <Check size={16} className="text-blue-400" />}
                         </div>
                         <span className={`px-2.5 py-0.5 rounded text-sm font-medium ${getColorStyle(opt.color)}`}>
                           {opt.name}
                         </span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(opt.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 rounded hover:bg-red-400/10 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )
            })}
            
            {/* --- BURASI DEĞİŞTİ: GRUP SEÇMELİ OLUŞTURMA --- */}
            {search && !options.find(o => o.name.toLowerCase() === search.toLowerCase()) && (
              <div className="mt-2 border-t border-[#373737] pt-2">
                <div className="px-3 text-[10px] text-gray-500 uppercase font-bold mb-1">Yeni Oluştur</div>
                
                {/* Her grup için ayrı buton */}
                {STATUS_GROUPS.map(group => (
                  <button 
                    key={group}
                    onClick={() => {
                        onCreate(search, group)
                        setSearch('')
                        if(!multiple) onClose() 
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#2C2C2C] text-gray-400 hover:text-white transition-colors text-left"
                  >
                    <div className="w-4 flex justify-center"><Plus size={16} /></div>
                    <span className="text-sm">
                      <span className="text-white font-medium">"{search}"</span> 
                      <span className="opacity-50 text-xs ml-1">→ {group}</span>
                    </span>
                  </button>
                ))}
                
                {/* Eğer Status değil de normal Select/Multi-select ise 'Seçenekler' grubu için */}
                {!STATUS_GROUPS.some(g => options.some(o => o.group === g)) && (
                   <button 
                    onClick={() => {
                        onCreate(search, 'Seçenekler')
                        setSearch('')
                        if(!multiple) onClose() 
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#2C2C2C] text-gray-400 hover:text-white transition-colors text-left"
                  >
                    <div className="w-4 flex justify-center"><Plus size={16} /></div>
                    <span className="text-sm">Oluştur: <span className="text-white font-medium">"{search}"</span></span>
                  </button>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  )
}