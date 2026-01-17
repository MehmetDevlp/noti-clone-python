from sqlalchemy import Column, String, Integer, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import uuid
import time

def generate_id():
    return str(uuid.uuid4())

def current_timestamp():
    return int(time.time())

class Database(Base):
    __tablename__ = "databases"
    
    id = Column(String, primary_key=True, default=generate_id)
    title = Column(String, nullable=False)
    icon = Column(String, nullable=True)
    parent_page_id = Column(String, nullable=True)
    created_at = Column(Integer, default=current_timestamp)
    updated_at = Column(Integer, default=current_timestamp, onupdate=current_timestamp)
    
    properties = relationship("DatabaseProperty", back_populates="database", cascade="all, delete-orphan")
    pages = relationship("Page", back_populates="database", cascade="all, delete-orphan")

class DatabaseProperty(Base):
    __tablename__ = "database_properties"
    
    id = Column(String, primary_key=True, default=generate_id)
    database_id = Column(String, ForeignKey("databases.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    config = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=False)
    visible = Column(Boolean, default=True)
    created_at = Column(Integer, default=current_timestamp)
    updated_at = Column(Integer, default=current_timestamp, onupdate=current_timestamp)
    
    database = relationship("Database", back_populates="properties")
    values = relationship("PageProperty", back_populates="property", cascade="all, delete-orphan")

class Page(Base):
    __tablename__ = "pages"
    
    id = Column(String, primary_key=True, default=generate_id)
    parent_id = Column(String, ForeignKey("databases.id", ondelete="CASCADE"), nullable=False)
    parent_type = Column(String, default="database")
    title = Column(String, nullable=False, default="Untitled")
    icon = Column(String, nullable=True)
    content = Column(Text, nullable=True, default="[]") # BU SÜTUN ŞART
    created_at = Column(Integer, default=current_timestamp)
    updated_at = Column(Integer, default=current_timestamp, onupdate=current_timestamp)
    
    database = relationship("Database", back_populates="pages")
    properties = relationship("PageProperty", back_populates="page", cascade="all, delete-orphan")

class PageProperty(Base):
    __tablename__ = "page_properties"
    
    id = Column(String, primary_key=True, default=generate_id)
    page_id = Column(String, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    property_id = Column(String, ForeignKey("database_properties.id", ondelete="CASCADE"), nullable=False)
    value = Column(Text, nullable=True)
    
    page = relationship("Page", back_populates="properties")
    property = relationship("DatabaseProperty", back_populates="values")