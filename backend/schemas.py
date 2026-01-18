from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime

# =======================
# 1. TEMEL DEĞER (VALUE) ŞEMALARI
# =======================
class ValueBase(BaseModel):
    text: Optional[str] = None
    date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    checked: Optional[bool] = None
    option_id: Optional[str] = None
    option_ids: Optional[List[str]] = None

class PropertyValueSet(BaseModel):
    page_id: str
    property_id: str
    value: Dict[str, Any]

class PropertyValueResponse(ValueBase):
    id: int
    page_id: str
    property_id: str

    class Config:
        from_attributes = True

# =======================
# 2. ÖZELLİK (PROPERTY) ŞEMALARI
# =======================
class PropertyBase(BaseModel):
    name: str
    type: str
    config: Optional[Dict[str, Any]] = None
    order_index: int = 0
    visible: bool = True

class PropertyCreate(PropertyBase):
    database_id: str

class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    order_index: Optional[int] = None
    visible: Optional[bool] = None

class PropertyResponse(PropertyBase):
    id: str
    database_id: str
    
    class Config:
        from_attributes = True

# =======================
# 3. SAYFA (PAGE) ŞEMALARI
# =======================
class PageBase(BaseModel):
    title: str
    icon: Optional[str] = None
    cover: Optional[str] = None
    content: Optional[str] = None

class PageCreate(PageBase):
    # DEĞİŞİKLİK: parent_id gitti, database_id geldi ve opsiyonel (None olabilir) oldu.
    database_id: Optional[str] = None

class PageUpdate(BaseModel):
    # Burası aynı kalabilir
    title: Optional[str] = None
    icon: Optional[str] = None
    cover: Optional[str] = None
    content: Optional[str] = None

class PageResponse(PageBase):
    id: str
    # DEĞİŞİKLİK: parent_id yerine database_id
    database_id: Optional[str] = None
    created_at: int
    
    class Config:
        from_attributes = True

# =======================
# 4. VERİTABANI (DATABASE) ŞEMALARI
# =======================
# DİKKAT: Bu en sonda olmalı çünkü PropertyResponse kullanıyor
class DatabaseBase(BaseModel):
    title: str
    icon: Optional[str] = None

class DatabaseCreate(DatabaseBase):
    pass

class DatabaseResponse(DatabaseBase):
    id: str
    created_at: int
    properties: List[PropertyResponse] = []
    
    class Config:
        from_attributes = True