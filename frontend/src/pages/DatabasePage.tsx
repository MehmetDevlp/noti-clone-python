import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Table as TableIcon, KanbanSquare as LayoutKanban, Trash, X } from 'lucide-react'
import AddPropertyModal from '../components/AddPropertyModal'
import StatusEditModal from '../components/StatusEditModal'
import TableView from '../components/views/TableView'
import BoardView from '../components/views/BoardView'

export default function DatabasePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  // --- STATE ---
  const [database, setDatabase] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [pages, setPages] = useState<any[]>([])
  const [pageValues, setPageValues] = useState<Record<string, Record<string, any>>>({})
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<'table' | 'board'>('table')
  const [rowSelection, setRowSelection] = useState({})
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false)
  const [activeStatusModal, setActiveStatusModal] = useState<any>(null)

  // --- VERİ ÇEKME ---
  const fetchData = async () => {
      try { 
          const [d, p, pg] = await Promise.all([ 
              fetch(`http://localhost:8000/databases/${id}`).then(r=>r.json()), 
              fetch(`http://localhost:8000/databases/${id}/properties`).then(r=>r.json()), 
              fetch(`http://localhost:8000/databases/${id}/pages`).then(r=>r.json()) 
          ]); 
          setDatabase(d); setProperties(p); setPages(pg); 
          
          const vMap: any = {}; 
          for(const page of pg) { 
              const vals = await fetch(`http://localhost:8000/pages/${page.id}/values`).then(r=>r.json()); 
              vMap[page.id] = {}; 
              vals.forEach((v: any) => vMap[page.id][v.property_id] = v) 
          } 
          setPageValues(vMap); 
          setLoading(false) 
      } catch(e){console.error(e);setLoading(false)} 
  }

  useEffect(() => { if(id) fetchData() }, [id])

  // --- FONKSİYONLAR ---
  const handleAddPage = async (statusOptionId?: string) => { 
      if (!id) return
      try { 
          const res = await fetch('http://localhost:8000/pages', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ database_id: id, title: '' }) }); 
          if(res.ok) { 
              const p = await res.json(); 
              setPages([...pages, p]) 
              if (statusOptionId) {
                  const statusProp = properties.find(pr => pr.type === 'status' || pr.type === 'select')
                  if(statusProp) handlePropertyValueUpdate(p.id, statusProp.id, { option_id: statusOptionId })
              }
          } 
      } catch(e){console.error(e)}
  }

  const handlePropertyValueUpdate = async (pageId: string, propertyId: string, value: any) => {
      try { 
        const res = await fetch('http://localhost:8000/values', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({page_id:pageId, property_id:propertyId, value}) }); 
        if(res.ok) { 
          // BURADAKİ HATA DÜZELTİLDİ: (prev: any) eklendi
          setPageValues((prev: any) => {
              const currentVal = prev[pageId]?.[propertyId] || {};
              return {...prev, [pageId]:{...prev[pageId], [propertyId]: {...currentVal, ...value}}}
          })
        } 
      } catch(e){ console.error(e) }
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

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Yükleniyor...</div>
  if (!database) return <div className="flex items-center justify-center min-h-screen text-red-500">Bulunamadı</div>

  const selectedCount = Object.keys(rowSelection).length

  return (
    <div className="min-h-screen p-8 bg-[#191919] text-white">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">{database.icon || '📄'}</span>
          <h1 className="text-3xl font-bold">{database.title}</h1>
        </div>

        <div className="flex items-center gap-4 border-b border-[#373737] mb-4">
          <button onClick={() => setCurrentView('table')} className={`flex items-center gap-2 pb-2 text-sm font-medium border-b-2 transition-colors ${currentView==='table'?'border-white text-white':'border-transparent text-gray-500 hover:text-gray-300'}`}><TableIcon size={16}/> Tablo</button>
          <button onClick={() => setCurrentView('board')} className={`flex items-center gap-2 pb-2 text-sm font-medium border-b-2 transition-colors ${currentView==='board'?'border-white text-white':'border-transparent text-gray-500 hover:text-gray-300'}`}><LayoutKanban size={16}/> Pano</button>
        </div>

        {currentView === 'table' ? (
            <TableView 
                databaseId={id!} properties={properties} pages={pages} pageValues={pageValues}
                onAddPage={() => handleAddPage()}
                onOpenPage={(pid) => navigate(`/page/${pid}`)}
                onUpdateTitle={async (pid, title) => {
                    await fetch(`http://localhost:8000/pages/${pid}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({title}) });
                    setPages(pages.map(p=>p.id===pid?{...p, title}:p))
                }}
                onUpdateValue={handlePropertyValueUpdate}
                onDeleteProperty={async (pid) => { await fetch(`http://localhost:8000/properties/${pid}`, {method:'DELETE'}); setProperties(properties.filter(p=>p.id!==pid)) }}
                onRenameProperty={async (pid, name) => { await fetch(`http://localhost:8000/properties/${pid}`, {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name})}); setProperties(properties.map(p=>p.id===pid?{...p, name}:p)) }}
                onOpenStatusModal={(pid, propId, propName, val, opts, type) => setActiveStatusModal({ pageId: pid, propertyId: propId, propertyName: propName, currentValue: val, options: opts, propType: type, isOpen: true })}
                onAddProperty={() => setShowAddPropertyModal(true)}
                rowSelection={rowSelection} setRowSelection={setRowSelection}
            />
        ) : (
            <BoardView 
                databaseId={id!} 
                properties={properties} 
                pages={pages} 
                pageValues={pageValues} 
                onAddPage={(optId) => handleAddPage(optId)}
                onOpenPage={(pid) => navigate(`/page/${pid}`)}
                onOpenStatusModal={(propId, propName, opts, type) => setActiveStatusModal({ pageId: '', propertyId: propId, propertyName: propName, currentValue: null, options: opts, propType: type, isOpen: true })}
                
                // YENİ EKLENEN SATIR:
                onUpdateValue={handlePropertyValueUpdate} 
            />
        )}

        {selectedCount > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#252525] border border-[#373737] px-4 py-2 rounded-lg shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-200">
             <div className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded">{selectedCount}</div>
             <span className="text-sm text-gray-300 mr-2">satır seçildi</span>
             <div className="w-px h-4 bg-[#373737] mx-1"></div>
             <button onClick={handleDeleteSelected} className="flex items-center gap-1 px-3 py-1 hover:bg-red-900/30 text-red-400 hover:text-red-300 rounded text-sm transition-colors"><Trash size={14} /> Sil</button>
             <button onClick={() => setRowSelection({})} className="ml-2 text-gray-500 hover:text-white"><X size={16} /></button>
          </div>
        )}

        {showAddPropertyModal && <AddPropertyModal databaseId={id!} onClose={()=>setShowAddPropertyModal(false)} onSuccess={(np)=>setProperties([...properties, np])}/>}
        {activeStatusModal && (
          <StatusEditModal
            isOpen={true} onClose={() => setActiveStatusModal(null)}
            title={activeStatusModal.propertyName} currentValue={activeStatusModal.currentValue}
            options={activeStatusModal.options} propType={activeStatusModal.propType}
            multiple={activeStatusModal.propType === 'multi_select'}
            onChange={(newValue) => {
              if (!activeStatusModal.pageId) return;
              const payload = Array.isArray(newValue) ? { option_ids: newValue } : { option_id: newValue }
              handlePropertyValueUpdate(activeStatusModal.pageId, activeStatusModal.propertyId, payload)
            }}
            onCreate={(name, color, group) => {
               const newOpt = { id: crypto.randomUUID(), name, color: color || 'gray', group }
               const newOptions = [...activeStatusModal.options, newOpt]
               const config = { options: newOptions }
               fetch(`http://localhost:8000/properties/${activeStatusModal.propertyId}`, {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({config})})
                .then(() => {
                    setProperties(properties.map(p=>p.id===activeStatusModal.propertyId?{...p, config}:p))
                    setActiveStatusModal((prev: any) => ({...prev, options: newOptions})) // prev:any eklendi
                })
            }}
            onDelete={(optId) => {
                const newOptions = activeStatusModal.options.filter((o: any) => o.id !== optId)
                const config = { options: newOptions }
                fetch(`http://localhost:8000/properties/${activeStatusModal.propertyId}`, {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({config})})
                .then(() => {
                    setProperties(properties.map(p=>p.id===activeStatusModal.propertyId?{...p, config}:p))
                    setActiveStatusModal((prev: any) => ({...prev, options: newOptions})) // prev:any eklendi
                })
            }}
          />
        )}
      </div>
    </div>
  )
}