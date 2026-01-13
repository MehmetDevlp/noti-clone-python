from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

# ========== DATABASE SCHEMAS ==========

class DatabaseCreate(BaseModel):
    title: str
    icon: Optional[str] = None
    parent_page_id: Optional[str] = None

class DatabaseResponse(BaseModel):
    id: str
    title: str
    icon: Optional[str]
    parent_page_id: Optional[str]
    created_at: int
    updated_at: int
    
    class Config:
        from_attributes = True

# ========== PROPERTY SCHEMAS ==========

class PropertyCreate(BaseModel):
    database_id: str
    name: str
    type: str  # 'text', 'number', 'select', 'multi_select', 'date', 'checkbox', 'status'
    config: Optional[dict] = {}
    order_index: int = 0
    visible: bool = True

class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    config: Optional[dict] = None
    order_index: Optional[int] = None
    visible: Optional[bool] = None

class PropertyResponse(BaseModel):
    id: str
    database_id: str
    name: str
    type: str
    config: Optional[str]  # JSON string
    order_index: int
    visible: bool
    created_at: int
    updated_at: int
    
    class Config:
        from_attributes = True

# ========== PAGE SCHEMAS ==========

class PageCreate(BaseModel):
    parent_id: str  # database_id
    title: str = "Untitled"
    icon: Optional[str] = None

class PageUpdate(BaseModel):
    title: Optional[str] = None
    icon: Optional[str] = None

class PageResponse(BaseModel):
    id: str
    parent_id: str
    parent_type: str
    title: str
    icon: Optional[str]
    created_at: int
    updated_at: int
    
    class Config:
        from_attributes = True

# ========== PAGE PROPERTY (VALUE) SCHEMAS ==========

class PropertyValueSet(BaseModel):
    page_id: str
    property_id: str
    value: Any  # Can be dict, string, number, etc.

class PropertyValueResponse(BaseModel):
    id: str
    page_id: str
    property_id: str
    value: Optional[str]  # JSON string
    
    class Config:
        from_attributes = True