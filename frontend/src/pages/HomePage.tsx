import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal' // YENİ: Modal'ı import ettik

interface Database {
  id: string
  title: string
  icon: string | null
  created_at: number
}

export default function HomePage() {
  const [databases, setDatabases] = useState<Database[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // --- MODAL STATE'LERİ ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newDbTitle, setNewDbTitle] = useState("")

  useEffect(() => {
    fetch('http://localhost:8000/databases')
      .then(res => res.json())
      .then(data => {
        setDatabases(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('API Error:', err)
        setLoading(false)
      })
  }, [])

  // YENİ: Veritabanı Kaydetme Fonksiyonu (Modal'dan tetiklenir)
  const submitCreateDatabase = async () => {
    if (!newDbTitle.trim()) return

    try {
      const response = await fetch('http://localhost:8000/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newDbTitle,
          icon: "📁" 
        })
      })

      if (response.ok) {
        const newDb = await response.json()
        setDatabases([...databases, newDb])
        
        // Modalı kapat ve temizle
        setIsModalOpen(false)
        setNewDbTitle("")
        
        // İstersen direkt yönlendir:
        // navigate(`/database/${newDb.id}`)
      }
    } catch (err) {
      console.error('Veritabanı oluşturulamadı:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            📚 Veritabanlarım
          </h1>
          
          {/* BUTON GÜNCELLENDİ: Artık Modalı açıyor */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors shadow-lg shadow-blue-900/20"
          >
            + Yeni Veritabanı Oluştur
          </button>
        </div>
        
        {databases.length === 0 ? (
          <div className="text-gray-500 text-center py-12 border border-dashed border-[#373737] rounded-lg bg-[#202020]">
            Henüz hiç veritabanın yok. <br/>
            Yukarıdaki butona basarak ilkini oluştur!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {databases.map(db => (
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
                    <p className="text-xs text-gray-500 mt-1">
                      Oluşturulma: {new Date(db.created_at * 1000).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- YENİ VERİTABANI OLUŞTURMA MODALI --- */}
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
              onClick={submitCreateDatabase} 
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors font-medium"
            >
              Oluştur
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
            onKeyDown={(e) => e.key === 'Enter' && submitCreateDatabase()}
            placeholder="Örn: Projeler, Görevler..."
            className="w-full bg-[#151515] border border-[#373737] rounded px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </Modal>
    </div>
  )
}