# Ticket Dashboard

A full-stack ticket management system with real-time collaboration features. Built with FastAPI backend and React frontend, providing a Kanban-style interface for managing projects and tickets.

## Demo Video

https://github.com/user-attachments/assets/587e5018-16c1-4c00-a04d-aba0c664812a

## Features 

- Email-based OTP authentication with JWT tokens
- Project creation and management
- Kanban board with 5-stage workflow (Proposed → To Do → In Progress → Done → Deployed)
- Real-time updates via WebSocket connections
- Activity notifications and user tracking
- Super mode for enhanced user information display

## Tech Stack

### Backend
- FastAPI - Modern Python web framework
- MongoDB - NoSQL Database
- WebSockets - Real-time communication
- JWT Token-based authentication
- Pydantic - Data validation and settings management

### Frontend
- React 19
- TypeScript
- Vite
- TailwindCSS
- React Router for Client-side routing

### DevOps
- **Docker** - Containerization with published images on Docker Hub
- **Docker Compose** - Multi-container orchestration
- **Published Images:**
  - `https://hub.docker.com/r/adityaxxz/ticket-dashboard-frontend`
  - `https://hub.docker.com/r/adityaxxz/ticket-dashboard-backend`  


## Setup and Installation

### Prerequisites
- Python
- Node
- Docker and Docker Compose
- uv (install via pip) - I've used uv because, its rust based and 100x faster than pip.


### Local Development Setup

Backend:
```bash
cd TICKET_DASHBOARD
uv venv
 .venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

### Docker Setup (Recommended)

#### Quick Start with Published Images

1. **Download the production docker-compose file:**
   ```bash
   curl -o docker-compose.yml https://raw.githubusercontent.com/adityaxxz/ticket-dashboard/main/docker-compose.prod.yml
   ```

2. **Start the application:**
   ```bash
   docker compose up
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

#### Alternative: Pull Images Manually

```bash
# Pull the images
docker pull adityaxxz/ticket-dashboard-backend:latest
docker pull adityaxxz/ticket-dashboard-frontend:latest

# Run with docker compose
docker compose up
```

#### Build from Source

1. **Clone the Repo & Build and start all services:**
   ```bash
   docker compose up --build
   ```

## Usage

1. Access the application at http://localhost:3000
2. Login with any email address
3. Check logs for OTP code (development mode)
4. Create projects and manage tickets through the Kanban interface
5. Enable Super Mode with password `admin123` for additional user information

## Configuration

### Environment Variables

#### Backend (`TICKET_DASHBOARD/.env`)
```env
DATABASE_URL= MongoDB URL starts with mongodb+srv://
JWT_SECRET= your-secret-key
SUPER_TOGGLE_PWD=admin123
MONGO_DB_NAME=ticket_dashboard
SUPER_TOGGLE_PWD=admin123
MAIL_USERNAME=sender_email
MAIL_PASSWORD=get_from_smtp_provider
MAIL_FROM=sender_email
```

#### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000
change this to backend deployed url
```


## API Endpoints

### Authentication
- `POST /auth/request-otp` - Request OTP for email
- `POST /auth/verify-otp` - Verify OTP and get JWT token
- `GET /auth/me` - Get current user information

### Projects & Tickets
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project with tickets
- `POST /api/tickets` - Create new ticket
- `PATCH /api/tickets/{id}` - Update ticket

### Real-time Features
- `GET /api/activities` - Get activity feed
- `GET/POST /api/super-toggle` - Manage super mode
- `WS /ws/activity` - WebSocket for real-time updates
