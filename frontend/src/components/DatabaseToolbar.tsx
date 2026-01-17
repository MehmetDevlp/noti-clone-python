import { useState } from 'react'
import { ListFilter, ArrowUpDown, X, Plus } from 'lucide-react'
import type { Table } from '@tanstack/react-table'

interface Property {
  id: string
  name: string
  type: string
  config: string | null
}

interface DatabaseToolbarProps {
  table: Table<any>
  properties: Property[]
}

export default function DatabaseToolbar({ table, properties }: DatabaseToolbarProps) {
  const [activeModal, setActiveModal] = useState<'sort' | 'filter' | null>(null)

  const sorting = table.getState().sorting
  const columnFilters = table.getState().columnFilters

  const handleAddSort = () => {
    const firstProp = properties[0]?.id || 'title'
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

  const handleAddFilter = () => {
    const uncalcProps = properties.map(p => p.id).concat('title')
    const available = uncalcProps.find(id => !columnFilters.find(f => f.id === id)) || uncalcProps[0]
    table.setColumnFilters([...columnFilters, { id: available, value: '' }])
  }

  const handleRemoveFilter = (filterId: string) => {
    table.setColumnFilters(columnFilters.filter(f => f.id !== filterId))
  }

  const handleUpdateFilter = (index: number, field: string, value: any) => {
    const newFilters = [...columnFilters]
    // @ts-ignore
    newFilters[index][field] = value
    table.setColumnFilters(newFilters)
  }

  return (
    <div className="flex items-center gap-2 mb-4 border-b border-[#373737] pb-3">
      {/* SORT */}
      <div className="relative">
        <button 
          onClick={() => setActiveModal(activeModal === 'sort' ? null : 'sort')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#2C2C2C] transition-colors text-sm ${sorting.length > 0 ? 'text-blue-400' : 'text-gray-400'}`}
        >
          <ArrowUpDown size={14} />
          <span>Sıralama</span>
          {sorting.length > 0 && <span className="bg-blue-500/20 text-blue-400 px-1.5 rounded text-[10px]">{sorting.length}</span>}
        </button>

        {activeModal === 'sort' && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setActiveModal(null)} />
            <div className="absolute top-full left-0 mt-2 w-[350px] bg-[#202020] border border-[#373737] rounded-lg shadow-xl z-50 p-3 flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">Sıralama Kuralları</span>
              
              {sorting.map((sort, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[#2C2C2C] p-2 rounded border border-[#373737]">
                  {/* Özellik Seçimi */}
                  <select 
                    value={sort.id}
                    onChange={(e) => handleUpdateSort(idx, 'id', e.target.value)}
                    className="bg-[#202020] text-white text-sm border border-[#373737] rounded px-2 py-1 outline-none flex-1 min-w-0 cursor-pointer focus:border-blue-500"
                  >
                    <option value="title">Başlık</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>

                  {/* Yön Seçimi */}
                  <select 
                    value={sort.desc ? 'desc' : 'asc'}
                    onChange={(e) => handleUpdateSort(idx, 'desc', e.target.value === 'desc')}
                    className="bg-[#202020] text-gray-300 text-xs border border-[#373737] rounded px-2 py-1 outline-none cursor-pointer focus:border-blue-500"
                  >
                    <option value="asc">Artan</option>
                    <option value="desc">Azalan</option>
                  </select>

                  <button onClick={() => handleRemoveSort(sort.id)} className="text-gray-500 hover:text-red-400 p-1 hover:bg-red-400/10 rounded">
                    <X size={14} />
                  </button>
                </div>
              ))}

              <button 
                onClick={handleAddSort} 
                className="flex items-center gap-2 px-2 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#2C2C2C] rounded transition-colors w-full"
              >
                <Plus size={14} /> <span>Sıralama Ekle</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* FILTER */}
      <div className="relative">
        <button 
          onClick={() => setActiveModal(activeModal === 'filter' ? null : 'filter')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#2C2C2C] transition-colors text-sm ${columnFilters.length > 0 ? 'text-blue-400' : 'text-gray-400'}`}
        >
          <ListFilter size={14} />
          <span>Filtre</span>
          {columnFilters.length > 0 && <span className="bg-blue-500/20 text-blue-400 px-1.5 rounded text-[10px]">{columnFilters.length}</span>}
        </button>

        {activeModal === 'filter' && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setActiveModal(null)} />
            <div className="absolute top-full left-0 mt-2 w-[350px] bg-[#202020] border border-[#373737] rounded-lg shadow-xl z-50 p-3 flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 px-1 uppercase tracking-wider">Filtre Kuralları</span>
              
              {columnFilters.length === 0 && <div className="text-xs text-gray-500 px-2 py-2 italic">Aktif filtre yok.</div>}
              
              {columnFilters.map((filter, idx) => (
                <div key={idx} className="flex flex-col gap-2 bg-[#2C2C2C] p-2 rounded border border-[#373737]">
                  <div className="flex items-center justify-between gap-2">
                      <select 
                        value={filter.id}
                        onChange={(e) => handleUpdateFilter(idx, 'id', e.target.value)}
                        className="bg-[#202020] text-blue-400 text-sm font-medium border border-[#373737] rounded px-2 py-1 outline-none cursor-pointer flex-1"
                      >
                        <option value="title">Başlık</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <button onClick={() => handleRemoveFilter(filter.id)} className="text-gray-500 hover:text-red-400 p-1"><X size={14} /></button>
                  </div>
                  <div className="flex items-center gap-2 bg-[#1a1a1a] px-2 py-1 rounded border border-[#373737] focus-within:border-blue-500">
                      <span className="text-xs text-gray-500">İçerir</span>
                      <input 
                        type="text"
                        value={filter.value as string}
                        onChange={(e) => handleUpdateFilter(idx, 'value', e.target.value)}
                        className="bg-transparent text-white text-sm outline-none w-full placeholder:text-gray-700"
                        placeholder="Değer yaz..."
                        autoFocus
                      />
                  </div>
                </div>
              ))}
              
              <button 
                onClick={handleAddFilter} 
                className="flex items-center gap-2 px-2 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#2C2C2C] rounded transition-colors w-full"
              >
                <Plus size={14} /> <span>Filtre Ekle</span>
              </button>
            </div>
          </>
        )}
      </div>
      
      {(sorting.length > 0 || columnFilters.length > 0) && (
          <button onClick={() => { table.setSorting([]); table.setColumnFilters([]) }} className="ml-auto text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-400/10 transition-colors">Temizle</button>
      )}
    </div>
  )
}