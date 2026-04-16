#!/usr/bin/env python
"""Create mailengine_db database"""
import psycopg2
from psycopg2 import sql

try:
    # Connect to default postgres database
    conn = psycopg2.connect(
        host="localhost",
        user="postgres",
        password="2804",
        database="postgres"
    )
    conn.autocommit = True
    cursor = conn.cursor()
    
    print("🔧 Creating database 'mailengine_db'...")
    cursor.execute("CREATE DATABASE mailengine_db;")
    
    print("✅ Database created successfully!")
    print("   Database: mailengine_db")
    print("   Host: localhost:5432")
    
    cursor.close()
    conn.close()
    
except psycopg2.errors.DuplicateDatabase:
    print("ℹ️  Database 'mailengine_db' already exists")
    
except Exception as e:
    print(f"❌ Error creating database: {str(e)}")
