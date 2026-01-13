from sqlalchemy.orm import Session
import models
import schemas
import json

# ========== DATABASE CRUD ==========

def create_database(db: Session, database: schemas.DatabaseCreate):
    db_database = models.Database(
        title=database.title,
        icon=database.icon,
        parent_page_id=database.parent_page_id
    )
    db.add(db_database)
    db.commit()
    db.refresh(db_database)
    return db_database

def get_database(db: Session, database_id: str):
    return db.query(models.Database).filter(models.Database.id == database_id).first()

def get_databases(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Database).offset(skip).limit(limit).all()

def delete_database(db: Session, database_id: str):
    db_database = get_database(db, database_id)
    if db_database:
        db.delete(db_database)
        db.commit()
        return True
    return False

# ========== PROPERTY CRUD ==========

def create_property(db: Session, prop: schemas.PropertyCreate):
    db_property = models.DatabaseProperty(
        database_id=prop.database_id,
        name=prop.name,
        type=prop.type,
        config=json.dumps(prop.config) if prop.config else None,
        order_index=prop.order_index,
        visible=prop.visible
    )
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return db_property

def get_property(db: Session, property_id: str):
    return db.query(models.DatabaseProperty).filter(models.DatabaseProperty.id == property_id).first()

def get_properties(db: Session, database_id: str):
    return db.query(models.DatabaseProperty).filter(
        models.DatabaseProperty.database_id == database_id
    ).order_by(models.DatabaseProperty.order_index).all()

def update_property(db: Session, property_id: str, updates: schemas.PropertyUpdate):
    db_property = get_property(db, property_id)
    if not db_property:
        return None
    
    update_data = updates.model_dump(exclude_unset=True)
    
    # Handle config separately (needs JSON encoding)
    if 'config' in update_data and update_data['config'] is not None:
        update_data['config'] = json.dumps(update_data['config'])
    
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

def create_page(db: Session, page: schemas.PageCreate):
    db_page = models.Page(
        parent_id=page.parent_id,
        title=page.title,
        icon=page.icon
    )
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page

def get_page(db: Session, page_id: str):
    return db.query(models.Page).filter(models.Page.id == page_id).first()

def get_pages(db: Session, database_id: str):
    return db.query(models.Page).filter(models.Page.parent_id == database_id).all()

def update_page(db: Session, page_id: str, updates: schemas.PageUpdate):
    db_page = get_page(db, page_id)
    if not db_page:
        return None
    
    update_data = updates.model_dump(exclude_unset=True)
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

# ========== PAGE PROPERTY (VALUE) CRUD ==========

def set_property_value(db: Session, value_data: schemas.PropertyValueSet):
    # Check if value already exists
    db_value = db.query(models.PageProperty).filter(
        models.PageProperty.page_id == value_data.page_id,
        models.PageProperty.property_id == value_data.property_id
    ).first()
    
    value_json = json.dumps(value_data.value) if value_data.value is not None else None
    
    if db_value:
        # Update existing
        db_value.value = value_json
    else:
        # Create new
        db_value = models.PageProperty(
            page_id=value_data.page_id,
            property_id=value_data.property_id,
            value=value_json
        )
        db.add(db_value)
    
    db.commit()
    db.refresh(db_value)
    return db_value

def get_property_value(db: Session, page_id: str, property_id: str):
    return db.query(models.PageProperty).filter(
        models.PageProperty.page_id == page_id,
        models.PageProperty.property_id == property_id
    ).first()

def get_page_values(db: Session, page_id: str):
    return db.query(models.PageProperty).filter(
        models.PageProperty.page_id == page_id
    ).all()