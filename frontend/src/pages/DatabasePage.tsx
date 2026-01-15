import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AddPropertyModal from '../components/AddPropertyModal'
import InlineFilter from '../components/InlineFilter'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import RowActionsMenu from '../components/RowActionsMenu'

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

interface FilterRule {
  id: string
  propertyId: string
  operator: string
  value: string
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
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  
  // Inline filters
  const [filters, setFilters] = useState<FilterRule[]>([])

  // Handlers
  const handleAddPage = async () => {
    if (!id) return
    try {
      const response = await fetch('http://localhost:8000/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: id, title: 'Başlıksız' })
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
    if (!confirm(`${selectedPages.length} sayfa silinsin mi?`)) return

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

  // Apply filters to pages
  const filteredPages = useMemo(() => {
    if (filters.length === 0) return pages

    return pages.filter(page => {
      return filters.every(filter => {
        const value = pageValues[page.id]?.[filter.propertyId]
        const property = properties.find(p => p.id === filter.propertyId)

        if (!property) return true

        // Boş değer kontrolü - değer girilmemişse skip et
        const needsValue = !['is_empty', 'is_not_empty', 'is_checked', 'is_not_checked'].includes(filter.operator)
        if (needsValue && !filter.value) return true

        switch (filter.operator) {
          case 'is_empty':
            return !value || (typeof value === 'object' && Object.keys(value).length === 0)
          
          case 'is_not_empty':
            return value && (typeof value !== 'object' || Object.keys(value).length > 0)
          
          case 'is_checked':
            return value?.checked === true
          
          case 'is_not_checked':
            return value?.checked !== true
          
          case 'contains':
            return value?.text?.toLowerCase().includes(filter.value.toLowerCase())
          
          case 'not_contains':
            return !value?.text?.toLowerCase().includes(filter.value.toLowerCase())
          
          case 'is':
            if (property.type === 'text') return value?.text === filter.value
            if (property.type === 'select') return value?.option_id === filter.value
            if (property.type === 'date') return value?.date === filter.value
            return false
          
          case 'is_not':
            if (property.type === 'text') return value?.text !== filter.value
            if (property.type === 'select') return value?.option_id !== filter.value
            return false
          
          case 'equals':
            return value?.number === parseFloat(filter.value)
          
          case 'not_equals':
            return value?.number !== parseFloat(filter.value)
          
          case 'greater_than':
            return value?.number > parseFloat(filter.value)
          
          case 'less_than':
            return value?.number < parseFloat(filter.value)
          
          case 'is_before':
            return value?.date && new Date(value.date) < new Date(filter.value)
          
          case 'is_after':
            return value?.date && new Date(value.date) > new Date(filter.value)
          
          default:
            return true
        }
      })
    })
  }, [pages, pageValues, filters, properties])

  // Column Definitions
  const columns = useMemo<ColumnDef<Page>[]>(() => {
    const cols: ColumnDef<Page>[] = [
      // Selection Column
      {
        id: 'select',
        header: () => null,
        cell: ({ row }) => (
          <RowActionsMenu
            isSelected={row.getIsSelected()}
            onToggleSelect={() => row.toggleSelected()}
            onDelete={async () => {
              if (!confirm('Bu sayfayı silmek istediğinize emin misiniz?')) return
              try {
                await fetch(`http://localhost:8000/pages/${row.original.id}`, { method: 'DELETE' })
                setPages(pages.filter(p => p.id !== row.original.id))
              } catch (err) {
                console.error('Failed to delete page:', err)
              }
            }}
          />
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
            📄 Başlık
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

          if (prop.type === 'select') {
            return isEditing ? (
              <select
                value={value?.option_id || ''}
                onChange={(e) => handlePropertyValueUpdate(row.original.id, prop.id, { option_id: e.target.value })}
                onBlur={() => setEditingCell(null)}
                autoFocus
                className="w-full bg-notion-bg text-white border border-notion-border rounded px-2 py-1 text-sm outline-none"
              >
                <option value="">Boş</option>
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
                })() : <span className="text-notion-muted text-sm italic">Boş</span>}
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
                {value?.text ? <span className="text-white text-sm">{value.text}</span> : <span className="text-notion-muted text-sm italic">Boş</span>}
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
                {value?.number !== undefined ? <span className="text-white text-sm">{value.number}</span> : <span className="text-notion-muted text-sm italic">Boş</span>}
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
                  <span className="text-notion-muted text-sm italic">Boş</span>
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
                <option value="">Seçenek ekle...</option>
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
                })() : <span className="text-notion-muted text-sm italic">Boş</span>}
              </div>
            )
          }

          return <span className="text-notion-muted text-sm italic">Boş</span>
        },
        size: 200,
        enableSorting: true,
      })
    })

    return cols
  }, [properties, pageValues, editingCell, editValue, pages])

  // Create Table Instance
  const table = useReactTable({
    data: filteredPages,
    columns,
    state: {
      sorting,
      rowSelection,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
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
        <div className="text-notion-muted">Yükleniyor...</div>
      </div>
    )
  }

  if (!database) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Veritabanı bulunamadı</div>
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
        ← Veritabanlarına Dön
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
            + Özellik Ekle
          </button>
        </div>

        {/* Toolbar: Search + Filter + Column Visibility */}
        <div className="mb-4 flex items-center gap-3">
          {/* Global Search */}
          <div className="w-80">
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Ara..."
              className="w-full px-4 py-2 bg-notion-panel border border-notion-border rounded-lg text-white placeholder-notion-muted outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Inline Filter */}
          <InlineFilter
            properties={properties}
            filters={filters}
            onFiltersChange={setFilters}
          />

          {/* Column Visibility Dropdown */}
          <div className="relative group">
            <button className="px-4 py-2 bg-notion-panel border border-notion-border rounded-lg text-white hover:bg-notion-hover transition-colors flex items-center gap-2">
              <span>Sütunlar</span>
              <span className="text-xs">▼</span>
            </button>
            
            <div className="absolute right-0 top-12 w-56 bg-notion-panel border border-notion-border rounded-lg shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="px-3 py-1 text-xs text-notion-muted font-semibold">Görünür Sütunlar</div>
              <div className="border-t border-notion-border my-1" />
              {table.getAllLeafColumns().filter(col => col.id !== 'select').map(column => {
                const columnName = column.id === 'title' 
                  ? 'Başlık' 
                  : properties.find(p => p.id === column.id)?.name || column.id
                
                return (
                  <label
                    key={column.id}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-notion-hover cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                      className="w-4 h-4 cursor-pointer accent-blue-500"
                    />
                    <span className="text-sm text-white">{columnName}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        {/* Selection Toolbar */}
        {selectedCount > 0 && (
          <div className="mb-4 px-4 py-2 bg-blue-600 bg-opacity-20 border border-blue-500 rounded flex items-center justify-between">
            <span className="text-blue-400 font-medium">{selectedCount} seçildi</span>
            <button
              onClick={handleDeleteSelected}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm transition-colors"
            >
              Seçilenleri Sil
            </button>
          </div>
        )}

        {/* TABLE */}
        <div className="border border-notion-border rounded-lg mb-4">
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
                      {filters.length > 0 
                        ? 'Filtre kriterlerine uyan sayfa bulunamadı.'
                        : 'Henüz sayfa yok. İlk sayfayı oluşturmak için "+ Yeni Sayfa" butonuna tıklayın.'
                      }
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr
                      key={row.id}
                      className="border-b border-notion-border last:border-b-0 hover:bg-notion-hover transition-colors group"
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

        {/* Sonuçlar */}
        <div className="mb-4 text-sm text-notion-muted">
          {table.getFilteredRowModel().rows.length} / {pages.length} sayfa gösteriliyor
          {filters.length > 0 && (
            <span className="ml-2 text-blue-400">({filters.length} filtre aktif)</span>
          )}
        </div>

        {/* Add Page Button */}
        <button 
          onClick={handleAddPage}
          className="px-4 py-2 bg-notion-panel border border-notion-border rounded hover:bg-notion-hover transition-colors text-white text-sm font-medium"
        >
          + Yeni Sayfa
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