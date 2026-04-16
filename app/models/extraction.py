import uuid
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Text, Integer, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from ..database import Base

class ExtractionSource(Base):
    __tablename__ = "extraction_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    type = Column(Enum("website", "directory", "document", name="source_type"))
    url = Column(String(1000))
    sector = Column(String(100))
    crawl_depth = Column(Integer, default=2)
    status = Column(Enum("active", "paused", name="source_status"), default="active")
    last_run = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ExtractedContact(Base):
    __tablename__ = "extracted_contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200))
    email = Column(String(255), index=True)
    phone = Column(String(30))
    organization = Column(String(300))
    role = Column(String(150))
    sector = Column(String(100))
    source_id = Column(UUID(as_uuid=True), ForeignKey("extraction_sources.id"))
    confidence_score = Column(Integer, default=0)
    status = Column(Enum("pending", "approved", "rejected", name="extracted_status"), default="pending")
    raw_data = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ExtractionLog(Base):
    __tablename__ = "extraction_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(UUID(as_uuid=True), ForeignKey("extraction_sources.id"))
    run_time = Column(DateTime(timezone=True), server_default=func.now())
    records_found = Column(Integer, default=0)
    records_valid = Column(Integer, default=0)
    status = Column(String(50))
