import smtplib
import re
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional
from app.config import settings
import logging

logger = logging.getLogger(__name__)


def render_template(body_html: str, subject: str, contact_data: dict) -> tuple[str, str]:
    """Replace {{variable}} placeholders with contact data."""
    rendered_body = body_html
    rendered_subject = subject
    for key, value in contact_data.items():
        placeholder = f"{{{{{key}}}}}"
        rendered_body = rendered_body.replace(placeholder, str(value or ""))
        rendered_subject = rendered_subject.replace(placeholder, str(value or ""))
    return rendered_subject, rendered_body


def validate_email_format(email: str) -> bool:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def calculate_confidence_score(contact: dict) -> int:
    """Score an extracted contact 0-100."""
    score = 0
    if contact.get("email") and validate_email_format(contact["email"]):
        score += 40
    # Prefer domain emails over gmail/yahoo
    email = contact.get("email", "")
    free_providers = {"gmail.com", "yahoo.com", "hotmail.com", "outlook.com"}
    domain = email.split("@")[-1].lower() if "@" in email else ""
    if domain and domain not in free_providers:
        score += 30
    if contact.get("organization"):
        score += 20
    if contact.get("phone"):
        score += 10
    return min(score, 100)


class EmailService:
   # def __init__(self,user=None, password=None):
       # self.user = user or settings.SMTP_USER
       # self.password = password or settings.SMTP_PASS 
    def send_via_smtp(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        cc: Optional[List[str]] = None,
    ) -> bool:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.FROM_NAME} <{settings.FROM_EMAIL}>"
            msg["To"] = to_email
            if cc:
                msg["Cc"] = ", ".join(cc)

            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.ehlo()
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASS)
                recipients = [to_email] + (cc or [])
                server.sendmail(settings.FROM_EMAIL, recipients, msg.as_string())
            return True
        except Exception as e:
            logger.error(f"SMTP error sending to {to_email}: {e}")
            return False

    def send_via_sendgrid(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        cc: Optional[List[str]] = None,
    ) -> bool:
        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail, To, Cc

            sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
            message = Mail(
                from_email=(settings.FROM_EMAIL, settings.FROM_NAME),
                to_emails=to_email,
                subject=subject,
                html_content=html_body,
            )
            if cc:
                for cc_email in cc:
                    message.add_cc(Cc(cc_email))
            sg.send(message)
            return True
        except Exception as e:
            logger.error(f"SendGrid error sending to {to_email}: {e}")
            return False

    def send(self, to_email: str, subject: str, html_body: str, cc: Optional[List[str]] = None) -> bool:
        if settings.EMAIL_PROVIDER == "sendgrid" and settings.SENDGRID_API_KEY:
            return self.send_via_sendgrid(to_email, subject, html_body, cc)
        return self.send_via_smtp(to_email, subject, html_body, cc)


email_service = EmailService()
