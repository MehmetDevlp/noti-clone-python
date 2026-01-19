import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css"; 
import { Home, Database, ChevronLeft } from "lucide-react"; // İkonları ekledik
import IconPicker from "../components/IconPicker";
import { useUpdatePageIcon } from "../hooks/apiHooks";

interface PageData {
  id: string;
  database_id: string | null; // parent_id -> database_id olarak güncellendi ve null olabilir
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
  const updateIconMutation = useUpdatePageIcon(id!);

  // Editörü başlat
  const editor = useCreateBlockNote();

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
        try {
            const res = await fetch(`http://localhost:8000/pages/${id}`);
            if (!res.ok) throw new Error("Page not found");
            const data = await res.json();
            
            setPage(data);
            setTitle(data.title || "");

            // --- GÜNCELLENEN KISIM ---
            if (data.content) {
                // Eğer sayfanın kayıtlı bir içeriği varsa onu yükle
                try {
                    const blocks = JSON.parse(data.content);
                    if (Array.isArray(blocks) && blocks.length > 0) {
                        editor.replaceBlocks(editor.document, blocks);
                    } else {
                        // İçerik array ama boşsa temizle
                        editor.replaceBlocks(editor.document, [
                            { type: "paragraph", content: [] }
                        ]);
                    }
                } catch (parseError) {
                    console.error("İçerik parse hatası:", parseError);
                }
            } else {
                // ÖNEMLİ: Eğer içerik NULL ise (Yeni Sayfa), editörü sıfırla!
                // Bunu yapmazsak önceki sayfanın yazıları ekranda kalır.
                editor.replaceBlocks(editor.document, [
                    { type: "paragraph", content: [] }
                ]);
            }
            // -------------------------

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    loadData();
  }, [id, editor]);

  // Otomatik Kaydetme
  const saveTimeoutRef = useRef<number | null>(null);

  const handleEditorChange = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
        if (!id) return;
        try {
            await fetch(`http://localhost:8000/pages/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: JSON.stringify(editor.document),
                }),
            });
        } catch (err) {
            console.error("Kaydetme hatası:", err);
        }
    }, 1000);
  };

  const handleTitleBlur = async () => {
    if (!id) return;
    try {
      await fetch(`http://localhost:8000/pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      
      // YENİ EKLENEN SATIR: Sidebar'ı tetikleyen sinyal
      window.dispatchEvent(new Event('sidebar-update'));

    } catch (err) {
      console.error("Başlık hatası:", err);
    }
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
      {/* --- NAVİGASYON --- */}
      <div className="sticky top-0 z-50 bg-[#191919]/80 backdrop-blur-md border-b border-[#373737] px-4 py-3 flex items-center gap-2 text-sm text-gray-400">
        
        {/* AKILLI GERİ BUTONU */}
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
        <span className="ml-auto text-xs text-gray-600 transition-opacity duration-500" style={{opacity: saveTimeoutRef.current ? 1 : 0}}>
            Kaydediliyor...
        </span>
      </div>

      {/* --- KAPAK GÖRSELİ --- */}
      <div className="h-48 w-full bg-gradient-to-r from-slate-800 via-gray-800 to-slate-900 relative group">
          {/* İlerde buraya 'Kapak Değiştir' butonu ekleyebiliriz */}
      </div>

      <div className="max-w-4xl mx-auto px-12 relative">
        {/* --- İKON (GÜNCELLENDİ) --- */}
        <div className="-mt-10 mb-4 relative group w-20 h-20">
             <IconPicker 
                icon={page.icon || ""} 
                onChange={(newIcon) => {
                    // 1. Ekranda anında değişsin diye:
                    setPage(prev => prev ? { ...prev, icon: newIcon } : null);
                    // 2. Backend'e kaydetsin diye:
                    updateIconMutation.mutate(newIcon);
                }} 
             />
        </div>

        {/* --- BAŞLIK ALANI --- */}
        <div className="mb-6 group">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="İsimsiz"
            className="w-full text-4xl font-bold bg-transparent border-none outline-none text-white placeholder-gray-600"
          />
        </div>

        {/* --- METADATA (Tarih vb.) --- */}
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

        {/* --- NOTION EDİTÖRÜ --- */}
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