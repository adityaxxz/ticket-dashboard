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

    SUPER_TOGGLE_PWD: str = os.getenv("SUPER_TOGGLE_PWD") or "admin123"
    
    JWT_SECRET: str = os.getenv("JWT_SECRET") or ""
    JWT_ALG: str = "HS256"
    JWT_TTL_SECONDS: int = 60 * 60 * 24 * 7

    # Mail configuration
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME") or ""
    MAIL_PASSWORD: SecretStr = SecretStr(os.getenv("MAIL_PASSWORD") or "")
    MAIL_FROM: str = os.getenv("MAIL_FROM") or "adityaranjanvanced@gmail.com"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_FROM_NAME: str = "Admin@Ticket-Dashboard"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    USE_CREDENTIALS: bool = True
    VALIDATE_CERTS: bool = True
    DOMAIN: str = "localhost:8000"


    model_config = SettingsConfigDict(
        env_file=DOTENV_PATH,
        extra="ignore"
    )


Config = Settings()