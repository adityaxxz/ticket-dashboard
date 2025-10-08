from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List


class OTPRequest(BaseModel):
    email: EmailStr = Field(..., description="email address to request an OTP for")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"email": "@gmail.com"}
            ]
        }
    }


class OTPVerify(BaseModel):
    email: EmailStr = Field(..., description="email address to verify an OTP for")
    code: str = Field(..., description="OTP code to verify")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"email": "@gmail.com", "code": ""}
            ]
        }
    }


class ProjectCreate(BaseModel):
    name: str = Field(..., description="name of the project")


class TicketCreate(BaseModel):
    project_id: int = Field(..., description="id of the project")
    description: str = Field(..., description="description of the ticket")


class TicketUpdate(BaseModel):
    description: Optional[str] = Field(default=None, description="description of the ticket")
    status: Optional[str] = Field(default="proposed", description="status of the ticket")


class SuperToggleRequest(BaseModel):
    enable: bool
    password: str