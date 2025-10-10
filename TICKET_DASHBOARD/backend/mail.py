import resend
from .config import Config
from pathlib import Path
from typing import List

BASE_DIR = Path(__file__).resolve().parent

resend.api_key = Config.MAIL_PASSWORD.get_secret_value()


async def send_html_email(recipients: List[str], subject: str, body: str):
    try:
        response = resend.Emails.send({
            "from": Config.MAIL_FROM,
            "to": recipients,
            "subject": subject,
            "html": body
        })
        return response
    except Exception as e:
        print(f"Error sending email: {e}")
        raise


async def send_otp_email(email: str, code: str):
    subject = "Your Ticket Dashboard OTP"
    body = (
        f"<p>Your OTP code is: <strong>{code}</strong></p>"
        "<p>This code will expire in 5 minutes.</p>"
    )
    await send_html_email([email], subject, body)


async def send_activity_email(recipients: List[str], subject: str, body: str):
    await send_html_email(recipients, subject, body)
