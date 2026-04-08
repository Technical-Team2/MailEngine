from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
from ..database import get_db
from ..models.contact import Sector
from ..schemas.contact import SectorCreate, SectorOut
from ..utils.security import get_current_user, require_admin

router = APIRouter(prefix="/sectors", tags=["sectors"])

@router.get("", response_model=list[SectorOut])
def list_sectors(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Sector).all()

@router.post("", response_model=SectorOut, status_code=201)
def create_sector(payload: SectorCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if db.query(Sector).filter(Sector.name == payload.name).first():
        raise HTTPException(400, detail="Sector already exists")
    sector = Sector(name=payload.name, created_by=current_user.id)
    db.add(sector)
    db.commit()
    db.refresh(sector)
    return sector

@router.put("/{sector_id}/approve", response_model=SectorOut)
def approve_sector(sector_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_admin)):
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(404, detail="Sector not found")
    sector.status = "approved"
    db.commit()
    db.refresh(sector)
    return sector

@router.delete("/{sector_id}", status_code=204)
def delete_sector(sector_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_admin)):
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(404)
    db.delete(sector)
    db.commit()
