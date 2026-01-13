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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-notion-muted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white">
          📚 My Databases
        </h1>
        
        {databases.length === 0 ? (
          <div className="text-notion-muted">No databases yet</div>
        ) : (
          <div className="space-y-4">
            {databases.map(db => (
              <div
                key={db.id}
                onClick={() => navigate(`/database/${db.id}`)}
                className="bg-notion-panel border border-notion-border rounded-lg p-4 hover:bg-notion-hover transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{db.icon || '📄'}</span>
                  <div>
                    <h2 className="text-lg font-medium text-white">
                      {db.title}
                    </h2>
                    <p className="text-sm text-notion-muted">
                      Created: {new Date(db.created_at * 1000).toLocaleDateString()}
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