import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AddPropertyModal from '../components/AddPropertyModal'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
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
  const [pageValues, setPageValues] = useState<Record<string, Record<string, any>>>({})
  
  // Edit state
  const [editingCell, setEditingCell] = useState<{ pageId: string; field: 'title' | 'property'; propertyId?: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  
  // Modal state
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false)
  
  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Handlers
  const handleAddPage = async () => {
    if (!id) return
    try {
      const response = await fetch('http://localhost:8000/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: id, title: 'Untitled' })
      })
      if (response.ok) {
        const newPage = await response.json()
        setPages([...pages, newPage])
      }
    } catch (err) {
      console.error('Failed to create page:', err)
    }
  }

  const handleTitleUpdate = async (pageId: string, newTitle: string) => {
    try {
      const response = await fetch(`http://localhost:8000/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      })
      if (response.ok) {
        setPages(pages.map(p => p.id === pageId ? { ...p, title: newTitle } : p))
        setEditingCell(null)
      }
    } catch (err) {
      console.error('Failed to update title:', err)
    }
  }

  const handlePropertyValueUpdate = async (pageId: string, propertyId: string, value: any) => {
    try {
      const response = await fetch('http://localhost:8000/values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_id: pageId, property_id: propertyId, value })
      })
      if (response.ok) {
        setPageValues({
          ...pageValues,
          [pageId]: { ...pageValues[pageId], [propertyId]: value }
        })
        setEditingCell(null)
      }
    } catch (err) {
      console.error('Failed to update value:', err)
    }
  }

  const handleDeleteSelected = async () => {
    const selectedRowIndices = Object.keys(rowSelection)
    if (selectedRowIndices.length === 0) return
    
    const selectedPages = selectedRowIndices.map(idx => pages[parseInt(idx)])
    if (!confirm(`Delete ${selectedPages.length} page(s)?`)) return

    try {
      await Promise.all(
        selectedPages.map(page => 
          fetch(`http://localhost:8000/pages/${page.id}`, { method: 'DELETE' })
        )
      )
      setPages(pages.filter(p => !selectedPages.find(sp => sp.id === p.id)))
      setRowSelection({})
    } catch (err) {
      console.error('Failed to delete pages:', err)
    }
  }

  // Column Definitions
  const columns = useMemo<ColumnDef<Page>[]>(() => {
    const cols: ColumnDef<Page>[] = [
     // Selection Column - 3 NOKTA MENÜ
      {
        id: 'select',
        header: () => <span className="text-notion-muted">⋯</span>,
        cell: ({ row }) => (
          <div className="group relative flex items-center justify-center">
            <button 
              className="opacity-0 group-hover:opacity-100 text-notion-muted hover:text-white transition-opacity"
              onClick={() => row.toggleSelected()}
            >
              {row.getIsSelected() ? '☑' : '⋯'}
            </button>
          </div>
        ),
        size: 50,
        enableSorting: false,
      },
      // Title Column
      {
        id: 'title',
        accessorKey: 'title',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            📄 Title
            <ArrowUpDown size={14} />
          </button>
        ),
        cell: ({ row, getValue }) => {
          const isEditing = editingCell?.pageId === row.original.id && editingCell?.field === 'title'
          return (
            <div className="flex items-center gap-2">
              {row.original.icon && <span className="text-lg">{row.original.icon}</span>}
              {isEditing ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleTitleUpdate(row.original.id, editValue)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleUpdate(row.original.id, editValue)
                    else if (e.key === 'Escape') setEditingCell(null)
                  }}
                  autoFocus
                  className="flex-1 bg-transparent text-white font-medium outline-none"
                />
              ) : (
                <span 
                  className="text-white font-medium cursor-text hover:bg-notion-hover px-1 -mx-1 rounded"
                  onClick={() => {
                    setEditingCell({ pageId: row.original.id, field: 'title' })
                    setEditValue(getValue() as string)
                  }}
                >
                  {getValue() as string}
                </span>
              )}
            </div>
          )
        },
        size: 300,
      }
    ]

    // Property Columns
    properties.forEach(prop => {
      cols.push({
        id: prop.id,
        accessorFn: (row) => {
          const val = pageValues[row.id]?.[prop.id]
          
          // SORTING FIX: Select için option name'e göre sırala
          if (prop.type === 'select' && val?.option_id) {
            const config = prop.config ? JSON.parse(prop.config) : null
            const option = config?.options?.find((o: any) => o.id === val.option_id)
            return option?.name || ''
          }
          
          if (prop.type === 'text') return val?.text || ''
          if (prop.type === 'number') return val?.number || 0
          if (prop.type === 'checkbox') return val?.checked ? 1 : 0
          if (prop.type === 'date') return val?.date || ''
          
          return ''
        },
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center justify-between w-full hover:text-white transition-colors"
          >
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold">{prop.name}</span>
              <span className="text-xs text-notion-muted">{prop.type}</span>
            </div>
            <ArrowUpDown size={14} />
          </button>
        ),
        cell: ({ row }) => {
          const value = pageValues[row.original.id]?.[prop.id]
          const isEditing = editingCell?.pageId === row.original.id && 
                           editingCell?.field === 'property' && 
                           editingCell?.propertyId === prop.id

          // Render cell based on type
          if (prop.type === 'select') {
            return isEditing ? (
              <select
                value={value?.option_id || ''}
                onChange={(e) => handlePropertyValueUpdate(row.original.id, prop.id, { option_id: e.target.value })}
                onBlur={() => setEditingCell(null)}
                autoFocus
                className="w-full bg-notion-bg text-white border border-notion-border rounded px-2 py-1 text-sm outline-none"
              >
                <option value="">Empty</option>
                {prop.config && JSON.parse(prop.config).options?.map((opt: any) => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            ) : (
              <div 
                onClick={() => setEditingCell({ pageId: row.original.id, field: 'property', propertyId: prop.id })}
                className="cursor-pointer hover:bg-notion-hover px-1 -mx-1 rounded min-h-[24px] flex items-center"
              >
                {value?.option_id ? (() => {
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
                  return <span className={`px-2 py-1 rounded text-xs ${colorMap[option?.color] || colorMap.gray}`}>{option?.name || value.option_id}</span>
                })() : <span className="text-notion-muted text-sm italic">Empty</span>}
              </div>
            )
          }

          if (prop.type === 'text') {
            return isEditing ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handlePropertyValueUpdate(row.original.id, prop.id, { text: editValue })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handlePropertyValueUpdate(row.original.id, prop.id, { text: editValue })
                  else if (e.key === 'Escape') setEditingCell(null)
                }}
                autoFocus
                className="w-full bg-transparent text-white text-sm outline-none"
              />
            ) : (
              <div
                onClick={() => {
                  setEditingCell({ pageId: row.original.id, field: 'property', propertyId: prop.id })
                  setEditValue(value?.text || '')
                }}
                className="cursor-text hover:bg-notion-hover px-1 -mx-1 rounded min-h-[24px]"
              >
                {value?.text ? <span className="text-white text-sm">{value.text}</span> : <span className="text-notion-muted text-sm italic">Empty</span>}
              </div>
            )
          }

          if (prop.type === 'number') {
            return isEditing ? (
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handlePropertyValueUpdate(row.original.id, prop.id, { number: parseFloat(editValue) || 0 })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handlePropertyValueUpdate(row.original.id, prop.id, { number: parseFloat(editValue) || 0 })
                  else if (e.key === 'Escape') setEditingCell(null)
                }}
                autoFocus
                className="w-full bg-transparent text-white text-sm outline-none"
              />
            ) : (
              <div
                onClick={() => {
                  setEditingCell({ pageId: row.original.id, field: 'property', propertyId: prop.id })
                  setEditValue(value?.number?.toString() || '')
                }}
                className="cursor-text hover:bg-notion-hover px-1 -mx-1 rounded min-h-[24px]"
              >
                {value?.number !== undefined ? <span className="text-white text-sm">{value.number}</span> : <span className="text-notion-muted text-sm italic">Empty</span>}
              </div>
            )
          }

          if (prop.type === 'checkbox') {
            return (
              <div className="flex items-center justify-center min-h-[24px]">
                <input
                  type="checkbox"
                  checked={value?.checked || false}
                  onChange={() => handlePropertyValueUpdate(row.original.id, prop.id, { checked: !value?.checked })}
                  className="w-5 h-5 cursor-pointer accent-blue-500"
                />
              </div>
            )
          }

          if (prop.type === 'date') {
            return isEditing ? (
              <input
                type="date"
                value={value?.date || ''}
                onChange={(e) => handlePropertyValueUpdate(row.original.id, prop.id, { date: e.target.value })}
                onBlur={() => setEditingCell(null)}
                autoFocus
                className="w-full bg-notion-bg text-white border border-notion-border rounded px-2 py-1 text-sm outline-none"
              />
            ) : (
              <div
                onClick={() => setEditingCell({ pageId: row.original.id, field: 'property', propertyId: prop.id })}
                className="cursor-pointer hover:bg-notion-hover px-1 -mx-1 rounded min-h-[24px] flex items-center"
              >
                {value?.date ? (
                  <span className="text-white text-sm">
                    {new Date(value.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                ) : (
                  <span className="text-notion-muted text-sm italic">Empty</span>
                )}
              </div>
            )
          }

          if (prop.type === 'multi_select') {
            return isEditing ? (
              <select
                onChange={(e) => {
                  const selectedIds = value?.option_ids || []
                  if (e.target.value && !selectedIds.includes(e.target.value)) {
                    handlePropertyValueUpdate(row.original.id, prop.id, { option_ids: [...selectedIds, e.target.value] })
                  }
                }}
                onBlur={() => setEditingCell(null)}
                autoFocus
                className="w-full bg-notion-bg text-white border border-notion-border rounded px-2 py-1 text-sm outline-none"
              >
                <option value="">Add option...</option>
                {prop.config && JSON.parse(prop.config).options?.map((opt: any) => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            ) : (
              <div
                onClick={() => setEditingCell({ pageId: row.original.id, field: 'property', propertyId: prop.id })}
                className="cursor-pointer hover:bg-notion-hover px-1 -mx-1 rounded min-h-[24px] flex items-center gap-1 flex-wrap"
              >
                {value?.option_ids && value.option_ids.length > 0 ? (() => {
                  const config = prop.config ? JSON.parse(prop.config) : null
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
                  return value.option_ids.map((optId: string) => {
                    const option = config?.options?.find((o: any) => o.id === optId)
                    if (!option) return null
                    return (
                      <span 
                        key={optId}
                        className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${colorMap[option.color] || colorMap.gray}`}
                      >
                        {option.name}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePropertyValueUpdate(row.original.id, prop.id, {
                              option_ids: value.option_ids.filter((id: string) => id !== optId)
                            })
                          }}
                          className="hover:text-white"
                        >
                          ×
                        </button>
                      </span>
                    )
                  })
                })() : <span className="text-notion-muted text-sm italic">Empty</span>}
              </div>
            )
          }

          return <span className="text-notion-muted text-sm italic">Empty</span>
        },
        size: 200,
        enableSorting: true,
      })
    })

    return cols
  }, [properties, pageValues, editingCell, editValue])

  // Create Table Instance
  const table = useReactTable({
    data: pages,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // Fetch data
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
        
        const valuesMap: Record<string, Record<string, any>> = {}
        for (const page of pagesData) {
          const valuesResponse = await fetch(`http://localhost:8000/pages/${page.id}/values`)
          const values = await valuesResponse.json()
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

  const selectedCount = Object.keys(rowSelection).length

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
        <div className="flex items-center gap-3 mb-4">
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

        {/* Selection Toolbar */}
        {selectedCount > 0 && (
          <div className="mb-4 px-4 py-2 bg-blue-600 bg-opacity-20 border border-blue-500 rounded flex items-center justify-between">
            <span className="text-blue-400 font-medium">{selectedCount} selected</span>
            <button
              onClick={handleDeleteSelected}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm transition-colors"
            >
              Delete Selected
            </button>
          </div>
        )}

        {/* TABLE */}
        <div className="border border-notion-border rounded-lg overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-notion-bg border-b border-notion-border">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        style={{ width: header.column.getSize() }}
                        className="px-4 py-3 text-left border-r border-notion-border last:border-r-0"
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-notion-panel">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-12 text-center text-notion-muted">
                      No pages yet. Click "+ Add Page" to create your first row.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr
                      key={row.id}
                      className="border-b border-notion-border last:border-b-0 hover:bg-notion-hover transition-colors"
                    >
                      {row.getVisibleCells().map(cell => (
                        <td
                          key={cell.id}
                          style={{ width: cell.column.getSize() }}
                          className="px-4 py-3 border-r border-notion-border last:border-r-0"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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