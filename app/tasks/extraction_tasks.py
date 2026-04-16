import logging
import re
import httpx
from datetime import datetime
from .celery_app import celery_app
from ..database import SessionLocal
from ..models.extraction import ExtractionSource, ExtractedContact, ExtractionLog

logger = logging.getLogger(__name__)

EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
PERSONAL_DOMAINS = {"gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"}

def is_valid_email(email: str) -> bool:
    return bool(EMAIL_REGEX.match(email))

def is_business_email(email: str) -> bool:
    domain = email.split("@")[-1].lower()
    return domain not in PERSONAL_DOMAINS

def compute_confidence(contact: dict) -> int:
    score = 0
    if contact.get("email") and is_valid_email(contact["email"]):
        score += 40
    if contact.get("email") and is_business_email(contact.get("email", "")):
        score += 30
    if contact.get("organization"):
        score += 20
    if contact.get("phone"):
        score += 10
    return score

def extract_emails_from_text(text: str) -> list:
    return list(set(EMAIL_REGEX.findall(text)))

@celery_app.task
def run_source_extraction(source_id: str):
    """Crawl a source URL, extract emails, save to staging."""
    db = SessionLocal()
    found = 0
    valid = 0
    try:
        source = db.query(ExtractionSource).filter(ExtractionSource.id == source_id).first()
        if not source or source.status != "active":
            return

        logger.info(f"Running extraction for source: {source.name}")

        # Crawl the URL
        try:
            response = httpx.get(source.url, timeout=15, follow_redirects=True)
            text = response.text
        except Exception as e:
            logger.error(f"Failed to crawl {source.url}: {e}")
            return

        emails = extract_emails_from_text(text)
        found = len(emails)

        for email in emails:
            if not is_valid_email(email):
                continue

            # Deduplicate
            existing = db.query(ExtractedContact).filter(ExtractedContact.email == email).first()
            if existing:
                continue

            contact_data = {"email": email, "organization": "", "phone": ""}
            confidence = compute_confidence(contact_data)

            contact = ExtractedContact(
                email=email,
                organization=None,
                sector=source.sector,
                source_id=source.id,
                confidence_score=confidence,
                raw_data={"source_url": source.url, "email": email},
            )
            db.add(contact)
            valid += 1

        source.last_run = datetime.utcnow()
        db.commit()

        log = ExtractionLog(
            source_id=source.id,
            records_found=found,
            records_valid=valid,
            status="completed",
        )
        db.add(log)
        db.commit()
        logger.info(f"Extraction done for {source.name}: {found} found, {valid} valid")

    except Exception as e:
        logger.error(f"Extraction task error: {e}")
        log = ExtractionLog(source_id=source_id, records_found=found, records_valid=valid, status="failed")
        db.add(log)
        db.commit()
    finally:
        db.close()

@celery_app.task
def run_all_sources():
    """Daily task: run extraction on all active sources."""
    db = SessionLocal()
    try:
        sources = db.query(ExtractionSource).filter(ExtractionSource.status == "active").all()
        for source in sources:
            run_source_extraction.delay(str(source.id))
    finally:
        db.close()
