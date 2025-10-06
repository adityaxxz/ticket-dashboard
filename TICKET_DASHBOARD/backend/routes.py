from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from .auth import get_current_user
from .db import get_session
from .models import Activity, Project, Ticket, User, SuperToggle
from .config import Config
from .schemas import ProjectCreate, TicketCreate, TicketUpdate, SuperToggleRequest
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api", tags=["api"])


@router.get("/projects")
def get_projects(session: Session = Depends(get_session)):
    return session.exec(select(Project)).all()


@router.post("/projects")
def create_project(data: ProjectCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    try:
        project = Project(name=data.name)
        session.add(project)
        session.commit()
        session.refresh(project)
        
        # Add activity log
        activity = Activity(project_id=project.id, message=f"Project created: {project.name}", actor_email=user.email)
        session.add(activity)
        session.commit()
        
        return JSONResponse(status_code=201, content={"message": "Project created", "project": {
            "id": project.id,
            "name": project.name,
            "created_at": project.created_at.isoformat()
        }})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating project: {str(e)}")


@router.get("/projects/{project_id}")
def get_project(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    tickets = session.exec(select(Ticket).where(Ticket.project_id == project_id)).all()
    # Ensure datetime fields are serialized consistently
    return {
        "project": {
            "id": project.id,
            "name": project.name,
            "created_at": project.created_at.isoformat(),
        },
        "tickets": [
            {
                "id": t.id,
                "project_id": t.project_id,
                "description": t.description,
                "status": t.status,
                "creator_id": t.creator_id,
                "updated_by_id": t.updated_by_id,
                "created_at": t.created_at.isoformat(),
                "updated_at": t.updated_at.isoformat(),
            }
            for t in tickets
        ],
    }


@router.post("/tickets")
def create_ticket(data: TicketCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    try:
        project = session.get(Project, data.project_id)

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        ticket = Ticket(
            project_id=data.project_id, 
            description=data.description, 
            creator_id=user.id, 
            updated_by_id=user.id
        )
        session.add(ticket)
        session.commit()
        session.refresh(ticket)
        
        # Add activity log
        session.add(Activity(project_id=data.project_id, ticket_id=ticket.id, message="Ticket Raised", actor_email=user.email))
        session.commit()
        return JSONResponse(
            status_code=201,
            content={
                "message": "Ticket Raised",
                "ticket": {
                    "id": ticket.id,
                    "description": ticket.description,
                    "status": ticket.status,
                    "creator_id": ticket.creator_id,
                    "created_at": ticket.created_at.isoformat(),
                    "updated_at": ticket.updated_at.isoformat(),
                }
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating ticket: {str(e)}")


@router.patch("/tickets/{ticket_id}")
def update_ticket(ticket_id: int, data: TicketUpdate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Update fields if provided
    if data.description is not None:
        ticket.description = data.description
        
    if data.status is not None:
        if data.status not in {"todo", "doing", "done"}:
            raise HTTPException(status_code=400, detail="Invalid status")
        ticket.status = data.status
    
    ticket.updated_by_id = user.id
    session.add(ticket)
    
    # Add activity log
    session.add(Activity(project_id=ticket.project_id, ticket_id=ticket.id, message="Ticket Updated", actor_email=user.email))
    session.commit()
    session.refresh(ticket)

    return {
        "id": ticket.id,
        "project_id": ticket.project_id,
        "description": ticket.description,
        "status": ticket.status,
        "creator_id": ticket.creator_id,
        "updated_by_id": ticket.updated_by_id,
        "created_at": ticket.created_at.isoformat(),
        "updated_at": ticket.updated_at.isoformat(),
    }



@router.post("/super-toggle")
def set_super_toggle(data: SuperToggleRequest, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    
    if data.enable and data.password != Config.SUPER_TOGGLE_PWD:
        raise HTTPException(status_code=403, detail="Invalid password")
    
    toggle = session.exec(select(SuperToggle)).first()
    if not toggle:
        toggle = SuperToggle(enabled=data.enable)
        session.add(toggle)
    else:
        toggle.enabled = data.enable
    
    session.commit()
    return {"enabled": toggle.enabled}


@router.get("/super-toggle")
def get_super_toggle(session: Session = Depends(get_session)):
    toggle = session.exec(select(SuperToggle)).first()
    return {"enabled": bool(toggle and toggle.enabled)}


