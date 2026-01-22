import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ListFilter, ArrowUpDown, X, Plus, Calendar, CheckSquare, Type, List, Trash2, Filter } from 'lucide-react'
import type { Table } from '@tanstack/react-table'
import { getOperatorsForType } from '../utils/filterOperators'

interface Property {
  id: string
  name: string
  type: string
  config: any
}

interface DatabaseToolbarProps {
  table: Table<any>
  properties: Property[]
}

export default function DatabaseToolbar({ table, properties }: DatabaseToolbarProps) {
  const [activeModal, setActiveModal] = useState<'sort' | 'filter' | null>(null)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })

  const sorting = table.getState().sorting
  // Not: Artık table.getState().columnFilters kullanmıyoruz çünkü yapı değişti.
  // Gelişmiş filtreleri "globalFilter" üzerinden veya custom bir state üzerinden yönetmemiz gerekirdi.
  // Ancak TanStack table'ın native columnFilters yapısı basit key-value tutar.
  // Biz "Advanced Filter" yaptığımız için bu filtreleri tabloya "globalFilter" olarak veya dışarıdan filtreleyerek vereceğiz.
  // ŞİMDİLİK: Basit entegrasyon için columnFilters kullanmaya devam edeceğiz ama "value" kısmına JSON string gömeceğiz.
  
  const columnFilters = table.getState().columnFilters

  // --- SORT İŞLEMLERİ ---
  const handleAddSort = () => {
    if (!properties || properties.length === 0) return
    const firstProp = properties[0].id
    table.setSorting([...sorting, { id: firstProp, desc: false }])
  }

  const handleRemoveSort = (sortId: string) => {
    table.setSorting(sorting.filter(s => s.id !== sortId))
  }

  const handleUpdateSort = (index: number, field: string, value: any) => {
    const newSorting = [...sorting]
    // @ts-ignore
    newSorting[index][field] = value
    table.setSorting(newSorting)
  }

  // --- GELİŞMİŞ FİLTRE İŞLEMLERİ ---
  
  // Filtre ekle
  const handleAddFilter = () => {
    // Varsayılan olarak ilk özelliği seç
    const defaultProp = properties[0] || { id: 'title', type: 'text' }
    const defaultOperator = getOperatorsForType(defaultProp.type)[0].value
    
    // Filtre objesini JSON string olarak saklıyoruz (TanStack Table limitation workaround)
    // Yapı: { operator: 'contains', value: '...' }
    const filterValue = JSON.stringify({ operator: defaultOperator, value: '' })
    
    // Benzersiz bir ID ile eklemek için columnFilters yerine meta state kullanmak daha doğru olurdu ama
    // mevcut yapıyı bozmadan 'id' kısmına propertyId veriyoruz.
    // Aynı property'ye birden fazla filtre eklemeyi şimdilik desteklemiyoruz (V2'de ekleriz).
    
    const exists = columnFilters.find(f => f.id === defaultProp.id)
    if (!exists) {
        table.setColumnFilters([...columnFilters, { id: defaultProp.id, value: filterValue }])
    }
  }

  const handleRemoveFilter = (filterId: string) => {
    table.setColumnFilters(columnFilters.filter(f => f.id !== filterId))
  }

  // Filtre güncelle (Property, Operator veya Value değişince)
  const handleUpdateFilter = (index: number, key: 'id' | 'operator' | 'value', newValue: any) => {
    const currentFilters = [...columnFilters]
    const currentFilter = currentFilters[index]
    
    // Mevcut değeri parse et
    let filterData = { operator: 'contains', value: '' }
    try { filterData = JSON.parse(currentFilter.value as string) } catch {}

    if (key === 'id') {
        // Property değişti, o yüzden operatörü de sıfırla
        const newProp = properties.find(p => p.id === newValue) || { type: 'text' }
        const newOperator = getOperatorsForType(newProp.type)[0].value
        
        // ID değiştiği için array'de eskiyi silip yeniyi eklememiz lazım (TanStack mantığı)
        // Ama array index üzerinden gidiyoruz.
        currentFilters[index] = { 
            id: newValue, 
            value: JSON.stringify({ operator: newOperator, value: '' }) 
        }
    } else if (key === 'operator') {
        filterData.operator = newValue
        currentFilters[index].value = JSON.stringify(filterData)
    } else if (key === 'value') {
        filterData.value = newValue
        currentFilters[index].value = JSON.stringify(filterData)
    }

    table.setColumnFilters(currentFilters)
  }

  const getProperty = (propId: string) => {
      if (propId === 'title') return { id: 'title', name: 'Başlık', type: 'text', config: null }
      return properties.find(p => p.id === propId)
  }

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, type: 'sort' | 'filter') => {
      const rect = e.currentTarget.getBoundingClientRect()
      setMenuPos({ x: rect.left, y: rect.bottom + 5 })
      setActiveModal(activeModal === type ? null : type)
  }

  const renderModal = (content: React.ReactNode) => {
      if (!activeModal) return null
      return createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setActiveModal(null)} />
            <div style={{ position: 'fixed', top: menuPos.y, left: menuPos.x, zIndex: 9999 }} className="bg-[#202020] border border-[#373737] rounded-lg shadow-2xl p-3 flex flex-col gap-2 min-w-[380px] animate-in fade-in zoom-in-95 duration-100">
                {content}
            </div>
          </>,
          document.body
      )
  }

  return (
    <div className="flex items-center gap-2 mb-4 border-b border-[#373737] pb-3">
      {/* SORT BUTONU */}
      <button onClick={(e) => openMenu(e, 'sort')} className={`flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#2C2C2C] transition-colors text-sm ${sorting.length > 0 ? 'text-blue-400' : 'text-gray-400'}`}>
        <ArrowUpDown size={14} />
        <span>Sıralama</span>
        {sorting.length > 0 && <span className="bg-blue-500/20 text-blue-400 px-1.5 rounded text-[10px]">{sorting.length}</span>}
      </button>

      {/* FILTER BUTONU */}
      <button onClick={(e) => openMenu(e, 'filter')} className={`flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#2C2C2C] transition-colors text-sm ${columnFilters.length > 0 ? 'text-blue-400' : 'text-gray-400'}`}>
        <ListFilter size={14} />
        <span>Filtre</span>
        {columnFilters.length > 0 && <span className="bg-blue-500/20 text-blue-400 px-1.5 rounded text-[10px]">{columnFilters.length}</span>}
      </button>

      {/* --- SORT PENCERESİ --- */}
      {activeModal === 'sort' && renderModal(
          <>
            <span className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">Sıralama Kuralları</span>
            {sorting.map((sort, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-[#2C2C2C] p-2 rounded border border-[#373737]">
                <select value={sort.id} onChange={(e) => handleUpdateSort(idx, 'id', e.target.value)} className="bg-[#202020] text-white text-sm border border-[#373737] rounded px-2 py-1 outline-none flex-1 min-w-0 cursor-pointer focus:border-blue-500">
                  <option value="title">Başlık</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={sort.desc ? 'desc' : 'asc'} onChange={(e) => handleUpdateSort(idx, 'desc', e.target.value === 'desc')} className="bg-[#202020] text-gray-300 text-xs border border-[#373737] rounded px-2 py-1 outline-none cursor-pointer focus:border-blue-500">
                  <option value="asc">Artan</option>
                  <option value="desc">Azalan</option>
                </select>
                <button onClick={() => handleRemoveSort(sort.id)} className="text-gray-500 hover:text-red-400 p-1 hover:bg-red-400/10 rounded"><X size={14} /></button>
              </div>
            ))}
            <button onClick={handleAddSort} className="flex items-center gap-2 px-2 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#2C2C2C] rounded transition-colors w-full"><Plus size={14} /> <span>Sıralama Ekle</span></button>
          </>
      )}

      {/* --- FILTER PENCERESİ (GELİŞMİŞ) --- */}
      {activeModal === 'filter' && renderModal(
          <>
            <span className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">Filtre Kuralları</span>
            {columnFilters.length === 0 && <div className="text-xs text-gray-500 px-2 py-2 italic">Aktif filtre yok.</div>}
            
            {columnFilters.map((filter, idx) => {
              const prop = getProperty(filter.id) || { id: 'title', name: 'Başlık', type: 'text', config: null }
              
              // Değeri parse et
              let filterData = { operator: 'contains', value: '' }
              try { filterData = JSON.parse(filter.value as string) } catch {}
              
              const operators = getOperatorsForType(prop.type)
              const currentOp = operators.find(op => op.value === filterData.operator) || operators[0]

              return (
                <div key={idx} className="flex flex-col gap-2 bg-[#2C2C2C] p-2 rounded border border-[#373737] animate-in slide-in-from-left-2 duration-200">
                  {/* Satır 1: Özellik ve Silme Butonu */}
                  <div className="flex items-center justify-between gap-2">
                      <select 
                        value={filter.id}
                        onChange={(e) => handleUpdateFilter(idx, 'id', e.target.value)}
                        className="bg-[#1a1a1a] text-blue-400 text-sm font-medium border border-[#373737] rounded px-2 py-1 outline-none cursor-pointer flex-1"
                      >
                        <option value="title">Başlık</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <button onClick={() => handleRemoveFilter(filter.id)} className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-[#373737]"><Trash2 size={14} /></button>
                  </div>
                  
                  {/* Satır 2: Operatör ve Değer */}
                  <div className="flex items-center gap-2">
                      {/* Operatör Seçimi */}
                      <select 
                          value={filterData.operator}
                          onChange={(e) => handleUpdateFilter(idx, 'operator', e.target.value)}
                          className="bg-[#2C2C2C] text-gray-300 text-xs border border-[#373737] rounded px-2 py-1.5 outline-none cursor-pointer max-w-[120px]"
                      >
                          {operators.map(op => (
                              <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                      </select>

                      {/* Değer Girişi (Eğer gerekliyse) */}
                      {currentOp?.requiresValue && (
                          <div className="flex-1 min-w-0">
                              {(prop.type === 'text' || prop.type === 'title') && (
                                  <input 
                                      type="text" value={filterData.value}
                                      onChange={(e) => handleUpdateFilter(idx, 'value', e.target.value)}
                                      className="w-full bg-[#1a1a1a] text-white text-xs border border-[#373737] rounded px-2 py-1.5 outline-none focus:border-blue-500"
                                      placeholder="Değer..." autoFocus
                                  />
                              )}
                              
                              {prop.type === 'number' && (
                                  <input 
                                      type="number" value={filterData.value}
                                      onChange={(e) => handleUpdateFilter(idx, 'value', e.target.value)}
                                      className="w-full bg-[#1a1a1a] text-white text-xs border border-[#373737] rounded px-2 py-1.5 outline-none focus:border-blue-500"
                                      placeholder="0"
                                  />
                              )}

                              {(prop.type === 'select' || prop.type === 'status' || prop.type === 'priority' || prop.type === 'multi_select') && (
                                  <select 
                                      value={filterData.value}
                                      onChange={(e) => handleUpdateFilter(idx, 'value', e.target.value)}
                                      className="w-full bg-[#1a1a1a] text-white text-xs border border-[#373737] rounded px-2 py-1.5 outline-none cursor-pointer"
                                  >
                                      <option value="">Seçiniz...</option>
                                      {prop.config?.options?.map((opt: any) => (
                                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                                      ))}
                                  </select>
                              )}

                              {prop.type === 'date' && (
                                  <>
                                    {filterData.operator === 'date_within' ? (
                                        <select 
                                            value={filterData.value}
                                            onChange={(e) => handleUpdateFilter(idx, 'value', e.target.value)}
                                            className="w-full bg-[#1a1a1a] text-white text-xs border border-[#373737] rounded px-2 py-1.5 outline-none cursor-pointer"
                                        >
                                            <option value="today">Bugün</option>
                                            <option value="yesterday">Dün</option>
                                            <option value="tomorrow">Yarın</option>
                                            <option value="this_week">Bu Hafta</option>
                                            <option value="last_week">Geçen Hafta</option>
                                            <option value="this_month">Bu Ay</option>
                                            <option value="last_month">Geçen Ay</option>
                                        </select>
                                    ) : (
                                        <input 
                                            type="date" value={filterData.value}
                                            onChange={(e) => handleUpdateFilter(idx, 'value', e.target.value)}
                                            className="w-full bg-[#1a1a1a] text-white text-xs border border-[#373737] rounded px-2 py-1.5 outline-none"
                                        />
                                    )}
                                  </>
                              )}
                          </div>
                      )}
                  </div>
                </div>
              )
            })}
            
            <button onClick={handleAddFilter} className="flex items-center gap-2 px-2 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#2C2C2C] rounded transition-colors w-full border border-dashed border-[#373737] mt-1">
              <Plus size={14} /> <span>Filtre Kuralı Ekle</span>
            </button>
          </>
      )}
      
      {(sorting.length > 0 || columnFilters.length > 0) && (
          <button onClick={() => { table.setSorting([]); table.setColumnFilters([]) }} className="ml-auto text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-400/10 transition-colors">Temizle</button>
      )}
    </div>
  )
}