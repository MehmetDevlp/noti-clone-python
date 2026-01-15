import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Trash2, Square, CheckSquare } from 'lucide-react'

interface RowActionsMenuProps {
  isSelected: boolean
  onToggleSelect: () => void
  onDelete: () => void
}

export default function RowActionsMenu({ 
  isSelected, 
  onToggleSelect, 
  onDelete,
}: RowActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      {/* 3 Nokta Butonu */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className={`p-1.5 rounded hover:bg-notion-bg transition-colors ${
          isSelected ? 'text-blue-400 opacity-100' : 'text-notion-muted opacity-0 group-hover:opacity-100'
        }`}
        title="İşlemler"
      >
        <MoreVertical size={16} />
      </button>

      {/* Dropdown Menü */}
      {isOpen && (
        <div 
          className="absolute left-0 top-8 w-48 bg-notion-panel border border-notion-border rounded-md shadow-xl py-1 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Seç/Seçimi Kaldır */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleSelect()
              setIsOpen(false)
            }}
            className="w-full px-3 py-2 text-left text-sm text-white hover:bg-notion-hover transition-colors flex items-center gap-3"
          >
            {isSelected ? (
              <>
                <CheckSquare size={16} className="text-blue-400" />
                <span>Seçimi Kaldır</span>
              </>
            ) : (
              <>
                <Square size={16} />
                <span>Seç</span>
              </>
            )}
          </button>

          {/* Ayırıcı */}
          <div className="border-t border-notion-border my-1" />

          {/* Sil */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
              setIsOpen(false)
            }}
            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-notion-hover transition-colors flex items-center gap-3"
          >
            <Trash2 size={16} />
            <span>Sil</span>
          </button>
        </div>
      )}
    </div>
  )
}