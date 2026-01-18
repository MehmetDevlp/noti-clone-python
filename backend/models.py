from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Database(Base):
    __tablename__ = "databases"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    icon = Column(String, nullable=True)
    created_at = Column(Integer, default=lambda: int(datetime.datetime.now().timestamp()))
    properties = relationship("Property", back_populates="database", cascade="all, delete-orphan")
    pages = relationship("Page", back_populates="database", cascade="all, delete-orphan")

class Property(Base):
    __tablename__ = "properties"
    id = Column(String, primary_key=True, index=True)
    database_id = Column(String, ForeignKey("databases.id"))
    name = Column(String)
    type = Column(String) # 'text', 'select', 'multi_select', 'status', 'date', 'checkbox'
    config = Column(JSON, nullable=True)
    order_index = Column(Integer, default=0)
    visible = Column(Boolean, default=True)
    database = relationship("Database", back_populates="properties")
    values = relationship("Value", back_populates="property", cascade="all, delete-orphan")

class Page(Base):
    __tablename__ = "pages"
    id = Column(String, primary_key=True, index=True)
    parent_id = Column(String, ForeignKey("databases.id"))
    title = Column(String)
    icon = Column(String, nullable=True)
    cover = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    created_at = Column(Integer, default=lambda: int(datetime.datetime.now().timestamp()))
    database = relationship("Database", back_populates="pages")
    values = relationship("Value", back_populates="page", cascade="all, delete-orphan")

class Value(Base):
    __tablename__ = "values"
    id = Column(Integer, primary_key=True, index=True)
    page_id = Column(String, ForeignKey("pages.id"))
    property_id = Column(String, ForeignKey("properties.id"))
    
    # Değer alanları (Frontend ile aynı isimlerde)
    text = Column(Text, nullable=True)
    date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True) # YENİ
    checked = Column(Boolean, default=False)
    option_id = Column(String, nullable=True)
    option_ids = Column(JSON, nullable=True)
    
    page = relationship("Page", back_populates="values")
    property = relationship("Property", back_populates="values")