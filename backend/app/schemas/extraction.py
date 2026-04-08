from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime

class SourceCreate(BaseModel):
    name: str
    type: str = "website"
    url: str
    sector: str
    crawl_depth: int = 2

class SourceOut(BaseModel):
    id: uuid.UUID
    name: str
    type: str
    url: str
    sector: str
    status: str
    last_run: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class ExtractedContactOut(BaseModel):
    id: uuid.UUID
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    organization: Optional[str]
    sector: Optional[str]
    confidence_score: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
