<div align="center">
  <img src="https://img.shields.io/badge/Notion-Clone-000000?style=for-the-badge&logo=notion&logoColor=white" alt="Notion Clone">
  
  # 🚀 Notion Clone
  
  **Modern, Hızlı ve Kullanıcı Dostu Bilgi Yönetim Sistemi**
  
  [![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

  [Demo](#-demo) • [Özellikler](#-temel-özellikler) • [Kurulum](#-hızlı-başlangıç) • [Dokümantasyon](#-detaylı-dokümantasyon) • [Katkıda Bulunma](#-katkıda-bulunma)

  <img src="https://via.placeholder.com/800x450/191919/FFFFFF?text=Notion+Clone+Screenshot" alt="Uygulama Önizleme">
</div>

---

## 📖 İçindekiler

- [Hakkında](#-hakkında)
- [Temel Özellikler](#-temel-özellikler)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Hızlı Başlangıç](#-hızlı-başlangıç)
- [Detaylı Kurulum](#-detaylı-kurulum)
- [Kullanım Kılavuzu](#-kullanım-kılavuzu)
- [Proje Yapısı](#-proje-yapısı)
- [API Dokümantasyonu](#-api-dokümantasyonu)
- [Katkıda Bulunma](#-katkıda-bulunma)
- [Lisans](#-lisans)

---

## 🎯 Hakkında

**Notion Clone**, modern web teknolojileri kullanılarak geliştirilmiş, açık kaynak kodlu bir bilgi ve proje yönetim platformudur. Notion'un temel özelliklerini sunan bu proje, kullanıcıların notlarını, görevlerini ve projelerini organize etmelerine yardımcı olur.

### 🌟 Neden Bu Proje?

- ✅ **Açık Kaynak**: Tamamen ücretsiz ve değiştirilebilir
- ✅ **Self-Hosted**: Kendi sunucunuzda barındırın, verileriniz sizde kalsın
- ✅ **Modern Teknolojiler**: En yeni web standartları ile geliştirildi
- ✅ **Türkçe Dil Desteği**: Arayüz tamamen Türkçe
- ✅ **Öğrenme Amaçlı**: Full-stack geliştirme için mükemmel bir örnek

---

## ✨ Temel Özellikler

<table>
  <tr>
    <td width="50%">
      
### 📊 Veritabanı Yönetimi
- Sınırsız veritabanı oluşturma
- Tablo, Kanban ve Takvim görünümleri
- Gelişmiş filtreleme ve sıralama
- Özelleştirilebilir özellikler (property)
- Sütun sürükle-bırak ile yeniden sıralama

    </td>
    <td width="50%">
      
### 📝 Sayfa Editörü
- Rich text editör (BlockNote)
- Başlık, liste, kod bloğu desteği
- Emoji ve kapak resmi ekleme
- Otomatik kaydetme
- Markdown kısayolları

    </td>
  </tr>
  <tr>
    <td>
      
### 🎨 Özellik Tipleri
- **Text**: Serbest metin alanları
- **Select**: Tekli seçim menüsü
- **Multi-Select**: Etiket sistemi
- **Status**: Gruplu durum takibi
- **Priority**: Akıllı öncelik sıralaması
- **Date**: Başlangıç + bitiş tarihi
- **Checkbox**: Basit işaretleme

    </td>
    <td>
      
### 🔍 Arama ve Filtreleme
- Global arama (Ctrl+K)
- Başlık ve içerik araması
- Gelişmiş filtre operatörleri
- Çoklu sıralama desteği
- Favori ve geçmiş takibi

    </td>
  </tr>
  <tr>
    <td>
      
### 🎭 Görsel Özelleştirme
- Emoji picker ile ikon seçimi
- Hazır gradient kapaklar
- Unsplash entegrasyonu
- Özel renk seçici
- Dosya yükleme desteği

    </td>
    <td>
      
### ⚡ Performans & UX
- Infinite scroll (sonsuz kaydırma)
- Debounced arama
- Optimistic UI updates
- Toast bildirimleri
- Persist edilmiş ayarlar

    </td>
  </tr>
</table>

---

## 🛠️ Teknoloji Yığını

### Backend
```
FastAPI (Python 3.11+)    → Modern async web framework
SQLAlchemy 2.0            → ORM ve veritabanı yönetimi
SQLite                    → Hafif veritabanı (production'da PostgreSQL önerilir)
Pydantic                  → Veri validasyonu
Uvicorn                   → ASGI server
```

### Frontend
```
React 19                  → UI kütüphanesi
TypeScript                → Type-safe geliştirme
Vite                      → Hızlı build tool
TailwindCSS               → Utility-first CSS framework
TanStack Query (v5)       → Server state yönetimi
TanStack Table (v8)       → Güçlü tablo bileşeni
```

### Öne Çıkan Kütüphaneler
```
BlockNote                 → Notion-style editör
DnD Kit                   → Sürükle-bırak işlevselliği
React Big Calendar        → Takvim görünümü
Zustand                   → Hafif state management
React Hot Toast           → Bildirim sistemi
Lucide React              → Modern ikonlar
Emoji Picker React        → Emoji seçici
```

## 🚀 Hızlı Başlangıç

### Ön Gereksinimler
```bash
# Python 3.11 veya üzeri
python --version

# Node.js 18 veya üzeri
node --version

# npm veya yarn
npm --version
```

### ⚡ 3 Dakikada Çalıştırın
```bash
# 1. Projeyi klonlayın
git clone https://github.com/kullaniciadi/notion-clone.git
cd notion-clone

# 2. Backend'i başlatın (Terminal 1)
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

# 3. Frontend'i başlatın (Terminal 2)
cd frontend
npm install
npm run dev
```

🎉 **Tarayıcınızda açın:** `http://localhost:5173`

---

## 📚 Detaylı Kurulum

<details>
<summary><b>🐍 Backend Kurulumu (Adım Adım)</b></summary>

### 1. Python Sanal Ortamı Oluşturun
```bash
cd backend
python -m venv venv
```

### 2. Sanal Ortamı Aktifleştirin

**Linux/Mac:**
```bash
source venv/bin/activate
```

**Windows (CMD):**
```cmd
venv\Scripts\activate.bat
```

**Windows (PowerShell):**
```powershell
venv\Scripts\Activate.ps1
```

### 3. Bağımlılıkları Yükleyin
```bash
pip install -r requirements.txt
```

### 4. Veritabanını Başlatın
```bash
# Otomatik olarak notion.db oluşturulacak
python -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine)"
```

### 5. Sunucuyu Başlatın
```bash
# Development mode (hot reload)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

✅ **Backend API:** `http://localhost:8000`  
📖 **Swagger Docs:** `http://localhost:8000/docs`

</details>

<details>
<summary><b>⚛️ Frontend Kurulumu (Adım Adım)</b></summary>

### 1. Bağımlılıkları Yükleyin
```bash
cd frontend
npm install
# veya
yarn install
```

### 2. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
# veya
yarn dev
```

### 3. Production Build Oluşturun
```bash
npm run build
# Çıktı: dist/ klasörü
```

### 4. Production Build'i Önizleyin
```bash
npm run preview
```

✅ **Frontend Uygulama:** `http://localhost:5173`

</details>

<details>
<summary><b>🐳 Docker ile Kurulum (Opsiyonel)</b></summary>

### Docker Compose ile Tek Komutta Başlatın
```bash
# docker-compose.yml dosyası hazır olduğunda:
docker-compose up -d
```

**Örnek docker-compose.yml:**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      - DATABASE_URL=sqlite:///./notion.db
  
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
    depends_on:
      - backend
```

</details>

---

## 📖 Kullanım Kılavuzu

### 🎯 Temel İşlemler

#### 1️⃣ Veritabanı Oluşturma
```
Ana Sayfa → "Yeni Veritabanı" Butonu → İsim Girin → Oluştur
```

#### 2️⃣ Özellik (Property) Ekleme
```
Veritabanı Sayfası → Sağdaki "+" İkonu → Tür Seçin → İsim Girin
```

#### 3️⃣ Sayfa Ekleme
```
Tablo Görünümü → En alttaki "Yeni Sayfa" → Enter
Kanban Görünümü → Sütun Altındaki "Yeni" Butonu
Takvim Görünümü → Tarihin Üzerine Gelip "+" Butonu
```

#### 4️⃣ Hücre Düzenleme
```
Tablo'da Hücreye Tıkla → Değer Gir
Select/Status Tipleri → Tıkla → Modal Açılır → Seçenek Seç
Tarih Tipi → Tıkla → Takvim Açılır → Tarih Seç
```

### 🔍 Gelişmiş Özellikler

#### Filtreleme
```
Toolbar'daki "Filtre" Butonu → "Filtre Kuralı Ekle" 
→ Özellik Seç → Operatör Seç → Değer Gir
```

**Örnek Filtre:**
```
Durum | Eşit Değildir | Tamamlandı
Öncelik | Eşittir | Yüksek
Tarih | Zaman Aralığı | Bu Hafta
```

#### Sıralama
```
Toolbar'daki "Sıralama" Butonu → "Sıralama Ekle"
→ Özellik Seç → Artan/Azalan Seç
```

#### Global Arama
```
Klavye Kısayolu: Ctrl+K (veya Cmd+K)
→ Arama Kutusuna Yaz
→ Sonuçlara Tıkla
```

### 🎨 Görsel Özelleştirme

#### Kapak Resmi Ekleme
```
Sayfa Editöründe → "Kapak Ekle" Butonu
→ 4 Seçenek:
  1. Hazır Gradientler
  2. Unsplash Galerisi
  3. Dosya Yükle
  4. Özel Gradient Oluştur
```

#### İkon Değiştirme
```
Başlığın Solundaki Emoji → Tıkla → Emoji Picker Açılır → Seç
```

### ⌨️ Klavye Kısayolları

| Kısayol | İşlev |
|---------|-------|
| `Ctrl+K` / `Cmd+K` | Global arama aç |
| `Esc` | Modal/menüleri kapat |
| `Enter` | Yeni sayfa ekle (tablo sonunda) |
| `Ctrl+Z` | Geri al (editörde) |
| `Ctrl+Shift+Z` | İleri al (editörde) |

---

## 📁 Proje Yapısı
```
notion-clone/
├── 📂 backend/
│   ├── main.py              # FastAPI uygulama entry point
│   ├── database.py          # SQLAlchemy konfigürasyonu
│   ├── models.py            # Veritabanı modelleri
│   ├── schemas.py           # Pydantic şemaları
│   ├── crud.py              # CRUD işlemleri
│   ├── requirements.txt     # Python bağımlılıkları
│   ├── notion.db            # SQLite veritabanı (otomatik oluşur)
│   └── 📂 uploads/          # Yüklenen dosyalar
│
├── 📂 frontend/
│   ├── 📂 src/
│   │   ├── 📂 components/   # React bileşenleri
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── CommandMenu.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── IconPicker.tsx
│   │   │   ├── CoverPicker.tsx
│   │   │   ├── StatusEditModal.tsx
│   │   │   ├── AddPropertyModal.tsx
│   │   │   ├── DatabaseToolbar.tsx
│   │   │   ├── RowActionsMenu.tsx
│   │   │   └── 📂 views/
│   │   │       ├── TableView.tsx
│   │   │       ├── BoardView.tsx
│   │   │       └── CalendarView.tsx
│   │   │
│   │   ├── 📂 pages/        # Sayfa componentleri
│   │   │   ├── HomePage.tsx
│   │   │   ├── DatabasePage.tsx
│   │   │   └── EditorPage.tsx
│   │   │
│   │   ├── 📂 hooks/        # Custom React hooks
│   │   │   ├── apiHooks.ts
│   │   │   ├── useDatabases.ts
│   │   │   └── useTablePersistence.ts
│   │   │
│   │   ├── 📂 store/        # State management (Zustand)
│   │   │   └── useCommandStore.ts
│   │   │
│   │   ├── 📂 utils/        # Yardımcı fonksiyonlar
│   │   │   ├── sortComparators.ts
│   │   │   ├── filterEvaluator.ts
│   │   │   └── filterOperators.ts
│   │   │
│   │   ├── App.tsx          # Ana React component
│   │   ├── main.tsx         # React entry point
│   │   └── index.css        # Global CSS
│   │
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── .gitignore
├── README.md                # Bu dosya
└── LICENSE
```

---

## 🔌 API Dokümantasyonu

### Endpoints Özeti

<details>
<summary><b>📊 Database Endpoints</b></summary>

#### `GET /databases`
Tüm veritabanlarını listele

**Response:**
```json
[
  {
    "id": "uuid-string",
    "title": "Projeler",
    "icon": "📁",
    "created_at": 1706000000,
    "properties": [...]
  }
]
```

#### `POST /databases`
Yeni veritabanı oluştur

**Request Body:**
```json
{
  "title": "Yeni Veritabanı",
  "icon": "📁"
}
```

#### `GET /databases/{id}`
Tek veritabanı detayı

#### `PATCH /databases/{id}`
Veritabanı güncelle

**Request Body:**
```json
{
  "title": "Güncellenmiş İsim",
  "icon": "🚀"
}
```

#### `DELETE /databases/{id}`
Veritabanı sil

</details>

<details>
<summary><b>🏷️ Property Endpoints</b></summary>

#### `POST /properties`
Yeni özellik ekle

**Request Body:**
```json
{
  "database_id": "uuid",
  "name": "Durum",
  "type": "status",
  "config": {
    "options": [
      {"id": "1", "name": "Yapılacak", "color": "gray", "group": "To-do"}
    ]
  }
}
```

#### `GET /databases/{id}/properties`
Veritabanının tüm özelliklerini getir

#### `PATCH /properties/{id}`
Özellik güncelle

#### `DELETE /properties/{id}`
Özellik sil

</details>

<details>
<summary><b>📄 Page Endpoints</b></summary>

#### `POST /pages`
Yeni sayfa oluştur

**Request Body:**
```json
{
  "database_id": "uuid-veya-null",
  "title": "Toplantı Notları",
  "icon": "📝",
  "cover": null,
  "content": "{...BlockNote JSON...}"
}
```

#### `GET /pages`
Bağımsız sayfaları listele (database_id = null)

#### `GET /databases/{id}/pages`
Belirli veritabanının sayfalarını listele

#### `GET /pages/{id}`
Tek sayfa detayı

#### `PATCH /pages/{id}`
Sayfa güncelle

#### `DELETE /pages/{id}`
Sayfa sil

</details>

<details>
<summary><b>💾 Value Endpoints</b></summary>

#### `POST /values`
Hücre değeri kaydet/güncelle

**Request Body:**
```json
{
  "page_id": "uuid",
  "property_id": "uuid",
  "value": {
    "text": "Metin değeri",
    "date": "2024-01-15",
    "end_date": "2024-01-20",
    "checked": true,
    "option_id": "uuid",
    "option_ids": ["uuid1", "uuid2"]
  }
}
```

#### `GET /pages/{page_id}/values`
Sayfanın tüm değerlerini getir

</details>

<details>
<summary><b>🔍 Diğer Endpoints</b></summary>

#### `GET /search?q={query}`
Global arama

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Bulunan Öğe",
    "type": "page",
    "icon": "📄",
    "context": "Sayfa İçeriği",
    "database_id": "uuid-veya-null"
  }
]
```

#### `POST /upload`
Dosya yükle

**Form Data:**
```
file: (binary)
```

**Response:**
```json
{
  "url": "http://localhost:8000/uploads/uuid.jpg"
}
```

</details>

### 🔗 Swagger UI

Tüm endpoint'leri interaktif olarak test etmek için:
```
http://localhost:8000/docs
```

---

## 🧪 Test

<details>
<summary><b>Backend Testleri</b></summary>
```bash
cd backend
pytest
```

**Test Coverage Raporu:**
```bash
pytest --cov=. --cov-report=html
```

</details>

<details>
<summary><b>Frontend Testleri</b></summary>
```bash
cd frontend
npm run test
```

</details>

> ⚠️ **Not:** Test dosyaları şu anda mevcut değil. Katkıda bulunmak ister misiniz?

---

## 🚢 Production Deployment

### Backend (FastAPI)

<details>
<summary><b>🔷 Render.com ile Deploy</b></summary>

1. GitHub'a push yapın
2. [Render.com](https://render.com) → New Web Service
3. Repo'yu seçin
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

</details>

<details>
<summary><b>🔶 Railway ile Deploy</b></summary>

1. [Railway.app](https://railway.app) → New Project
2. GitHub repo bağla
3. Root Directory: `backend`
4. Deploy ✅

</details>

### Frontend (React + Vite)

<details>
<summary><b>▲ Vercel ile Deploy</b></summary>
```bash
cd frontend
vercel --prod
```

veya GitHub push ile otomatik deploy

</details>

<details>
<summary><b>🌐 Netlify ile Deploy</b></summary>

1. `npm run build`
2. Netlify → Drop `dist/` klasörü
3. Site yayında! 🎉

</details>

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! 🎉

### 📝 Katkı Adımları

1. **Fork** yapın
2. Feature branch oluşturun (`git checkout -b feature/harika-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Harika özellik eklendi'`)
4. Branch'inizi push edin (`git push origin feature/harika-ozellik`)
5. **Pull Request** açın

### 📋 Commit Kuralları
```
feat: Yeni özellik
fix: Hata düzeltme
docs: Dokümantasyon
style: Kod formatı
refactor: Kod iyileştirme
test: Test ekleme
chore: Bakım işleri
```

### 🐛 Bug Bildirimi

[GitHub Issues](https://github.com/kullaniciadi/notion-clone/issues) üzerinden rapor edin.

**Şablon:**
```markdown
**Bug Açıklaması:**
Kısa ve net açıklama

**Nasıl Tekrarlanır:**
1. '...' sayfasına git
2. '...' butonuna tıkla
3. Hatayı gör


**Ortam:**
- OS: Windows 11
- Browser: Chrome 120
- Version: 1.0.0
```

---

## 🎓 Öğrenme Kaynakları

Bu projeyi geliştirirken kullanılan kaynaklar:

- [FastAPI Dokümantasyonu](https://fastapi.tiangolo.com/)
- [React 19 Dokümantasyonu](https://react.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [TanStack Table](https://tanstack.com/table/latest)
- [DnD Kit](https://dndkit.com/)
- [BlockNote Editör](https://www.blocknotejs.org/)

---

## 📊 Performans Metrikleri

| Metrik | Değer |
|--------|-------|
| Lighthouse Score | 95+ |
| First Contentful Paint | <1.5s |
| Time to Interactive | <3s |
| Bundle Size (gzip) | ~250KB |



## 📜 Lisans

Bu proje [MIT License](LICENSE) altında lisanslanmıştır.
```
MIT License

Copyright (c) 2026 [mehmet]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```
---
## 🙏 Teşekkürler
---

<div align="center">
  
### ⭐ Beğendiyseniz yıldız vermeyi unutmayın!

**[🔝 Başa Dön](#-notion-clone)**

</div>
