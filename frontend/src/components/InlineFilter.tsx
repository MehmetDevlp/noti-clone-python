import { useState } from 'react'
import { X, Plus, Filter } from 'lucide-react'

interface Property {
  id: string
  name: string
  type: string
  config: string | null
}

interface FilterRule {
  id: string
  propertyId: string
  operator: string
  value: string
}

interface InlineFilterProps {
  properties: Property[]
  filters: FilterRule[]
  onFiltersChange: (filters: FilterRule[]) => void
}

export default function InlineFilter({ properties, filters, onFiltersChange }: InlineFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)

  const addFilter = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId)
    const defaultOperator = getDefaultOperator(property?.type || 'text')
    
    onFiltersChange([...filters, {
      id: `filter-${Date.now()}`,
      propertyId,
      operator: defaultOperator,
      value: ''
    }])
    setShowAddMenu(false)
  }

  const removeFilter = (filterId: string) => {
    onFiltersChange(filters.filter(f => f.id !== filterId))
  }

  const updateFilter = (filterId: string, updates: Partial<FilterRule>) => {
    onFiltersChange(filters.map(f => f.id === filterId ? { ...f, ...updates } : f))
  }

  const getDefaultOperator = (type: string) => {
    switch (type) {
      case 'text': return 'contains'
      case 'number': return 'equals'
      case 'select': return 'is'
      case 'multi_select': return 'contains'
      case 'checkbox': return 'is_checked'
      case 'date': return 'is'
      default: return 'contains'
    }
  }

  const getOperators = (type: string) => {
    switch (type) {
      case 'text':
        return [
          { value: 'contains', label: 'içerir' },
          { value: 'not_contains', label: 'içermez' },
          { value: 'is', label: 'eşittir' },
          { value: 'is_not', label: 'eşit değil' },
          { value: 'is_empty', label: 'boş' },
          { value: 'is_not_empty', label: 'boş değil' }
        ]
      case 'number':
        return [
          { value: 'equals', label: '=' },
          { value: 'not_equals', label: '≠' },
          { value: 'greater_than', label: '>' },
          { value: 'less_than', label: '<' },
          { value: 'is_empty', label: 'boş' },
          { value: 'is_not_empty', label: 'boş değil' }
        ]
      case 'select':
      case 'multi_select':
        return [
          { value: 'is', label: 'eşittir' },
          { value: 'is_not', label: 'eşit değil' },
          { value: 'is_empty', label: 'boş' },
          { value: 'is_not_empty', label: 'boş değil' }
        ]
      case 'checkbox':
        return [
          { value: 'is_checked', label: 'işaretli' },
          { value: 'is_not_checked', label: 'işaretli değil' }
        ]
      case 'date':
        return [
          { value: 'is', label: 'eşittir' },
          { value: 'is_before', label: 'öncesi' },
          { value: 'is_after', label: 'sonrası' },
          { value: 'is_empty', label: 'boş' },
          { value: 'is_not_empty', label: 'boş değil' }
        ]
      default:
        return [{ value: 'contains', label: 'içerir' }]
    }
  }

  const needsValue = (operator: string) => {
    return !['is_empty', 'is_not_empty', 'is_checked', 'is_not_checked'].includes(operator)
  }

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
          filters.length > 0
            ? 'bg-blue-600 bg-opacity-20 border border-blue-500 text-blue-400'
            : 'bg-notion-panel border border-notion-border text-notion-muted hover:text-white hover:border-notion-muted'
        }`}
      >
        <Filter size={14} />
        <span>Filtrele</span>
        {filters.length > 0 && (
          <span className="px-1.5 py-0.5 bg-blue-600 rounded text-xs font-medium">{filters.length}</span>
        )}
      </button>

      {/* Filter Panel - Notion Style */}
      {isOpen && (
        <div className="absolute left-0 top-12 w-max min-w-[500px] bg-notion-panel border border-notion-border rounded-lg shadow-xl p-3 z-50">
          <div className="space-y-2">
            {/* Filter Rows */}
            {filters.map((filter) => {
              const property = properties.find(p => p.id === filter.propertyId)
              const operators = getOperators(property?.type || 'text')

              return (
                <div key={filter.id} className="flex items-center gap-2">
                  {/* Property Selector */}
                  <select
                    value={filter.propertyId}
                    onChange={(e) => updateFilter(filter.id, { propertyId: e.target.value })}
                    className="bg-notion-bg text-blue-400 text-sm font-medium outline-none cursor-pointer px-3 py-1.5 rounded border border-notion-border hover:bg-notion-hover"
                  >
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.id}>{prop.name}</option>
                    ))}
                  </select>

                  {/* Operator Selector */}
                  <select
                    value={filter.operator}
                    onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
                    className="bg-notion-bg text-white text-sm outline-none cursor-pointer px-3 py-1.5 rounded border border-notion-border hover:bg-notion-hover"
                  >
                    {operators.map(op => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>

                  {/* Value Input */}
                  {needsValue(filter.operator) && (
                    <>
                      {property?.type === 'select' || property?.type === 'multi_select' ? (
                        <select
                          value={filter.value}
                          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                          className="bg-notion-bg text-white text-sm outline-none px-3 py-1.5 rounded border border-notion-border hover:bg-notion-hover min-w-[140px]"
                        >
                          <option value="">Seçiniz...</option>
                          {property.config && JSON.parse(property.config).options?.map((opt: any) => (
                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                          ))}
                        </select>
                      ) : property?.type === 'date' ? (
                        <input
                          type="date"
                          value={filter.value}
                          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                          className="bg-notion-bg text-white text-sm outline-none px-3 py-1.5 rounded border border-notion-border hover:bg-notion-hover"
                        />
                      ) : property?.type === 'number' ? (
                        <input
                          type="number"
                          value={filter.value}
                          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                          placeholder="0"
                          className="bg-notion-bg text-white text-sm outline-none px-3 py-1.5 rounded border border-notion-border hover:bg-notion-hover w-28"
                        />
                      ) : (
                        <input
                          type="text"
                          value={filter.value}
                          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                          placeholder="Değer..."
                          className="bg-notion-bg text-white text-sm outline-none px-3 py-1.5 rounded border border-notion-border hover:bg-notion-hover min-w-[140px]"
                        />
                      )}
                    </>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFilter(filter.id)}
                    className="text-notion-muted hover:text-red-400 transition-colors p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              )
            })}

            {/* Add Filter Button */}
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="flex items-center gap-1 px-3 py-1.5 bg-notion-bg border border-notion-border rounded text-sm text-notion-muted hover:text-white hover:bg-notion-hover transition-colors"
              >
                <Plus size={14} />
                <span>Filtre Ekle</span>
              </button>

              {/* Property Dropdown */}
              {showAddMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowAddMenu(false)}
                  />
                  <div className="absolute left-0 top-10 w-56 bg-notion-bg border border-notion-border rounded-lg shadow-xl py-1 z-50 max-h-64 overflow-y-auto">
                    {properties.map(prop => (
                      <button
                        key={prop.id}
                        onClick={() => addFilter(prop.id)}
                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-notion-hover transition-colors"
                      >
                        {prop.name}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Clear All */}
              {filters.length > 0 && (
                <button
                  onClick={() => {
                    onFiltersChange([])
                    setIsOpen(false)
                  }}
                  className="ml-auto text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Tümünü Temizle
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}