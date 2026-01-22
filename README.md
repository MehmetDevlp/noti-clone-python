# noti-clone-python
React, TypeScript ve FastAPI kullanılarak geliştirilmiş; modern, hızlı ve tamamen kişiselleştirilebilir bir üretkenlik ve not alma uygulaması. Bu proje, blok tabanlı editör yapısı ve dinamik veritabanı özellikleri sunar.

🚀 Özellikler
🗂️ Gelişmiş Veritabanı Yönetimi
Dinamik Özellikler (Properties): Metin, Sayı, Seçim (Select), Çoklu Seçim (Multi-select), Durum (Status), Tarih, Öncelik ve Onay Kutusu gibi veri tipleri oluşturabilme.

Çoklu Görünüm (Views): Verilerinizi ihtiyacınıza göre yönetin:

Tablo Görünümü: Excel benzeri satır/sütun yapısı. Sütunları sürükleyip bırakarak (Drag & Drop) yeniden sıralama, genişletme ve filtreleme.

Pano (Board) Görünümü: Kanban tarzı sürükle-bırak görev yönetimi.

Takvim Görünümü: Tarih bazlı etkinlik ve görev takibi.

Filtreleme ve Sıralama: Gelişmiş filtreleme seçenekleri ve sıralama algoritmaları.

✍️ Zengin Metin Editörü (Block-Based)
Blok Yapısı: Notion benzeri / komutları ile başlık, liste, yapılacaklar listesi, resim ve daha fazlasını ekleme.

Medya Desteği: Görsel yükleme ve yerleştirme.

Anlık Kayıt: Yazdıklarınız otomatik olarak kaydedilir.

🎨 Kişiselleştirme & UI/UX
Kapak Resimleri: Hazır gradyanlar, özel renkler veya kendi yüklediğiniz resimlerle sayfa kapaklarını özelleştirme.

İkon Seçici: Her sayfa ve veritabanı için emoji tabanlı ikon seçimi.

Karanlık Mod (Dark Mode): Göz yormayan, modern koyu tema.

Sürükle & Bırak: Kanban kartları ve tablo sütunları için pürüzsüz sürükle-bırak deneyimi.

🏠 Pano (Dashboard) & Navigasyon
Akıllı Ana Sayfa: Saate göre değişen karşılama mesajı (Günaydın/Tünaydın), favori sayfalar ve son ziyaret edilenler geçmişi.

Kenar Çubuğu (Sidebar): Hızlı erişim, sayfa ağacı, favoriler ve çöp kutusu yönetimi.

Hızlı Arama: Ctrl + K ile tüm sayfalarda anında arama yapma (Command Menu).

🛠️ Teknolojiler
Bu proje modern web teknolojileri kullanılarak inşa edilmiştir:

Frontend:

React: UI Kütüphanesi

TypeScript: Tip güvenliği

Vite: Hızlı geliştirme ortamı ve build aracı

Tailwind CSS: Stil ve tasarım

TanStack Query (React Query): Sunucu durumu yönetimi ve caching

TanStack Table: Headless tablo yönetimi

BlockNote: Notion tarzı editör motoru

dnd-kit: Sürükle ve bırak işlemleri

Zustand: Global state yönetimi

Backend:

Python: Programlama dili

FastAPI: Yüksek performanslı web framework'ü

SQLAlchemy: ORM (Veritabanı yönetimi)

SQLite: Veritabanı (Kolay taşınabilirlik için)

Pydantic: Veri doğrulama

⚙️ Kurulum ve Çalıştırma
Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin.

Ön Hazırlık
Bilgisayarınızda Node.js ve Python yüklü olmalıdır.

Projeyi bilgisayarınıza indirin (Clone):

Bash

git clone https://github.com/KULLANICI_ADINIZ/PROJE_ADINIZ.git
cd PROJE_ADINIZ
1. Backend Kurulumu (Sunucu)
Terminali açın ve backend klasörüne gidin:

cd backend
Sanal ortam (Virtual Environment) oluşturun ve aktif edin:

# Windows için:
python -m venv venv
venv\Scripts\activate

# Mac/Linux için:
python3 -m venv venv
source venv/bin/activate
Gerekli kütüphaneleri yükleyin:


pip install -r requirements.txt
Sunucuyu başlatın:

uvicorn main:app --reload
Backend şu adreste çalışacaktır: http://localhost:8000

2. Frontend Kurulumu (Arayüz)
Yeni bir terminal açın ve frontend klasörüne gidin:

cd frontend
Gerekli paketleri yükleyin:

npm install
Önemli: API bağlantısı için .env dosyasını oluşturun. frontend klasörü içindeyken:

.env adında bir dosya oluşturun.

İçine şu satırı yapıştırın:

VITE_API_URL=http://localhost:8000

Uygulamayı başlatın:

npm run dev
Uygulama şu adreste çalışacaktır: http://localhost:5173 (veya terminalde belirtilen port)
