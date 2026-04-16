from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

class TemplateCreate(BaseModel):
    name: str
    subject: str
    body_html: str
    variables: Optional[List[str]] = []

class TemplateUpdate(TemplateCreate):
    pass

class TemplateOut(BaseModel):
    id: uuid.UUID
    name: str
    subject: str
    body_html: str
    variables: Optional[List] = []
    created_at: datetime

    class Config:
        from_attributes = True
