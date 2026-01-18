from sqlalchemy.orm import Session
import models
import schemas
import uuid
import datetime

# ========== DATABASE CRUD ==========

def get_database(db: Session, database_id: str):
    return db.query(models.Database).filter(models.Database.id == database_id).first()

def get_databases(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Database).offset(skip).limit(limit).all()

def create_database(db: Session, database: schemas.DatabaseCreate):
    db_database = models.Database(
        id=str(uuid.uuid4()),
        title=database.title,
        icon=database.icon
    )
    db.add(db_database)
    db.commit()
    db.refresh(db_database)
    return db_database

def delete_database(db: Session, database_id: str):
    db_database = db.query(models.Database).filter(models.Database.id == database_id).first()
    if db_database:
        db.delete(db_database)
        db.commit()
        return True
    return False

# ========== PROPERTY CRUD ==========

def get_property(db: Session, property_id: str):
    return db.query(models.Property).filter(models.Property.id == property_id).first()

def get_properties(db: Session, database_id: str):
    return db.query(models.Property).filter(models.Property.database_id == database_id).order_by(models.Property.order_index).all()

def create_property(db: Session, prop: schemas.PropertyCreate):
    db_property = models.Property(
        id=str(uuid.uuid4()),
        database_id=prop.database_id,
        name=prop.name,
        type=prop.type,
        config=prop.config,
        order_index=prop.order_index,
        visible=prop.visible
    )
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return db_property

def update_property(db: Session, property_id: str, updates: schemas.PropertyUpdate):
    db_property = get_property(db, property_id)
    if not db_property:
        return None
    
    update_data = updates.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_property, key, value)
    
    db.commit()
    db.refresh(db_property)
    return db_property

def delete_property(db: Session, property_id: str):
    db_property = get_property(db, property_id)
    if db_property:
        db.delete(db_property)
        db.commit()
        return True
    return False

# ========== PAGE CRUD ==========

def get_page(db: Session, page_id: str):
    return db.query(models.Page).filter(models.Page.id == page_id).first()

def get_pages(db: Session, database_id: str):
    # DÜZELTME: parent_id -> database_id
    return db.query(models.Page).filter(models.Page.database_id == database_id).all()

def create_page(db: Session, page: schemas.PageCreate):
    db_page = models.Page(
        id=str(uuid.uuid4()),
        # DÜZELTME: parent_id -> database_id
        database_id=page.database_id,
        title=page.title,
        icon=page.icon,
        cover=page.cover,
        content=page.content
    )
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page

def update_page(db: Session, page_id: str, updates: schemas.PageUpdate):
    db_page = get_page(db, page_id)
    if not db_page:
        return None
    
    update_data = updates.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_page, key, value)
    
    db.commit()
    db.refresh(db_page)
    return db_page

def delete_page(db: Session, page_id: str):
    db_page = get_page(db, page_id)
    if db_page:
        db.delete(db_page)
        db.commit()
        return True
    return False

# ========== PAGE VALUE CRUD ==========

def get_property_value(db: Session, page_id: str, property_id: str):
    return db.query(models.Value).filter(
        models.Value.page_id == page_id,
        models.Value.property_id == property_id
    ).first()

def get_page_values(db: Session, page_id: str):
    return db.query(models.Value).filter(models.Value.page_id == page_id).all()

def set_property_value(db: Session, value_data: schemas.PropertyValueSet):
    existing_value = get_property_value(db, value_data.page_id, value_data.property_id)
    
    if existing_value:
        for key, val in value_data.value.items():
            if hasattr(existing_value, key):
                setattr(existing_value, key, val)
        db.commit()
        db.refresh(existing_value)
        return existing_value
    else:
        new_value = models.Value(
            page_id=value_data.page_id,
            property_id=value_data.property_id,
            **value_data.value
        )
        db.add(new_value)
        db.commit()
        db.refresh(new_value)
        return new_value
def get_root_pages(db: Session):
    # database_id'si NULL olan (yani bir veritabanına bağlı olmayan) sayfaları getir
    return db.query(models.Page).filter(models.Page.database_id == None).all()