import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { Search, Home, Plus } from 'lucide-react'
import { useDatabases } from '../hooks/useDatabases'
import { useCommandStore } from '../store/useCommandStore' // YENİ: Store importu

export default function CommandMenu() {
  const navigate = useNavigate()
  const { data: databases } = useDatabases()
  
  // YENİ: State'i zustand'dan çekiyoruz
  const { isOpen, setOpen, toggle } = useCommandStore()

  // --- KLAVYE DİNLEYİCİSİ ---
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Açma/Kapama: Ctrl+K veya Cmd+K
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle() // Store'daki toggle fonksiyonunu kullan
      }
      
      // ESC ile kapat
      if (e.key === 'Escape') {
          setOpen(false)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [toggle, setOpen]) // Dependency array güncellendi

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
            className="w-full bg-[#191919] border border-[#373737] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            label="Global Command Menu"
          >
            {/* ... (Geri kalan kısım tamamen aynı) ... */}
            <div className="flex items-center border-b border-[#373737] px-3">
              <Search className="w-4 h-4 text-gray-500 mr-2" />
              <Command.Input 
                autoFocus
                placeholder="Ne aramıştınız? (Sayfalar, Veritabanları...)"
                className="w-full bg-transparent p-4 text-white outline-none placeholder:text-gray-500 text-sm"
              />
              <div className="flex gap-1">
                <kbd className="bg-[#2C2C2C] text-gray-400 text-[10px] px-1.5 py-0.5 rounded border border-[#373737]">ESC</kbd>
              </div>
            </div>

            <Command.List className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
              <Command.Empty className="py-6 text-center text-sm text-gray-500">
                Sonuç bulunamadı.
              </Command.Empty>

              <Command.Group heading="Genel" className="text-xs font-bold text-gray-500 mb-2 px-2">
                <Command.Item 
                    onSelect={() => runCommand(() => navigate('/'))}
                    className="flex items-center gap-2 px-2 py-2 rounded text-sm text-gray-300 hover:bg-[#2C2C2C] hover:text-white cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white transition-colors"
                >
                  <Home size={14} />
                  <span>Ana Sayfa</span>
                </Command.Item>
              </Command.Group>

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
              
              <Command.Group heading="İşlemler" className="text-xs font-bold text-gray-500 mb-2 px-2 mt-2">
                <Command.Item 
                    disabled 
                    className="flex items-center gap-2 px-2 py-2 rounded text-sm text-gray-500 opacity-50 cursor-not-allowed"
                >
                  <Plus size={14} />
                  <span>Yeni Sayfa Oluştur (Yakında)</span>
                </Command.Item>
              </Command.Group>

            </Command.List>
          </Command>
      </div>
    </div>
  )
}