from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr
from pathlib import Path
from dotenv import load_dotenv
import os


DOTENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(DOTENV_PATH)

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL") or ""
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME") or "ticket_dashboard"
    
    # Environment settings
    ENVIRONMENT: str = os.getenv("ENVIRONMENT") or "development"
    
    # MongoDB SSL settings
    MONGO_SSL_ENABLED: bool = os.getenv("MONGO_SSL_ENABLED", "true").lower() == "true"
    MONGO_TLS_ALLOW_INVALID_CERTIFICATES: bool = os.getenv("MONGO_TLS_ALLOW_INVALID_CERTIFICATES", "true").lower() == "true"

    SUPER_TOGGLE_PWD: str = os.getenv("SUPER_TOGGLE_PWD") or "admin123"
    
    JWT_SECRET: str = os.getenv("JWT_SECRET") or ""
    JWT_ALG: str = "HS256"
    JWT_TTL_SECONDS: int = 60 * 60 * 24 * 7

    # Mail configuration - Resend SMTP
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "resend")  # Resend uses fixed username
    MAIL_PASSWORD: SecretStr = SecretStr(os.getenv("MAIL_PASSWORD") or "")  # Resend API key
    MAIL_FROM: str = os.getenv("MAIL_FROM") or "adityaranjanvanced@gmail.com"
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp.resend.com")  # Resend SMTP
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", "TicketDashboard")
    MAIL_STARTTLS: bool = os.getenv("MAIL_STARTTLS", "true").lower() == "true"
    MAIL_SSL_TLS: bool = os.getenv("MAIL_SSL_TLS", "false").lower() == "true"
    USE_CREDENTIALS: bool = os.getenv("USE_CREDENTIALS", "true").lower() == "true"
    VALIDATE_CERTS: bool = os.getenv("VALIDATE_CERTS", "true").lower() == "true"
    DOMAIN: str = os.getenv("DOMAIN", "localhost:8000")


    model_config = SettingsConfigDict(
        env_file=DOTENV_PATH,
        extra="ignore"
    )


Config = Settings()