import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  ChevronsLeft, 
  Menu, 
  Plus, 
  Database, 
  FileText, 
  Settings, 
  Search,
  Home
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  toggle: () => void
}

interface DatabaseItem {
  id: string
  title: string
  icon: string | null
}

export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [databases, setDatabases] = useState<DatabaseItem[]>([])

  // Veritabanlarını çek
  useEffect(() => {
    fetch('http://localhost:8000/databases')
      .then(res => res.json())
      .then(data => setDatabases(data))
      .catch(err => console.error('Sidebar data error:', err))
  }, []) // Gerçek uygulamada burası global state veya context olmalı ama şimdilik böyle yeter

  // Yeni veritabanı oluşturma (Hızlı Eylem)
  const handleCreateNew = async () => {
    const title = prompt("Yeni veritabanı ismi:")
    if (!title) return

    try {
      const response = await fetch('http://localhost:8000/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, icon: '📁' })
      })
      if (response.ok) {
        const newDb = await response.json()
        setDatabases([...databases, newDb])
        navigate(`/database/${newDb.id}`)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      {/* MOBİL / KAPALI DURUM İÇİN AÇMA BUTONU (Solda süzülen buton) */}
      {!isOpen && (
        <button
          onClick={toggle}
          className="fixed top-4 left-4 z-50 p-2 bg-[#202020] text-gray-400 hover:text-white rounded-md shadow-lg border border-[#373737] transition-colors"
        >
          <Menu size={20} />
        </button>
      )}

      {/* SIDEBAR ANA KUTUSU */}
      <div 
        className={`
          fixed top-0 left-0 h-screen bg-[#202020] border-r border-[#373737] 
          transition-all duration-300 ease-in-out z-40 flex flex-col
          ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'}
        `}
      >
        {/* 1. Üst Kısım (Kullanıcı / Kapatma) */}
        <div className="flex items-center justify-between p-4 hover:bg-[#2C2C2C] cursor-pointer transition-colors group">
          <div className="flex items-center gap-2 font-semibold text-white truncate">
            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-xs">M</div>
            <span className="truncate">Mehmet'in Notion'ı</span>
          </div>
          <button 
            onClick={toggle}
            className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronsLeft size={18} />
          </button>
        </div>

        {/* 2. Hızlı Menü (Ara, Ayarlar, Yeni Sayfa) */}
        <div className="px-2 py-2 space-y-1">
          <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:bg-[#2C2C2C] hover:text-white rounded cursor-pointer transition-colors">
            <Search size={16} />
            <span>Ara</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:bg-[#2C2C2C] hover:text-white rounded cursor-pointer transition-colors">
            <Settings size={16} />
            <span>Ayarlar</span>
          </div>
          <div 
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:bg-[#2C2C2C] hover:text-white rounded cursor-pointer transition-colors"
          >
            <Plus size={16} className="bg-gray-600/50 rounded-full p-0.5" />
            <span>Yeni Veritabanı</span>
          </div>
        </div>

        {/* 3. Kaydırılabilir İçerik (Veritabanları Listesi) */}
        <div className="flex-1 overflow-y-auto py-2">
          {/* Bölüm Başlığı */}
          <div className="px-4 py-1 text-xs font-semibold text-gray-500 mt-2 mb-1">
            Veritabanları
          </div>

          <div 
             onClick={() => navigate('/')}
             className={`flex items-center gap-2 px-4 py-1.5 mx-2 rounded text-sm cursor-pointer transition-colors ${location.pathname === '/' ? 'bg-[#2C2C2C] text-white' : 'text-gray-400 hover:bg-[#2C2C2C] hover:text-white'}`}
          >
             <Home size={16} />
             <span>Ana Sayfa</span>
          </div>

          {databases.map(db => (
            <div
              key={db.id}
              onClick={() => navigate(`/database/${db.id}`)}
              className={`
                flex items-center gap-2 px-4 py-1.5 mx-2 rounded text-sm cursor-pointer transition-colors group
                ${location.pathname === `/database/${db.id}` 
                  ? 'bg-[#2C2C2C] text-white' 
                  : 'text-gray-400 hover:bg-[#2C2C2C] hover:text-white'}
              `}
            >
              <span className="text-lg leading-none">{db.icon || '📄'}</span>
              <span className="truncate">{db.title}</span>
            </div>
          ))}
          
          {databases.length === 0 && (
            <div className="px-6 py-2 text-xs text-gray-600 italic">
              Henüz veritabanı yok.
            </div>
          )}
        </div>

        {/* 4. Alt Kısım (Opsiyonel - Çöp Kutusu vb.) */}
        <div className="p-2 border-t border-[#373737]">
           <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:bg-[#2C2C2C] hover:text-white rounded cursor-pointer transition-colors">
             <Plus size={16} />
             <span>Yeni Sayfa Ekle</span>
           </div>
        </div>
      </div>
    </>
  )
}