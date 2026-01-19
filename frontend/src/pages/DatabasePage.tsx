import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Table as TableIcon, KanbanSquare as LayoutKanban, Trash, X } from 'lucide-react'
import AddPropertyModal from '../components/AddPropertyModal'
import StatusEditModal from '../components/StatusEditModal'
import TableView from '../components/views/TableView'
import BoardView from '../components/views/BoardView'
import { 
    useDatabaseData, 
    useAddPage, 
    useUpdateValue, 
    useUpdateTitle, 
    useDeletePage, 
    useDeleteProperty, 
    useRenameProperty, 
    useUpdatePropertyConfig 
} from '../hooks/apiHooks'

export default function DatabasePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  // --- REACT QUERY ---
  const { data, isLoading, isError } = useDatabaseData(id!)
  
  const database = data?.database
  const properties = data?.properties || []
  const pages = data?.pages || []
  const pageValues = data?.pageValues || {}

  // --- MUTATIONS ---
  const addPageMutation = useAddPage(id!)
  const updateValueMutation = useUpdateValue(id!)
  const updateTitleMutation = useUpdateTitle(id!)
  const deletePageMutation = useDeletePage(id!)
  const deletePropertyMutation = useDeleteProperty(id!)
  const renamePropertyMutation = useRenameProperty(id!)
  const updateConfigMutation = useUpdatePropertyConfig(id!)

  // --- STATE ---
  const [currentView, setCurrentView] = useState<'table' | 'board'>('table')
  const [rowSelection, setRowSelection] = useState({})
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false)
  const [activeStatusModal, setActiveStatusModal] = useState<any>(null)

  // --- FONKSİYONLAR ---
  const handleAddPage = (statusOptionId?: string) => {
      addPageMutation.mutate('', {
          onSuccess: (newPage: any) => {
              if (statusOptionId) {
                  const statusProp = properties.find((pr:any) => pr.type === 'status' || pr.type === 'select')
                  if(statusProp) {
                      updateValueMutation.mutate({ 
                          pageId: newPage.id, 
                          propertyId: statusProp.id, 
                          value: { option_id: statusOptionId } 
                      })
                  }
              }
          }
      })
  }

  const handleDeleteSelected = async () => {
    const selectedIds = Object.keys(rowSelection).map(idx => pages[parseInt(idx)].id)
    if (selectedIds.length === 0) return
    if (!confirm(`${selectedIds.length} sayfayı silmek istediğinize emin misiniz?`)) return
    
    for (const pid of selectedIds) {
        deletePageMutation.mutate(pid)
    }
    setRowSelection({})
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Yükleniyor...</div>
  if (isError || !database) return <div className="flex items-center justify-center min-h-screen text-red-500">Veritabanı yüklenemedi.</div>

  const selectedCount = Object.keys(rowSelection).length

  return (
    <div className="min-h-screen p-8 bg-[#191919] text-white">
      <div className="max-w-[1400px] mx-auto">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">{database.icon || '📄'}</span>
          <h1 className="text-3xl font-bold">{database.title}</h1>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-4 border-b border-[#373737] mb-4">
          <button onClick={() => setCurrentView('table')} className={`flex items-center gap-2 pb-2 text-sm font-medium border-b-2 transition-colors ${currentView==='table'?'border-white text-white':'border-transparent text-gray-500 hover:text-gray-300'}`}><TableIcon size={16}/> Tablo</button>
          <button onClick={() => setCurrentView('board')} className={`flex items-center gap-2 pb-2 text-sm font-medium border-b-2 transition-colors ${currentView==='board'?'border-white text-white':'border-transparent text-gray-500 hover:text-gray-300'}`}><LayoutKanban size={16}/> Pano</button>
        </div>

        {/* VIEW RENDERER */}
        {currentView === 'table' ? (
            <TableView 
                databaseId={id!} 
                properties={properties} 
                pages={pages} 
                pageValues={pageValues}
                onAddPage={() => handleAddPage()}
                onOpenPage={(pid) => navigate(`/page/${pid}`)}
                onUpdateTitle={(pid, title) => updateTitleMutation.mutate({ pageId: pid, title })}
                onUpdateValue={(pid, propId, val) => updateValueMutation.mutate({ pageId: pid, propertyId: propId, value: val })}
                onDeleteProperty={(pid) => deletePropertyMutation.mutate(pid)}
                onRenameProperty={(pid, name) => renamePropertyMutation.mutate({ propId: pid, name })}
                onOpenStatusModal={(pid, propId, propName, val, opts, type) => setActiveStatusModal({ pageId: pid, propertyId: propId, propertyName: propName, currentValue: val, options: opts, propType: type, isOpen: true })}
                onAddProperty={() => setShowAddPropertyModal(true)}
                rowSelection={rowSelection}
                setRowSelection={setRowSelection}
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
                onUpdateValue={(pid, propId, val) => updateValueMutation.mutate({ pageId: pid, propertyId: propId, value: val })}
            />
        )}

        {/* SELECTION BAR */}
        {selectedCount > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#252525] border border-[#373737] px-4 py-2 rounded-lg shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-200">
             <div className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded">{selectedCount}</div>
             <span className="text-sm text-gray-300 mr-2">satır seçildi</span>
             <div className="w-px h-4 bg-[#373737] mx-1"></div>
             <button onClick={handleDeleteSelected} className="flex items-center gap-1 px-3 py-1 hover:bg-red-900/30 text-red-400 hover:text-red-300 rounded text-sm transition-colors"><Trash size={14} /> Sil</button>
             <button onClick={() => setRowSelection({})} className="ml-2 text-gray-500 hover:text-white"><X size={16} /></button>
          </div>
        )}

        {/* MODALS */}
        {showAddPropertyModal && (
            <AddPropertyModal 
                databaseId={id!} 
                onClose={()=>setShowAddPropertyModal(false)} 
                onSuccess={() => {}} 
            />
        )}
        
        {activeStatusModal && (
          <StatusEditModal
            isOpen={true}
            onClose={() => setActiveStatusModal(null)}
            title={activeStatusModal.propertyName}
            currentValue={activeStatusModal.currentValue}
            options={activeStatusModal.options}
            propType={activeStatusModal.propType}
            multiple={activeStatusModal.propType === 'multi_select'}
            onChange={(newValue) => {
              if (!activeStatusModal.pageId) return;
              const payload = Array.isArray(newValue) ? { option_ids: newValue } : { option_id: newValue }
              updateValueMutation.mutate({ pageId: activeStatusModal.pageId, propertyId: activeStatusModal.propertyId, value: payload })
            }}
            onCreate={(name, color, group) => {
               const newOpt = { id: crypto.randomUUID(), name, color: color || 'gray', group }
               const newOptions = [...activeStatusModal.options, newOpt]
               updateConfigMutation.mutate({ propId: activeStatusModal.propertyId, options: newOptions })
               setActiveStatusModal((prev:any) => ({...prev, options: newOptions}))
            }}
            onDelete={(optId) => {
                const newOptions = activeStatusModal.options.filter((o: any) => o.id !== optId)
                updateConfigMutation.mutate({ propId: activeStatusModal.propertyId, options: newOptions })
                setActiveStatusModal((prev:any) => ({...prev, options: newOptions}))
            }}
          />
        )}
      </div>
    </div>
  )
}