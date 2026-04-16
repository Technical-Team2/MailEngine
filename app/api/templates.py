import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
from ..database import get_db
from ..models.template import EmailTemplate
from ..schemas.template import TemplateCreate, TemplateUpdate, TemplateOut
from ..utils.security import get_current_user

router = APIRouter(prefix="/templates", tags=["templates"])

def parse_variables(html: str) -> list:
    return list(set(re.findall(r'\{\{(\w+)\}\}', html)))

@router.get("", response_model=list[TemplateOut])
def list_templates(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(EmailTemplate).order_by(EmailTemplate.created_at.desc()).all()

@router.post("", response_model=TemplateOut, status_code=201)
def create_template(payload: TemplateCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    variables = parse_variables(payload.body_html + payload.subject)
    template = EmailTemplate(**payload.dict(exclude={"variables"}), variables=variables, created_by=current_user.id)
    db.add(template)
    db.commit()
    db.refresh(template)
    return template

@router.put("/{template_id}", response_model=TemplateOut)
def update_template(template_id: uuid.UUID, payload: TemplateUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(404, detail="Template not found")
    variables = parse_variables(payload.body_html + payload.subject)
    for k, v in payload.dict(exclude={"variables"}).items():
        setattr(template, k, v)
    template.variables = variables
    db.commit()
    db.refresh(template)
    return template

@router.delete("/{template_id}", status_code=204)
def delete_template(template_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    t = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not t:
        raise HTTPException(404)
    db.delete(t)
    db.commit()
