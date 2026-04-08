from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "MailEngine"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    DATABASE_URL: str = "postgresql://mailengine:mailengine123@localhost:5432/mailengine_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    EMAIL_PROVIDER: str = "smtp"
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    FROM_EMAIL: str = "noreply@mailengine.com"
    FROM_NAME: str = "MailEngine"
    SENDGRID_API_KEY: Optional[str] = None

    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"

    BATCH_SIZE: int = 50
    BATCH_DELAY_SECONDS: int = 5

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
