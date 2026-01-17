import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css"; 

interface PageData {
  id: string;
  parent_id: string;
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

  // Editörü boş başlatıyoruz
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

            // İÇERİK YÜKLEME (GÜVENLİ)
            if (data.content) {
                try {
                    const blocks = JSON.parse(data.content);
                    // Eğer içerik doluysa editöre yükle
                    if (Array.isArray(blocks) && blocks.length > 0) {
                        editor.replaceBlocks(editor.document, blocks);
                    }
                } catch (parseError) {
                    console.error("İçerik parse hatası:", parseError);
                    // Hata varsa editör boş kalsın, çökmesin
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    loadData();
  }, [id, editor]);

  // --- OTOMATİK KAYDETME ---
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
    } catch (err) {
      console.error("Başlık hatası:", err);
    }
  };

  // TARİH FORMATLAMA (GÜVENLİ)
  const formatDate = (timestamp: number | undefined) => {
      if (!timestamp) return "-";
      try {
          return new Date(timestamp * 1000).toLocaleDateString("tr-TR");
      } catch {
          return "-";
      }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-notion-muted">Yükleniyor...</div>;
  if (!page) return <div className="flex items-center justify-center min-h-screen text-white">Sayfa bulunamadı veya silinmiş.</div>;

  return (
    <div className="min-h-screen bg-[#191919] text-white pb-32">
      {/* NAVİGASYON */}
      <div className="sticky top-0 z-50 bg-[#191919]/80 backdrop-blur-md border-b border-[#373737] px-4 py-3 flex items-center gap-2 text-sm text-gray-400">
        <button 
          onClick={() => navigate(`/database/${page.parent_id}`)}
          className="hover:text-white hover:bg-[#2C2C2C] px-2 py-1 rounded transition-colors flex items-center gap-1"
        >
          ⬅ Veritabanına Dön
        </button>
        <span className="opacity-50">/</span>
        <span className="text-white truncate max-w-[200px]">{title || "İsimsiz"}</span>
        <span className="ml-auto text-xs text-green-500 animate-pulse">Otomatik Kaydediliyor</span>
      </div>

      {/* KAPAK */}
      <div className="h-48 w-full bg-gradient-to-r from-slate-800 via-gray-800 to-slate-900 relative group">
      </div>

      <div className="max-w-4xl mx-auto px-12 relative">
        {/* İKON */}
        <div className="-mt-10 mb-4 relative group w-20 h-20">
          <div className="text-6xl cursor-pointer hover:bg-[#2C2C2C] rounded p-1 transition-colors">
            {page.icon || "📄"}
          </div>
        </div>

        {/* BAŞLIK */}
        <div className="mb-8">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="İsimsiz"
            className="w-full text-5xl font-bold bg-transparent border-none outline-none text-white placeholder-gray-600"
          />
        </div>

        {/* METADATA */}
        <div className="flex items-center gap-4 text-notion-muted text-sm mb-8 border-b border-notion-border pb-4">
           <span>📅 Oluşturuldu: {formatDate(page.created_at)}</span>
        </div>

        {/* EDİTÖR */}
        <div className="-ml-14 text-gray-200">
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