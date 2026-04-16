from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import uuid
from datetime import datetime
from ..database import get_db
from ..models.campaign import Campaign, CampaignRecipient, CCContact
from ..models.contact import Contact
from ..models.template import EmailTemplate
from ..schemas.campaign import CampaignCreate, CampaignOut, RecipientFilter
from ..utils.security import get_current_user

router = APIRouter(prefix="/campaigns", tags=["campaigns"])

@router.get("", response_model=list[CampaignOut])
def list_campaigns(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Campaign).order_by(Campaign.created_at.desc()).all()

@router.post("", response_model=CampaignOut, status_code=201)
def create_campaign(payload: CampaignCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Validate template exists
    template = db.query(EmailTemplate).filter(EmailTemplate.id == payload.template_id).first()
    if not template:
        raise HTTPException(404, detail="Template not found")

    campaign = Campaign(
        name=payload.name,
        template_id=payload.template_id,
        type=payload.type,
        status="draft",
        scheduled_at=payload.scheduled_at,
        created_by=current_user.id,
    )
    db.add(campaign)
    db.flush()  # get campaign.id before adding recipients

    # Build recipient list from filter (snapshot approach)
    q = db.query(Contact).filter(Contact.status == "active")
    rf = payload.recipient_filter
    if rf:
        if rf.type:
            q = q.filter(Contact.type == rf.type)
        if rf.sector_id:
            q = q.filter(Contact.sector_id == rf.sector_id)
        if rf.contact_ids:
            q = q.filter(Contact.id.in_(rf.contact_ids))

    contacts = q.all()
    for contact in contacts:
        recipient = CampaignRecipient(
            campaign_id=campaign.id,
            contact_id=contact.id,
            email_snapshot=contact.email,
            name_snapshot=contact.name,
            organization_snapshot=contact.organization,
        )
        db.add(recipient)

    # CC contacts
    for email in (payload.cc_emails or []):
        cc = CCContact(campaign_id=campaign.id, email=email)
        db.add(cc)

    db.commit()
    db.refresh(campaign)
    return campaign

@router.get("/{campaign_id}")
def get_campaign(campaign_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(404)

    recipients = db.query(CampaignRecipient).filter(CampaignRecipient.campaign_id == campaign_id).all()
    sent = sum(1 for r in recipients if r.status == "sent")
    failed = sum(1 for r in recipients if r.status == "failed")
    pending = sum(1 for r in recipients if r.status == "pending")

    return {
        "id": str(campaign.id),
        "name": campaign.name,
        "type": campaign.type,
        "status": campaign.status,
        "scheduled_at": campaign.scheduled_at,
        "created_at": campaign.created_at,
        "stats": {
            "total": len(recipients),
            "sent": sent,
            "failed": failed,
            "pending": pending,
        }
    }

@router.post("/{campaign_id}/send")
def send_campaign(campaign_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Queue the campaign for async sending via Celery."""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(404)
    if campaign.status not in ("draft", "scheduled"):
        raise HTTPException(400, detail=f"Cannot send a campaign in '{campaign.status}' status")

    # Dispatch Celery task
    try:
        from ..tasks.campaign_tasks import send_campaign as celery_send
        celery_send.delay(str(campaign_id))
        campaign.status = "sending"
        db.commit()
        return {"message": "Campaign queued for sending", "campaign_id": str(campaign_id)}
    except Exception as e:
        raise HTTPException(500, detail=f"Failed to queue campaign: {str(e)}")

@router.post("/{campaign_id}/recipients", status_code=201)
def add_campaign_recipients(campaign_id: uuid.UUID, payload: RecipientFilter, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Add recipients to an existing campaign."""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(404, detail="Campaign not found")
    
    # Build recipient list from filter
    q = db.query(Contact).filter(Contact.status == "active")
    if payload.type:
        q = q.filter(Contact.type == payload.type)
    if payload.sector_id:
        q = q.filter(Contact.sector_id == payload.sector_id)
    if payload.contact_ids:
        q = q.filter(Contact.id.in_(payload.contact_ids))

    contacts = q.all()
    added = 0
    
    for contact in contacts:
        # Check if already added
        existing = db.query(CampaignRecipient).filter(
            CampaignRecipient.campaign_id == campaign_id,
            CampaignRecipient.contact_id == contact.id
        ).first()
        
        if not existing:
            recipient = CampaignRecipient(
                campaign_id=campaign_id,
                contact_id=contact.id,
                email_snapshot=contact.email,
                name_snapshot=contact.name,
                organization_snapshot=contact.organization,
            )
            db.add(recipient)
            added += 1

    db.commit()
    return {"message": f"Added {added} recipients to campaign", "added": added, "campaign_id": str(campaign_id)}

@router.get("/{campaign_id}/recipients")
def get_campaign_recipients(campaign_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Get all recipients for a campaign."""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(404, detail="Campaign not found")
    
    recipients = db.query(CampaignRecipient).filter(CampaignRecipient.campaign_id == campaign_id).all()
    
    return {
        "campaign_id": str(campaign_id),
        "total_recipients": len(recipients),
        "recipients": [
            {
                "id": str(r.id),
                "email": r.email_snapshot,
                "name": r.name_snapshot,
                "organization": r.organization_snapshot,
                "status": r.status
            }
            for r in recipients
        ]
    }

@router.delete("/{campaign_id}", status_code=204)
def delete_campaign(campaign_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(404)
    if campaign.status == "sending":
        raise HTTPException(400, detail="Cannot delete a campaign that is actively sending")
    db.delete(campaign)
    db.commit()
