from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from ..database import get_db
from ..utils.security import get_current_user
from ..services.email_service import email_service
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/email", tags=["email"])


class SendEmailRequest(BaseModel):
    to_email: EmailStr
    subject: str
    html_body: str
    cc_emails: list[EmailStr] = None


@router.post("/send")
def send_email(
    payload: SendEmailRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Send a test email."""
    try:
        print(f"\n📧 SENDING EMAIL")
        print(f"   From: {current_user.email} ({current_user.name})")
        print(f"   To: {payload.to_email}")
        print(f"   Subject: {payload.subject}")
        
        success = email_service.send_via_smtp(
            to_email=payload.to_email,
            subject=payload.subject,
            html_body=payload.html_body,
            cc=payload.cc_emails,
        )
        
        if success:
            print(f"✅ Email sent successfully to {payload.to_email}\n")
            return {
                "status": "success",
                "message": f"Email sent to {payload.to_email}",
                "to": payload.to_email,
            }
        else:
            print(f"❌ Failed to send email to {payload.to_email}\n")
            raise HTTPException(
                status_code=500,
                detail="Failed to send email. Check SMTP configuration.",
            )
    except Exception as e:
        print(f"❌ Error sending email: {str(e)}\n")
        logger.error(f"Email send error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
