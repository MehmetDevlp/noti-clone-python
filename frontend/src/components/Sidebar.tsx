import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  ChevronsLeft, Menu, Plus, Search, Settings, Home, Trash, Star 
} from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from './Modal'
import { useCommandStore } from '../store/useCommandStore'

// API URL'i buradan alıyoruz
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
  
  const { setOpen } = useCommandStore() 

  const [databases, setDatabases] = useState<SidebarItem[]>([])
  const [pages, setPages] = useState<SidebarItem[]>([])
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])

  const [deleteTarget, setDeleteTarget] = useState<{id: string, type: 'database' | 'page'} | null>(null)
  const [isCreateDbOpen, setIsCreateDbOpen] = useState(false)
  const [newDbTitle, setNewDbTitle] = useState("")
  const [isCreatePageOpen, setIsCreatePageOpen] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState("")

  const fetchData = async () => {
    try {
      const [dbsRes, pagesRes] = await Promise.all([
        fetch(`${API_URL}/databases`), // <-- DÜZELTİLDİ
        fetch(`${API_URL}/pages`)      // <-- DÜZELTİLDİ
      ])
      
      if (dbsRes.ok && pagesRes.ok) {
        const dbsData = await dbsRes.json()
        const pagesData = await pagesRes.json()
        setDatabases(dbsData.map((d: any) => ({ ...d, type: 'database' })))
        setPages(pagesData.map((p: any) => ({ ...p, type: 'page' })))
      }
    } catch (err) { console.error(err) }
  }

  const updateFavorites = () => {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      setFavoriteIds(favs.map((f: any) => f.id));
  }

  useEffect(() => {
    fetchData()
    updateFavorites()

    const handleUpdate = () => {
        fetchData()
        updateFavorites()
    }
    
    window.addEventListener('sidebar-update', handleUpdate)
    return () => window.removeEventListener('sidebar-update', handleUpdate)
  }, [])

  const toggleFavorite = (e: React.MouseEvent, item: SidebarItem) => {
      e.stopPropagation();
      
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      const isFav = favs.some((f: any) => f.id === item.id);
      let newFavs;

      if (isFav) {
          newFavs = favs.filter((f: any) => f.id !== item.id);
          toast.success("Favorilerden çıkarıldı");
      } else {
          newFavs = [{ id: item.id, title: item.title, icon: item.icon, type: item.type }, ...favs];
          toast.success("Favorilere eklendi");
      }

      localStorage.setItem('favorites', JSON.stringify(newFavs));
      window.dispatchEvent(new Event('sidebar-update'));
  }

  const submitCreateDatabase = async () => {
    if (!newDbTitle.trim()) {
        toast.error("Veritabanı ismi boş olamaz")
        return
    }

    try {
      const res = await fetch(`${API_URL}/databases`, { // <-- DÜZELTİLDİ
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newDbTitle, icon: '📁' })
      })
      if (res.ok) {
        const data = await res.json()
        navigate(`/database/${data.id}`)
        window.dispatchEvent(new Event('sidebar-update'))
        
        setIsCreateDbOpen(false)
        setNewDbTitle("")
        toast.success("Veritabanı oluşturuldu")
      } else {
        toast.error("Oluşturulurken hata oluştu")
      }
    } catch (e) { console.error(e); toast.error("Sunucu hatası") }
  }

  const submitCreatePage = async () => {
    if (!newPageTitle.trim()) {
        toast.error("Sayfa başlığı boş olamaz")
        return
    }

    try {
      const res = await fetch(`${API_URL}/pages`, { // <-- DÜZELTİLDİ
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newPageTitle, database_id: null })
      })
      if (res.ok) {
        const data = await res.json()
        navigate(`/page/${data.id}`)
        window.dispatchEvent(new Event('sidebar-update'))
        
        setIsCreatePageOpen(false)
        setNewPageTitle("")
        toast.success("Sayfa oluşturuldu")
      } else {
        toast.error("Oluşturulurken hata oluştu")
      }
    } catch (e) { console.error(e); toast.error("Sunucu hatası") }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const { id, type } = deleteTarget
    const endpoint = type === 'database' ? 'databases' : 'pages'
    
    try {
        const res = await fetch(`${API_URL}/${endpoint}/${id}`, { method: 'DELETE' }) // <-- DÜZELTİLDİ
        if (res.ok) {
            window.dispatchEvent(new Event('sidebar-update'))
            if (location.pathname.includes(id)) navigate('/')
            toast.success("Öğe silindi")
        } else {
            toast.error("Silinemedi")
        }
    } catch (err) { console.error(err); toast.error("Sunucu hatası") }
    finally { setDeleteTarget(null) }
  }

  return (
    <>
      {!isOpen && (
        <button onClick={toggle} className="fixed top-4 left-4 z-50 p-2 bg-[#202020] text-gray-400 hover:text-white rounded-md shadow-lg border border-[#373737]">
          <Menu size={20} />
        </button>
      )}

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
          <button 
             onClick={() => setOpen(true)} 
             className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-[#2C2C2C] rounded text-sm text-gray-400 hover:text-white transition-colors cursor-pointer group text-left"
          >
            <Search size={16} /> 
            <span>Ara</span>
            <span className="ml-auto text-xs text-gray-500 border border-[#373737] rounded px-1.5 py-0.5 group-hover:border-gray-500 transition-colors">
                Ctrl K
            </span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:bg-[#2C2C2C] hover:text-white rounded cursor-pointer">
            <Settings size={16} /> <span>Ayarlar</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
           <div onClick={() => navigate('/')} className={`flex items-center gap-2 px-4 py-1.5 mx-2 rounded text-sm cursor-pointer transition-colors ${location.pathname === '/' ? 'bg-[#2C2C2C] text-white' : 'text-gray-400 hover:bg-[#2C2C2C] hover:text-white'}`}>
             <Home size={16} /> <span>Ana Sayfa</span>
          </div>

          <div className="mt-6 mb-1 px-4 flex items-center justify-between group">
            <span className="text-xs font-bold text-gray-500">VERİTABANLARI</span>
            <button onClick={() => setIsCreateDbOpen(true)} className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><Plus size={14}/></button>
          </div>
          {databases.map(db => (
            <div key={db.id} onClick={() => navigate(`/database/${db.id}`)} className={`flex items-center gap-2 px-4 py-1 mx-2 rounded text-sm cursor-pointer transition-colors group ${location.pathname === `/database/${db.id}` ? 'bg-[#2C2C2C] text-white' : 'text-gray-400 hover:bg-[#2C2C2C] hover:text-white'}`}>
              <span className="text-lg leading-none">{db.icon || '📁'}</span>
              <span className="truncate flex-1">{db.title}</span>
              
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => toggleFavorite(e, db)} 
                    className={`p-1 rounded hover:bg-[#373737] transition-colors ${favoriteIds.includes(db.id) ? 'text-yellow-400 opacity-100' : 'text-gray-500 hover:text-yellow-400'}`}
                    title="Favorilere Ekle/Çıkar"
                  >
                      <Star size={14} fill={favoriteIds.includes(db.id) ? "currentColor" : "none"} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget({id: db.id, type: 'database'}) }} 
                    className="text-gray-500 hover:text-red-400 transition-colors p-1 hover:bg-[#373737] rounded"
                    title="Sil"
                  >
                      <Trash size={14} />
                  </button>
              </div>
            </div>
          ))}

          <div className="mt-6 mb-1 px-4 flex items-center justify-between group">
            <span className="text-xs font-bold text-gray-500">SAYFALAR</span>
            <button onClick={() => setIsCreatePageOpen(true)} className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><Plus size={14}/></button>
          </div>
          {pages.map(page => (
            <div key={page.id} onClick={() => navigate(`/page/${page.id}`)} className={`flex items-center gap-2 px-4 py-1 mx-2 rounded text-sm cursor-pointer transition-colors group ${location.pathname === `/page/${page.id}` ? 'bg-[#2C2C2C] text-white' : 'text-gray-400 hover:bg-[#2C2C2C] hover:text-white'}`}>
              <span className="text-lg leading-none">{page.icon || '📄'}</span>
              <span className="truncate flex-1">{page.title || "İsimsiz"}</span>
              
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => toggleFavorite(e, page)} 
                    className={`p-1 rounded hover:bg-[#373737] transition-colors ${favoriteIds.includes(page.id) ? 'text-yellow-400 opacity-100' : 'text-gray-500 hover:text-yellow-400'}`}
                    title="Favorilere Ekle/Çıkar"
                  >
                      <Star size={14} fill={favoriteIds.includes(page.id) ? "currentColor" : "none"} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget({id: page.id, type: 'page'}) }} 
                    className="text-gray-500 hover:text-red-400 transition-colors p-1 hover:bg-[#373737] rounded"
                    title="Sil"
                  >
                      <Trash size={14} />
                  </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-2 border-t border-[#373737]">
           <button onClick={() => setIsCreatePageOpen(true)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:bg-[#2C2C2C] hover:text-white rounded cursor-pointer transition-colors">
             <Plus size={16} /> <span>Yeni Sayfa Ekle</span>
           </button>
        </div>
      </div>

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
          <p className="text-xs text-gray-500 mt-1">* Boş bırakırsanız hata verir.</p>
        </div>
      </Modal>
    </>
  )
}