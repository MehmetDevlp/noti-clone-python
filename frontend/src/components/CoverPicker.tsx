import { useState, useRef, useEffect } from 'react'
import { Image, Palette, Wand2, Upload, Loader2, AlertTriangle, Check, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { useUploadFile } from '../hooks/apiHooks'

// --- 1. HAZIR GRADYANLAR ---
const PRESET_CATEGORIES = [
  {
    name: "Uzay & Karanlık",
    gradients: [
      { name: 'Midnight', value: 'bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900' },
      { name: 'Deep Space', value: 'bg-gradient-to-b from-gray-900 to-gray-600 bg-gradient-to-r' },
      { name: 'Cyberpunk', value: 'bg-gradient-to-r from-slate-900 to-cyan-900' },
      { name: 'Batman', value: 'bg-gradient-to-r from-slate-900 via-gray-800 to-slate-900' },
    ]
  },
  {
    name: "Canlı & Neon",
    gradients: [
      { name: 'Hyper', value: 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500' },
      { name: 'Oceanic', value: 'bg-gradient-to-r from-green-300 via-blue-500 to-purple-600' },
      { name: 'Cotton Candy', value: 'bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400' },
      { name: 'Sunset', value: 'bg-gradient-to-r from-orange-400 to-rose-400' },
    ]
  },
  {
    name: "Sade & Pastel",
    gradients: [
      { name: 'Warm', value: 'bg-gradient-to-r from-orange-100 to-rose-100' },
      { name: 'Cool', value: 'bg-gradient-to-r from-blue-100 to-cyan-100' },
      { name: 'Nature', value: 'bg-gradient-to-r from-emerald-100 to-teal-100' },
      { name: 'Lavender', value: 'bg-gradient-to-r from-violet-100 to-purple-100' },
    ]
  }
]

// --- 2. DÜZELTİLMİŞ GALERİ ---
const GALLERY_IMAGES = [
  { name: 'Galaxy', thumb: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-4.0.3&q=80&w=400&auto=format&fit=crop', full: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-4.0.3&q=90&w=2560&auto=format&fit=crop' },
  { name: 'Mountains', thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&q=80&w=400&auto=format&fit=crop', full: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&q=90&w=2560&auto=format&fit=crop' },
  { name: 'Deep Forest', thumb: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&q=80&w=400&auto=format&fit=crop', full: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&q=90&w=2560&auto=format&fit=crop' },
  { name: 'Desert', thumb: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?ixlib=rb-4.0.3&q=80&w=400&auto=format&fit=crop', full: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?ixlib=rb-4.0.3&q=90&w=2560&auto=format&fit=crop' },
  { name: 'Ocean', thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&q=80&w=400&auto=format&fit=crop', full: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&q=90&w=2560&auto=format&fit=crop' },
  { name: 'Architecture', thumb: 'https://images.unsplash.com/photo-1486325212027-808522f6480b?ixlib=rb-4.0.3&q=80&w=400&auto=format&fit=crop', full: 'https://images.unsplash.com/photo-1486325212027-808522f6480b?ixlib=rb-4.0.3&q=90&w=2560&auto=format&fit=crop' },
  { name: 'Japan', thumb: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&q=80&w=400&auto=format&fit=crop', full: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&q=90&w=2560&auto=format&fit=crop' },
  { name: 'Gradient', thumb: 'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?ixlib=rb-4.0.3&q=80&w=400&auto=format&fit=crop', full: 'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?ixlib=rb-4.0.3&q=90&w=2560&auto=format&fit=crop' },
]

interface CoverPickerProps {
  currentCover: string | null
  onChange: (cover: string) => void
  onRemove: () => void
  onClose: () => void
}

export default function CoverPicker({ currentCover, onChange, onRemove, onClose }: CoverPickerProps) {
  const [tab, setTab] = useState<'presets' | 'images' | 'upload' | 'custom'>('presets')
  const [customStart, setCustomStart] = useState('#202020')
  const [customEnd, setCustomEnd] = useState('#404040')
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const uploadMutation = useUploadFile()

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', handleClick); return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const applyCustomGradient = () => {
    // DÜZELTME: Tailwind class yerine standart CSS kullanıyoruz
    const gradientStyle = `linear-gradient(to right, ${customStart}, ${customEnd})`
    onChange(gradientStyle)
    onClose()
  }

  const checkImageResolution = (file: File): Promise<{width: number, height: number, ok: boolean}> => {
      return new Promise((resolve) => {
          const img = document.createElement('img');
          img.src = URL.createObjectURL(file);
          img.onload = () => {
              const width = img.naturalWidth;
              const height = img.naturalHeight;
              URL.revokeObjectURL(img.src);
              if (width < 1500) resolve({ width, height, ok: false });
              else resolve({ width, height, ok: true });
          }
          img.onerror = () => resolve({ width: 0, height: 0, ok: false });
      })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
          toast.error("Geçersiz dosya tipi.")
          return
      }

      if (file.size > 5 * 1024 * 1024) { 
          toast.error("Dosya 5MB'dan büyük olamaz.")
          return
      }

      const resolution = await checkImageResolution(file);
      if (!resolution.ok) {
          const proceed = confirm(`UYARI: Resim (${resolution.width}px) biraz küçük. Kaliteli durması için en az 1920px landspace resim önerilir. Yine de yüklensin mi?`);
          if (!proceed) return;
      }

      const toastId = toast.loading('Resim yükleniyor...')

      try {
          const data = await uploadMutation.mutateAsync(file)
          onChange(data.url)
          onClose()
          toast.success("Kapak yüklendi!", { id: toastId })
      } catch (error: any) {
          console.error(error)
          toast.error("Yükleme başarısız.", { id: toastId })
      }
  }

  return (
    <div ref={menuRef} className="absolute right-4 top-full mt-2 z-50 w-96 bg-[#202020] border border-[#373737] rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
      
      <div className="flex items-center justify-between p-3 border-b border-[#373737]">
        <span className="text-xs font-bold text-gray-400 uppercase">Kapak Seç</span>
        {currentCover && <button onClick={() => { onRemove(); onClose() }} className="text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 px-2 py-1 rounded transition-colors">Kaldır</button>}
      </div>

      <div className="flex p-1 gap-1 border-b border-[#373737]">
        <button onClick={() => setTab('presets')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded transition-colors ${tab==='presets'?'bg-[#373737] text-white':'text-gray-500 hover:text-gray-300'}`}><Palette size={14} /> Hazır</button>
        <button onClick={() => setTab('images')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded transition-colors ${tab==='images'?'bg-[#373737] text-white':'text-gray-500 hover:text-gray-300'}`}><Image size={14} /> Galeri</button>
        <button onClick={() => setTab('upload')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded transition-colors ${tab==='upload'?'bg-[#373737] text-white':'text-gray-500 hover:text-gray-300'}`}><Upload size={14} /> Yükle</button>
        <button onClick={() => setTab('custom')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded transition-colors ${tab==='custom'?'bg-[#373737] text-white':'text-gray-500 hover:text-gray-300'}`}><Wand2 size={14} /> Özel</button>
      </div>

      <div className="p-3 max-h-[400px] overflow-y-auto custom-scrollbar relative">
        {uploadMutation.isPending && <div className="absolute inset-0 bg-[#202020]/80 backdrop-blur-sm z-50 flex items-center justify-center text-blue-400"><Loader2 className="animate-spin mr-2"/> Yükleniyor...</div>}

        {tab === 'presets' && (
            <div className="flex flex-col gap-4">{PRESET_CATEGORIES.map(cat => (<div key={cat.name}><div className="text-[10px] text-gray-500 font-bold mb-2 uppercase">{cat.name}</div><div className="grid grid-cols-2 gap-2">{cat.gradients.map(g => (<div key={g.name} onClick={() => {onChange(g.value);onClose()}} className={`h-12 rounded cursor-pointer hover:border-white/50 border border-transparent ${g.value}`}></div>))}</div></div>))}</div>
        )}

        {tab === 'images' && (
            <div className="grid grid-cols-2 gap-2">
                {GALLERY_IMAGES.map(img => (
                    <div 
                        key={img.name} 
                        onClick={() => { onChange(img.full); onClose() }} 
                        className="h-24 relative group cursor-pointer rounded-lg overflow-hidden border border-[#373737] bg-[#1a1a1a]"
                    >
                        <img 
                            src={img.thumb} 
                            alt={img.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" 
                            loading="lazy" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-transparent transition-colors">
                            <span className="text-white text-xs font-bold shadow-sm drop-shadow-md">{img.name}</span>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {tab === 'upload' && (
            <div className="flex flex-col gap-3">
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-start gap-3">
                    <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-gray-300">
                        <p className="font-bold text-blue-300 mb-1">Görsel Boyutu</p>
                        Kapakların kaliteli durması için <strong>genişliğin 1920px</strong> yada üzeri olması ve landspace resim olması önerilir. Sistem resmi otomatik ortalar.
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[#373737] hover:border-blue-500/50 rounded-lg transition-colors bg-[#1a1a1a]/50 cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <Upload size={24} className="text-gray-500 group-hover:text-blue-400 mb-2 transition-colors" />
                    <span className="text-xs text-gray-400 font-medium">Bilgisayardan Seç</span>
                </div>
            </div>
        )}

        {tab === 'custom' && (
            <div className="flex flex-col gap-4 animate-in slide-in-from-right-5 duration-200">
                <div className="h-28 w-full rounded-lg border border-[#373737] shadow-inner flex items-center justify-center relative overflow-hidden"
                     style={{ background: `linear-gradient(to right, ${customStart}, ${customEnd})` }}>
                    <span className="relative z-10 text-white font-bold drop-shadow-md bg-black/20 px-3 py-1 rounded backdrop-blur-sm text-sm">Önizleme</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">İlk Renk</label>
                        <div className="flex items-center gap-2 bg-[#151515] p-2 rounded border border-[#373737] hover:border-gray-500 transition-colors">
                            <input type="color" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent p-0"/>
                            <span className="text-xs font-mono text-gray-300 uppercase">{customStart}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Son Renk</label>
                        <div className="flex items-center gap-2 bg-[#151515] p-2 rounded border border-[#373737] hover:border-gray-500 transition-colors">
                            <input type="color" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent p-0"/>
                            <span className="text-xs font-mono text-gray-300 uppercase">{customEnd}</span>
                        </div>
                    </div>
                </div>

                <button onClick={applyCustomGradient} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium text-sm transition-all flex items-center justify-center gap-2 mt-2">
                    <Check size={16} />
                    <span>Uygula</span>
                </button>
            </div>
        )}
      </div>
    </div>
  )
}