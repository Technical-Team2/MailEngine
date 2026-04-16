import psycopg2

try:
    conn = psycopg2.connect(
        host='127.0.0.1',
        port=5432,
        user='mailengine',
        password='mailengine123',
        database='mailengine'
    )
    cursor = conn.cursor()
    
    # Test basic query
    cursor.execute("SELECT 1 as connection_test;")
    result = cursor.fetchone()
    
    # Get database info
    cursor.execute("SELECT version();")
    db_version = cursor.fetchone()[0]
    
    # List tables
    cursor.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
    ;""")
    tables = cursor.fetchall()
    
    print("✅ DATABASE CONNECTION SUCCESSFUL!")
    print(f"\n📊 Database Version:\n{db_version}")
    print(f"\n📋 Tables in database ({len(tables)} total):")
    for table in tables:
        print(f"   - {table[0]}")
    
    cursor.close()
    conn.close()
    
except psycopg2.OperationalError as e:
    print(f"❌ Connection Failed: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
