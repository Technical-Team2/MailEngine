"""
Run this once to seed the database with an admin user and demo data.
Usage: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models import User, Sector, Contact, EmailTemplate
from app.utils.auth import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ── Admin user ────────────────────────────────
if not db.query(User).filter(User.email == "admin@mailengine.com").first():
    admin = User(
        name="Admin User",
        email="admin@mailengine.com",
        hashed_password=hash_password("admin123"),
        role="admin",
    )
    db.add(admin)
    print("✓ Admin user created: admin@mailengine.com / admin123")
else:
    print("· Admin user already exists")

# ── Sectors ───────────────────────────────────
sector_names = ["TVET", "Hospitals", "NGOs", "Education", "Corporate", "Government"]
sector_map = {}
for name in sector_names:
    s = db.query(Sector).filter(Sector.name == name).first()
    if not s:
        s = Sector(name=name, status="approved")
        db.add(s)
        db.flush()
        print(f"✓ Sector: {name}")
    sector_map[name] = s.id

db.commit()

# ── Demo contacts ─────────────────────────────
demo_contacts = [
    ("Dr. James Mwangi", "j.mwangi@kenyatta.ac.ke", "+254 722 001 001", "Kenyatta University", "TVET", "customer"),
    ("Sarah Achieng", "sachieng@nairobi-hospital.org", "+254 733 002 002", "Nairobi Hospital", "Hospitals", "prospect"),
    ("Peter Kamau", "pkamau@techbridge.co.ke", "+254 700 003 003", "TechBridge Kenya", "NGOs", "customer"),
    ("Grace Wanjiku", "grace@eastafricatvet.ac.ke", "+254 711 004 004", "East Africa TVET", "TVET", "prospect"),
    ("Ali Hassan", "ali.hassan@momentuminc.co.ke", "+254 722 005 005", "Momentum Inc.", "Corporate", "customer"),
]
for name, email, phone, org, sector, ctype in demo_contacts:
    if not db.query(Contact).filter(Contact.email == email).first():
        c = Contact(
            name=name, email=email, phone=phone,
            organization=org,
            sector_id=sector_map.get(sector),
            type=ctype,
        )
        db.add(c)
        print(f"✓ Contact: {name}")

# ── Demo templates ────────────────────────────
if not db.query(EmailTemplate).first():
    t1 = EmailTemplate(
        name="TVET Partnership Proposal",
        subject="Partnership Opportunity — {{organization}}",
        body_html="""<p>Dear {{name}},</p>
<p>We hope this message finds you well. We are reaching out to <strong>{{organization}}</strong> with an exciting partnership opportunity.</p>
<p>Our platform helps institutions like yours reach and engage with the right partners efficiently.</p>
<p>We would love to schedule a brief call to explore how we can collaborate.</p>
<p>Best regards,<br>MailEngine Team</p>""",
        variables=["name", "organization"],
    )
    t2 = EmailTemplate(
        name="Seasonal Greeting",
        subject="Warm Greetings from Our Team, {{name}}!",
        body_html="""<p>Dear {{name}},</p>
<p>As we celebrate this season, we want to take a moment to thank you and {{organization}} for your continued support.</p>
<p>Wishing you a prosperous season ahead!</p>
<p>Warm regards,<br>MailEngine Team</p>""",
        variables=["name", "organization"],
    )
    db.add_all([t1, t2])
    print("✓ Demo templates created")

db.commit()
db.close()
print("\n✅ Database seeded successfully!")
print("   Login: admin@mailengine.com / admin123")
