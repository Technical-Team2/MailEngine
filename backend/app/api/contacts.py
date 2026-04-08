from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid, io
import pandas as pd
from ..database import get_db
from ..models.contact import Contact, Sector
from ..schemas.contact import ContactCreate, ContactUpdate, ContactOut
from ..utils.security import get_current_user

router = APIRouter(prefix="/contacts", tags=["contacts"])

@router.get("", response_model=dict)
def list_contacts(
    search: Optional[str] = None,
    type: Optional[str] = None,
    sector_id: Optional[uuid.UUID] = None,
    status: Optional[str] = "active",
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Contact)
    if search:
        q = q.filter(
            (Contact.name.ilike(f"%{search}%")) |
            (Contact.email.ilike(f"%{search}%")) |
            (Contact.organization.ilike(f"%{search}%"))
        )
    if type:
        q = q.filter(Contact.type == type)
    if sector_id:
        q = q.filter(Contact.sector_id == sector_id)
    if status:
        q = q.filter(Contact.status == status)

    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "page": page, "page_size": page_size, "items": [ContactOut.from_orm(c).dict() for c in items]}

@router.post("", response_model=ContactOut, status_code=201)
def create_contact(payload: ContactCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    if db.query(Contact).filter(Contact.email == payload.email).first():
        raise HTTPException(400, detail="Email already exists")
    contact = Contact(**payload.dict())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact

@router.put("/{contact_id}", response_model=ContactOut)
def update_contact(contact_id: uuid.UUID, payload: ContactUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(404, detail="Contact not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(contact, k, v)
    db.commit()
    db.refresh(contact)
    return contact

@router.delete("/{contact_id}", status_code=204)
def delete_contact(contact_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(404, detail="Not found")
    db.delete(contact)
    db.commit()

@router.post("/upload")
async def upload_contacts(file: UploadFile = File(...), _=Depends(get_current_user)):
    """Parse CSV/XLSX and return preview rows (no DB write yet)."""
    contents = await file.read()
    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception:
        raise HTTPException(400, detail="Could not parse file. Ensure it's CSV or XLSX.")

    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    preview = df.head(10).to_dict(orient="records")
    return {"rows": len(df), "columns": list(df.columns), "preview": preview}

@router.post("/import")
async def import_contacts(file: UploadFile = File(...), db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Full import — validates, deduplicates, inserts."""
    contents = await file.read()
    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception:
        raise HTTPException(400, detail="Could not parse file")

    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    if "email" not in df.columns:
        raise HTTPException(400, detail="File must contain an 'email' column")

    imported = skipped = 0
    for _, row in df.iterrows():
        email = str(row.get("email", "")).strip().lower()
        if not email or "@" not in email:
            skipped += 1
            continue
        if db.query(Contact).filter(Contact.email == email).first():
            skipped += 1
            continue
        contact = Contact(
            name=str(row.get("name", email.split("@")[0])).strip(),
            email=email,
            phone=str(row.get("phone", "")).strip() or None,
            organization=str(row.get("organization", "")).strip() or None,
            type=str(row.get("type", "prospect")).lower().strip(),
        )
        db.add(contact)
        imported += 1

    db.commit()
    return {"imported": imported, "skipped": skipped}
