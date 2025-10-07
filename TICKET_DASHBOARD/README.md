## Endpoints

#### Auth
- POST /auth/request-otp
- POST /auth/verify-otp
- GET /auth/me

#### Projects & Tickets
- GET /api/projects
- POST /api/projects
- GET /api/projects/{project_id}
- POST /api/tickets
- PATCH /api/tickets/{ticket_id}

#### Super Toggle
- GET /api/super-toggle
- POST /api/super-toggle

#### Activities
- GET /api/activities
- GET /api/projects/{project_id}/activities

#### WebSocket
- WS /ws/activity?token=...&project_id=...