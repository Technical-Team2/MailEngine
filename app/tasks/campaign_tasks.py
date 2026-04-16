import time
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from .celery_app import celery_app
from ..database import SessionLocal
from ..models.campaign import Campaign, CampaignRecipient, EmailLog
from ..models.template import EmailTemplate
from ..utils.email_sender import send_email, render_template
from ..config import settings

logger = logging.getLogger(__name__)

def chunk(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]

@celery_app.task(bind=True, max_retries=3)
def send_campaign(self, campaign_id: str):
    """
    Main async task to send a campaign in batches.
    - Batch size: 50 recipients
    - Delay between batches: 5 seconds
    - Marks each recipient sent/failed
    - Updates campaign status on completion
    """
    db: Session = SessionLocal()
    try:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            logger.error(f"Campaign {campaign_id} not found")
            return

        # Mark as sending
        campaign.status = "sending"
        db.commit()

        template = db.query(EmailTemplate).filter(EmailTemplate.id == campaign.template_id).first()
        if not template:
            campaign.status = "failed"
            db.commit()
            return

        recipients = db.query(CampaignRecipient).filter(
            CampaignRecipient.campaign_id == campaign_id,
            CampaignRecipient.status == "pending"
        ).all()

        logger.info(f"Sending campaign '{campaign.name}' to {len(recipients)} recipients")

        for batch in chunk(recipients, settings.BATCH_SIZE):
            for recipient in batch:
                try:
                    context = {
                        "name": recipient.name_snapshot or "",
                        "organization": recipient.organization_snapshot or "",
                        "email": recipient.email_snapshot or "",
                    }
                    subject, body = render_template(template.subject, template.body_html, context)

                    success = send_email(
                        to_email=recipient.email_snapshot,
                        subject=subject,
                        html_body=body,
                    )

                    if success:
                        recipient.status = "sent"
                        recipient.sent_at = datetime.utcnow()
                        log_status = "sent"
                    else:
                        recipient.status = "failed"
                        recipient.error_message = "Email delivery failed"
                        log_status = "failed"

                    # Write log
                    log = EmailLog(
                        campaign_id=campaign_id,
                        contact_id=recipient.contact_id,
                        status=log_status,
                        response="ok" if success else "failed",
                    )
                    db.add(log)

                except Exception as e:
                    logger.error(f"Error sending to {recipient.email_snapshot}: {e}")
                    recipient.status = "failed"
                    recipient.error_message = str(e)

            db.commit()
            time.sleep(settings.BATCH_DELAY_SECONDS)

        campaign.status = "completed"
        db.commit()
        logger.info(f"Campaign '{campaign.name}' completed")

    except Exception as exc:
        logger.error(f"Campaign task error: {exc}")
        if campaign:
            campaign.status = "failed"
            db.commit()
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()
