import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react'
import { useState, useRef, useEffect } from 'react'

interface IconPickerProps {
  icon: string
  onChange: (icon: string) => void
}

export default function IconPicker({ icon, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const onEmojiClick = (emojiData: EmojiClickData) => {
    onChange(emojiData.emoji)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-4xl hover:bg-[#2C2C2C] p-2 rounded transition-colors select-none cursor-pointer"
      >
        {icon || '📄'}
      </button>

      {isOpen && (
        <div className="absolute top-14 left-0 z-[50] shadow-2xl border border-[#373737] rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
           <EmojiPicker 
              theme={Theme.DARK}
              onEmojiClick={onEmojiClick}
              searchPlaceHolder="Emoji ara..."
              width={350}
              height={400}
           />
        </div>
      )}
    </div>
  )
}