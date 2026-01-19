import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import { useDatabases, useCreateDatabase } from '../hooks/useDatabases'
import toast from 'react-hot-toast' // <-- 1. IMPORT

export default function HomePage() {
  const navigate = useNavigate()
  
  const { data: databases, isLoading, isError } = useDatabases()
  const createDatabaseMutation = useCreateDatabase()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newDbTitle, setNewDbTitle] = useState("")

  const handleSubmit = async () => {
    // 2. GÜVENLİK VE BİLDİRİM
    if (!newDbTitle.trim()) {
        toast.error("Veritabanı ismi boş olamaz")
        return
    }
    
    createDatabaseMutation.mutate(newDbTitle, {
      onSuccess: () => {
        setIsModalOpen(false)
        setNewDbTitle("")
        
        // 3. SENKRONİZASYON (Sidebar'ı güncelle)
        window.dispatchEvent(new Event('sidebar-update'))
      },
      // Not: Toast mesajı useCreateDatabase içinde zaten veriliyor
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#191919] text-gray-500">
        Yükleniyor...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#191919] text-red-500">
        Veriler yüklenirken bir hata oluştu.
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 text-white bg-[#191919]">
      <div className="max-w-4xl mx-auto">
        {/* BAŞLIK VE BUTON */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">📚 Veritabanlarım</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors shadow-lg shadow-blue-900/20"
          >
            + Yeni Veritabanı Oluştur
          </button>
        </div>
        
        {/* LİSTELEME */}
        {databases?.length === 0 ? (
          <div className="text-gray-500 text-center py-12 border border-dashed border-[#373737] rounded-lg bg-[#202020]">
            Henüz hiç veritabanın yok. <br/>
            Yukarıdaki butona basarak ilkini oluştur!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {databases?.map((db: any) => (
              <div
                key={db.id}
                onClick={() => navigate(`/database/${db.id}`)}
                className="bg-[#202020] border border-[#373737] rounded-lg p-4 hover:bg-[#2C2C2C] hover:border-blue-500/50 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{db.icon || '📁'}</span>
                  <div>
                    <h2 className="text-lg font-medium text-white group-hover:text-blue-400 transition-colors">
                      {db.title}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">ID: {db.id.slice(0, 8)}...</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Veritabanı Oluştur"
        footer={
          <>
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-[#373737] rounded transition-colors"
            >
              İptal
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={createDatabaseMutation.isPending}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors font-medium disabled:opacity-50"
            >
              {createDatabaseMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
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
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Örn: Müşteri Listesi, Görevler..."
            className="w-full bg-[#151515] border border-[#373737] rounded px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </Modal>
    </div>
  )
}