import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css"; 
import { Home, Database, ChevronLeft, Image as ImageIcon, Smile, Star } from "lucide-react"; 
import toast from 'react-hot-toast'; 
import IconPicker from "../components/IconPicker";
import CoverPicker from "../components/CoverPicker"; 
import { useUpdatePageIcon, useUpdatePageCover } from "../hooks/apiHooks"; 

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface PageData {
  id: string;
  database_id: string | null; 
  title: string;
  icon: string | null;
  cover: string | null;
  content: string | null;
  created_at: number;
}

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  const updateIconMutation = useUpdatePageIcon(id!);
  const updateCoverMutation = useUpdatePageCover(id!); 

  const editor = useCreateBlockNote();

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
        try {
            const res = await fetch(`${API_URL}/pages/${id}`); // <-- DÜZELTİLDİ
            if (!res.ok) throw new Error("Page not found");
            const data = await res.json();
            
            setPage(data);
            setTitle(data.title || "");

            const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            setIsFavorite(favorites.some((p: any) => p.id === data.id));

            const history = JSON.parse(localStorage.getItem('history') || '[]');
            const newEntry = { 
                id: data.id, 
                title: data.title || "İsimsiz", 
                icon: data.icon, 
                type: 'page',
                visitedAt: Date.now() 
            };
            const filteredHistory = history.filter((h: any) => h.id !== data.id);
            filteredHistory.unshift(newEntry);
            localStorage.setItem('history', JSON.stringify(filteredHistory.slice(0, 10)));
            
            if (data.content) {
                try {
                    const blocks = JSON.parse(data.content);
                    if (Array.isArray(blocks) && blocks.length > 0) {
                        editor.replaceBlocks(editor.document, blocks);
                    } else {
                        editor.replaceBlocks(editor.document, [{ type: "paragraph", content: [] }]);
                    }
                } catch (parseError) {
                    console.error("İçerik parse hatası:", parseError);
                }
            } else {
                editor.replaceBlocks(editor.document, [{ type: "paragraph", content: [] }]);
            }

        } catch (err) {
            console.error(err);
            toast.error("Sayfa yüklenirken bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    loadData();
  }, [id, editor]);

  const saveTimeoutRef = useRef<number | null>(null);

  const handleEditorChange = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = window.setTimeout(async () => {
        if (!id) return;
        try {
            const res = await fetch(`${API_URL}/pages/${id}`, { // <-- DÜZELTİLDİ
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: JSON.stringify(editor.document),
                }),
            });
            if (!res.ok) throw new Error("Kayıt başarısız");
        } catch (err) {
            console.error("Kaydetme hatası:", err);
            toast.error("Otomatik kayıt başarısız!");
        }
    }, 1000);
  };

  const handleTitleBlur = async () => {
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/pages/${id}`, { // <-- DÜZELTİLDİ
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      
      if (!res.ok) throw new Error("Başlık kaydedilemedi");
      window.dispatchEvent(new Event('sidebar-update'));

    } catch (err) {
      console.error("Başlık hatası:", err);
      toast.error("Başlık kaydedilemedi");
    }
  };

  const toggleFavorite = () => {
      if (!page) return;
      
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      let newFavorites;

      if (isFavorite) {
          newFavorites = favorites.filter((p: any) => p.id !== page.id);
          toast.success("Favorilerden çıkarıldı");
      } else {
          newFavorites = [{ 
              id: page.id, 
              title: title || "İsimsiz", 
              icon: page.icon,
              type: 'page'
          }, ...favorites];
          toast.success("Favorilere eklendi");
      }

      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      setIsFavorite(!isFavorite);
      window.dispatchEvent(new Event('sidebar-update')); 
  };

  const handleAddCover = () => {
      const defaultCover = "bg-gradient-to-r from-slate-700 to-slate-900";
      setPage(prev => prev ? { ...prev, cover: defaultCover } : null);
      updateCoverMutation.mutate(defaultCover);
  };

  const handleUpdateCover = (newCover: string) => {
      setPage(prev => prev ? { ...prev, cover: newCover } : null);
      updateCoverMutation.mutate(newCover);
  };

  const handleRemoveCover = () => {
      setPage(prev => prev ? { ...prev, cover: null } : null);
      updateCoverMutation.mutate(null);
      setShowCoverPicker(false);
  };

  const formatDate = (timestamp: number | undefined) => {
      if (!timestamp) return "-";
      try {
          return new Date(timestamp * 1000).toLocaleDateString("tr-TR");
      } catch {
          return "-";
      }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Yükleniyor...</div>;
  if (!page) return <div className="flex items-center justify-center min-h-screen text-white">Sayfa bulunamadı.</div>;

  return (
    <div className="min-h-screen bg-[#191919] text-white pb-32">
      
      <div className="sticky top-0 z-40 bg-[#191919]/80 backdrop-blur-md border-b border-[#373737] px-4 py-3 flex items-center gap-2 text-sm text-gray-400">
        <button 
          onClick={() => page.database_id ? navigate(`/database/${page.database_id}`) : navigate('/')}
          className="hover:text-white hover:bg-[#2C2C2C] px-2 py-1 rounded transition-colors flex items-center gap-1 group"
        >
          <ChevronLeft size={16} />
          {page.database_id ? (
             <>
               <Database size={14} className="text-gray-500 group-hover:text-blue-400"/>
               <span>Veritabanına Dön</span>
             </>
          ) : (
             <>
               <Home size={14} className="text-gray-500 group-hover:text-green-400"/>
               <span>Ana Sayfa</span>
             </>
          )}
        </button>

        <span className="opacity-30">/</span>
        <span className="text-white truncate max-w-[200px] font-medium">{title || "İsimsiz"}</span>

        <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-gray-600 transition-opacity duration-500" style={{opacity: saveTimeoutRef.current ? 1 : 0}}>
                Kaydediliyor...
            </span>
            <button 
                onClick={toggleFavorite}
                className={`p-1 rounded hover:bg-[#2C2C2C] transition-colors ${isFavorite ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`}
                title={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
            >
                <Star size={18} fill={isFavorite ? "currentColor" : "none"} />
            </button>
        </div>
      </div>

      <div className="group relative w-full">
          {page.cover ? (
              <div className="h-64 w-full relative animate-in fade-in duration-300">
                  {page.cover.startsWith('http') || page.cover.startsWith('data:') ? (
                      <img 
                        src={page.cover} 
                        alt="Cover" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center" 
                      />
                  ) : page.cover.startsWith('linear-gradient') ? (
                      <div className="w-full h-full" style={{ background: page.cover }}></div>
                  ) : (
                      <div className={`w-full h-full ${page.cover}`}></div>
                  )}
                  
                  <div className="absolute bottom-4 right-12 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button 
                        onClick={() => setShowCoverPicker(true)}
                        className="bg-[#202020]/60 hover:bg-[#202020] text-xs text-gray-300 px-3 py-1.5 rounded-md border border-white/10 backdrop-blur-md flex items-center gap-1.5 transition-colors"
                      >
                          <ImageIcon size={14} /> Kapak Değiştir
                      </button>
                      
                      {showCoverPicker && (
                          <CoverPicker 
                              currentCover={page.cover}
                              onChange={handleUpdateCover}
                              onRemove={handleRemoveCover}
                              onClose={() => setShowCoverPicker(false)}
                          />
                      )}
                  </div>
              </div>
          ) : (
              <div className="h-0 w-full"></div> 
          )}
      </div>

      <div className="max-w-4xl mx-auto px-12 relative group/header">
        
        <div className={`relative z-20 flex flex-col items-start transition-all duration-300 ${page.cover ? '-mt-16' : 'mt-12'}`}>
             
             {!page.cover && (
                 <div className="flex items-center gap-1 mb-4 opacity-0 group-hover/header:opacity-100 transition-opacity pl-1">
                     <button onClick={handleAddCover} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white hover:bg-[#2C2C2C] px-2 py-1 rounded transition-colors">
                         <ImageIcon size={14} /> Kapak Ekle
                     </button>
                 </div>
             )}

             <div className="relative group w-24 h-24">
                <IconPicker 
                    icon={page.icon || ""} 
                    onChange={(newIcon) => {
                        setPage(prev => prev ? { ...prev, icon: newIcon } : null);
                        updateIconMutation.mutate(newIcon);
                    }} 
                />
             </div>
        </div>

        <div className="mb-6 group relative">
          {!title && <div className="absolute top-0 left-0 text-4xl font-bold text-gray-600 pointer-events-none">İsimsiz</div>}
          
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="w-full text-4xl font-bold bg-transparent border-none outline-none text-white placeholder-transparent"
          />
        </div>

        <div className="flex items-center gap-6 text-gray-500 text-xs mb-8 border-b border-[#373737] pb-4">
           <span className="flex items-center gap-1">
             🕒 {formatDate(page.created_at)}
           </span>
           {page.database_id && (
             <span className="bg-[#2C2C2C] px-2 py-0.5 rounded text-blue-400">
               Veritabanı Sayfası
             </span>
           )}
        </div>

        <div className="-ml-14 text-gray-200 editor-wrapper">
            <BlockNoteView
                editor={editor}
                theme="dark"
                onChange={handleEditorChange}
            />
        </div>
      </div>
    </div>
  );
}