from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime

class RecipientFilter(BaseModel):
    type: Optional[str] = None       # "customer" | "prospect" | None (all)
    sector_id: Optional[uuid.UUID] = None
    contact_ids: Optional[List[uuid.UUID]] = None

class CampaignCreate(BaseModel):
    name: str
    template_id: uuid.UUID
    type: str = "promotional"
    scheduled_at: Optional[datetime] = None
    recipient_filter: Optional[RecipientFilter] = None
    cc_emails: Optional[List[str]] = []

class CampaignOut(BaseModel):
    id: uuid.UUID
    name: str
    type: str
    status: str
    scheduled_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
