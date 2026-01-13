import { useState } from 'react'
import { X } from 'lucide-react'

interface AddPropertyModalProps {
  databaseId: string
  onClose: () => void
  onSuccess: (property: any) => void
}

const PROPERTY_TYPES = [
  { id: 'text', name: 'Text', icon: '📝', description: 'Plain text' },
  { id: 'number', name: 'Number', icon: '🔢', description: 'Numbers with formatting' },
  { id: 'select', name: 'Select', icon: '🏷️', description: 'Single select dropdown' },
  { id: 'multi_select', name: 'Multi-select', icon: '🏷️', description: 'Multiple tags' },
  { id: 'date', name: 'Date', icon: '📅', description: 'Date or date range' },
  { id: 'checkbox', name: 'Checkbox', icon: '☑️', description: 'True or false' },
  { id: 'status', name: 'Status', icon: '📊', description: 'Custom status with groups' },
]

const SELECT_COLORS = ['gray', 'blue', 'green', 'red', 'yellow', 'purple', 'pink', 'orange', 'brown']

export default function AddPropertyModal({ databaseId, onClose, onSuccess }: AddPropertyModalProps) {
  const [step, setStep] = useState<'type' | 'config'>('type')
  const [selectedType, setSelectedType] = useState('')
  const [propertyName, setPropertyName] = useState('')
  const [options, setOptions] = useState<Array<{ id: string; name: string; color: string }>>([])

  const handleTypeSelect = (type: string) => {
    setSelectedType(type)
    
    // Select ve multi_select için default options
    if (type === 'select' || type === 'multi_select') {
      setOptions([
        { id: 'option1', name: 'Option 1', color: 'gray' },
        { id: 'option2', name: 'Option 2', color: 'blue' },
      ])
      setStep('config')
    } else if (type === 'status') {
      // Status için default groups
      setOptions([
        { id: 'todo', name: 'To-do', color: 'gray' },
        { id: 'progress', name: 'In Progress', color: 'blue' },
        { id: 'done', name: 'Done', color: 'green' },
      ])
      setStep('config')
    } else {
      // Text, number, date, checkbox için direkt oluştur
      setStep('config')
    }
  }

  const handleCreate = async () => {
    if (!propertyName.trim()) {
      alert('Property name is required!')
      return
    }

    const config: any = {}
    
    if (selectedType === 'select' || selectedType === 'multi_select') {
      config.options = options
    } else if (selectedType === 'status') {
      config.options = options // Basitleştirilmiş, ileride groups eklenecek
    }

    try {
      const response = await fetch('http://localhost:8000/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database_id: databaseId,
          name: propertyName,
          type: selectedType,
          config: config,
          order_index: 999,
          visible: true,
        })
      })

      if (response.ok) {
        const newProperty = await response.json()
        onSuccess(newProperty)
        onClose()
      }
    } catch (err) {
      console.error('Failed to create property:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-notion-panel border border-notion-border rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-notion-border">
          <h2 className="text-lg font-semibold text-white">
            {step === 'type' ? 'Select Property Type' : 'Configure Property'}
          </h2>
          <button
            onClick={onClose}
            className="text-notion-muted hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {step === 'type' ? (
            // Type Selection
            <div className="grid grid-cols-2 gap-3">
              {PROPERTY_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className="p-4 bg-notion-bg border border-notion-border rounded-lg hover:bg-notion-hover transition-colors text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{type.icon}</span>
                    <span className="font-medium text-white">{type.name}</span>
                  </div>
                  <p className="text-sm text-notion-muted">{type.description}</p>
                </button>
              ))}
            </div>
          ) : (
            // Config Step
            <div className="space-y-4">
              {/* Property Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Property Name
                </label>
                <input
                  type="text"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="e.g., Status, Priority, Due Date"
                  className="w-full px-3 py-2 bg-notion-bg border border-notion-border rounded text-white outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              {/* Options (for select/multi-select/status) */}
              {(selectedType === 'select' || selectedType === 'multi_select' || selectedType === 'status') && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Options
                  </label>
                  <div className="space-y-2">
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt.name}
                          onChange={(e) => {
                            const newOpts = [...options]
                            newOpts[idx].name = e.target.value
                            setOptions(newOpts)
                          }}
                          className="flex-1 px-3 py-2 bg-notion-bg border border-notion-border rounded text-white outline-none"
                        />
                        <select
                          value={opt.color}
                          onChange={(e) => {
                            const newOpts = [...options]
                            newOpts[idx].color = e.target.value
                            setOptions(newOpts)
                          }}
                          className="px-2 py-2 bg-notion-bg border border-notion-border rounded text-white"
                        >
                          {SELECT_COLORS.map(color => (
                            <option key={color} value={color}>{color}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setOptions([...options, { id: `opt${options.length + 1}`, name: `Option ${options.length + 1}`, color: 'gray' }])}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      + Add option
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setStep('type')}
                  className="px-4 py-2 bg-notion-bg border border-notion-border rounded hover:bg-notion-hover transition-colors text-white"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-white font-medium"
                >
                  Create Property
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}