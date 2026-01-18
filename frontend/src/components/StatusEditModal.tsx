import { useState, useEffect, useRef } from 'react'
import { X, Search, Check, Plus, Trash, Palette } from 'lucide-react'

interface Option {
  id: string
  name: string
  color: string
  group?: string
}

interface StatusEditModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  currentValue: Option | Option[] | null
  options: Option[]
  propType: string
  multiple?: boolean
  onChange: (value: string | string[]) => void
  onCreate: (name: string, color: string, group?: string) => void
  onDelete: (optionId: string) => void
}

export default function StatusEditModal({
  isOpen,
  onClose,
  title,
  currentValue,
  options,
  propType,
  multiple = false,
  onChange,
  onCreate,
  onDelete
}: StatusEditModalProps) {
  const [search, setSearch] = useState('')
  const [selectedColor, setSelectedColor] = useState('#6b7280') // Varsayılan gri
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(options)
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setFilteredOptions(options)
      setSearch('')
      setSelectedColor('#6b7280')
    }
  }, [isOpen, options])

  useEffect(() => {
    if (!search.trim()) {
      setFilteredOptions(options)
    } else {
      setFilteredOptions(options.filter(o => o.name.toLowerCase().includes(search.toLowerCase())))
    }
  }, [search, options])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isSelected = (optId: string) => {
    if (Array.isArray(currentValue)) return currentValue.some(c => c.id === optId)
    return currentValue?.id === optId
  }

  const handleSelect = (opt: Option) => {
    if (multiple) {
      const currentIds = Array.isArray(currentValue) ? currentValue.map(c => c.id) : []
      if (currentIds.includes(opt.id)) onChange(currentIds.filter(id => id !== opt.id))
      else onChange([...currentIds, opt.id])
    } else {
      onChange(opt.id)
      onClose()
    }
  }

  // Renk Kontrolü (Hex mi yoksa eski tip isim mi?)
  const getColorStyle = (color: string) => {
    if (color.startsWith('#')) {
      return { backgroundColor: color }
    }
    // Eski renk isimleri için fallback (Geri uyumluluk)
    const colorMap: Record<string, string> = {
      gray: '#6b7280', blue: '#3b82f6', green: '#22c55e', red: '#ef4444',
      yellow: '#eab308', orange: '#f97316', purple: '#a855f7', pink: '#ec4899', brown: '#78350f'
    }
    return { backgroundColor: colorMap[color] || '#6b7280' }
  }

  const renderOptionItem = (opt: Option) => (
    <div key={opt.id} className="group flex items-center justify-between p-1.5 rounded hover:bg-[#2C2C2C] cursor-pointer transition-colors">
      <div onClick={() => handleSelect(opt)} className="flex items-center gap-2 flex-1 overflow-hidden">
        {/* Yuvarlak Renk Göstergesi */}
        <div 
            className="w-3 h-3 rounded-full border border-white/10 shrink-0" 
            style={getColorStyle(opt.color)}
        ></div>
        <span className={`text-sm truncate ${isSelected(opt.id) ? 'text-blue-400 font-medium' : 'text-gray-300'}`}>{opt.name}</span>
        {isSelected(opt.id) && <Check size={14} className="text-blue-400 ml-auto" />}
      </div>
      <button onClick={(e) => { e.stopPropagation(); onDelete(opt.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all">
        <Trash size={12} />
      </button>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div ref={modalRef} className="w-[320px] bg-[#202020] border border-[#373737] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[500px] animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="p-3 border-b border-[#373737] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title || 'Seçenekler'}</span>
            <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={14} /></button>
          </div>
          <div className="relative group">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-500 group-focus-within:text-blue-400" />
            <input ref={inputRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${title} ara...`} className="w-full bg-[#151515] text-white text-sm rounded-md py-1.5 pl-8 pr-3 outline-none border border-[#373737] focus:border-blue-500/50 placeholder:text-gray-600" />
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
          {propType === 'status' ? (
             ['To-do', 'In Progress', 'Complete'].map(group => {
                 const groupOptions = filteredOptions.filter(o => o.group === group)
                 if (search && groupOptions.length === 0) return null
                 return (
                     <div key={group} className="mb-2">
                         <div className="text-[10px] font-bold text-gray-500 uppercase px-2 py-1">{group === 'To-do' ? 'Yapılacaklar' : group === 'In Progress' ? 'Devam Edenler' : 'Tamamlananlar'}</div>
                         <div className="pl-1">
                             {groupOptions.map(renderOptionItem)}
                             {!search && groupOptions.length === 0 && <div className="text-[10px] text-gray-600 px-2 italic">Boş</div>}
                         </div>
                     </div>
                 )
             })
          ) : (
             filteredOptions.map(renderOptionItem)
          )}

          {!search && filteredOptions.length === 0 && propType !== 'status' && (
              <div className="text-xs text-gray-500 text-center py-4 italic">Henüz seçenek yok.</div>
          )}

          {/* OLUŞTURMA BÖLÜMÜ (RENK SEÇİCİLİ) */}
          {search && !filteredOptions.some(o => o.name.toLowerCase() === search.toLowerCase()) && (
            <div className="mt-2 border-t border-[#373737]/50 pt-3 px-2">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Renk Seç</span>
                    <div className="flex items-center gap-2">
                        {/* Renk Önizlemesi */}
                        <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: selectedColor }}></div>
                        
                        {/* Native Color Picker */}
                        <label className="cursor-pointer bg-[#2C2C2C] hover:bg-[#373737] text-white text-xs px-2 py-1 rounded border border-[#373737] flex items-center gap-1 transition-colors">
                            <Palette size={12} />
                            <span>Özel</span>
                            <input 
                                type="color" 
                                value={selectedColor}
                                onChange={(e) => setSelectedColor(e.target.value)}
                                className="w-0 h-0 opacity-0 absolute" // Gizli input, label tetikler
                            />
                        </label>
                    </div>
                </div>

                <div 
                    onClick={() => { onCreate(search, selectedColor); setSearch('') }} 
                    className="flex items-center gap-2 p-2 rounded bg-blue-500/10 hover:bg-blue-500/20 cursor-pointer text-blue-300 hover:text-blue-200 border border-blue-500/30 transition-all"
                >
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white shadow-sm"><Plus size={14} /></div>
                    <span className="text-sm font-medium">Oluştur: "{search}"</span>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}