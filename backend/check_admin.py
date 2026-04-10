#!/usr/bin/env python
"""Check admin user in database"""
import sys
from app.config import settings
from app.database import SessionLocal
from app.models.user import User
from app.utils.security import hash_password

db = SessionLocal()

print("🔍 Checking admin user...")
admin = db.query(User).filter(User.email == "admin@mailengine.com").first()

if admin:
    print(f"✅ Admin user found:")
    print(f"   Email: {admin.email}")
    print(f"   Name: {admin.name}")
    print(f"   Role: {admin.role}")
    print(f"   Active: {admin.is_active}")
    print(f"   Password Hash: {admin.hashed_password[:50]}...")
else:
    print("❌ Admin user NOT found!")
    print("\n📝 Creating admin user...")
    try:
        admin = User(
            name="Admin User",
            email="admin@mailengine.com",
            hashed_password=hash_password("admin123"),
            role="admin",
        )
        db.add(admin)
        db.commit()
        print("✅ Admin user created successfully!")
        print(f"   Email: admin@mailengine.com")
        print(f"   Password: admin123")
    except Exception as e:
        print(f"❌ Failed to create admin: {str(e)}")
        sys.exit(1)

db.close()
