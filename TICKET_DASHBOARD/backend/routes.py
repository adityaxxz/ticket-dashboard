from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from .auth import get_current_user
from .db import get_database, get_next_sequence, utc_now
from .config import Config
from .schemas import ProjectCreate, TicketCreate, TicketUpdate, SuperToggleRequest
from fastapi.responses import JSONResponse
from .notifications import notify_activity as send_notification
from .ws import log_user_visit


def notify_activity(db, project_id: int, message: str, actor_email: str, ticket_id: int | None = None) -> None:
    send_notification(db, project_id, message, actor_email, ticket_id)

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
        
        activity = {
            "project_id": new_id,
            "message": f"{user['email']} created a project: {data.name}",
            "actor_email": user["email"],
            "created_at": utc_now()
        }
        
        db["activities"].insert_one(activity.copy())

        log_user_visit(int(user["id"]), str(new_id))

        
        notify_activity(db, project_id=int(new_id), message=activity["message"], actor_email=user["email"]) 
        
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
        
        user_email = user['email']
        new_id = get_next_sequence(db, "tickets")
        ticket = {
            "id": new_id,
            "project_id": data.project_id,
            "description": data.description,
            "status": "todo",
            "creator_id": int(user["id"]),
            "creator_email": user["email"],  
            "updated_by_id": int(user["id"]),
            "updated_by_email": user_email,  
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }
        db["tickets"].insert_one(ticket.copy())
        
        
        activity = {
            "project_id": data.project_id,
            "ticket_id": new_id,
            "message": user_email + " raised a ticket",
            "actor_email": user_email,
            "created_at": utc_now(),
        }
        db["activities"].insert_one(activity.copy())
        
        log_user_visit(int(user["id"]), str(data.project_id))
        
        notify_activity(db, project_id=int(data.project_id), message=activity["message"], actor_email=user["email"], ticket_id=int(new_id))

        return JSONResponse(
            status_code=201,
            content=jsonable_encoder({
                "message": "Ticket Raised",
                
                "ticket": {**ticket, "actor_email": user["email"]}
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
    
    
    update_fields = {}
    if data.description is not None:
        update_fields["description"] = data.description
    
    old_status = ticket['status']
    new_status = data.status
    id = ticket['id']
    updated_by = user['email']

    valid_status = ["todo", "deployed", "done", "inprogress","proposed"]

    if data.status is not None:
        if data.status not in valid_status:
            raise HTTPException(status_code=400, detail="Invalid status")
        update_fields["status"] = data.status
    
    update_fields["updated_by_id"] = int(user["id"])
    update_fields["updated_by_email"] = user["email"]  
    db["tickets"].update_one(
        {"id": ticket_id},
        {"$set": update_fields, "$currentDate": {"updated_at": True}},
    )
    
    
    activity = {
        "project_id": int(ticket["project_id"]),
        "ticket_id": ticket_id,
        "message": updated_by + " moved Ticket:" + str(id) + " from " + old_status + " to " + new_status,
        "actor_email": user["email"],
        "created_at": utc_now(),
    }
    db["activities"].insert_one(activity.copy())

    
    log_user_visit(int(user["id"]), str(ticket["project_id"]))

    
    notify_activity(db, project_id=int(ticket["project_id"]), message=activity["message"], actor_email=user["email"], ticket_id=int(ticket_id))

    
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



@router.get("/activities")
def list_activities(limit: int = 20, db = Depends(get_database), user = Depends(get_current_user)):
    # No visit logging needed for activities list (not project-specific)
    items = list(db["activities"].find({}, {"_id": 0}).sort("created_at", -1).limit(int(limit)))
    return items


@router.get("/projects/{project_id}/activities")
def list_project_activities(project_id: int, limit: int = 20, db = Depends(get_database), user = Depends(get_current_user)):
    
    log_user_visit(int(user["id"]), str(project_id))
    items = list(
        db["activities"].find({"project_id": int(project_id)}, {"_id": 0}).sort("created_at", -1).limit(int(limit))
    )
    return items


