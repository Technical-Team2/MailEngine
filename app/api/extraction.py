from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
from ..database import get_db
from ..models.extraction import ExtractionSource, ExtractedContact
from ..models.contact import Contact
from ..schemas.extraction import SourceCreate, SourceOut, ExtractedContactOut
from ..utils.security import get_current_user

router = APIRouter(prefix="/extraction", tags=["extraction"])

@router.get("/sources", response_model=list[SourceOut])
def list_sources(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(ExtractionSource).all()

@router.post("/sources", response_model=SourceOut, status_code=201)
def create_source(payload: SourceCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    source = ExtractionSource(**payload.dict())
    db.add(source)
    db.commit()
    db.refresh(source)
    return source

@router.delete("/sources/{source_id}", status_code=204)
def delete_source(source_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    s = db.query(ExtractionSource).filter(ExtractionSource.id == source_id).first()
    if not s:
        raise HTTPException(404)
    db.delete(s)
    db.commit()

@router.post("/sources/{source_id}/run")
def run_source(source_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    from ..tasks.extraction_tasks import run_source_extraction
    run_source_extraction.delay(str(source_id))
    return {"message": "Extraction queued"}

@router.get("/extracted", response_model=list[ExtractedContactOut])
def list_extracted(status: str = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(ExtractedContact)
    if status:
        q = q.filter(ExtractedContact.status == status)
    return q.order_by(ExtractedContact.created_at.desc()).all()
    
@router.put("/sources/{source_id}/toggle", response_model=SourceOut)
def toggle_source(source_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    source = db.query(ExtractionSource).filter(ExtractionSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    
    # Logic: Switch between "active" and "paused" (matching your Enum)
    if source.status == "active":
        source.status = "paused"
    else:
        source.status = "active"
        
    db.commit()
    db.refresh(source)
    return source
# -----------------------------------

@router.get("/extracted", response_model=list[ExtractedContactOut])

@router.post("/extracted/{contact_id}/approve")
def approve_extracted(contact_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    ec = db.query(ExtractedContact).filter(ExtractedContact.id == contact_id).first()
    if not ec:
        raise HTTPException(404)
    # Move to contacts table
    if not db.query(Contact).filter(Contact.email == ec.email).first():
        contact = Contact(
            name=ec.name or ec.email.split("@")[0],
            email=ec.email,
            phone=ec.phone,
            organization=ec.organization,
            type="prospect",
        )
        db.add(contact)
    ec.status = "approved"
    db.commit()
    return {"message": "Contact approved and added to database"}

@router.post("/extracted/{contact_id}/reject")
def reject_extracted(contact_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    ec = db.query(ExtractedContact).filter(ExtractedContact.id == contact_id).first()
    if not ec:
        raise HTTPException(404)
    ec.status = "rejected"
    db.commit()
    return {"message": "Contact rejected"}
