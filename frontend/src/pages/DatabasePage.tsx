import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AddPropertyModal from '../components/AddPropertyModal'
import StatusEditModal from '../components/StatusEditModal'
import DatabaseToolbar from '../components/DatabaseToolbar'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from '@tanstack/react-table'
import { 
  ArrowUpDown, 
  Trash, 
  Edit2, 
  ArrowRight,
  Table as TableIcon,
  KanbanSquare as LayoutKanban, 
  Plus,
  X,
  GripVertical
} from 'lucide-react'

// --- TİP TANIMLARI ---
interface Database { id: string; title: string; icon: string | null }
interface Property { id: string; name: string; type: string; config: string | null; order_index: number; visible: boolean }
interface Page { id: string; title: string; icon: string | null; created_at: number }

const COLOR_MAP: Record<string, string> = {
  gray: 'bg-gray-500/20 text-gray-300',
  blue: 'bg-blue-500/20 text-blue-300',
  green: 'bg-green-500/20 text-green-300',
  red: 'bg-red-500/20 text-red-300',
  yellow: 'bg-yellow-500/20 text-yellow-300',
  purple: 'bg-purple-500/20 text-purple-300',
  pink: 'bg-pink-500/20 text-pink-300',
  orange: 'bg-orange-500/20 text-orange-300',
  brown: 'bg-amber-700/20 text-amber-400',
}

// --- HEADER MENÜSÜ ---
const PropertyHeader = ({ property, onRename, onDelete, icon }: { property: Property, onRename: (id: string, newName: string) => void, onDelete: (id: string) => void, icon?: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(property.name)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) { setIsOpen(false); setIsRenaming(false) } }
    document.addEventListener('mousedown', handleClick); return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleRename = () => { if (newName.trim() && newName !== property.name) onRename(property.id, newName); setIsRenaming(false) }

  return (
    <div ref={menuRef} className="relative flex items-center gap-2 group w-full h-full">
      {isRenaming ? (
        <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} onBlur={handleRename} onKeyDown={(e) => e.key === 'Enter' && handleRename()} className="bg-[#202020] text-white text-xs px-1 py-0.5 rounded border border-blue-500 outline-none w-full" />
      ) : (
        <div onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 cursor-pointer hover:bg-[#373737] px-2 py-1 rounded transition-colors w-full select-none">
          {icon && <span className="text-gray-500">{icon}</span>}
          <span className="text-sm font-medium text-gray-300 truncate">{property.name}</span>
        </div>
      )}
      {isOpen && !isRenaming && (
        <div className="fixed mt-8 ml-4 w-40 bg-[#202020] border border-[#373737] rounded-lg shadow-xl z-[9999] py-1 flex flex-col">
          <button onClick={() => setIsRenaming(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-[#2C2C2C] text-left"><Edit2 size={14}/> İsim Değiştir</button>
          <button onClick={() => { if(confirm('Silmek istediğine emin misin?')) onDelete(property.id); setIsOpen(false) }} className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-red-400/10 text-left"><Trash size={14}/> Sil</button>
        </div>
      )}
    </div>
  )
}

export default function DatabasePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [database, setDatabase] = useState<Database | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [pageValues, setPageValues] = useState<Record<string, Record<string, any>>>({})
  const [currentView, setCurrentView] = useState<'table' | 'board'>('table')

  const [editingCell, setEditingCell] = useState<{ pageId: string; field: 'title' | 'property'; propertyId?: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false)
  const [activeStatusModal, setActiveStatusModal] = useState<{ isOpen: boolean, pageId: string, propertyId: string, currentValue: any, options: any[], propType: string } | null>(null)
  
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // --- HANDLERS ---
  const handleAddPage = async () => { 
      if (!id) return
      try { const res = await fetch('http://localhost:8000/pages', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ parent_id: id, title: '' }) }); if(res.ok) { const p = await res.json(); setPages([...pages, p]) } } catch(e){console.error(e)}
  }
  const handleDeleteSelected = async () => {
    const selectedIds = Object.keys(rowSelection).map(idx => pages[parseInt(idx)].id)
    if (selectedIds.length === 0) return
    if (!confirm(`${selectedIds.length} sayfayı silmek istediğinize emin misiniz?`)) return
    try {
      await Promise.all(selectedIds.map(pid => fetch(`http://localhost:8000/pages/${pid}`, { method: 'DELETE' })))
      setPages(pages.filter(p => !selectedIds.includes(p.id)))
      setRowSelection({})
    } catch (err) { console.error(err) }
  }
  const handleTitleUpdate = async (pageId: string, newTitle: string) => {
      try { const res = await fetch(`http://localhost:8000/pages/${pageId}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({title:newTitle}) }); if(res.ok) { setPages(pages.map(p=>p.id===pageId?{...p, title:newTitle}:p)); setEditingCell(null) } } catch(e){console.error(e)}
  }
  
  // DÜZELTME BURADA: try-finally bloğu ve setEditingCell(null)
  const handlePropertyValueUpdate = async (pageId: string, propertyId: string, value: any) => {
      try { 
        const res = await fetch('http://localhost:8000/values', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({page_id:pageId, property_id:propertyId, value}) }); 
        if(res.ok) { 
          setPageValues(prev=>({...prev, [pageId]:{...prev[pageId], [propertyId]:value}}))
        } 
      } catch(e){
        console.error("Update error:", e)
      } finally {
        setEditingCell(null) // <--- BU SATIR HAYAT KURTARIR
      }
  }

  const updatePropertyOptions = async (propertyId: string, newOptions: any[]) => {
      const config = {options:newOptions}; 
      try { 
        const res = await fetch(`http://localhost:8000/properties/${propertyId}`, {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({config})}); 
        if(res.ok) { 
          setProperties(prev=>prev.map(p=>p.id===propertyId?{...p, config:JSON.stringify(config)}:p)); 
          if(activeStatusModal?.propertyId===propertyId) setActiveStatusModal(prev=>prev?{...prev, options:newOptions}:null) 
        } 
      } catch(e){console.error(e)}
  }
  const handleDeleteProperty = async (propId: string) => {
      try { await fetch(`http://localhost:8000/properties/${propId}`, {method:'DELETE'}); setProperties(properties.filter(p=>p.id!==propId)) } catch(e){console.error(e)}
  }
  const handleRenameProperty = async (propId: string, name: string) => {
      try { const res = await fetch(`http://localhost:8000/properties/${propId}`, {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name})}); if(res.ok) setProperties(properties.map(p=>p.id===propId?{...p, name}:p)) } catch(e){console.error(e)}
  }

  // --- SÜTUNLAR ---
  const columns = useMemo<ColumnDef<Page>[]>(() => {
    const cols: ColumnDef<Page>[] = [
      {
        id: 'select',
        header: ({ table }) => (
          <div className="flex items-center justify-center w-full h-full">
            <input type="checkbox" checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} className="w-4 h-4 rounded border-gray-600 bg-transparent accent-blue-500 cursor-pointer" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center w-full h-full">
            <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} className="w-4 h-4 rounded border-gray-600 bg-transparent accent-blue-500 cursor-pointer opacity-0 group-hover:opacity-100 data-[checked=true]:opacity-100" data-checked={row.getIsSelected()} />
          </div>
        ),
        size: 40,
        enableSorting: false,
      },
      {
        id: 'title',
        accessorKey: 'title',
        header: ({ column }) => (
          <div className="flex items-center gap-1 group cursor-pointer hover:bg-[#373737] px-2 py-1 rounded w-full" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            <span className="text-gray-500 text-xs">Aa</span>
            <span className="text-sm font-medium text-gray-300">Başlık</span>
            <ArrowUpDown size={12} className="text-gray-500 opacity-0 group-hover:opacity-100 ml-auto" />
          </div>
        ),
        cell: ({ row, getValue }) => {
          const isEditing = editingCell?.pageId === row.original.id && editingCell?.field === 'title'
          return (
            <div className="flex items-center h-full w-full relative">
              {row.original.icon && <span className="mr-2 text-lg">{row.original.icon}</span>}
              {isEditing ? (
                <input
                  autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleTitleUpdate(row.original.id, editValue)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleTitleUpdate(row.original.id, editValue); else if (e.key === 'Escape') setEditingCell(null) }}
                  className="bg-transparent text-white font-medium outline-none w-full border-b border-blue-500"
                />
              ) : (
                <div className="group/title flex items-center w-full cursor-text h-full" onClick={() => { setEditingCell({ pageId: row.original.id, field: 'title' }); setEditValue(getValue() as string) }}>
                  <span className="text-white font-medium truncate flex-1">{getValue() as string || 'İsimsiz'}</span>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/page/${row.original.id}`); }} className="opacity-0 group-hover/title:opacity-100 text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded ml-2 border border-[#373737] bg-[#202020] hover:bg-[#373737] transition-all">Aç</button>
                </div>
              )}
            </div>
          )
        },
        size: 300,
      }
    ]

    properties.forEach(prop => {
      let icon = <span className="text-[10px] font-mono text-gray-500">Tx</span>
      if(prop.type === 'number') icon = <span className="text-[10px] font-mono text-gray-500">#</span>
      if(prop.type === 'select' || prop.type === 'status') icon = <span className="text-[10px] text-gray-500">▼</span>
      if(prop.type === 'multi_select') icon = <span className="text-[10px] text-gray-500">☰</span>
      if(prop.type === 'date') icon = <span className="text-[10px] text-gray-500">📅</span>
      if(prop.type === 'checkbox') icon = <span className="text-[10px] text-gray-500">☑</span>

      cols.push({
        id: prop.id,
        accessorFn: (row) => {
            const val = pageValues[row.id]?.[prop.id]
            if (!val) return ''
            if (prop.type === 'select' || prop.type === 'status') {
                const config = prop.config ? JSON.parse(prop.config) : null
                return config?.options?.find((o: any) => o.id === val.option_id)?.name || ''
            }
            if (prop.type === 'multi_select') {
                const config = prop.config ? JSON.parse(prop.config) : null
                const ids = val.option_ids || []
                return ids.map((id: string) => config?.options?.find((o: any) => o.id === id)?.name).join(', ')
            }
            if (prop.type === 'text') return val.text || ''
            if (prop.type === 'number') return val.number?.toString() || ''
            return ''
        },
        header: () => <PropertyHeader property={prop} onDelete={handleDeleteProperty} onRename={handleRenameProperty} icon={icon} />,
        cell: ({ row }) => {
          const value = pageValues[row.original.id]?.[prop.id]
          const isEditing = editingCell?.pageId === row.original.id && editingCell?.field === 'property' && editingCell?.propertyId === prop.id

          if (prop.type === 'select' || prop.type === 'status' || prop.type === 'multi_select') {
            const config = prop.config ? JSON.parse(prop.config) : { options: [] }
            const options = config.options || []
            let selectedValue: any = null
            if (prop.type === 'multi_select') {
                const ids = value?.option_ids || []
                selectedValue = options.filter((o: any) => ids.includes(o.id))
            } else {
                selectedValue = options.find((o: any) => o.id === value?.option_id) || null
            }
            return (
              <div 
                onClick={() => setActiveStatusModal({ isOpen: true, pageId: row.original.id, propertyId: prop.id, currentValue: selectedValue, options, propType: prop.type })}
                className="cursor-pointer h-full w-full flex items-center flex-wrap gap-1 min-h-[34px] px-1"
              >
                {prop.type === 'multi_select' && Array.isArray(selectedValue) && selectedValue.length > 0 ? (
                    selectedValue.map((opt: any) => <span key={opt.id} className={`px-2 py-0.5 rounded text-xs ${COLOR_MAP[opt.color] || COLOR_MAP.gray}`}>{opt.name}</span>)
                ) : (prop.type !== 'multi_select' && selectedValue) ? (
                   <span className={`px-2 py-0.5 rounded text-xs ${COLOR_MAP[selectedValue.color] || COLOR_MAP.gray} flex items-center gap-1.5`}>{prop.type==='status'&&<span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>}{selectedValue.name}</span>
                ) : null}
              </div>
            )
          }
          if (prop.type === 'text') {
             return isEditing ? (
               <input 
                 autoFocus value={editValue} onChange={(e)=>setEditValue(e.target.value)} 
                 onBlur={() => handlePropertyValueUpdate(row.original.id, prop.id, {text:editValue})}
                 onKeyDown={(e)=>{if(e.key==='Enter') handlePropertyValueUpdate(row.original.id,prop.id,{text:editValue}); else if(e.key==='Escape') setEditingCell(null)}}
                 className="w-full bg-transparent text-white text-sm outline-none px-1 border-b border-blue-500"
               />
             ) : (
               <div onClick={()=>{setEditingCell({pageId:row.original.id,field:'property',propertyId:prop.id});setEditValue(value?.text||'')}} className="cursor-text h-full w-full flex items-center min-h-[34px] text-sm text-white px-1">
                 {value?.text}
               </div>
             )
          }
          if (prop.type==='number') return isEditing ? <input type="number" value={editValue} onChange={(e)=>setEditValue(e.target.value)} onBlur={()=>handlePropertyValueUpdate(row.original.id,prop.id,{number:parseFloat(editValue)||0})} className="w-full bg-transparent text-white text-sm outline-none px-1 border-b border-blue-500"/> : <div onClick={()=>{setEditingCell({pageId:row.original.id,field:'property',propertyId:prop.id});setEditValue(value?.number?.toString()||'')}} className="cursor-text h-full w-full flex items-center min-h-[34px] text-sm text-white px-1">{value?.number}</div>
          if (prop.type==='checkbox') return <div className="flex items-center h-full w-full px-1"><input type="checkbox" checked={value?.checked||false} onChange={()=>handlePropertyValueUpdate(row.original.id,prop.id,{checked:!value?.checked})} className="w-4 h-4 rounded bg-transparent border-gray-500 accent-blue-500 cursor-pointer"/></div>
          if (prop.type==='date') return <div className="text-sm text-gray-500 italic px-1">Tarih (WIP)</div>
          return null
        },
        size: 200,
      })
    })
    return cols
  }, [properties, pageValues, editingCell, editValue])

  // --- INIT TABLE ---
  const table = useReactTable({ data: pages, columns, state: { sorting, columnFilters, rowSelection }, enableRowSelection: true, onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters, onRowSelectionChange: setRowSelection, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel() })

  useEffect(() => { if (!id) return; const f = async () => { try { const [d, p, pg] = await Promise.all([ fetch(`http://localhost:8000/databases/${id}`).then(r=>r.json()), fetch(`http://localhost:8000/databases/${id}/properties`).then(r=>r.json()), fetch(`http://localhost:8000/databases/${id}/pages`).then(r=>r.json()) ]); setDatabase(d); setProperties(p); setPages(pg); const vMap: any = {}; for(const page of pg) { const vals = await fetch(`http://localhost:8000/pages/${page.id}/values`).then(r=>r.json()); vMap[page.id] = {}; vals.forEach((v:any)=>{if(v.value)vMap[page.id][v.property_id]=JSON.parse(v.value)}) } setPageValues(vMap); setLoading(false) } catch(e){console.error(e);setLoading(false)} }; f() }, [id])

  if (loading) return <div className="flex items-center justify-center min-h-screen text-notion-muted">Yükleniyor...</div>
  if (!database) return <div className="flex items-center justify-center min-h-screen text-red-500">Veritabanı bulunamadı</div>
  const selectedCount = Object.keys(rowSelection).length

  return (
    <div className="min-h-screen p-8 bg-[#191919] text-white">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">{database.icon || '📄'}</span>
          <h1 className="text-3xl font-bold">{database.title}</h1>
        </div>

        <div className="flex items-center gap-4 border-b border-[#373737] mb-4">
          <button onClick={() => setCurrentView('table')} className={`flex items-center gap-2 pb-2 text-sm font-medium border-b-2 transition-colors ${currentView==='table'?'border-white text-white':'border-transparent text-gray-500 hover:text-gray-300'}`}><TableIcon size={16}/> Tablo</button>
          <button onClick={() => setCurrentView('board')} className={`flex items-center gap-2 pb-2 text-sm font-medium border-b-2 transition-colors ${currentView==='board'?'border-white text-white':'border-transparent text-gray-500 hover:text-gray-300'}`}><LayoutKanban size={16}/> Pano</button>
        </div>

        <DatabaseToolbar table={table} properties={properties} />

        {selectedCount > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#252525] border border-[#373737] px-4 py-2 rounded-lg shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-200">
             <div className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded">{selectedCount}</div>
             <span className="text-sm text-gray-300 mr-2">satır seçildi</span>
             {selectedCount === 1 && (
                <button onClick={() => navigate(`/page/${pages[parseInt(Object.keys(rowSelection)[0])].id}`)} className="flex items-center gap-1 px-3 py-1 hover:bg-[#373737] rounded text-sm text-gray-300 transition-colors"><ArrowRight size={14} /> Aç</button>
             )}
             <div className="w-px h-4 bg-[#373737] mx-1"></div>
             <button onClick={handleDeleteSelected} className="flex items-center gap-1 px-3 py-1 hover:bg-red-900/30 text-red-400 hover:text-red-300 rounded text-sm transition-colors"><Trash size={14} /> Sil</button>
             <button onClick={() => setRowSelection({})} className="ml-2 text-gray-500 hover:text-white"><X size={16} /></button>
          </div>
        )}

        {/* TABLO */}
        {currentView === 'table' ? (
          <div className="border border-[#373737] rounded-lg bg-[#191919] flex flex-col">
            <div className="overflow-x-auto overflow-y-visible"> 
              <table className="w-full border-collapse table-fixed"> 
                <thead className="bg-[#191919] border-b border-[#373737]">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id} style={{ width: header.column.getSize() }} className="px-3 py-2 text-left border-r border-[#373737] last:border-r-0 font-normal group relative">
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                      <th className="w-10 border-l border-[#373737] bg-[#191919] cursor-pointer hover:bg-[#2C2C2C] transition-colors" onClick={() => setShowAddPropertyModal(true)}>
                         <div className="flex items-center justify-center h-full w-full text-gray-500 hover:text-white"><Plus size={16} /></div>
                      </th>
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="group border-b border-[#373737] hover:bg-[#252525] transition-colors">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-0 border-r border-[#373737] last:border-r-0 h-9 align-middle overflow-hidden">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                      <td className="border-l border-[#373737]"></td>
                    </tr>
                  ))}
                  <tr className="hover:bg-[#2C2C2C] cursor-pointer transition-colors" onClick={handleAddPage}>
                      <td colSpan={columns.length + 1} className="px-3 py-2">
                          <div className="flex items-center gap-2 text-gray-500 text-sm select-none opacity-60 hover:opacity-100">
                              <Plus size={16} /> Yeni Sayfa
                          </div>
                      </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 border border-dashed border-[#373737] rounded-lg text-gray-500">🚧 Pano Görünümü</div>
        )}

        {/* MODALLAR */}
        {showAddPropertyModal && <AddPropertyModal databaseId={id!} onClose={()=>setShowAddPropertyModal(false)} onSuccess={(np)=>setProperties([...properties, np])}/>}
        {activeStatusModal && (
          <StatusEditModal
            isOpen={true}
            onClose={() => setActiveStatusModal(null)}
            currentValue={activeStatusModal.currentValue}
            options={activeStatusModal.options}
            multiple={activeStatusModal.propType === 'multi_select'}
            onChange={(newValue) => {
              const payload = Array.isArray(newValue) ? { option_ids: newValue } : { option_id: newValue }
              handlePropertyValueUpdate(activeStatusModal.pageId, activeStatusModal.propertyId, payload)
            }}
            onCreate={(name, group) => {
               const newOpt = { id: crypto.randomUUID(), name, color: 'gray', group }
               const newOptions = [...activeStatusModal.options, newOpt]
               updatePropertyOptions(activeStatusModal.propertyId, newOptions)
               
               if (activeStatusModal.propType === 'multi_select') {
                   const currentIds = Array.isArray(activeStatusModal.currentValue) ? activeStatusModal.currentValue.map((o: any) => o.id) : []
                   handlePropertyValueUpdate(activeStatusModal.pageId, activeStatusModal.propertyId, { option_ids: [...currentIds, newOpt.id] })
               } else {
                   handlePropertyValueUpdate(activeStatusModal.pageId, activeStatusModal.propertyId, { option_id: newOpt.id })
               }
            }}
            onDelete={(optId) => {
                const newOptions = activeStatusModal.options.filter(o => o.id !== optId)
                updatePropertyOptions(activeStatusModal.propertyId, newOptions)
            }}
          />
        )}
      </div>
    </div>
  )
}