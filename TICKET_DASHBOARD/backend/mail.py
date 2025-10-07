from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from .config import Config
from pathlib import Path
from typing import List

BASE_DIR = Path(__file__).resolve().parent

mail_config = ConnectionConfig(
    MAIL_USERNAME=Config.MAIL_USERNAME,
    MAIL_PASSWORD=Config.MAIL_PASSWORD.get_secret_value() if hasattr(Config.MAIL_PASSWORD, "get_secret_value") else Config.MAIL_PASSWORD,
    MAIL_FROM=Config.MAIL_FROM,
    MAIL_PORT=587,
    MAIL_SERVER=Config.MAIL_SERVER,
    MAIL_FROM_NAME=Config.MAIL_FROM_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    # TEMPLATE_FOLDER=Path(BASE_DIR, "templates"),
)


mail = FastMail(config=mail_config)


def create_message(recipients: List[str], subject: str, body: str):
    message = MessageSchema(
        recipients=recipients, subject=subject, body=body, subtype=MessageType.html
    )
    return message


async def send_html_email(recipients: List[str], subject: str, body: str):
    message = create_message(recipients=recipients, subject=subject, body=body)
    await mail.send_message(message)


async def send_otp_email(email: str, code: str):
    subject = "Your Ticket Dashboard OTP"
    body = (
        f"<p>Your OTP code is: <strong>{code}</strong></p>"
        "<p>This code will expire in 5 minutes.</p>"
    )
    await send_html_email([email], subject, body)


async def send_activity_email(recipients: List[str], subject: str, body: str):
    await send_html_email(recipients, subject, body)
