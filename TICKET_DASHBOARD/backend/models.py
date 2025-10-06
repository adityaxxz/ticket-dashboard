from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, DateTime, func


class User(SQLModel, table=True):
    __tablename__ = "user"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    created_at: datetime = Field(default=func.now())

    def __repr__(self) -> str:
        return f"<User {self.email}>"


class Project(SQLModel, table=True):
    __tablename__ = "project"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(..., description="The name of the project")
    created_at: datetime = Field(default=func.now())

    def __repr__(self) -> str:
        return f"<Project {self.name}>"


class Ticket(SQLModel, table=True):
    __tablename__ = "ticket"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    description: str = Field(..., description="The description of the ticket")
    status: str = Field(default="todo")  # todo, doing, done
    creator_id: Optional[int] = Field(default=None, foreign_key="user.id")
    updated_by_id: Optional[int] = Field(default=None, foreign_key="user.id")

    created_at: datetime = Field(sa_column=Column(DateTime, default=func.now()))
    updated_at: datetime = Field(sa_column=Column(DateTime, default=func.now(), onupdate=func.now()))

    def __repr__(self) -> str:
        return f"<Ticket {self.description}>"

class Activity(SQLModel, table=True):
    __tablename__ = "activity"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: Optional[int] = Field(default=None, foreign_key="project.id")
    ticket_id: Optional[int] = Field(default=None, foreign_key="ticket.id")
    message: str
    actor_email: Optional[str] = None
    created_at: datetime = Field(default=func.now())

    def __repr__(self) -> str:
        return f"<Activity {self.message}>"


class SuperToggle(SQLModel, table=True):
    __tablename__ = "super_toggle"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    enabled: bool = Field(default=False)

    updated_at: datetime = Field(default=func.now())

    def __repr__(self) -> str:
        return f"<SuperToggle {self.enabled}>"
