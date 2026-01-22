import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { Search, Home, Plus, FileText } from 'lucide-react'
import { useDatabases } from '../hooks/useDatabases'
import { useCommandStore } from '../store/useCommandStore'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function CommandMenu() {
  const navigate = useNavigate()
  const { data: databases } = useDatabases()
  
  const { isOpen, setOpen, toggle } = useCommandStore()

  // --- STATE'LER ---
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [rootPages, setRootPages] = useState<any[]>([]) // YENİ: Kök sayfalar için state

  // --- KLAVYE DİNLEYİCİSİ ---
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
      if (e.key === 'Escape') {
          setOpen(false)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [toggle, setOpen])

  // --- BAŞLANGIÇTA SAYFALARI ÇEK (YENİ EKLENEN KISIM) ---
  useEffect(() => {
    if (isOpen) {
        // Menü açılınca kök sayfaları (veritabanına bağlı olmayanları) çek
        fetch(`${API_URL}/pages`)
            .then(res => res.json())
            .then(data => setRootPages(data))
            .catch(err => console.error("Sayfalar yüklenemedi:", err))
    }
  }, [isOpen])

  // --- ARAMA API İSTEĞİ (DEBOUNCE) ---
  useEffect(() => {
    const timer = setTimeout(async () => {
        if (!query.trim()) {
            setResults([])
            return
        }
        
        try {
            const res = await fetch(`http://localhost:8000/search?q=${query}`)
            const data = await res.json()
            setResults(data)
        } catch (error) {
            console.error("Arama hatası:", error)
        }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  if (!isOpen) return null

  return (
    <div 
        className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
        onClick={() => setOpen(false)}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[640px]">
          <Command 
            shouldFilter={false}
            className="w-full bg-[#191919] border border-[#373737] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            label="Global Command Menu"
          >
            <div className="flex items-center border-b border-[#373737] px-3">
              <Search className="w-4 h-4 text-gray-500 mr-2" />
              <Command.Input 
                autoFocus
                placeholder="Ne aramıştınız? (Sayfalar, Veritabanları...)"
                className="w-full bg-transparent p-4 text-white outline-none placeholder:text-gray-500 text-sm"
                value={query}
                onValueChange={setQuery}
              />
              <div className="flex gap-1">
                <kbd className="bg-[#2C2C2C] text-gray-400 text-[10px] px-1.5 py-0.5 rounded border border-[#373737]">ESC</kbd>
              </div>
            </div>

            <Command.List className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
              
              {!results.length && query && (
                  <div className="py-6 text-center text-sm text-gray-500">Sonuç bulunamadı.</div>
              )}

              {/* --- VARSAYILAN LİSTE (Query Yoksa) --- */}
              {!query && (
                  <>
                    <Command.Group heading="Genel" className="text-xs font-bold text-gray-500 mb-2 px-2">
                        <Command.Item 
                            onSelect={() => runCommand(() => navigate('/'))}
                            className="flex items-center gap-2 px-2 py-2 rounded text-sm text-gray-300 hover:bg-[#2C2C2C] hover:text-white cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white transition-colors"
                        >
                        <Home size={14} />
                        <span>Ana Sayfa</span>
                        </Command.Item>
                    </Command.Group>

                    {/* VERİTABANLARI */}
                    {databases && databases.length > 0 && (
                        <Command.Group heading="Veritabanları" className="text-xs font-bold text-gray-500 mb-2 px-2 mt-2">
                        {databases.map((db: any) => (
                            <Command.Item
                            key={db.id}
                            onSelect={() => runCommand(() => navigate(`/database/${db.id}`))}
                            className="flex items-center gap-2 px-2 py-2 rounded text-sm text-gray-300 hover:bg-[#2C2C2C] hover:text-white cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white transition-colors"
                            >
                            <span className="text-lg leading-none">{db.icon || '📁'}</span>
                            <span>{db.title}</span>
                            <span className="ml-auto text-[10px] opacity-50">Database</span>
                            </Command.Item>
                        ))}
                        </Command.Group>
                    )}

                    {/* YENİ EKLENEN KISIM: SAYFALAR */}
                    {rootPages && rootPages.length > 0 && (
                        <Command.Group heading="Sayfalar" className="text-xs font-bold text-gray-500 mb-2 px-2 mt-2">
                        {rootPages.map((page: any) => (
                            <Command.Item
                            key={page.id}
                            onSelect={() => runCommand(() => navigate(`/page/${page.id}`))}
                            className="flex items-center gap-2 px-2 py-2 rounded text-sm text-gray-300 hover:bg-[#2C2C2C] hover:text-white cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white transition-colors"
                            >
                            <span className="text-lg leading-none">{page.icon || '📄'}</span>
                            <span>{page.title || "İsimsiz"}</span>
                            <span className="ml-auto text-[10px] opacity-50">Page</span>
                            </Command.Item>
                        ))}
                        </Command.Group>
                    )}
                  </>
              )}

              {/* --- ARAMA SONUÇLARI --- */}
              {query && results.length > 0 && (
                  <Command.Group heading="Arama Sonuçları" className="text-xs font-bold text-gray-500 mb-2 px-2">
                      {results.map((item) => (
                          <Command.Item
                              key={item.id}
                              onSelect={() => runCommand(() => {
                                  if (item.type === 'database') navigate(`/database/${item.id}`)
                                  else navigate(`/page/${item.id}`)
                              })}
                              className="flex items-center gap-2 px-2 py-2 rounded text-sm text-gray-300 hover:bg-[#2C2C2C] hover:text-white cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white transition-colors"
                          >
                              <span className="text-lg leading-none">{item.icon || (item.type === 'database' ? '🗂️' : '📄')}</span>
                              <div className="flex flex-col">
                                  <span>{item.title || "İsimsiz"}</span>
                              </div>
                              
                              <span className="ml-auto text-[10px] opacity-50 flex items-center gap-1">
                                  {item.context === 'Sayfa İçeriği' && <FileText size={10} className="text-yellow-500"/>}
                                  {item.type === 'database' ? 'Veritabanı' : item.context}
                              </span>
                          </Command.Item>
                      ))}
                  </Command.Group>
              )}
              
              {!query && (
                <Command.Group heading="İşlemler" className="text-xs font-bold text-gray-500 mb-2 px-2 mt-2">
                    <Command.Item 
                        disabled 
                        className="flex items-center gap-2 px-2 py-2 rounded text-sm text-gray-500 opacity-50 cursor-not-allowed"
                    >
                    <Plus size={14} />
                    <span>Yeni Sayfa Oluştur (Yakında)</span>
                    </Command.Item>
                </Command.Group>
              )}

            </Command.List>
          </Command>
      </div>
    </div>
  )
}