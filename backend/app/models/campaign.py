import uuid
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey("email_templates.id"))
    type = Column(Enum("promotional", "seasonal", name="campaign_type"), default="promotional")
    status = Column(Enum("draft", "scheduled", "sending", "completed", "failed", name="campaign_status"), default="draft")
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    recipients = relationship("CampaignRecipient", back_populates="campaign")
    cc_contacts = relationship("CCContact", back_populates="campaign")

class CampaignRecipient(Base):
    __tablename__ = "campaign_recipients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"), index=True)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), index=True)
    # Snapshot fields (frozen at time of send)
    email_snapshot = Column(String(255))
    name_snapshot = Column(String(200))
    organization_snapshot = Column(String(300))
    status = Column(Enum("pending", "sent", "failed", name="recipient_status"), default="pending")
    sent_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    campaign = relationship("Campaign", back_populates="recipients")

class CCContact(Base):
    __tablename__ = "cc_contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"))
    email = Column(String(255), nullable=False)
    label = Column(String(100))

    campaign = relationship("Campaign", back_populates="cc_contacts")

class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"), index=True)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=True)
    status = Column(String(50))
    response = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
