from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import Base, engine
from .api import auth, contacts, sectors, templates, campaigns, extraction, email

# Create all tables (with error handling for dev mode without database)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"⚠️  Warning: Could not connect to database: {str(e)}")
    print("   Server running in dev mode without database. Connect PostgreSQL to enable features.")

app = FastAPI(
    title="MailEngine API",
    description="Professional Email Campaign Management System",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(contacts.router, prefix=API_PREFIX)
app.include_router(sectors.router, prefix=API_PREFIX)
app.include_router(templates.router, prefix=API_PREFIX)
app.include_router(campaigns.router, prefix=API_PREFIX)
app.include_router(extraction.router, prefix=API_PREFIX)
app.include_router(email.router, prefix=API_PREFIX)

@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.ENVIRONMENT}

@app.on_event("startup")
async def startup_event():
    """Seed default admin user if none exists."""
    from .database import SessionLocal
    from .models.user import User
    from .utils.security import hash_password
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "admin@mailengine.com").first():
            admin = User(
                name="Admin User",
                email="admin@mailengine.com",
                hashed_password=hash_password("admin123"),
                role="admin",
            )
            db.add(admin)
            db.commit()
            print("✅ Default admin created: admin@mailengine.com / admin123")
    except Exception as e:
        print(f"⚠️  Could not seed admin user: {str(e)}")
    finally:
        db.close()
