import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Table as TableIcon, KanbanSquare as LayoutKanban, Calendar as CalendarIcon, Trash, X } from 'lucide-react'
import CalendarView from '../components/views/CalendarView'
import AddPropertyModal from '../components/AddPropertyModal'
import IconPicker from '../components/IconPicker'
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
    useUpdatePropertyConfig ,
    useUpdateDatabaseIcon
} from '../hooks/apiHooks'
import Modal from '../components/Modal'

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
  const updateIconMutation = useUpdateDatabaseIcon(id!)

  // --- STATE ---
  const [currentView, setCurrentView] = useState<'table' | 'board' | 'calendar'>('table')
  const [rowSelection, setRowSelection] = useState({})
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false)
  const [activeStatusModal, setActiveStatusModal] = useState<any>(null)
  
  // GÜNCELLENDİ: Hem tarih (Takvim) hem durum (Pano) tutabilen state
  const [createPageModal, setCreatePageModal] = useState<{ isOpen: boolean, dateStr: string | null, statusId: string | null }>({ 
      isOpen: false, 
      dateStr: null, 
      statusId: null 
  })
  const [newPageTitle, setNewPageTitle] = useState("")

  // --- FONKSİYONLAR ---
  
  // GÜNCELLENDİ: Modal Açma Fonksiyonu
  const openCreateModal = (dateStr: string | null = null, statusId: string | null = null) => {
    setNewPageTitle("") 
    setCreatePageModal({ isOpen: true, dateStr, statusId })
  }

  // GÜNCELLENDİ: Sayfa Oluşturma ve Verileri Atama
  const submitCreatePage = () => {
    const title = newPageTitle 
    const { dateStr, statusId } = createPageModal

    addPageMutation.mutate(title, {
        onSuccess: (newPage: any) => {
            // 1. Eğer Takvimden geldiyse Tarihi ekle
            if (dateStr) {
                 const dateProp = properties.find((pr:any) => pr.type === 'date')
                 if(dateProp) {
                     updateValueMutation.mutate({
                         pageId: newPage.id,
                         propertyId: dateProp.id,
                         value: { date: dateStr } 
                     })
                 }
            }
            // 2. Eğer Panodan geldiyse Durumu (Sütunu) ekle
            if (statusId) {
                const statusProp = properties.find((pr:any) => pr.type === 'status' || pr.type === 'select')
                if(statusProp) {
                    updateValueMutation.mutate({
                        pageId: newPage.id,
                        propertyId: statusProp.id,
                        value: { option_id: statusId }
                    })
                }
            }
            setCreatePageModal({ isOpen: false, dateStr: null, statusId: null })
        }
    })
  }

  const handleQuickAdd = () => {
     addPageMutation.mutate('')
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
            <IconPicker 
              icon={database.icon} 
              onChange={(newIcon) => updateIconMutation.mutate(newIcon)} 
            />
            <h1 className="text-3xl font-bold">{database.title}</h1>
          </div>

        {/* TABS */}
        <div className="flex items-center gap-4 border-b border-[#373737] mb-4">
            <button onClick={() => setCurrentView('table')} className={`flex items-center gap-2 pb-2 text-sm font-medium border-b-2 transition-colors ${currentView==='table'?'border-white text-white':'border-transparent text-gray-500 hover:text-gray-300'}`}><TableIcon size={16}/> Tablo</button>
            <button onClick={() => setCurrentView('board')} className={`flex items-center gap-2 pb-2 text-sm font-medium border-b-2 transition-colors ${currentView==='board'?'border-white text-white':'border-transparent text-gray-500 hover:text-gray-300'}`}><LayoutKanban size={16}/> Pano</button>
            <button onClick={() => setCurrentView('calendar')} className={`flex items-center gap-2 pb-2 text-sm font-medium border-b-2 transition-colors ${currentView==='calendar'?'border-white text-white':'border-transparent text-gray-500 hover:text-gray-300'}`}><CalendarIcon size={16}/> Takvim</button>
        </div>

       {/* VIEW RENDERER */}
        {currentView === 'table' && (
            <TableView 
                databaseId={id!} 
                properties={properties} 
                pages={pages} 
                pageValues={pageValues}
                onAddPage={() => handleQuickAdd()}
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
        )}

        {currentView === 'board' && (
            <BoardView 
                databaseId={id!} 
                properties={properties} 
                pages={pages} 
                pageValues={pageValues} 
                // BURASI GÜNCELLENDİ: Artık direkt modal açıyor
                onAddPage={(statusId) => openCreateModal(null, statusId)} 
                onOpenPage={(pid) => navigate(`/page/${pid}`)}
                onOpenStatusModal={(propId, propName, opts, type) => setActiveStatusModal({ pageId: '', propertyId: propId, propertyName: propName, currentValue: null, options: opts, propType: type, isOpen: true })}
                onUpdateValue={(pid, propId, val) => updateValueMutation.mutate({ pageId: pid, propertyId: propId, value: val })}
            />
        )}

        {currentView === 'calendar' && (
            <CalendarView 
                databaseId={id!} 
                properties={properties} 
                pages={pages} 
                pageValues={pageValues}
                onAddPage={(dateStr) => openCreateModal(dateStr, null)}
                onOpenPage={(pid) => navigate(`/page/${pid}`)}
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

        {/* --- SAYFA OLUŞTURMA MODALI (Hem Takvim Hem Pano İçin) --- */}
          <Modal
              isOpen={createPageModal.isOpen}
              onClose={() => setCreatePageModal({ isOpen: false, dateStr: null, statusId: null })}
              title="Yeni Sayfa Oluştur"
              footer={
                <>
                  <button onClick={() => setCreatePageModal({ isOpen: false, dateStr: null, statusId: null })} className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-[#373737] rounded transition-colors">İptal</button>
                  <button onClick={submitCreatePage} className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors font-medium">Oluştur</button>
                </>
              }
          >
              <div className="flex flex-col gap-2">
                  {createPageModal.dateStr && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <CalendarIcon size={12}/>
                          <span>{createPageModal.dateStr} tarihine ekleniyor</span>
                      </div>
                  )}
                  {createPageModal.statusId && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <LayoutKanban size={12}/>
                          <span>Seçili sütuna ekleniyor</span>
                      </div>
                  )}

                  <label className="text-xs text-gray-500 uppercase font-bold">Başlık</label>
                  <input 
                      autoFocus
                      type="text" 
                      value={newPageTitle}
                      onChange={(e) => setNewPageTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitCreatePage()}
                      placeholder="Örn: Toplantı, Görev..."
                      className="w-full bg-[#151515] border border-[#373737] rounded px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors"
                  />
              </div>
          </Modal>

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