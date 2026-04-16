import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from ..config import settings
import logging

logger = logging.getLogger(__name__)

def render_template(template_html: str, template_subject: str, context: dict) -> tuple[str, str]:
    """Replace {{variable}} placeholders with actual values."""
    body = template_html
    subject = template_subject
    for key, value in context.items():
        placeholder = "{{" + key + "}}"
        body = body.replace(placeholder, str(value or ""))
        subject = subject.replace(placeholder, str(value or ""))
    return subject, body

def send_email_smtp(
    to_email: str,
    subject: str,
    html_body: str,
    cc: Optional[list] = None,
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
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            recipients = [to_email] + (cc or [])
            server.sendmail(settings.FROM_EMAIL, recipients, msg.as_string())

        return True
    except Exception as e:
        logger.error(f"SMTP send failed to {to_email}: {e}")
        return False

def send_email(to_email: str, subject: str, html_body: str, cc: Optional[list] = None) -> bool:
    if settings.EMAIL_PROVIDER == "sendgrid" and settings.SENDGRID_API_KEY:
        return _send_via_sendgrid(to_email, subject, html_body, cc)
    return send_email_smtp(to_email, subject, html_body, cc)

def _send_via_sendgrid(to_email: str, subject: str, html_body: str, cc=None) -> bool:
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail, To, Cc
        sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
        mail = Mail(
            from_email=(settings.FROM_EMAIL, settings.FROM_NAME),
            to_emails=to_email,
            subject=subject,
            html_content=html_body,
        )
        if cc:
            mail.cc = [Cc(email=e) for e in cc]
        response = sg.send(mail)
        return response.status_code in (200, 202)
    except Exception as e:
        logger.error(f"SendGrid send failed: {e}")
        return False
