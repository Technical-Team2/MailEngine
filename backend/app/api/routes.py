"""
All API route handlers in one organized file.
Split into separate files as the project grows.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List
from datetime import datetime
import io
import re

from app.database import get_db
from app.models import (
    User, Sector, Contact, EmailTemplate, Campaign, CampaignRecipient,
    CCContact, ExtractionSource, ExtractedContact, ExtractionLog,
    ContactType, ContactStatus, CampaignStatus, RecipientStatus
)
from app.schemas import (
    LoginRequest, TokenResponse,
    SectorCreate, SectorOut,
    ContactCreate, ContactUpdate, ContactOut, ImportPreviewResponse,
    TemplateCreate, TemplateUpdate, TemplateOut,
    CampaignCreate, CampaignOut, CampaignRecipientAdd,
    CCContactCreate, CCContactOut,
    ExtractionSourceCreate, ExtractionSourceOut, ExtractedContactOut,
)
from app.utils.auth import (
    verify_password, create_access_token,
    hash_password, get_current_user, require_admin,
)

router = APIRouter()


# ──────────────────────────────────────────────
# AUTH
# ──────────────────────────────────────────────
auth_router = APIRouter(prefix="/auth", tags=["Auth"])

@auth_router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user.id})
    return {
        "access_token": token,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
    }

@auth_router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "name": current_user.name, "email": current_user.email, "role": current_user.role}


# ──────────────────────────────────────────────
# SECTORS
# ──────────────────────────────────────────────
sectors_router = APIRouter(prefix="/sectors", tags=["Sectors"])

@sectors_router.get("", response_model=List[SectorOut])
def list_sectors(status: Optional[str] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(Sector)
    if status:
        q = q.filter(Sector.status == status)
    return q.order_by(Sector.name).all()

@sectors_router.post("", response_model=SectorOut, status_code=201)
def create_sector(body: SectorCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if db.query(Sector).filter(func.lower(Sector.name) == body.name.lower()).first():
        raise HTTPException(400, "Sector already exists")
    s = Sector(name=body.name, created_by=user.id)
    db.add(s); db.commit(); db.refresh(s)
    return s

@sectors_router.put("/{sector_id}/approve", response_model=SectorOut)
def approve_sector(sector_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    s = db.query(Sector).filter(Sector.id == sector_id).first()
    if not s:
        raise HTTPException(404, "Sector not found")
    s.status = "approved"
    db.commit(); db.refresh(s)
    return s

@sectors_router.delete("/{sector_id}", status_code=204)
def delete_sector(sector_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    s = db.query(Sector).filter(Sector.id == sector_id).first()
    if not s:
        raise HTTPException(404, "Sector not found")
    db.delete(s); db.commit()


# ──────────────────────────────────────────────
# CONTACTS
# ──────────────────────────────────────────────
contacts_router = APIRouter(prefix="/contacts", tags=["Contacts"])

@contacts_router.get("")
def list_contacts(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    type: Optional[str] = None,
    sector_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Contact)
    if search:
        q = q.filter(or_(
            Contact.name.ilike(f"%{search}%"),
            Contact.email.ilike(f"%{search}%"),
            Contact.organization.ilike(f"%{search}%"),
        ))
    if type:
        q = q.filter(Contact.type == type)
    if sector_id:
        q = q.filter(Contact.sector_id == sector_id)
    if status:
        q = q.filter(Contact.status == status)

    total = q.count()
    items = q.order_by(Contact.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return {
        "items": [ContactOut.model_validate(c) for c in items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    }

@contacts_router.post("", response_model=ContactOut, status_code=201)
def create_contact(body: ContactCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    if db.query(Contact).filter(Contact.email == body.email).first():
        raise HTTPException(400, "Email already exists")
    c = Contact(**body.model_dump())
    db.add(c); db.commit(); db.refresh(c)
    return c

@contacts_router.put("/{contact_id}", response_model=ContactOut)
def update_contact(contact_id: str, body: ContactUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(Contact).filter(Contact.id == contact_id).first()
    if not c:
        raise HTTPException(404, "Contact not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(c, k, v)
    c.updated_at = datetime.utcnow()
    db.commit(); db.refresh(c)
    return c

@contacts_router.delete("/{contact_id}", status_code=204)
def delete_contact(contact_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(Contact).filter(Contact.id == contact_id).first()
    if not c:
        raise HTTPException(404, "Contact not found")
    db.delete(c); db.commit()

@contacts_router.post("/upload")
async def upload_contacts_preview(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Parse CSV/XLSX and return preview (no DB writes)."""
    import pandas as pd
    content = await file.read()
    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
    except Exception:
        raise HTTPException(400, "Could not parse file. Use CSV or XLSX.")

    # Normalize column names
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    required = {"email"}
    if not required.issubset(set(df.columns)):
        raise HTTPException(400, "File must have at least an 'email' column")

    email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    existing_emails = {e[0] for e in db.query(Contact.email).all()}

    valid, duplicates, preview = [], 0, []
    for _, row in df.iterrows():
        email = str(row.get("email", "")).strip().lower()
        if not email_pattern.match(email):
            continue
        if email in existing_emails:
            duplicates += 1
            continue
        row_data = {
            "name": str(row.get("name", "")).strip() or email.split("@")[0],
            "email": email,
            "phone": str(row.get("phone", "")).strip() or None,
            "organization": str(row.get("organization", "")).strip() or None,
            "sector": str(row.get("sector", "")).strip() or None,
            "type": str(row.get("type", "prospect")).strip().lower(),
        }
        valid.append(row_data)
        if len(preview) < 10:
            preview.append(row_data)

    return {"total": len(df), "valid": len(valid), "duplicates": duplicates, "preview": preview}

@contacts_router.post("/import")
async def import_contacts(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Parse CSV/XLSX and write valid contacts to DB."""
    import pandas as pd
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content)) if file.filename.endswith(".csv") else pd.read_excel(io.BytesIO(content))
    except Exception:
        raise HTTPException(400, "Could not parse file")

    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    existing_emails = {e[0] for e in db.query(Contact.email).all()}

    # Sector cache
    sectors = {s.name.lower(): s.id for s in db.query(Sector).filter(Sector.status == "approved").all()}

    imported = 0
    for _, row in df.iterrows():
        email = str(row.get("email", "")).strip().lower()
        if not email_pattern.match(email) or email in existing_emails:
            continue

        sector_name = str(row.get("sector", "")).strip().lower()
        sector_id = sectors.get(sector_name)

        c = Contact(
            name=str(row.get("name", email.split("@")[0])).strip(),
            email=email,
            phone=str(row.get("phone", "")).strip() or None,
            organization=str(row.get("organization", "")).strip() or None,
            sector_id=sector_id,
            type=str(row.get("type", "prospect")).strip().lower() or "prospect",
        )
        db.add(c)
        existing_emails.add(email)
        imported += 1

    db.commit()
    return {"imported": imported}


# ──────────────────────────────────────────────
# TEMPLATES
# ──────────────────────────────────────────────
templates_router = APIRouter(prefix="/templates", tags=["Templates"])

def extract_variables(text: str) -> list:
    return list(set(re.findall(r'\{\{(\w+)\}\}', text)))

@templates_router.get("", response_model=List[TemplateOut])
def list_templates(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(EmailTemplate).order_by(EmailTemplate.created_at.desc()).all()

@templates_router.post("", response_model=TemplateOut, status_code=201)
def create_template(body: TemplateCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    import bleach
    safe_html = bleach.clean(body.body_html, tags=bleach.sanitizer.ALLOWED_TAGS | {"p","br","div","span","h1","h2","h3","img","a","ul","li","strong","em","table","tr","td","th"}, strip=False)
    variables = extract_variables(body.body_html + " " + body.subject)
    t = EmailTemplate(name=body.name, subject=body.subject, body_html=safe_html, variables=variables, created_by=user.id)
    db.add(t); db.commit(); db.refresh(t)
    return t

@templates_router.put("/{template_id}", response_model=TemplateOut)
def update_template(template_id: str, body: TemplateUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    t = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not t:
        raise HTTPException(404, "Template not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(t, k, v)
    if body.body_html or body.subject:
        t.variables = extract_variables((body.body_html or t.body_html) + " " + (body.subject or t.subject))
    t.updated_at = datetime.utcnow()
    db.commit(); db.refresh(t)
    return t

@templates_router.delete("/{template_id}", status_code=204)
def delete_template(template_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    t = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not t:
        raise HTTPException(404, "Template not found")
    db.delete(t); db.commit()


# ──────────────────────────────────────────────
# CAMPAIGNS
# ──────────────────────────────────────────────
campaigns_router = APIRouter(prefix="/campaigns", tags=["Campaigns"])

def campaign_stats(c: Campaign, db: Session) -> dict:
    total = db.query(func.count(CampaignRecipient.id)).filter(CampaignRecipient.campaign_id == c.id).scalar()
    sent = db.query(func.count(CampaignRecipient.id)).filter(CampaignRecipient.campaign_id == c.id, CampaignRecipient.status == "sent").scalar()
    failed = db.query(func.count(CampaignRecipient.id)).filter(CampaignRecipient.campaign_id == c.id, CampaignRecipient.status == "failed").scalar()
    return {"recipients_count": total, "sent_count": sent, "failed_count": failed}

@campaigns_router.get("")
def list_campaigns(status: Optional[str] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(Campaign)
    if status:
        q = q.filter(Campaign.status == status)
    campaigns = q.order_by(Campaign.created_at.desc()).all()
    result = []
    for c in campaigns:
        stats = campaign_stats(c, db)
        result.append({**CampaignOut.model_validate(c).model_dump(), **stats})
    return result

@campaigns_router.post("", status_code=201)
def create_campaign(body: CampaignCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not db.query(EmailTemplate).filter(EmailTemplate.id == body.template_id).first():
        raise HTTPException(404, "Template not found")
    c = Campaign(**body.model_dump(), created_by=user.id)
    db.add(c); db.commit(); db.refresh(c)
    return CampaignOut.model_validate(c)

@campaigns_router.post("/{campaign_id}/recipients")
def add_recipients(campaign_id: str, body: CampaignRecipientAdd, db: Session = Depends(get_db), _=Depends(get_current_user)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(404, "Campaign not found")
    if campaign.status != CampaignStatus.draft:
        raise HTTPException(400, "Cannot modify recipients for a non-draft campaign")

    f = body.filter
    q = db.query(Contact).filter(Contact.status == ContactStatus.active)
    if f.type and f.type != "all":
        q = q.filter(Contact.type == f.type)
    if f.sector_id:
        q = q.filter(Contact.sector_id == f.sector_id)
    if f.contact_ids:
        q = q.filter(Contact.id.in_(f.contact_ids))

    contacts = q.all()

    # Clear existing recipients first (idempotent)
    db.query(CampaignRecipient).filter(CampaignRecipient.campaign_id == campaign_id).delete()

    # Snapshot recipients
    for contact in contacts:
        r = CampaignRecipient(
            campaign_id=campaign_id,
            contact_id=contact.id,
            email_snapshot=contact.email,
            name_snapshot=contact.name,
            organization_snapshot=contact.organization,
        )
        db.add(r)

    db.commit()
    return {"added": len(contacts)}

@campaigns_router.post("/{campaign_id}/send")
def send_campaign(campaign_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    from app.tasks.email_tasks import send_campaign as send_task
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(404, "Campaign not found")
    if campaign.status not in [CampaignStatus.draft, CampaignStatus.scheduled]:
        raise HTTPException(400, f"Campaign cannot be sent (status: {campaign.status})")

    # Dispatch async task
    send_task.delay(campaign_id)
    return {"message": "Campaign queued for sending", "campaign_id": campaign_id}

@campaigns_router.delete("/{campaign_id}", status_code=204)
def delete_campaign(campaign_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not c:
        raise HTTPException(404, "Campaign not found")
    if c.status == CampaignStatus.sending:
        raise HTTPException(400, "Cannot delete a campaign that is currently sending")
    db.delete(c); db.commit()


# ──────────────────────────────────────────────
# CC CONTACTS
# ──────────────────────────────────────────────
cc_router = APIRouter(prefix="/cc-contacts", tags=["CC Contacts"])

@cc_router.get("", response_model=List[CCContactOut])
def list_cc(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(CCContact).all()

@cc_router.post("", response_model=CCContactOut, status_code=201)
def create_cc(body: CCContactCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    cc = CCContact(**body.model_dump())
    db.add(cc); db.commit(); db.refresh(cc)
    return cc

@cc_router.delete("/{cc_id}", status_code=204)
def delete_cc(cc_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    cc = db.query(CCContact).filter(CCContact.id == cc_id).first()
    if not cc:
        raise HTTPException(404)
    db.delete(cc); db.commit()


# ──────────────────────────────────────────────
# AI EXTRACTOR
# ──────────────────────────────────────────────
extractor_router = APIRouter(prefix="/extractor", tags=["AI Extractor"])

@extractor_router.get("/sources", response_model=List[ExtractionSourceOut])
def list_sources(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(ExtractionSource).order_by(ExtractionSource.created_at.desc()).all()

@extractor_router.post("/sources", response_model=ExtractionSourceOut, status_code=201)
def add_source(body: ExtractionSourceCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    s = ExtractionSource(**body.model_dump())
    db.add(s); db.commit(); db.refresh(s)
    return s

@extractor_router.put("/sources/{source_id}/toggle")
def toggle_source(source_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    s = db.query(ExtractionSource).filter(ExtractionSource.id == source_id).first()
    if not s:
        raise HTTPException(404)
    s.status = "paused" if s.status == "active" else "active"
    db.commit(); db.refresh(s)
    return {"id": s.id, "status": s.status}

@extractor_router.post("/sources/{source_id}/run")
def run_source(source_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    from app.tasks.extraction_tasks import extract_from_source
    s = db.query(ExtractionSource).filter(ExtractionSource.id == source_id).first()
    if not s:
        raise HTTPException(404)
    extract_from_source.delay(source_id)
    return {"message": "Extraction queued", "source_id": source_id}

@extractor_router.post("/run-all")
def run_all(db: Session = Depends(get_db), _=Depends(require_admin)):
    from app.tasks.extraction_tasks import run_all_extractions
    run_all_extractions.delay()
    return {"message": "All extractions queued"}

@extractor_router.get("/contacts", response_model=List[ExtractedContactOut])
def list_extracted(status: Optional[str] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(ExtractedContact)
    if status:
        q = q.filter(ExtractedContact.status == status)
    return q.order_by(ExtractedContact.created_at.desc()).all()

@extractor_router.post("/contacts/{contact_id}/approve")
def approve_extracted(contact_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    ec = db.query(ExtractedContact).filter(ExtractedContact.id == contact_id).first()
    if not ec:
        raise HTTPException(404)
    if db.query(Contact).filter(Contact.email == ec.email).first():
        raise HTTPException(400, "Contact with this email already exists")
    ec.status = "approved"
    # Promote to main contacts table
    c = Contact(name=ec.name or ec.email.split("@")[0], email=ec.email, phone=ec.phone, organization=ec.organization)
    db.add(c); db.commit()
    return {"message": "Contact approved and added"}

@extractor_router.post("/contacts/{contact_id}/reject")
def reject_extracted(contact_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    ec = db.query(ExtractedContact).filter(ExtractedContact.id == contact_id).first()
    if not ec:
        raise HTTPException(404)
    ec.status = "rejected"
    db.commit()
    return {"message": "Contact rejected"}


# ──────────────────────────────────────────────
# Stats / Dashboard
# ──────────────────────────────────────────────
stats_router = APIRouter(prefix="/stats", tags=["Stats"])

@stats_router.get("/dashboard")
def dashboard_stats(db: Session = Depends(get_db), _=Depends(get_current_user)):
    total_contacts = db.query(func.count(Contact.id)).scalar()
    active_contacts = db.query(func.count(Contact.id)).filter(Contact.status == "active").scalar()
    total_campaigns = db.query(func.count(Campaign.id)).scalar()
    total_templates = db.query(func.count(EmailTemplate.id)).scalar()
    total_sent = db.query(func.count(CampaignRecipient.id)).filter(CampaignRecipient.status == "sent").scalar()
    total_failed = db.query(func.count(CampaignRecipient.id)).filter(CampaignRecipient.status == "failed").scalar()

    return {
        "contacts": {"total": total_contacts, "active": active_contacts},
        "campaigns": {"total": total_campaigns},
        "templates": {"total": total_templates},
        "emails": {"sent": total_sent, "failed": total_failed},
    }
