import psycopg2
from psycopg2 import sql

# Connect as postgres superuser
conn = psycopg2.connect(
    host='127.0.0.1',
    port=5432,
    user='postgres',
    password='2804',
    database='postgres'
)
conn.autocommit = True
cursor = conn.cursor()

try:
    # Drop existing database if it exists
    cursor.execute("DROP DATABASE IF EXISTS mailengine;")
    print("✓ Dropped existing 'mailengine' database")
    
    # Drop existing user if it exists
    cursor.execute("DROP USER IF EXISTS mailengine;")
    print("✓ Dropped existing 'mailengine' user")
    
    # Create new user
    cursor.execute(sql.SQL("CREATE USER mailengine WITH PASSWORD %s;"), ['mailengine123'])
    print("✓ Created user 'mailengine'")
    
    # Create new database
    cursor.execute("CREATE DATABASE mailengine OWNER mailengine;")
    print("✓ Created database 'mailengine'")
    
    # Grant privileges
    cursor.execute("GRANT ALL PRIVILEGES ON DATABASE mailengine TO mailengine;")
    print("✓ Granted privileges to 'mailengine' user")
    
    print("\n✅ Database setup complete!")
    print("Database: mailengine")
    print("User: mailengine")
    print("Password: mailengine123")
    
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    cursor.close()
    conn.close()
