import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode; // Butonlar için alan
}

export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Modal dışına tıklayınca kapatma mantığı
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Arka plan karartma
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Modal Penceresi */}
      <div 
        ref={modalRef}
        className="bg-[#202020] border border-[#373737] rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Başlık */}
        <div className="flex items-center justify-between p-4 border-b border-[#373737]">
          <h3 className="text-white font-medium">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* İçerik */}
        <div className="p-4 text-gray-300">
          {children}
        </div>

        {/* Footer (Butonlar) */}
        {footer && (
          <div className="p-3 border-t border-[#373737] bg-[#252525] rounded-b-xl flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}