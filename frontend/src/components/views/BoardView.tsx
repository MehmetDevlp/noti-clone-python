import { useState, useMemo } from 'react'
import { Plus, Calendar, KanbanSquare as LayoutKanban } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'

import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'

import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface BoardViewProps {
    databaseId: string
    properties: any[]
    pages: any[]
    pageValues: any
    onAddPage: (statusId?: string) => void
    onOpenPage: (pageId: string) => void
    onOpenStatusModal: (propId: string, propName: string, options: any[], propType: string) => void
    onUpdateValue: (pageId: string, propertyId: string, value: any) => void
}

const getBadgeStyle = (color: string) => {
    if (color.startsWith('#')) return { style: { backgroundColor: `${color}33`, color: color }, className: "px-2 py-0.5 rounded text-xs" }
    const map: any = { gray: 'bg-gray-500/20 text-gray-300', blue: 'bg-blue-500/20 text-blue-300', green: 'bg-green-500/20 text-green-300', red: 'bg-red-500/20 text-red-300', yellow: 'bg-yellow-500/20 text-yellow-300', purple: 'bg-purple-500/20 text-purple-300', pink: 'bg-pink-500/20 text-pink-300', orange: 'bg-orange-500/20 text-orange-300', brown: 'bg-amber-700/20 text-amber-400' }
    return { style: {}, className: `px-2 py-0.5 rounded text-xs ${map[color] || map.gray}` }
}

const getColumnStyle = (color: string) => {
    if (color.startsWith('#')) return { style: { backgroundColor: `${color}0D`, borderColor: `${color}33` }, className: "border" }
    const map: any = { gray: {bg:'bg-gray-500/5', border:'border-gray-500/20'}, brown: {bg:'bg-amber-700/5', border:'border-amber-700/20'}, orange: {bg:'bg-orange-500/5', border:'border-orange-500/20'}, yellow: {bg:'bg-yellow-500/5', border:'border-yellow-500/20'}, green: {bg:'bg-green-500/5', border:'border-green-500/20'}, blue: {bg:'bg-blue-500/5', border:'border-blue-500/20'}, purple: {bg:'bg-purple-500/5', border:'border-purple-500/20'}, pink: {bg:'bg-pink-500/5', border:'border-pink-500/20'}, red: {bg:'bg-red-500/5', border:'border-red-500/20'} }
    const sel = map[color] || map.gray
    return { style: {}, className: `${sel.bg} ${sel.border} border` }
}

const SortableItem = ({ page, properties, pageValues, groupProperty, onOpenPage }: any) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id, data: { page } })
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

    return (
        <div 
            ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => onOpenPage(page.id)}
            className="bg-[#252525] hover:bg-[#2F2F2F] p-3 rounded-lg shadow-sm border border-black/10 cursor-grab active:cursor-grabbing group transition-all hover:border-gray-500 relative flex flex-col gap-2 z-10 touch-none"
        >
             <div className="flex items-start gap-2">
                <span className="text-lg leading-none mt-0.5">{page.icon || '📄'}</span>
                <span className="text-sm font-medium text-gray-200 break-words line-clamp-2 select-none">{page.title || 'İsimsiz'}</span>
             </div>
             <div className="space-y-1 pointer-events-none">
                 {properties.filter((p:any) => p.visible && p.id !== groupProperty.id && p.type !== 'text').slice(0, 3).map((prop:any) => {
                     const val = pageValues[page.id]?.[prop.id]
                     if (!val) return null
                     if (prop.type === 'date' && val.date) return (
                         <div key={prop.id} className="text-[10px] text-gray-500 flex items-center gap-1"><Calendar size={10}/> {new Date(val.date).toLocaleDateString('tr-TR')}</div>
                     )
                     return null
                 })}
             </div>
        </div>
    )
}

export default function BoardView({ properties, pages, pageValues, onAddPage, onOpenPage, onOpenStatusModal, onUpdateValue }: BoardViewProps) {
    const [activeId, setActiveId] = useState<string | null>(null)
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
    const groupProperty = properties.find(p => p.type === 'status') || properties.find(p => p.type === 'select')

    // --- KESİNLEŞMİŞ VERİYE GÖRE SIRALAMA ---
    const sortedOptions = useMemo(() => {
        if (!groupProperty) return []
        const rawOptions = groupProperty.config?.options || []
        
        // Attığın konsol çıktısına göre birebir eşleşme:
        const groupOrder: Record<string, number> = {
            'To-do': 1,         // Yapılacaklar (Başlanmadı, yapılcak vs.)
            'In Progress': 2,   // Devam Edenler (Devam Ediyor, yapılıyor vs.)
            'Complete': 3       // Tamamlananlar (Tamamlandı, bitti vs.)
        }

        return [...rawOptions].sort((a: any, b: any) => {
            // Veritabanından gelen 'group' değerine bakıyoruz
            const groupA = a.group || ''
            const groupB = b.group || ''

            const scoreA = groupOrder[groupA] || 99 // Grup yoksa en sona at
            const scoreB = groupOrder[groupB] || 99

            if (scoreA !== scoreB) {
                return scoreA - scoreB
            }
            // Aynı gruptalarsa kendi içinde oluşturulma sırasını koru (veya isme göre diz)
            return 0 
        })
    }, [groupProperty])
    // ----------------------------------------

    const columns = useMemo(() => {
        if (!groupProperty) return {}
        const cols: Record<string, any[]> = {}
        const opts = groupProperty.config?.options || []
        opts.forEach((opt:any) => {
            cols[opt.id] = pages.filter(p => pageValues[p.id]?.[groupProperty.id]?.option_id === opt.id)
        })
        cols['uncategorized'] = pages.filter(p => !pageValues[p.id]?.[groupProperty.id]?.option_id)
        return cols
    }, [pages, pageValues, groupProperty])

    if (!groupProperty) return null 

    const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string)
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over) { setActiveId(null); return }
        const activePageId = active.id as string
        const overId = over.id as string 
        let targetContainerId = null
        if (columns[overId]) targetContainerId = overId
        else { for (const [colId, items] of Object.entries(columns)) { if (items.find(p => p.id === overId)) { targetContainerId = colId; break } } }
        if (targetContainerId) {
             const newOptionId = targetContainerId === 'uncategorized' ? null : targetContainerId
             const currentOptionId = pageValues[activePageId]?.[groupProperty.id]?.option_id || 'uncategorized'
             if ((currentOptionId || 'uncategorized') !== (targetContainerId || 'uncategorized')) {
                onUpdateValue(activePageId, groupProperty.id, { option_id: newOptionId })
             }
        }
        setActiveId(null)
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto p-4 h-[calc(100vh-200px)] items-start bg-[#191919]">
                {columns['uncategorized'] && columns['uncategorized'].length > 0 && (
                    <BoardColumn id="uncategorized" title="Grupsuz" items={columns['uncategorized']} count={columns['uncategorized'].length} color="default" onAddPage={() => onAddPage()} onOpenPage={onOpenPage} properties={properties} pageValues={pageValues} groupProperty={groupProperty} />
                )}
                
                {/* SIRALANMIŞ SÜTUNLAR */}
                {sortedOptions.map((opt: any) => (
                    <BoardColumn 
                        key={opt.id} id={opt.id} title={opt.name} items={columns[opt.id] || []} count={(columns[opt.id] || []).length} color={opt.color}
                        // GÜNCELLENDİ: Modal açmak için ID gönderiyoruz
                        onAddPage={() => onAddPage(opt.id)} onOpenPage={onOpenPage} properties={properties} pageValues={pageValues} groupProperty={groupProperty}
                    />
                ))}

                <div className="min-w-[120px] pt-2 shrink-0">
                    <button onClick={() => onOpenStatusModal(groupProperty.id, groupProperty.name, sortedOptions, groupProperty.type)} className="flex items-center justify-center gap-2 text-gray-400 hover:text-white text-sm px-4 hover:bg-[#2C2C2C] py-3 rounded-xl border border-dashed border-[#373737] transition-all font-medium w-full h-[60px]">
                        <Plus size={16}/> Grup Ekle
                    </button>
                </div>
            </div>
            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
                {activeId ? <div className="bg-[#2C2C2C] p-3 rounded-lg shadow-2xl border border-blue-500 cursor-grabbing rotate-2"><div className="w-40 h-8 bg-gray-600/20 rounded animate-pulse"></div></div> : null}
            </DragOverlay>
        </DndContext>
    )
}

function BoardColumn({ id, title, items, count, color, onAddPage, onOpenPage, properties, pageValues, groupProperty }: any) {
    const { setNodeRef } = useSortable({ id: id, data: { type: 'container' } }) 
    const { style: badgeStyle } = getBadgeStyle(color)
    const { style: colStyle, className: colClass } = getColumnStyle(color)
    return (
        <div ref={setNodeRef} style={colStyle} className={`min-w-[280px] w-[280px] flex flex-col gap-3 shrink-0 p-2 rounded-xl transition-all max-h-full ${colClass}`}>
            <div className="flex items-center justify-between px-2 py-1 group/col shrink-0">
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-sm font-semibold" style={badgeStyle}>{title}</span>
                    <span className="px-1.5 py-0.5 text-xs bg-black/20 text-gray-400 rounded-full">{count}</span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pb-2 custom-scrollbar pr-1 min-h-[50px]">
                <SortableContext items={items.map((p:any) => p.id)} strategy={verticalListSortingStrategy}>
                    {items.map((page:any) => (<SortableItem key={page.id} id={page.id} page={page} properties={properties} pageValues={pageValues} groupProperty={groupProperty} onOpenPage={onOpenPage}/>))}
                </SortableContext>
                <button className="flex items-center gap-2 text-gray-400 hover:text-white text-sm p-2 rounded hover:bg-black/10 w-full transition-colors mt-1 font-medium" onClick={onAddPage}><Plus size={16}/> Yeni</button>
            </div>
        </div>
    )
}