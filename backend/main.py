from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models
import schemas
import crud
from database import engine, get_db

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Notion Clone API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== DATABASE ENDPOINTS ==========

@app.post("/databases", response_model=schemas.DatabaseResponse)
def create_database(database: schemas.DatabaseCreate, db: Session = Depends(get_db)):
    return crud.create_database(db, database)

@app.get("/databases", response_model=list[schemas.DatabaseResponse])
def list_databases(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_databases(db, skip, limit)

@app.get("/databases/{database_id}", response_model=schemas.DatabaseResponse)
def get_database(database_id: str, db: Session = Depends(get_db)):
    db_database = crud.get_database(db, database_id)
    if not db_database:
        raise HTTPException(status_code=404, detail="Database not found")
    return db_database

@app.delete("/databases/{database_id}")
def delete_database(database_id: str, db: Session = Depends(get_db)):
    success = crud.delete_database(db, database_id)
    if not success:
        raise HTTPException(status_code=404, detail="Database not found")
    return {"message": "Database deleted"}

# ========== PROPERTY ENDPOINTS ==========

@app.post("/properties", response_model=schemas.PropertyResponse)
def create_property(prop: schemas.PropertyCreate, db: Session = Depends(get_db)):
    return crud.create_property(db, prop)

@app.get("/properties/{property_id}", response_model=schemas.PropertyResponse)
def get_property(property_id: str, db: Session = Depends(get_db)):
    db_property = crud.get_property(db, property_id)
    if not db_property:
        raise HTTPException(status_code=404, detail="Property not found")
    return db_property

@app.get("/databases/{database_id}/properties", response_model=list[schemas.PropertyResponse])
def list_properties(database_id: str, db: Session = Depends(get_db)):
    return crud.get_properties(db, database_id)

@app.patch("/properties/{property_id}", response_model=schemas.PropertyResponse)
def update_property(property_id: str, updates: schemas.PropertyUpdate, db: Session = Depends(get_db)):
    db_property = crud.update_property(db, property_id, updates)
    if not db_property:
        raise HTTPException(status_code=404, detail="Property not found")
    return db_property

@app.delete("/properties/{property_id}")
def delete_property(property_id: str, db: Session = Depends(get_db)):
    success = crud.delete_property(db, property_id)
    if not success:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"message": "Property deleted"}

# ========== PAGE ENDPOINTS ==========

@app.post("/pages", response_model=schemas.PageResponse)
def create_page(page: schemas.PageCreate, db: Session = Depends(get_db)):
    return crud.create_page(db, page)

@app.get("/pages", response_model=list[schemas.PageResponse])
def list_root_pages(db: Session = Depends(get_db)):
    return crud.get_root_pages(db)

@app.get("/pages/{page_id}", response_model=schemas.PageResponse)
def get_page(page_id: str, db: Session = Depends(get_db)):
    db_page = crud.get_page(db, page_id)
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found")
    return db_page

@app.get("/databases/{database_id}/pages", response_model=list[schemas.PageResponse])
def list_pages(database_id: str, db: Session = Depends(get_db)):
    return crud.get_pages(db, database_id)

@app.patch("/pages/{page_id}", response_model=schemas.PageResponse)
def update_page(page_id: str, updates: schemas.PageUpdate, db: Session = Depends(get_db)):
    db_page = crud.update_page(db, page_id, updates)
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found")
    return db_page

@app.delete("/pages/{page_id}")
def delete_page(page_id: str, db: Session = Depends(get_db)):
    success = crud.delete_page(db, page_id)
    if not success:
        raise HTTPException(status_code=404, detail="Page not found")
    return {"message": "Page deleted"}

# ========== PAGE PROPERTY VALUE ENDPOINTS ==========

@app.post("/values", response_model=schemas.PropertyValueResponse)
def set_value(value_data: schemas.PropertyValueSet, db: Session = Depends(get_db)):
    return crud.set_property_value(db, value_data)

@app.get("/values/{page_id}/{property_id}", response_model=schemas.PropertyValueResponse)
def get_value(page_id: str, property_id: str, db: Session = Depends(get_db)):
    db_value = crud.get_property_value(db, page_id, property_id)
    if not db_value:
        raise HTTPException(status_code=404, detail="Value not found")
    return db_value

@app.get("/pages/{page_id}/values", response_model=list[schemas.PropertyValueResponse])
def list_page_values(page_id: str, db: Session = Depends(get_db)):
    return crud.get_page_values(db, page_id)

@app.get("/")
def root():
    return {"message": "Notion Clone API", "version": "1.0.0", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.patch("/databases/{database_id}")
def update_database(database_id: str, update: schemas.DatabaseUpdate, db: Session = Depends(get_db)):
    # Bak buraya 'schemas.' ekledik, sorun çözüldü!
    db_item = db.query(models.Database).filter(models.Database.id == database_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Database not found")
    
    if update.title is not None:
        db_item.title = update.title
    if update.icon is not None:
        db_item.icon = update.icon
        
    db.commit()
    db.refresh(db_item)
    return db_item
@app.get("/search")
def search_items(q: str, db: Session = Depends(get_db)):
    if not q:
        return []
    return crud.search_everything(db, q)