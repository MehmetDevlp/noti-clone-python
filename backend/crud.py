from sqlalchemy.orm import Session
import models, schemas
import uuid
from datetime import datetime # Bu import çok önemli, eksik olursa çalışmaz

# --- YARDIMCI FONKSİYON: GÜVENLİ TARİH ÇEVİRİCİ ---
def safe_parse_date(date_val):
    """
    Gelen tarih verisini (String) güvenli bir şekilde Python tarih objesine (datetime) çevirir.
    Hata alırsan veya boş gelirse sunucuyu çökertmez, None (Boş) döner.
    """
    if not date_val:
        return None
    
    # Zaten tarih objesiyse elleme
    if isinstance(date_val, datetime):
        return date_val
    
    # String ise çevirmeye çalış
    if isinstance(date_val, str):
        if not date_val.strip(): # Boş string ise ("")
            return None
        try:
            # Format 1: 2023-01-01T12:00:00 (ISO)
            return datetime.fromisoformat(date_val.replace('Z', '+00:00'))
        except ValueError:
            try:
                # Format 2: 2023-01-01 (Sadece Gün)
                return datetime.strptime(date_val, "%Y-%m-%d")
            except ValueError:
                print(f"UYARI: Tarih formatı anlaşılamadı, boş kaydediliyor: {date_val}")
                return None
    return None

# =======================
# VERİTABANI İŞLEMLERİ
# =======================

def get_databases(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Database).offset(skip).limit(limit).all()

def create_database(db: Session, database: schemas.DatabaseCreate):
    db_db = models.Database(id=str(uuid.uuid4()), title=database.title, icon=database.icon)
    db.add(db_db)
    db.commit()
    db.refresh(db_db)
    return db_db

def get_database(db: Session, db_id: str):
    return db.query(models.Database).filter(models.Database.id == db_id).first()

def delete_database(db: Session, db_id: str):
    db_db = db.query(models.Database).filter(models.Database.id == db_id).first()
    if db_db:
        db.delete(db_db)
        db.commit()
        return True
    return False

# =======================
# ÖZELLİK (PROPERTY) İŞLEMLERİ
# =======================

def get_properties(db: Session, db_id: str):
    return db.query(models.Property).filter(models.Property.database_id == db_id).all()

def get_property(db: Session, prop_id: str):
    return db.query(models.Property).filter(models.Property.id == prop_id).first()

def create_property(db: Session, prop: schemas.PropertyCreate):
    db_prop = models.Property(id=str(uuid.uuid4()), **prop.dict())
    db.add(db_prop)
    db.commit()
    db.refresh(db_prop)
    return db_prop

def update_property(db: Session, prop_id: str, updates: schemas.PropertyUpdate):
    db_prop = db.query(models.Property).filter(models.Property.id == prop_id).first()
    if not db_prop: return None
    for k, v in updates.dict(exclude_unset=True).items(): setattr(db_prop, k, v)
    db.commit()
    db.refresh(db_prop)
    return db_prop

def delete_property(db: Session, prop_id: str):
    db.query(models.Property).filter(models.Property.id == prop_id).delete()
    db.commit()
    return True

# =======================
# SAYFA (PAGE) İŞLEMLERİ
# =======================

def get_pages(db: Session, db_id: str):
    # Veritabanına bağlı sayfalar
    return db.query(models.Page).filter(models.Page.database_id == db_id).all()

def get_root_pages(db: Session):
    # Bağımsız sayfalar (Sidebar için)
    return db.query(models.Page).filter(models.Page.database_id == None).all()

def create_page(db: Session, page: schemas.PageCreate):
    db_page = models.Page(
        id=str(uuid.uuid4()), 
        database_id=page.database_id, # parent_id yerine database_id
        title=page.title,
        icon=page.icon,
        cover=page.cover,
        content=page.content
    )
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page

def get_page(db: Session, page_id: str):
    return db.query(models.Page).filter(models.Page.id == page_id).first()

def update_page(db: Session, page_id: str, updates: schemas.PageUpdate):
    db_page = db.query(models.Page).filter(models.Page.id == page_id).first()
    if not db_page: return None
    for k, v in updates.dict(exclude_unset=True).items(): setattr(db_page, k, v)
    db.commit()
    db.refresh(db_page)
    return db_page

def delete_page(db: Session, page_id: str):
    db.query(models.Page).filter(models.Page.id == page_id).delete()
    db.commit()
    return True

# =======================
# DEĞER (VALUE) İŞLEMLERİ (EN ÖNEMLİ KISIM)
# =======================

def get_property_value(db: Session, page_id: str, property_id: str):
    return db.query(models.Value).filter(models.Value.page_id == page_id, models.Value.property_id == property_id).first()

def get_page_values(db: Session, page_id: str):
    return db.query(models.Value).filter(models.Value.page_id == page_id).all()

def set_property_value(db: Session, value_data: schemas.PropertyValueSet):
    # Önce bu sayfa ve özellik için var olan bir değer var mı bakalım
    db_value = db.query(models.Value).filter(
        models.Value.page_id == value_data.page_id,
        models.Value.property_id == value_data.property_id
    ).first()

    val = value_data.value # Frontend'den gelen ham veri (Dict)

    # Eğer değer yoksa yeni oluştur
    if not db_value:
        db_value = models.Value(
            page_id=value_data.page_id, 
            property_id=value_data.property_id
        )
        db.add(db_value)
    
    # --- GÜVENLİ GÜNCELLEME ---
    # Gelen veriyi körü körüne kaydetmek yerine, tek tek kontrol edip işliyoruz.
    
    # 1. Metin (Text)
    if 'text' in val: 
        db_value.text = val['text']
    
    # 2. Tarih (Date) - Çökme riskini önlemek için safe_parse_date kullanıyoruz
    if 'date' in val:
        db_value.date = safe_parse_date(val['date'])

    # 3. Bitiş Tarihi (End Date)
    if 'end_date' in val:
        db_value.end_date = safe_parse_date(val['end_date'])

    # 4. Diğer Alanlar
    if 'checked' in val: 
        db_value.checked = val['checked']
        
    if 'option_id' in val: 
        db_value.option_id = val['option_id']
        
    if 'option_ids' in val: 
        db_value.option_ids = val['option_ids']
    
    db.commit()
    db.refresh(db_value)
    return db_value