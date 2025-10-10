from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from .config import Config
from pathlib import Path
from typing import List
import logging
import asyncio

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent

# Debug configuration values
logger.info("=== EMAIL CONFIGURATION DEBUG ===")
logger.info(f"MAIL_SERVER: {Config.MAIL_SERVER}")
logger.info(f"MAIL_PORT: {Config.MAIL_PORT}")
logger.info(f"MAIL_USERNAME: {Config.MAIL_USERNAME}")
logger.info(f"MAIL_FROM: {Config.MAIL_FROM}")
logger.info(f"MAIL_STARTTLS: {Config.MAIL_STARTTLS}")
logger.info(f"MAIL_SSL_TLS: {Config.MAIL_SSL_TLS}")
logger.info("================================")

mail_config = ConnectionConfig(
    MAIL_USERNAME=Config.MAIL_USERNAME,
    MAIL_PASSWORD=Config.MAIL_PASSWORD.get_secret_value(),
    MAIL_FROM=Config.MAIL_FROM,
    MAIL_PORT=Config.MAIL_PORT,
    MAIL_SERVER=Config.MAIL_SERVER,
    MAIL_FROM_NAME=Config.MAIL_FROM_NAME,
    MAIL_STARTTLS=Config.MAIL_STARTTLS,
    MAIL_SSL_TLS=Config.MAIL_SSL_TLS,
    USE_CREDENTIALS=Config.USE_CREDENTIALS,
    VALIDATE_CERTS=Config.VALIDATE_CERTS,
)


mail = FastMail(config=mail_config)


def create_message(recipients: List[str], subject: str, body: str):
    message = MessageSchema(
        recipients=recipients, subject=subject, body=body, subtype=MessageType.html
    )
    return message


async def send_html_email(recipients: List[str], subject: str, body: str):
    """
    Send HTML email with detailed error handling and logging
    """
    try:
        logger.info(f"Attempting to send email to: {recipients}")
        logger.info(f"Subject: {subject}")
        logger.info(f"From: {Config.MAIL_FROM}")
        
        message = create_message(recipients=recipients, subject=subject, body=body)
        
        # Add timeout to prevent hanging
        await asyncio.wait_for(mail.send_message(message), timeout=60.0)
        
        logger.info(f"✅ Email sent successfully to: {recipients}")
        
    except asyncio.TimeoutError:
        logger.error(f"❌ Email timeout when sending to: {recipients}")
        raise Exception("Email service timeout - please try again later")
        
    except Exception as e:
        logger.error(f"❌ Email send failed to: {recipients}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error message: {str(e)}")
        logger.error(f"Full error: {repr(e)}")
        raise Exception(f"Email delivery failed: {str(e)}")


async def send_otp_email(email: str, code: str):
    """
    Send OTP email with comprehensive error handling
    """
    logger.info(f"🔄 Starting OTP email send to: {email}")
    
    subject = "Your Ticket Dashboard OTP"
    body = (
        f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Your Ticket Dashboard OTP</h2>
            <p>Your verification code is:</p>
            <div style="font-size: 24px; font-weight: bold; background: #f0f9ff; 
                        padding: 20px; text-align: center; border-radius: 8px; 
                        color: #1e40af; margin: 20px 0;">
                {code}
            </div>
            <p style="color: #666;">This code will expire in 5 minutes.</p>
            <p style="color: #666; font-size: 12px;">
                If you didn't request this code, please ignore this email.
            </p>
        </div>
        """
    )
    
    try:
        await send_html_email([email], subject, body)
        logger.info(f"OTP email sent successfully to: {email}")
        
    except Exception as e:
        logger.error(f"Failed to send OTP email to: {email}")
        logger.error(f"OTP send error: {str(e)}")
        # Re-raise the exception so the API can handle it
        raise


async def send_activity_email(recipients: List[str], subject: str, body: str):
    await send_html_email(recipients, subject, body)
