#!/usr/bin/env python
"""Test database connection"""
import sys
from app.config import settings
from app.database import engine, SessionLocal
from sqlalchemy import text

def test_connection():
    print(f"🔍 Testing Database Connection...")
    print(f"   Database URL: {settings.DATABASE_URL}")
    
    try:
        # Test engine connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print(f"✅ Engine connection successful!")
            
        # Test session
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        print(f"✅ Session connection successful!")
        
        # Get database info
        with engine.connect() as connection:
            version = connection.execute(text("SELECT version()")).scalar()
            print(f"✅ PostgreSQL version: {version.split(',')[0]}")
            
            db_name = connection.execute(text("SELECT current_database()")).scalar()
            print(f"✅ Connected to database: {db_name}")
            
        print(f"\n✅ All database connection tests PASSED!")
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        print(f"\n⚠️  Make sure PostgreSQL is running and the database exists.")
        print(f"   Connection string: {settings.DATABASE_URL}")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
