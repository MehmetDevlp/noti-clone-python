import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

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

  const handleCreateDatabase = async () => {
    // Kullanıcıya isim sor
    const title = prompt("Veritabanı ismi ne olsun?", "Yeni Veritabanı")
    if (!title) return

    try {
      const response = await fetch('http://localhost:8000/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: title,
          icon: "📁" // Varsayılan ikon
        })
      })

      if (response.ok) {
        const newDb = await response.json()
        setDatabases([...databases, newDb])
        // İstersek direkt oluşturulan sayfaya yönlendirebiliriz:
        // navigate(`/database/${newDb.id}`)
      }
    } catch (err) {
      console.error('Veritabanı oluşturulamadı:', err)
      alert('Hata oluştu, konsola bak.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-notion-muted">Yükleniyor...</div>
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
          
          {/* İŞTE EKSİK OLAN BUTON BURADA */}
          <button
            onClick={handleCreateDatabase}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors"
          >
            + Yeni Veritabanı Oluştur
          </button>
        </div>
        
        {databases.length === 0 ? (
          <div className="text-notion-muted text-center py-12 border border-dashed border-notion-border rounded-lg">
            Henüz hiç veritabanın yok. <br/>
            Yukarıdaki butona basarak ilkini oluştur!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {databases.map(db => (
              <div
                key={db.id}
                onClick={() => navigate(`/database/${db.id}`)}
                className="bg-notion-panel border border-notion-border rounded-lg p-4 hover:bg-notion-hover transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{db.icon || '📁'}</span>
                  <div>
                    <h2 className="text-lg font-medium text-white group-hover:text-blue-400 transition-colors">
                      {db.title}
                    </h2>
                    <p className="text-xs text-notion-muted mt-1">
                      Oluşturulma: {new Date(db.created_at * 1000).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}