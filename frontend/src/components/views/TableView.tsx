import { useState, useMemo, useEffect, useRef } from 'react'
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  getFilteredRowModel, 
  flexRender, 
  type ColumnDef, 
  type SortingState, 
  type ColumnFiltersState, 
  type RowSelectionState 
} from '@tanstack/react-table'
import { ArrowUpDown, Plus, Edit2, Trash, ToggleRight, ToggleLeft } from 'lucide-react'
import DatabaseToolbar from '../../components/DatabaseToolbar'
import { getSortComparator, withNullHandling } from '../../utils/sortComparators'
import { evaluateFilter } from '../../utils/filterEvaluator'
import { useTablePersistence } from '../../hooks/useTablePersistence' // <-- 1. YENİ IMPORT

interface TableViewProps {
    databaseId: string
    properties: any[]
    pages: any[]
    pageValues: any
    onAddPage: () => void
    onOpenPage: (id: string) => void
    onUpdateTitle: (id: string, title: string) => void
    onUpdateValue: (pageId: string, propId: string, value: any) => void
    onDeleteProperty: (id: string) => void
    onRenameProperty: (id: string, name: string) => void
    onOpenStatusModal: (pageId: string, propId: string, propName: string, value: any, options: any[], type: string) => void
    onAddProperty: () => void
    rowSelection: RowSelectionState
    setRowSelection: (val: any) => void
}

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

const getBadgeStyle = (color: string) => {
    if (color.startsWith('#')) return { style: { backgroundColor: `${color}33`, color: color }, className: "px-2 py-0.5 rounded text-xs" }
    return { style: {}, className: `px-2 py-0.5 rounded text-xs ${COLOR_MAP[color] || COLOR_MAP.gray}` }
}

const DatePickerCell = ({ date, endDate, position, onUpdate, onClose }: { 
    date: string | null, 
    endDate: string | null, 
    position: { x: number, y: number },
    onUpdate: (d: string | null, ed: string | null) => void, 
    onClose: () => void 
}) => {
    const parseDate = (d: string | null) => d ? (d.includes('T') ? d.split('T')[0] : d) : ''

    const [localDate, setLocalDate] = useState(parseDate(date))
    const [localEndDate, setLocalEndDate] = useState(parseDate(endDate))
    const [hasEndDate, setHasEndDate] = useState(!!endDate)
    
    const style: React.CSSProperties = {
        position: 'fixed',
        top: `${position.y + 40}px`,
        left: `${position.x}px`,
        zIndex: 9999, 
    }

    const handleSave = () => {
        if (hasEndDate && localEndDate && localDate && localEndDate < localDate) {
            alert("Bitiş tarihi başlangıç tarihinden önce olamaz!");
            return;
        }
        const finalDate = localDate ? localDate : null
        const finalEndDate = (hasEndDate && localEndDate) ? localEndDate : null
        
        onUpdate(finalDate, finalEndDate)
        onClose()
    }

    return (
        <>
            <div className="fixed inset-0 z-[9990]" onClick={onClose}></div>
            <div style={style} className="bg-[#202020] border border-[#373737] rounded-lg shadow-2xl p-4 w-64 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Başlangıç Tarihi</label>
                    <input 
                        type="date" 
                        value={localDate}
                        onChange={(e) => setLocalDate(e.target.value)}
                        className="w-full bg-[#151515] border border-[#373737] rounded px-3 py-2 text-white text-sm outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <div className="flex items-center justify-between border-t border-[#373737] pt-3">
                    <span className="text-xs text-gray-400 font-medium">Bitiş Tarihi Ekle</span>
                    <button onClick={() => setHasEndDate(!hasEndDate)} className={`transition-colors ${hasEndDate ? 'text-blue-500' : 'text-gray-600'}`}>
                        {hasEndDate ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                </div>
                {hasEndDate && (
                    <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Bitiş Tarihi</label>
                        <input 
                            type="date" 
                            value={localEndDate}
                            onChange={(e) => setLocalEndDate(e.target.value)}
                            className="w-full bg-[#151515] border border-[#373737] rounded px-3 py-2 text-white text-sm outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                )}
                <div className="flex justify-between items-center mt-2">
                    <button onClick={() => { onUpdate(null, null); onClose() }} className="text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 px-2 py-1 rounded transition-colors">Temizle</button>
                    <button onClick={handleSave} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded font-medium transition-colors">Kaydet</button>
                </div>
            </div>
        </>
    )
}

const PropertyHeader = ({ property, onRename, onDelete, icon }: any) => {
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
          <div onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 cursor-pointer hover:bg-[#373737] px-2 py-1 rounded transition-colors w-full select-none relative">
            {icon && <span className="text-gray-500">{icon}</span>}
            <span className="text-sm font-medium text-gray-300 truncate">{property.name}</span>
          </div>
        )}
        {isOpen && !isRenaming && (
            <div className="fixed mt-8 ml-4 w-40 bg-[#202020] border border-[#373737] rounded-lg shadow-xl z-[9999] py-1 flex flex-col animate-in zoom-in-95 duration-100">
                <button onClick={(e) => { e.stopPropagation(); setIsRenaming(true) }} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-[#2C2C2C] text-left"><Edit2 size={14}/> İsim Değiştir</button>
                <button onClick={(e) => { e.stopPropagation(); if(confirm('Silmek istediğine emin misin?')) onDelete(property.id); setIsOpen(false) }} className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-red-400/10 text-left"><Trash size={14}/> Sil</button>
            </div>
        )}
      </div>
    )
}

export default function TableView({ 
    databaseId, // <-- Bunu hook'a göndereceğiz
    properties, 
    pages, 
    pageValues, 
    onAddPage, 
    onOpenPage, 
    onUpdateTitle, 
    onUpdateValue, 
    onDeleteProperty, 
    onRenameProperty, 
    onOpenStatusModal, 
    onAddProperty, 
    rowSelection, 
    setRowSelection 
}: TableViewProps) {
    // --- 2. PERSISTENCE HOOK ÇAĞRISI ---
    const { initialState, saveState } = useTablePersistence(databaseId)

    // State'leri başlangıç değerleri (LocalStorage) ile başlatıyoruz
    const [sorting, setSorting] = useState<SortingState>(initialState.sorting)
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialState.filters)
    
    // --- 3. DEĞİŞİKLİKLERİ KAYDETME ---
    useEffect(() => {
        saveState(sorting, columnFilters)
    }, [sorting, columnFilters, saveState])

    const [editingCell, setEditingCell] = useState<{ pageId: string; field: 'title' | 'property'; propertyId?: string } | null>(null)
    const [editValue, setEditValue] = useState('')
    const [activeDatePicker, setActiveDatePicker] = useState<{ pageId: string, propertyId: string, date: string | null, endDate: string | null, position: { x: number, y: number } } | null>(null)

    const columns = useMemo<ColumnDef<any>[]>(() => {
        const cols: ColumnDef<any>[] = [
            {
                id: 'select',
                header: ({ table }) => (<div className="flex items-center justify-center w-full h-full"><input type="checkbox" checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} className="w-4 h-4 rounded border-gray-600 bg-transparent accent-blue-500 cursor-pointer" /></div>),
                cell: ({ row }) => (<div className="flex items-center justify-center w-full h-full"><input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} className="w-4 h-4 rounded border-gray-600 bg-transparent accent-blue-500 cursor-pointer opacity-0 group-hover:opacity-100 data-[checked=true]:opacity-100" data-checked={row.getIsSelected()} /></div>),
                size: 40, enableSorting: false,
            },
            {
                id: 'title', 
                accessorKey: 'title',
                filterFn: (row, columnId, filterValue) => {
                    let filterRule = { operator: 'contains', value: '' }
                    try { filterRule = JSON.parse(filterValue) } catch {}
                    return evaluateFilter(row.original.title, filterRule as any, 'title')
                },
                header: ({ column }) => (<div className="flex items-center gap-1 group cursor-pointer hover:bg-[#373737] px-2 py-1 rounded w-full" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}><span className="text-gray-500 text-xs">Aa</span><span className="text-sm font-medium text-gray-300">Başlık</span><ArrowUpDown size={12} className="text-gray-500 opacity-0 group-hover:opacity-100 ml-auto" /></div>),
                cell: ({ row, getValue }) => {
                    const isEditing = editingCell?.pageId === row.original.id && editingCell?.field === 'title'
                    return (<div className="flex items-center h-full w-full relative">{row.original.icon && <span className="mr-2 text-lg">{row.original.icon}</span>}{isEditing ? (<input autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => { onUpdateTitle(row.original.id, editValue); setEditingCell(null) }} onKeyDown={(e) => { if (e.key === 'Enter') { onUpdateTitle(row.original.id, editValue); setEditingCell(null) } else if (e.key === 'Escape') setEditingCell(null) }} className="bg-transparent text-white font-medium outline-none w-full border-b border-blue-500" />) : (<div className="group/title flex items-center w-full cursor-text h-full" onClick={() => { setEditingCell({ pageId: row.original.id, field: 'title' }); setEditValue(getValue() as string) }}><span className="text-white font-medium truncate flex-1">{getValue() as string || 'İsimsiz'}</span><button onClick={(e) => { e.stopPropagation(); onOpenPage(row.original.id); }} className="opacity-0 group-hover/title:opacity-100 text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded ml-2 border border-[#373737] bg-[#202020] hover:bg-[#373737] transition-all">Aç</button></div>)}</div>)
                }, size: 300,
            }
        ]

        properties.forEach(prop => {
            let icon = <span className="text-[10px] font-mono text-gray-500">Tx</span>
            if(prop.type === 'select' || prop.type === 'status') icon = <span className="text-[10px] text-gray-500">▼</span>
            if(prop.type === 'multi_select') icon = <span className="text-[10px] text-gray-500">☰</span>
            if(prop.type === 'date') icon = <span className="text-[10px] text-gray-500">📅</span>
            if(prop.type === 'checkbox') icon = <span className="text-[10px] text-gray-500">☑</span>
            if(prop.type === 'priority') icon = <span className="text-[10px] text-gray-500">📊</span>
      
            cols.push({
              id: prop.id,
              accessorFn: (row) => {
                  const val = pageValues[row.id]?.[prop.id]
                  if (!val) return ''
                  if (prop.type === 'select' || prop.type === 'status' || prop.type === 'priority') return prop.config?.options?.find((o: any) => o.id === val.option_id)?.name || ''
                  if (prop.type === 'multi_select') {
                      const ids = val.option_ids || []
                      return ids.map((id: string) => prop.config?.options?.find((o: any) => o.id === id)?.name).join(', ')
                  }
                  if (prop.type === 'text') return val.text || ''
                  if (prop.type === 'date') return val.date || ''
                  return ''
              },
              filterFn: (row, columnId, filterValue) => {
                  let filterRule = { operator: 'contains', value: '' }
                  try { filterRule = JSON.parse(filterValue) } catch {}
                  const rawValue = pageValues[row.original.id]?.[columnId]
                  return evaluateFilter(rawValue, filterRule as any, prop.type)
              },
              sortingFn: (rowA, rowB, columnId) => {
                  const rawA = pageValues[rowA.original.id]?.[columnId]
                  const rawB = pageValues[rowB.original.id]?.[columnId]
                  let a = rawA
                  let b = rawB
                  if (prop.type === 'text') { a = rawA?.text; b = rawB?.text }
                  else if (prop.type === 'date') { a = rawA?.date; b = rawB?.date }
                  else if (prop.type === 'checkbox') { a = rawA?.checked; b = rawB?.checked }
                  const comparator = getSortComparator(prop.type, prop.config)
                  const withNulls = withNullHandling(comparator)
                  return withNulls(a, b) 
              },
              header: () => <PropertyHeader property={prop} onDelete={onDeleteProperty} onRename={onRenameProperty} icon={icon} />,
              cell: ({ row }) => {
                const value = pageValues[row.original.id]?.[prop.id]
                const isEditing = editingCell?.pageId === row.original.id && editingCell?.field === 'property' && editingCell?.propertyId === prop.id
      
                if (prop.type === 'select' || prop.type === 'status' || prop.type === 'multi_select' || prop.type === 'priority') {
                    const options = prop.config?.options || []
                    let selectedValue: any = null
                    if(prop.type === 'multi_select') {
                        const ids = value?.option_ids || []
                        selectedValue = options.filter((o: any) => ids.includes(o.id))
                    } else {
                        selectedValue = options.find((o: any) => o.id === value?.option_id)
                    }
                    
                    return (
                         <div onClick={() => onOpenStatusModal(row.original.id, prop.id, prop.name, selectedValue, options, prop.type)} className="cursor-pointer h-full w-full flex items-center flex-wrap gap-1 min-h-[34px] px-1">
                            {prop.type === 'multi_select' && Array.isArray(selectedValue) && selectedValue.length > 0 ? (
                                selectedValue.map((opt: any) => {
                                    const { style, className } = getBadgeStyle(opt.color)
                                    return <span key={opt.id} style={style} className={className}>{opt.name}</span>
                                })
                            ) : (prop.type !== 'multi_select' && selectedValue) ? (
                            (() => { const { style, className } = getBadgeStyle(selectedValue.color); return <span style={style} className={`${className} flex items-center gap-1.5`}>{prop.type==='status'&&<span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>}{selectedValue.name}</span> })()
                            ) : <span className="opacity-0 group-hover:opacity-50 text-gray-500 italic text-xs px-1">Seç</span>}
                        </div>
                    )
                }
                if (prop.type === 'text') {
                   return isEditing ? (<input autoFocus value={editValue} onChange={(e)=>setEditValue(e.target.value)} onBlur={() => { onUpdateValue(row.original.id, prop.id, {text:editValue}); setEditingCell(null) }} onKeyDown={(e)=>{if(e.key==='Enter'){ onUpdateValue(row.original.id,prop.id,{text:editValue}); setEditingCell(null) }}} className="w-full bg-transparent text-white text-sm outline-none px-1 border-b border-blue-500" />) : (<div onClick={()=>{setEditingCell({pageId:row.original.id,field:'property',propertyId:prop.id});setEditValue(value?.text||'')}} className="cursor-text h-full w-full flex items-center min-h-[34px] text-sm text-white px-1">{value?.text || <span className="opacity-0 group-hover:opacity-50 text-gray-500 italic text-xs">Boş</span>}</div>)
                }
                if (prop.type === 'checkbox') return <div className="flex items-center h-full w-full px-1"><input type="checkbox" checked={value?.checked||false} onChange={()=>onUpdateValue(row.original.id,prop.id,{checked:!value?.checked})} className="w-4 h-4 rounded bg-transparent border-gray-500 accent-blue-500 cursor-pointer"/></div>
                
                if (prop.type === 'date') {
                    const formatDisplay = (d: string) => {
                        try { return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return d }
                    }
                    const startDate = value?.date ? formatDisplay(value.date) : null
                    const endDate = value?.end_date ? formatDisplay(value.end_date) : null
                    
                    return (
                        <div className="relative h-full w-full">
                            <div 
                              onClick={(e) => {
                                  e.stopPropagation()
                                  const rect = e.currentTarget.getBoundingClientRect()
                                  setActiveDatePicker({ 
                                      pageId: row.original.id, 
                                      propertyId: prop.id, 
                                      date: value?.date, 
                                      endDate: value?.end_date,
                                      position: { x: rect.left, y: rect.top }
                                  })
                              }}
                              className="cursor-pointer h-full w-full flex items-center min-h-[34px] text-sm text-gray-300 px-1 hover:bg-[#2C2C2C] rounded transition-colors"
                            >
                                {startDate ? (
                                    <span className="flex items-center gap-1.5">
                                        <span>{startDate}</span>
                                        {endDate && <span className="text-gray-500 flex items-center gap-1">→ <span>{endDate}</span></span>}
                                    </span>
                                ) : <span className="text-gray-600 italic text-xs">Tarih Seç</span>}
                            </div>
                            
                            {activeDatePicker && activeDatePicker.pageId === row.original.id && activeDatePicker.propertyId === prop.id && (
                                <DatePickerCell 
                                    date={activeDatePicker.date} 
                                    endDate={activeDatePicker.endDate} 
                                    position={activeDatePicker.position}
                                    onClose={() => setActiveDatePicker(null)}
                                    onUpdate={(d, ed) => onUpdateValue(row.original.id, prop.id, { date: d, end_date: ed })}
                                />
                            )}
                        </div>
                    )
                }

                return null
              }, size: 200
            })
        })
        return cols
    }, [properties, pageValues, editingCell, editValue, activeDatePicker])

    const table = useReactTable({ data: pages, columns, state: { sorting, columnFilters, rowSelection }, enableRowSelection: true, onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters, onRowSelectionChange: setRowSelection, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel() })

    return (
        <div className="border border-[#373737] rounded-lg bg-[#191919] flex flex-col">
            <div className="p-2 border-b border-[#373737]">
               <DatabaseToolbar table={table} properties={properties} />
            </div>
            <div className="overflow-x-auto overflow-y-visible"> 
              <table className="w-full border-collapse table-fixed"> 
                <thead className="bg-[#191919] border-b border-[#373737]">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (<th key={header.id} style={{ width: header.column.getSize() }} className="px-3 py-2 text-left border-r border-[#373737] last:border-r-0 font-normal group relative">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</th>))}
                      <th className="w-10 border-l border-[#373737] bg-[#191919] cursor-pointer hover:bg-[#2C2C2C] transition-colors" onClick={onAddProperty}><div className="flex items-center justify-center h-full w-full text-gray-500 hover:text-white"><Plus size={16} /></div></th>
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="group border-b border-[#373737] hover:bg-[#252525] transition-colors">
                      {row.getVisibleCells().map(cell => (<td key={cell.id} className="px-0 border-r border-[#373737] last:border-r-0 h-9 align-middle overflow-hidden">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>))}
                      <td className="border-l border-[#373737]"></td>
                    </tr>
                  ))}
                  <tr className="hover:bg-[#2C2C2C] cursor-pointer transition-colors" onClick={onAddPage}><td colSpan={columns.length + 1} className="px-3 py-2"><div className="flex items-center gap-2 text-gray-500 text-sm select-none opacity-60 hover:opacity-100"><Plus size={16} /> Yeni Sayfa</div></td></tr>
                </tbody>
              </table>
            </div>
        </div>
    )
}