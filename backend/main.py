from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
import models
import schemas
import crud
from database import engine, get_db
import shutil
import os
import sys
import uuid
import threading
import uvicorn
import webview  # <--- YENİ EKLENEN KÜTÜPHANE

# --- PATH VE KONFİGÜRASYON AYARLARI ---

if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
    RESOURCE_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    RESOURCE_DIR = BASE_DIR

UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

DIST_DIR = os.path.join(RESOURCE_DIR, "static")

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Notion Clone API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

if os.path.exists(os.path.join(DIST_DIR, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

# ========== DATABASE ENDPOINTS (Aynı kalıyor) ==========

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

@app.patch("/databases/{database_id}")
def update_database(database_id: str, update: schemas.DatabaseUpdate, db: Session = Depends(get_db)):
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

@app.get("/search")
def search_items(q: str, db: Session = Depends(get_db)):
    if not q:
        return []
    return crud.search_everything(db, q)

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Geçersiz dosya türü.")
    file_ext = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hata: {str(e)}")
    file_url = f"http://127.0.0.1:8000/uploads/{unique_filename}"
    return {"url": file_url}

@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    if full_path.startswith("api") or full_path.startswith("uploads"):
        return JSONResponse(status_code=404, content={"message": "Not Found"})
    file_path = os.path.join(DIST_DIR, full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Frontend not found"}

# ========== MASAÜSTÜ PENCERE BAŞLATMA AYARLARI ==========

def start_server():
    """FastAPI Sunucusunu Başlatır (Arka Planda)"""
    # Exe modunda konsol çıktısını kapat (Hata vermemesi için)
    if getattr(sys, 'frozen', False):
        sys.stdout = open(os.devnull, "w")
        sys.stderr = open(os.devnull, "w")
    
    # 127.0.0.1 kullanarak başlatıyoruz
    uvicorn.run(app, host="127.0.0.1", port=8000, log_config=None)

if __name__ == "__main__":
    # 1. Sunucuyu ayrı bir thread'de (iş parçacığında) başlat
    t = threading.Thread(target=start_server)
    t.daemon = True
    t.start()

    # 2. Masaüstü penceresini oluştur ve aç
    webview.create_window(
        title='Notion Clone', 
        url='http://127.0.0.1:8000',
        width=1200,
        height=800,
        resizable=True
    )
    
    # Uygulamayı başlat
    webview.start()