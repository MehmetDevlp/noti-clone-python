from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import sys

# --- PYINSTALLER VE PATH AYARLARI ---

# Uygulamanın çalıştığı ana dizini bul
if getattr(sys, 'frozen', False):
    # Eğer uygulama .exe olarak çalışıyorsa (PyInstaller)
    BASE_DIR = os.path.dirname(sys.executable)
else:
    # Eğer normal python dosyası olarak çalışıyorsa
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Veritabanı için özel klasör oluştur
DB_FOLDER = os.path.join(BASE_DIR, "database")

# Klasör yoksa oluştur
if not os.path.exists(DB_FOLDER):
    os.makedirs(DB_FOLDER)

# Veritabanı dosyasının tam yolu
DB_PATH = os.path.join(DB_FOLDER, "notion.db")

# SQLite database URL'si
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# Engine oluştur
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite için gerekli
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()