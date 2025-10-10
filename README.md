# Ticket Dashboard

A full-stack ticket management system with real-time collaboration features. Built with FastAPI backend and React frontend, providing a Kanban-style interface for managing projects and tickets.

## Demo Video

[![demo video](https://raw.githubusercontent.com/adityaxxz/ticket-dashboard/main/thumb.png)](https://drive.google.com/file/d/1OgIPNkVw0fyaPDgu-VOZTLTAP71d5M5z/view)

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
- Pydantic - Data validation and settings management
- JWT - https - Token-based authentication

### Frontend
- React 19 - Modern UI library with latest features
- TypeScript - Type-safe JavaScript
- Vite - Fast build tool and dev server
- TailwindCSS - Utility-first CSS framework
- React Router - Client-side routing

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration  
- **Nginx** - Production web server

## Setup and Installation

### Prerequisites
- Docker and Docker Compose
- Node.js 18+
- Python 3.11+
- uv (install via pip) - Ive used uv coz its rust based and 100x faster than pip


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

1. Clone the repository and navigate to project directory
2. Start all services:
   ```bash
   docker-compose up -d
   ```
3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

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
DATABASE_URL= MongoDB URL or sqlite:///./data/database.db
JWT_SECRET=your-secret-key-change-this-in-production
SUPER_TOGGLE_PWD=admin123
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

#### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000
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
