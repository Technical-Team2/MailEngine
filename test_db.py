#!/usr/bin/env python
"""Test database connection"""
import sys
from app.config import settings
from sqlalchemy import create_engine, text

try:
    print(f"🔍 Testing connection to: {settings.DATABASE_URL}")
    
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("✅ Connection Successful!")
        print(f"   Database: postgresql")
        print(f"   Host: localhost:5432")
        print(f"   Status: Database is running and accessible")
        sys.exit(0)
        
except Exception as e:
    print(f"❌ Connection Failed!")
    print(f"   Error: {str(e)}")
    print(f"\n   Make sure:")
    print(f"   1. PostgreSQL is running on localhost:5432")
    print(f"   2. Database credentials in .env are correct")
    print(f"   3. Database 'mailengine_db' exists")
    sys.exit(1)
