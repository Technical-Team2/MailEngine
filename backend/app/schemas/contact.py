from pydantic import BaseModel, EmailStr
from typing import Optional, List
import uuid
from datetime import datetime

class SectorCreate(BaseModel):
    name: str

class SectorOut(BaseModel):
    id: uuid.UUID
    name: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    organization: Optional[str] = None
    sector_id: Optional[uuid.UUID] = None
    type: str = "prospect"
    tags: Optional[List[str]] = []

class ContactUpdate(ContactCreate):
    pass

class ContactOut(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    phone: Optional[str]
    organization: Optional[str]
    sector_id: Optional[uuid.UUID]
    type: str
    status: str
    tags: Optional[List] = []
    created_at: datetime

    class Config:
        from_attributes = True
