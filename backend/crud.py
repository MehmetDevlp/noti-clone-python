from sqlalchemy.orm import Session
import models, schemas
import uuid
from datetime import datetime # Bu import eklendi

# --- DATABASE ---
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

# --- PROPERTY ---
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

# --- PAGE ---
def get_pages(db: Session, db_id: str):
    return db.query(models.Page).filter(models.Page.parent_id == db_id).all()

def create_page(db: Session, page: schemas.PageCreate):
    db_page = models.Page(id=str(uuid.uuid4()), **page.dict())
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

# --- VALUE ---
def get_property_value(db: Session, page_id: str, property_id: str):
    return db.query(models.Value).filter(models.Value.page_id == page_id, models.Value.property_id == property_id).first()

def get_page_values(db: Session, page_id: str):
    return db.query(models.Value).filter(models.Value.page_id == page_id).all()

def set_property_value(db: Session, value_data: schemas.PropertyValueSet):
    db_value = db.query(models.Value).filter(
        models.Value.page_id == value_data.page_id,
        models.Value.property_id == value_data.property_id
    ).first()

    val = value_data.value

    if not db_value:
        db_value = models.Value(
            page_id=value_data.page_id, 
            property_id=value_data.property_id
        )
        db.add(db_value)
    
    # --- GÜNCELLEME: Tarih String -> Datetime Dönüşümü ---
    if 'text' in val: db_value.text = val['text']
    
    # Tarih (Date)
    if 'date' in val:
        d = val['date']
        if isinstance(d, str): # Eğer string gelirse (örn: "2026-01-18") datetime'a çevir
            try:
                db_value.date = datetime.fromisoformat(d.replace('Z', '+00:00'))
            except ValueError:
                # Basit YYYY-MM-DD formatı için fallback
                try:
                    db_value.date = datetime.strptime(d, "%Y-%m-%d")
                except:
                    db_value.date = None
        else:
            db_value.date = d

    # Bitiş Tarihi (End Date)
    if 'end_date' in val:
        d = val['end_date']
        if isinstance(d, str):
            try:
                db_value.end_date = datetime.fromisoformat(d.replace('Z', '+00:00'))
            except ValueError:
                try:
                    db_value.end_date = datetime.strptime(d, "%Y-%m-%d")
                except:
                    db_value.end_date = None
        else:
            db_value.end_date = d

    if 'checked' in val: db_value.checked = val['checked']
    if 'option_id' in val: db_value.option_id = val['option_id']
    if 'option_ids' in val: db_value.option_ids = val['option_ids']
    
    db.commit()
    db.refresh(db_value)
    return db_value