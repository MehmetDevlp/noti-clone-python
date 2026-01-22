import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, FileText, Clock, Star, Plus, Sun, Moon, X, Trash } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function HomePage() {
  const navigate = useNavigate()
  
  const [databases, setDatabases] = useState<any[]>([])
  const [pages, setPages] = useState<any[]>([])
  const [recentItems, setRecentItems] = useState<any[]>([]) 
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [isCreateDbOpen, setIsCreateDbOpen] = useState(false)
  const [newDbTitle, setNewDbTitle] = useState("")
  const [isCreatePageOpen, setIsCreatePageOpen] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState("")
  
  const [deleteTarget, setDeleteTarget] = useState<{id: string, type: 'database' | 'page'} | null>(null)

  const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return { text: "Günaydın", icon: "🌅" };
      if (hour >= 12 && hour < 18) return { text: "Tünaydın", icon: "☀️" };
      return { text: "İyi Akşamlar", icon: "🌙" };
  }
  const greeting = getGreeting();

  const fetchData = async () => {
    try {
      const [dbsRes, pagesRes] = await Promise.all([
          fetch(`${API_URL}/databases`), // <-- DÜZELTİLDİ
          fetch(`${API_URL}/pages`)      // <-- DÜZELTİLDİ
      ])
      
      const dbsData = await dbsRes.json()
      const pageData = await pagesRes.json()
      
      setDatabases(dbsData)
      setPages(pageData)

      // --- TEMİZLİK OPERASYONU ---
      const validDbIds = new Set(dbsData.map((d: any) => d.id));
      const validPageIds = new Set(pageData.map((p: any) => p.id));

      let history = JSON.parse(localStorage.getItem('history') || '[]');
      const cleanHistory = history.filter((item: any) => {
          if (item.type === 'database') return validDbIds.has(item.id);
          if (item.type === 'page') return validPageIds.has(item.id);
          return false;
      });
      if (history.length !== cleanHistory.length) {
          localStorage.setItem('history', JSON.stringify(cleanHistory));
      }
      setRecentItems(cleanHistory);

      let favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      const cleanFavs = favs.filter((item: any) => {
          if (item.type === 'database') return validDbIds.has(item.id);
          if (item.type === 'page') return validPageIds.has(item.id);
          if (!item.type) return validPageIds.has(item.id); 
          return false;
      });
      if (favs.length !== cleanFavs.length) {
          localStorage.setItem('favorites', JSON.stringify(cleanFavs));
      }
      setFavorites(cleanFavs);

    } catch (error) {
      console.error("Veri yüklenemedi", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    window.addEventListener('sidebar-update', fetchData);
    return () => window.removeEventListener('sidebar-update', fetchData);
  }, [])

  const removeFromHistory = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const newHistory = recentItems.filter(item => item.id !== id);
      setRecentItems(newHistory);
      localStorage.setItem('history', JSON.stringify(newHistory));
      toast.success("Listeden kaldırıldı");
  }

  const removeFromFavorites = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const newFavs = favorites.filter(item => item.id !== id);
      setFavorites(newFavs);
      localStorage.setItem('favorites', JSON.stringify(newFavs));
      window.dispatchEvent(new Event('sidebar-update')); 
      toast.success("Favorilerden çıkarıldı");
  }

  const confirmDelete = async () => {
      if (!deleteTarget) return;
      const { id, type } = deleteTarget;
      const endpoint = type === 'database' ? 'databases' : 'pages';

      try {
          const res = await fetch(`${API_URL}/${endpoint}/${id}`, { method: 'DELETE' }); // <-- DÜZELTİLDİ
          if (res.ok) {
              toast.success("Öğe kalıcı olarak silindi");
              fetchData(); 
              window.dispatchEvent(new Event('sidebar-update'));
          } else {
              toast.error("Silinemedi");
          }
      } catch (e) {
          console.error(e);
          toast.error("Sunucu hatası");
      } finally {
          setDeleteTarget(null);
      }
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
        window.dispatchEvent(new Event('sidebar-update'))
        navigate(`/database/${data.id}`)
        setIsCreateDbOpen(false)
        setNewDbTitle("")
        toast.success("Veritabanı oluşturuldu")
      } else { toast.error("Hata oluştu") }
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
        window.dispatchEvent(new Event('sidebar-update'))
        navigate(`/page/${data.id}`)
        setIsCreatePageOpen(false)
        setNewPageTitle("")
        toast.success("Sayfa oluşturuldu")
      } else { toast.error("Hata oluştu") }
    } catch (e) { console.error(e); toast.error("Sunucu hatası") }
  }

  if (loading) return <div className="p-8 text-gray-500">Yükleniyor...</div>

  return (
    <div className="p-10 max-w-6xl mx-auto text-white pb-32 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <span className="text-4xl">{greeting.icon}</span> {greeting.text}
        </h1>
        <p className="text-gray-400">Çalışmaların seni bekliyor.</p>
      </div>

      {/* FAVORİLER */}
      {favorites.length > 0 && (
          <>
            <div className="mb-8">
                <h2 className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
                    <Star size={14} className="text-yellow-500" /> Favorilerim
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {favorites.map((fav: any) => (
                        <div 
                            key={fav.id} 
                            onClick={() => navigate(fav.type === 'database' ? `/database/${fav.id}` : `/page/${fav.id}`)}
                            className="bg-[#202020] hover:bg-[#2C2C2C] border border-[#373737] p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.02] flex items-center gap-3 group relative"
                        >
                            <span className="text-xl">{fav.icon || (fav.type === 'database' ? "📁" : "📄")}</span>
                            <span className="font-medium truncate flex-1">{fav.title || "İsimsiz"}</span>
                            
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#2C2C2C] p-1 rounded-md shadow-sm">
                                <button 
                                    onClick={(e) => removeFromFavorites(e, fav.id)}
                                    className="text-yellow-500 hover:text-yellow-300 p-1 rounded hover:bg-[#373737]"
                                    title="Favorilerden Kaldır"
                                >
                                    <Star size={12} fill="currentColor" />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setDeleteTarget({id: fav.id, type: fav.type}) }}
                                    className="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-[#373737]"
                                    title="Kalıcı Olarak Sil"
                                >
                                    <Trash size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="w-full h-px bg-[#373737] my-8"></div>
          </>
      )}

      {/* SON ZİYARET EDİLENLER */}
      <div className="mb-8">
        <h2 className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
            <Clock size={14} /> Son Ziyaret Edilenler
        </h2>
        {recentItems.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {recentItems.map((item: any) => (
                    <div 
                        key={item.id} 
                        onClick={() => navigate(item.type === 'database' ? `/database/${item.id}` : `/page/${item.id}`)}
                        className="min-w-[160px] w-[160px] bg-[#202020] hover:bg-[#2C2C2C] border border-[#373737] p-4 rounded-xl cursor-pointer transition-all flex flex-col gap-2 group hover:border-gray-500 relative"
                    >
                        <button 
                            onClick={(e) => removeFromHistory(e, item.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity p-1 hover:bg-[#373737] rounded-full"
                            title="Listeden Kaldır"
                        >
                            <X size={14} />
                        </button>

                        <div className={`w-8 h-8 rounded flex items-center justify-center text-lg shadow-sm ${item.type === 'database' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                            {item.icon || (item.type === 'database' ? <Database size={16}/> : <FileText size={16}/>)}
                        </div>
                        <div className="font-medium truncate text-sm mt-auto">{item.title || "İsimsiz"}</div>
                        <div className="flex justify-between items-center text-[10px] text-gray-500">
                            <span>{item.type === 'database' ? 'Veritabanı' : 'Sayfa'}</span>
                            <span>{new Date(item.visitedAt).toLocaleDateString('tr-TR', { hour: '2-digit', minute:'2-digit' }).split(' ')[1]}</span>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-sm text-gray-500 italic bg-[#202020]/50 p-4 rounded-lg border border-dashed border-[#373737]">
                Henüz bir kayıt yok.
            </div>
        )}
      </div>

      <div className="w-full h-px bg-[#373737] my-8"></div>

      {/* TÜM İÇERİKLER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* VERİTABANLARI LİSTESİ */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-[#373737] pb-2">
                <h2 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <Database size={14} className="text-blue-400" /> Veritabanlarım
                </h2>
                <button onClick={() => setIsCreateDbOpen(true)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer font-medium">
                    + Yeni Oluştur
                </button>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
                {databases.length > 0 ? databases.map(db => (
                    <div 
                        key={db.id} 
                        onClick={() => navigate(`/database/${db.id}`)}
                        className="group flex items-center gap-3 p-2 rounded-lg hover:bg-[#252525] cursor-pointer transition-colors border border-transparent hover:border-[#373737]"
                    >
                        <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center">
                            {db.icon ? <span className="text-sm text-white">{db.icon}</span> : <Database size={16} />}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-medium group-hover:text-blue-400 transition-colors truncate">{db.title || "İsimsiz Veritabanı"}</span>
                            <span className="text-[10px] text-gray-600 truncate">ID: {db.id.slice(0,8)}...</span>
                        </div>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget({id: db.id, type: 'database'}) }}
                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-2 hover:bg-[#373737] rounded transition-all"
                            title="Sil"
                        >
                            <Trash size={14} />
                        </button>
                    </div>
                )) : (
                    <div className="text-sm text-gray-500">Henüz veritabanı yok.</div>
                )}
            </div>
          </div>

          {/* SAYFALAR LİSTESİ */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-[#373737] pb-2">
                <h2 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <FileText size={14} className="text-green-400" /> Sayfalar
                </h2>
                <button onClick={() => setIsCreatePageOpen(true)} className="text-xs text-green-400 hover:text-green-300 transition-colors cursor-pointer font-medium">
                    + Sayfa Ekle
                </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
                {pages.length > 0 ? pages.map(page => (
                    <div 
                        key={page.id} 
                        onClick={() => navigate(`/page/${page.id}`)}
                        className="group flex items-center gap-3 p-2 rounded-lg hover:bg-[#252525] cursor-pointer transition-colors border border-transparent hover:border-[#373737]"
                    >
                        <div className="w-8 h-8 rounded bg-green-500/10 text-green-400 flex items-center justify-center text-lg">
                            {page.icon || <FileText size={16} />}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-medium group-hover:text-green-400 transition-colors truncate">{page.title || "İsimsiz Sayfa"}</span>
                            <span className="text-[10px] text-gray-600 truncate">ID: {page.id.slice(0,8)}...</span>
                        </div>

                        <button 
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget({id: page.id, type: 'page'}) }}
                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-2 hover:bg-[#373737] rounded transition-all"
                            title="Sil"
                        >
                            <Trash size={14} />
                        </button>
                    </div>
                )) : (
                    <div className="text-sm text-gray-500">Henüz sayfa yok.</div>
                )}
            </div>
          </div>
      </div>

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

    </div>
  )
}