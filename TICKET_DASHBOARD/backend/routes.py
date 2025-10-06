from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from .auth import get_current_user
from .db import get_database, get_next_sequence, utc_now
from .config import Config
from .schemas import ProjectCreate, TicketCreate, TicketUpdate, SuperToggleRequest
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api", tags=["api"])


@router.get("/projects")
def get_projects(db = Depends(get_database)):
    projects = list(db["projects"].find({}, {"_id": 0}))
    return projects


@router.post("/projects")
def create_project(data: ProjectCreate, user = Depends(get_current_user), db = Depends(get_database)):
    try:
        projects = db["projects"]
        new_id = get_next_sequence(db, "projects")
        project = {"id": new_id, "name": data.name, "created_at": utc_now()}
        projects.insert_one(project)
        
        # Add activity log
        db["activities"].insert_one({
            "project_id": new_id,
            "message": f"Project created: {data.name}",
            "actor_email": user["email"],
            "created_at": utc_now()
        })
        
        return JSONResponse(status_code=201, content=jsonable_encoder({
            "message": "Project created",
            "project": {
                "id": project["id"],
                "name": project["name"],
                "created_at": project["created_at"],
            },
        }))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating project: {str(e)}")


@router.get("/projects/{project_id}")
def get_project(project_id: int, db = Depends(get_database)):

    project = db["projects"].find_one({"id": project_id}, {"_id": 0})

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tickets = list(db["tickets"].find({"project_id": project_id}, {"_id": 0}))

    return {
        "project": project,
        "tickets": tickets,
    }


@router.post("/tickets")
def create_ticket(data: TicketCreate, user = Depends(get_current_user), db = Depends(get_database)):
    try:
        project = db["projects"].find_one({"id": data.project_id})

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        new_id = get_next_sequence(db, "tickets")
        ticket = {
            "id": new_id,
            "project_id": data.project_id,
            "description": data.description,
            "status": "todo",
            "creator_id": int(user["id"]),
            "updated_by_id": int(user["id"]),
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }
        db["tickets"].insert_one(ticket.copy())
        
        # Add activity log
        db["activities"].insert_one({
            "project_id": data.project_id,
            "ticket_id": new_id,
            "message": "Ticket Raised",
            "actor_email": user["email"],
            "created_at": utc_now(),
        })

        return JSONResponse(
            status_code=201,
            content=jsonable_encoder({
                "message": "Ticket Raised",
                "ticket": ticket
            })
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating ticket: {str(e)}")


@router.patch("/tickets/{ticket_id}")
def update_ticket(ticket_id: int, data: TicketUpdate, user = Depends(get_current_user), db = Depends(get_database)):
    ticket = db["tickets"].find_one({"id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Update fields if provided
    update_fields = {}
    if data.description is not None:
        update_fields["description"] = data.description
        
    if data.status is not None:
        if data.status not in {"todo", "doing", "done"}:
            raise HTTPException(status_code=400, detail="Invalid status")
        update_fields["status"] = data.status
    
    update_fields["updated_by_id"] = int(user["id"])
    db["tickets"].update_one(
        {"id": ticket_id},
        {"$set": update_fields, "$currentDate": {"updated_at": True}},
    )
    
    # Add activity log
    db["activities"].insert_one({
        "project_id": int(ticket["project_id"]),
        "ticket_id": ticket_id,
        "message": "Ticket Updated",
        "actor_email": user["email"],
        "created_at": utc_now(),
    })

    ticket = db["tickets"].find_one({"id": ticket_id}, {"_id": 0})

    return ticket



@router.post("/super-toggle")
def set_super_toggle(data: SuperToggleRequest, user = Depends(get_current_user), db = Depends(get_database)):
    
    if data.enable and data.password != Config.SUPER_TOGGLE_PWD:
        raise HTTPException(status_code=403, detail="Invalid password")
    
    toggle = db["super_toggle"].find_one({}, {"_id": 0})
    if not toggle:
        db["super_toggle"].insert_one({"enabled": data.enable, "updated_at": utc_now()})
        enabled = data.enable
    else:
        db["super_toggle"].update_one({}, {"$set": {"enabled": data.enable}, "$currentDate": {"updated_at": True}})
        enabled = data.enable
    return {"enabled": bool(enabled)}


@router.get("/super-toggle")
def get_super_toggle(db = Depends(get_database)):
    toggle = db["super_toggle"].find_one({}, {"_id": 0}) or {}
    return {"enabled": bool(toggle.get("enabled", False))}


