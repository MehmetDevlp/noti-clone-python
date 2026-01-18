import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  ChevronsLeft, Menu, Plus, Search, Settings, Home, Trash
} from 'lucide-react'
import Modal from './Modal'

interface SidebarProps {
  isOpen: boolean
  toggle: () => void
}

interface SidebarItem {
  id: string
  title: string
  icon: string | null
  type: 'database' | 'page'
}

export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [databases, setDatabases] = useState<SidebarItem[]>([])
  const [pages, setPages] = useState<SidebarItem[]>([])

  // --- MODAL STATE'LERİ ---
  // 1. Silme Modalı
  const [deleteTarget, setDeleteTarget] = useState<{id: string, type: 'database' | 'page'} | null>(null)
  
  // 2. Veritabanı Oluşturma Modalı
  const [isCreateDbOpen, setIsCreateDbOpen] = useState(false)
  const [newDbTitle, setNewDbTitle] = useState("")

  // 3. YENİ: Sayfa Oluşturma Modalı
  const [isCreatePageOpen, setIsCreatePageOpen] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState("")

  const fetchData = async () => {
    try {
      const [dbsRes, pagesRes] = await Promise.all([
        fetch('http://localhost:8000/databases'),
        fetch('http://localhost:8000/pages')
      ])
      
      if (dbsRes.ok && pagesRes.ok) {
        const dbsData = await dbsRes.json()
        const pagesData = await pagesRes.json()
        setDatabases(dbsData.map((d: any) => ({ ...d, type: 'database' })))
        setPages(pagesData.map((p: any) => ({ ...p, type: 'page' })))
      }
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    fetchData()
    const handleUpdate = () => fetchData()
    window.addEventListener('sidebar-update', handleUpdate)
    return () => window.removeEventListener('sidebar-update', handleUpdate)
  }, [])

  // --- İŞLEM FONKSİYONLARI ---

  // 1. Veritabanı Oluşturma
  const submitCreateDatabase = async () => {
    if (!newDbTitle.trim()) return
    try {
      const res = await fetch('http://localhost:8000/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newDbTitle, icon: '📁' })
      })
      if (res.ok) {
        const data = await res.json()
        navigate(`/database/${data.id}`)
        fetchData()
        setIsCreateDbOpen(false)
        setNewDbTitle("")
      }
    } catch (e) { console.error(e) }
  }

  // 2. YENİ: Sayfa Oluşturma (Artık Modal Kullanıyor)
  const submitCreatePage = async () => {
    // Başlık boş olsa bile oluşturulabilir (Opsiyonel: return koyarak zorunlu yapabilirsin)
    // if (!newPageTitle.trim()) return 

    try {
      const res = await fetch('http://localhost:8000/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Girilen başlığı gönderiyoruz. Boşsa backend boş kaydedecek.
        body: JSON.stringify({ title: newPageTitle, database_id: null })
      })
      if (res.ok) {
        const data = await res.json()
        navigate(`/page/${data.id}`)
        fetchData()
        setIsCreatePageOpen(false)
        setNewPageTitle("")
      }
    } catch (e) { console.error(e) }
  }

  // 3. Silme İşlemi
  const confirmDelete = async () => {
    if (!deleteTarget) return
    const { id, type } = deleteTarget
    const endpoint = type === 'database' ? 'databases' : 'pages'
    
    try {
        const res = await fetch(`http://localhost:8000/${endpoint}/${id}`, { method: 'DELETE' })
        if (res.ok) {
            fetchData()
            if (location.pathname.includes(id)) navigate('/')
        }
    } catch (err) { console.error(err) }
    finally {
        setDeleteTarget(null)
    }
  }

  return (
    <>
      {/* MOBİL BUTON */}
      {!isOpen && (
        <button onClick={toggle} className="fixed top-4 left-4 z-50 p-2 bg-[#202020] text-gray-400 hover:text-white rounded-md shadow-lg border border-[#373737]">
          <Menu size={20} />
        </button>
      )}

      {/* SIDEBAR PANELİ */}
      <div className={`fixed top-0 left-0 h-screen bg-[#202020] border-r border-[#373737] transition-all duration-300 ease-in-out z-40 flex flex-col ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'}`}>
        
        <div className="flex items-center justify-between p-4 hover:bg-[#2C2C2C] cursor-pointer transition-colors group">
          <div className="flex items-center gap-2 font-semibold text-white truncate">
            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-xs">N</div>
            <span className="truncate">Notion Clone</span>
          </div>
          <button onClick={toggle} className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronsLeft size={18} />
          </button>
        </div>

        <div className="px-2 py-2 space-y-1">
          <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:bg-[#2C2C2C] hover:text-white rounded cursor-pointer">
            <Search size={16} /> <span>Ara</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:bg-[#2C2C2C] hover:text-white rounded cursor-pointer">
            <Settings size={16} /> <span>Ayarlar</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
           <div onClick={() => navigate('/')} className={`flex items-center gap-2 px-4 py-1.5 mx-2 rounded text-sm cursor-pointer transition-colors ${location.pathname === '/' ? 'bg-[#2C2C2C] text-white' : 'text-gray-400 hover:bg-[#2C2C2C] hover:text-white'}`}>
             <Home size={16} /> <span>Ana Sayfa</span>
          </div>

          {/* VERİTABANLARI */}
          <div className="mt-6 mb-1 px-4 flex items-center justify-between group">
            <span className="text-xs font-bold text-gray-500">VERİTABANLARI</span>
            <button onClick={() => setIsCreateDbOpen(true)} className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><Plus size={14}/></button>
          </div>
          {databases.map(db => (
            <div key={db.id} onClick={() => navigate(`/database/${db.id}`)} className={`flex items-center gap-2 px-4 py-1 mx-2 rounded text-sm cursor-pointer transition-colors group ${location.pathname === `/database/${db.id}` ? 'bg-[#2C2C2C] text-white' : 'text-gray-400 hover:bg-[#2C2C2C] hover:text-white'}`}>
              <span className="text-lg leading-none">{db.icon || '📁'}</span>
              <span className="truncate flex-1">{db.title}</span>
              <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({id: db.id, type: 'database'}) }} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1 hover:bg-[#373737] rounded"><Trash size={14} /></button>
            </div>
          ))}

          {/* SAYFALAR */}
          <div className="mt-6 mb-1 px-4 flex items-center justify-between group">
            <span className="text-xs font-bold text-gray-500">SAYFALAR</span>
            {/* BURASI GÜNCELLENDİ: Modal açıyor */}
            <button onClick={() => setIsCreatePageOpen(true)} className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><Plus size={14}/></button>
          </div>
          {pages.map(page => (
            <div key={page.id} onClick={() => navigate(`/page/${page.id}`)} className={`flex items-center gap-2 px-4 py-1 mx-2 rounded text-sm cursor-pointer transition-colors group ${location.pathname === `/page/${page.id}` ? 'bg-[#2C2C2C] text-white' : 'text-gray-400 hover:bg-[#2C2C2C] hover:text-white'}`}>
              <span className="text-lg leading-none">{page.icon || '📄'}</span>
              <span className="truncate flex-1">{page.title || "İsimsiz"}</span>
              <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({id: page.id, type: 'page'}) }} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1 hover:bg-[#373737] rounded"><Trash size={14} /></button>
            </div>
          ))}
        </div>

        <div className="p-2 border-t border-[#373737]">
           {/* BURASI GÜNCELLENDİ: Modal açıyor */}
           <button onClick={() => setIsCreatePageOpen(true)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:bg-[#2C2C2C] hover:text-white rounded cursor-pointer transition-colors">
             <Plus size={16} /> <span>Yeni Sayfa Ekle</span>
           </button>
        </div>
      </div>

      {/* --- MODALLAR --- */}
      
      {/* 1. SİLME ONAY PENCERESİ */}
      <Modal 
        isOpen={!!deleteTarget} 
        onClose={() => setDeleteTarget(null)} 
        title="Silme İşlemi"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-[#373737] rounded transition-colors">İptal</button>
            <button onClick={confirmDelete} className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-500 text-white rounded transition-colors font-medium">Evet, Sil</button>
          </>
        }
      >
        <p>Bu öğeyi kalıcı olarak silmek istediğinize emin misiniz?</p>
        <p className="text-sm text-gray-500 mt-1">Bu işlem geri alınamaz.</p>
      </Modal>

      {/* 2. VERİTABANI OLUŞTURMA PENCERESİ */}
      <Modal
        isOpen={isCreateDbOpen}
        onClose={() => setIsCreateDbOpen(false)}
        title="Yeni Veritabanı"
        footer={
          <>
            <button onClick={() => setIsCreateDbOpen(false)} className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-[#373737] rounded transition-colors">İptal</button>
            <button onClick={submitCreateDatabase} className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors font-medium">Oluştur</button>
          </>
        }
      >
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500 uppercase font-bold">Veritabanı İsmi</label>
          <input 
            autoFocus
            type="text" 
            value={newDbTitle}
            onChange={(e) => setNewDbTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitCreateDatabase()}
            placeholder="Örn: Projeler, Görevler..."
            className="w-full bg-[#151515] border border-[#373737] rounded px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </Modal>

      {/* 3. YENİ SAYFA OLUŞTURMA PENCERESİ (YENİ EKLENDİ) */}
      <Modal
        isOpen={isCreatePageOpen}
        onClose={() => setIsCreatePageOpen(false)}
        title="Yeni Sayfa"
        footer={
          <>
            <button onClick={() => setIsCreatePageOpen(false)} className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-[#373737] rounded transition-colors">İptal</button>
            <button onClick={submitCreatePage} className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 text-white rounded transition-colors font-medium">Sayfa Ekle</button>
          </>
        }
      >
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500 uppercase font-bold">Sayfa Başlığı</label>
          <input 
            autoFocus
            type="text" 
            value={newPageTitle}
            onChange={(e) => setNewPageTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitCreatePage()}
            placeholder="Örn: Toplantı Notları..."
            className="w-full bg-[#151515] border border-[#373737] rounded px-3 py-2 text-white outline-none focus:border-green-500 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">* Boş bırakırsanız "İsimsiz" olarak oluşturulur.</p>
        </div>
      </Modal>
    </>
  )
}