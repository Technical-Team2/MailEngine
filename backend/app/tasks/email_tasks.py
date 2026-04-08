import time
import logging
from datetime import datetime
from app.tasks import celery_app
from app.database import SessionLocal
from app.services.email_service import email_service, render_template

logger = logging.getLogger(__name__)

BATCH_SIZE = 50
BATCH_DELAY = 5  # seconds between batches


def chunk(lst, size):
    for i in range(0, len(lst), size):
        yield lst[i:i + size]


@celery_app.task(bind=True, name="app.tasks.email_tasks.send_campaign")
def send_campaign(self, campaign_id: str):
    """
    Core async campaign sending task.
    - Fetches pending recipients
    - Sends in batches of BATCH_SIZE
    - Updates status per recipient
    - Marks campaign as completed or failed
    """
    from app.models import Campaign, CampaignRecipient, EmailLog, CampaignStatus, RecipientStatus

    db = SessionLocal()
    try:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            logger.error(f"Campaign {campaign_id} not found")
            return

        # Mark as sending
        campaign.status = CampaignStatus.sending
        db.commit()

        template = campaign.template
        pending = (
            db.query(CampaignRecipient)
            .filter(
                CampaignRecipient.campaign_id == campaign_id,
                CampaignRecipient.status == RecipientStatus.pending,
            )
            .all()
        )

        logger.info(f"Campaign {campaign_id}: sending to {len(pending)} recipients")

        sent_count = 0
        failed_count = 0

        for batch in chunk(pending, BATCH_SIZE):
            for recipient in batch:
                contact_data = {
                    "name": recipient.name_snapshot or "",
                    "organization": recipient.organization_snapshot or "",
                    "email": recipient.email_snapshot,
                }
                rendered_subject, rendered_body = render_template(
                    template.body_html, template.subject, contact_data
                )

                success = email_service.send(
                    to_email=recipient.email_snapshot,
                    subject=rendered_subject,
                    html_body=rendered_body,
                )

                if success:
                    recipient.status = RecipientStatus.sent
                    recipient.sent_at = datetime.utcnow()
                    sent_count += 1
                else:
                    recipient.status = RecipientStatus.failed
                    recipient.error_message = "Delivery failed"
                    failed_count += 1

                # Log
                log = EmailLog(
                    campaign_id=campaign_id,
                    contact_id=recipient.contact_id,
                    status="sent" if success else "failed",
                )
                db.add(log)

            db.commit()
            # Throttle between batches
            time.sleep(BATCH_DELAY)

        # Mark campaign complete
        campaign.status = CampaignStatus.completed
        db.commit()

        logger.info(f"Campaign {campaign_id} done — sent:{sent_count} failed:{failed_count}")
        return {"sent": sent_count, "failed": failed_count}

    except Exception as exc:
        logger.exception(f"Campaign {campaign_id} failed: {exc}")
        try:
            from app.models import CampaignStatus
            campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
            if campaign:
                campaign.status = CampaignStatus.failed
                db.commit()
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=60, max_retries=2)
    finally:
        db.close()
