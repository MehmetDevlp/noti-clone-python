import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AddPropertyModal from '../components/AddPropertyModal'

interface Database {
  id: string
  title: string
  icon: string | null
}

interface Property {
  id: string
  name: string
  type: string
  config: string | null
  order_index: number
  visible: boolean
}

interface Page {
  id: string
  title: string
  icon: string | null
  created_at: number
}

export default function DatabasePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [database, setDatabase] = useState<Database | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
   // YENİ: Add Page fonksiyonu
  const handleAddPage = async () => {
    if (!id) return

    try {
      const response = await fetch('http://localhost:8000/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id: id,
          title: 'Untitled',
        })
      })

      if (response.ok) {
        const newPage = await response.json()
        setPages([...pages, newPage])
      }
    } catch (err) {
      console.error('Failed to create page:', err)
    }
  }  
  const [pageValues, setPageValues] = useState<Record<string, Record<string, any>>>({})
  
  // YENİ: Edit state
  const [editingCell, setEditingCell] = useState<{ pageId: string; field: 'title' | 'property'; propertyId?: string } | null>(null)
  const [editValue, setEditValue] = useState('')
 // YENİ: Modal state
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false)
  // YENİ: Title update fonksiyonu
  const handleTitleUpdate = async (pageId: string, newTitle: string) => {
    try {
      const response = await fetch(`http://localhost:8000/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      })

      if (response.ok) {
        // Update local state
        setPages(pages.map(p => 
          p.id === pageId ? { ...p, title: newTitle } : p
        ))
        setEditingCell(null)
      }
    } catch (err) {
      console.error('Failed to update title:', err)
    }
  }
// YENİ: Property value update
  const handlePropertyValueUpdate = async (pageId: string, propertyId: string, value: any) => {
    try {
      const response = await fetch('http://localhost:8000/values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id: pageId,
          property_id: propertyId,
          value: value
        })
      })

      if (response.ok) {
        // Update local state
        setPageValues({
          ...pageValues,
          [pageId]: {
            ...pageValues[pageId],
            [propertyId]: value
          }
        })
        setEditingCell(null)
      }
    } catch (err) {
      console.error('Failed to update value:', err)
    }
  }
  useEffect(() => {
    if (!id) return

    Promise.all([
      fetch(`http://localhost:8000/databases/${id}`).then(r => r.json()),
      fetch(`http://localhost:8000/databases/${id}/properties`).then(r => r.json()),
      fetch(`http://localhost:8000/databases/${id}/pages`).then(r => r.json()),
    ])
      .then(async ([dbData, propsData, pagesData]) => {
        setDatabase(dbData)
        setProperties(propsData)
        setPages(pagesData)
        
        // YENİ: Her page için values'ı çek
        const valuesMap: Record<string, Record<string, any>> = {}
        
        for (const page of pagesData) {
          const valuesResponse = await fetch(`http://localhost:8000/pages/${page.id}/values`)
          const values = await valuesResponse.json()
          
          // Values'ı property_id ile map et
          valuesMap[page.id] = {}
          values.forEach((v: any) => {
            if (v.value) {
              valuesMap[page.id][v.property_id] = JSON.parse(v.value)
            }
          })
        }
        
        setPageValues(valuesMap)
        setLoading(false)
      })
      .catch(err => {
        console.error('API Error:', err)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-notion-muted">Loading database...</div>
      </div>
    )
  }

  if (!database) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Database not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <button
        onClick={() => navigate('/')}
        className="mb-4 px-3 py-1 bg-notion-panel border border-notion-border rounded hover:bg-notion-hover transition-colors text-notion-muted hover:text-white"
      >
        ← Back to databases
      </button>
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-4xl">{database.icon || '📄'}</span>
          <h1 className="text-3xl font-bold text-white">
            {database.title}
          </h1>
          <button
            onClick={() => setShowAddPropertyModal(true)}
            className="ml-auto px-3 py-1 bg-notion-panel border border-notion-border rounded hover:bg-notion-hover transition-colors text-white text-sm"
          >
            + Add Property
          </button>
        </div>

        {/* TABLE VIEW */}
        <div className="bg-notion-panel border border-notion-border rounded-lg overflow-hidden mb-4">
          {/* Table Header */}
          <div className="border-b border-notion-border bg-notion-bg">
            <div className="flex">
              {/* Title Column */}
              <div className="w-64 px-4 py-3 border-r border-notion-border">
                <span className="text-sm font-semibold text-white">
                  📄 Title
                </span>
              </div>
              
              {/* Property Columns */}
              {properties.map(prop => (
                <div
                  key={prop.id}
                  className="flex-1 min-w-[200px] px-4 py-3 border-r border-notion-border last:border-r-0"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">
                      {prop.name}
                    </span>
                    <span className="text-xs text-notion-muted">
                      {prop.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table Body */}
          <div>
            {pages.length === 0 ? (
              <div className="px-4 py-12 text-center text-notion-muted">
                No pages yet. Click "+ Add Page" to create your first row.
              </div>
            ) : (
              pages.map(page => (
                <div
                  key={page.id}
                  className="flex border-b border-notion-border last:border-b-0 hover:bg-notion-hover transition-colors"
                >
                  {/* Title Cell */}
                  <div className="w-64 px-4 py-3 border-r border-notion-border">
                    <div className="flex items-center gap-2">
                      {page.icon && <span className="text-lg">{page.icon}</span>}
                      
                      {editingCell?.pageId === page.id && editingCell?.field === 'title' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleTitleUpdate(page.id, editValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleTitleUpdate(page.id, editValue)
                            } else if (e.key === 'Escape') {
                              setEditingCell(null)
                            }
                          }}
                          autoFocus
                          className="flex-1 bg-transparent text-white font-medium outline-none"
                        />
                      ) : (
                        <span 
                          className="text-white font-medium cursor-text hover:bg-notion-hover px-1 -mx-1 rounded"
                          onClick={() => {
                            setEditingCell({ pageId: page.id, field: 'title' })
                            setEditValue(page.title)
                          }}
                        >
                          {page.title}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Property Cells */}
                  {properties.map(prop => {
                    const value = pageValues[page.id]?.[prop.id]
                    const isEditing = editingCell?.pageId === page.id && 
                                     editingCell?.field === 'property' && 
                                     editingCell?.propertyId === prop.id
                    
                    return (
                      <div
                        key={prop.id}
                        className="flex-1 min-w-[200px] px-4 py-3 border-r border-notion-border last:border-r-0"
                      >
                        {prop.type === 'select' ? (
                          isEditing ? (
                            <select
                              value={value?.option_id || ''}
                              onChange={(e) => {
                                handlePropertyValueUpdate(page.id, prop.id, {
                                  option_id: e.target.value
                                })
                              }}
                              onBlur={() => setEditingCell(null)}
                              autoFocus
                              className="bg-notion-panel text-white border border-notion-border rounded px-2 py-1 text-sm outline-none"
                            >
                              <option value="">Empty</option>
                              {prop.config && JSON.parse(prop.config).options?.map((opt: any) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div 
                              onClick={() => {
                                setEditingCell({ 
                                  pageId: page.id, 
                                  field: 'property', 
                                  propertyId: prop.id 
                                })
                              }}
                              className="cursor-pointer hover:bg-notion-hover px-1 -mx-1 rounded"
                            >
                              {value?.option_id ? (
                                (() => {
                                  const config = prop.config ? JSON.parse(prop.config) : null
                                  const option = config?.options?.find((o: any) => o.id === value.option_id)
                                  const colorMap: Record<string, string> = {
                                    gray: 'bg-gray-500 bg-opacity-20 text-gray-400',
                                    blue: 'bg-blue-500 bg-opacity-20 text-blue-400',
                                    green: 'bg-green-500 bg-opacity-20 text-green-400',
                                    red: 'bg-red-500 bg-opacity-20 text-red-400',
                                    yellow: 'bg-yellow-500 bg-opacity-20 text-yellow-400',
                                    purple: 'bg-purple-500 bg-opacity-20 text-purple-400',
                                    pink: 'bg-pink-500 bg-opacity-20 text-pink-400',
                                    orange: 'bg-orange-500 bg-opacity-20 text-orange-400',
                                    brown: 'bg-amber-700 bg-opacity-20 text-amber-400',
                                  }
                                  
                                  return (
                                    <span className={`px-2 py-1 rounded text-xs ${colorMap[option?.color] || colorMap.gray}`}>
                                      {option?.name || value.option_id}
                                    </span>
                                  )
                                })()
                              ) : (
                                <span className="text-notion-muted text-sm italic">
                                  Empty
                                </span>
                              )}
                            </div>
                          )
                        ) : (
                          <span className="text-notion-muted text-sm italic">
                            Empty
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Page Button */}
        <button 
          onClick={handleAddPage}
          className="px-4 py-2 bg-notion-panel border border-notion-border rounded hover:bg-notion-hover transition-colors text-white text-sm font-medium"
        >
          + Add Page
        </button>
      {/* Add Property Modal */}
        {showAddPropertyModal && (
          <AddPropertyModal
            databaseId={id!}
            onClose={() => setShowAddPropertyModal(false)}
            onSuccess={(newProperty) => {
              setProperties([...properties, newProperty])
            }}
          />
        )}
      </div>
    </div>
  )
}